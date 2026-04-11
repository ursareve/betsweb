# Especificación de API Backend - Migración desde Firebase

## Objetivo
Reemplazar todos los servicios de Firebase (Auth, Firestore, Storage, Cloud Functions) por endpoints REST en nuestro VPS. Este documento contiene los contratos, interfaces, reglas de negocio y especificaciones necesarias para la implementación.

---

## Configuración Base

**Base URL actual:** `http://194.163.187.97/api/v1`
**Autenticación de API:** Header o query param `access_key`
**Autenticación de usuario:** JWT Bearer Token

---

## 1. Modelos de Datos

### 1.1 User (Modelo Principal)

```typescript
type UserRole = 'superadmin' | 'admin' | 'member' | 'viewer' | 'guest';
type Gender = 'masculino' | 'femenino';

interface User {
  uid: string;            // Identificador único (UUID)
  firstName: string;
  lastName: string;
  email: string;          // Único, usado para login
  document: string;       // Documento de identidad
  gender: Gender;
  role: UserRole;
  active: boolean;        // Si false, no puede hacer login
  activeUntil?: Date;     // Fecha de expiración de la cuenta (null = sin expiración)
  avatarUrl?: string;     // URL de la imagen de perfil
  createdAt: Date;
  updatedAt?: Date;
  maxSessions: number;    // Máximo de sesiones simultáneas permitidas (default: 1)
  activeSessionsCount: number;  // Contador de sesiones activas actuales
  hasActiveSession: boolean;    // Flag rápido para saber si tiene sesión activa
  fcmToken?: string;      // Token para push notifications (uso futuro)
}
```

### 1.2 Session (Modelo de Sesión)

```typescript
interface Session {
  sessionId: string;      // Formato: "{timestamp}_{random9chars}" ej: "1718234567890_a3bf9k2x1"
  userId: string;         // FK a User.uid
  role: UserRole;         // Rol del usuario al momento de crear la sesión
  createdAt: Date;
  lastHeartbeat: Date;    // Se actualiza cada 30 segundos desde el frontend
}
```

### 1.3 DTOs de Entrada

```typescript
// Para crear usuario (POST /users)
interface CreateUserData {
  firstName: string;      // Requerido
  lastName: string;       // Requerido
  email: string;          // Requerido, único, formato email válido
  password: string;       // Requerido, mínimo 6 caracteres
  document: string;       // Requerido
  gender: Gender;         // Requerido
  role: UserRole;         // Requerido
  active?: boolean;       // Default: true
  activeUntil?: Date;     // Opcional
  avatarUrl?: string;     // Opcional
  maxSessions?: number;   // Default: 1
}

// Para actualizar usuario (PUT /users/:uid)
interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  document?: string;
  gender?: Gender;
  role?: UserRole;
  active?: boolean;
  activeUntil?: Date;
  avatarUrl?: string;
  maxSessions?: number;
  activeSessionsCount?: number;
  hasActiveSession?: boolean;
}
```

---

## 2. Autenticación (JWT)

### 2.1 Estructura del Token

El frontend espera manejar tokens JWT. Se necesitan dos tokens:

```typescript
interface AuthTokens {
  accessToken: string;    // JWT, expiración corta (15-30 min)
  refreshToken: string;   // Token para renovar el accessToken, expiración larga (7 días)
}

// Payload del accessToken
interface TokenPayload {
  uid: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}
```

### 2.2 Headers de Autenticación

Todos los endpoints protegidos deben validar:
```
Authorization: Bearer <accessToken>
```

---

## 3. Endpoints de Autenticación

### 3.1 POST `/auth/login`

**Descripción:** Iniciar sesión. Debe validar credenciales, estado del usuario, expiración de cuenta y límite de sesiones.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Lógica de negocio (en este orden):**
1. Validar que email y password sean correctos
2. Obtener datos del usuario
3. Validar que `active === true` → Si no: error `USER_INACTIVE`
4. Validar que `activeUntil` no haya expirado (si existe) → Si expiró: error `ACCOUNT_EXPIRED`
5. Validar sesiones:
   - Si `role === 'superadmin'` → **NO tiene límite de sesiones**, saltar validación
   - Si `activeSessionsCount >= maxSessions` → error `MAX_SESSIONS`
6. Crear nueva sesión con `sessionId` generado
7. Incrementar `activeSessionsCount` en +1
8. Setear `hasActiveSession = true`
9. Retornar tokens + datos del usuario

**Response 200:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyBpcyBh...",
  "user": {
    "uid": "uuid-here",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "user@example.com",
    "document": "12345678",
    "gender": "masculino",
    "role": "member",
    "active": true,
    "activeUntil": "2025-12-31T00:00:00Z",
    "avatarUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "maxSessions": 1,
    "activeSessionsCount": 1,
    "hasActiveSession": true
  },
  "sessionId": "1718234567890_a3bf9k2x1"
}
```

**Errores esperados:**
| Código | Error | Mensaje Frontend |
|--------|-------|-----------------|
| 401 | `INVALID_CREDENTIALS` | "Correo o contraseña incorrectos" |
| 403 | `USER_INACTIVE` | "Tu cuenta ha sido deshabilitada. Contacta al administrador." |
| 403 | `ACCOUNT_EXPIRED` | "Tu cuenta ha expirado. Contacta al administrador para renovar tu acceso." |
| 429 | `MAX_SESSIONS` | "Límite de sesiones alcanzado" |
| 429 | `TOO_MANY_ATTEMPTS` | "Demasiados intentos fallidos. Intenta más tarde" |

---

### 3.2 POST `/auth/logout`

**Descripción:** Cerrar sesión actual. Requiere autenticación.

**Headers:** `Authorization: Bearer <accessToken>`

**Body:**
```json
{
  "sessionId": "1718234567890_a3bf9k2x1"
}
```

**Lógica de negocio:**
1. Obtener `uid` del token JWT
2. Eliminar la sesión con `sessionId` de la tabla de sesiones
3. Decrementar `activeSessionsCount` en -1 (mínimo 0)
4. Si `activeSessionsCount === 0` → setear `hasActiveSession = false`
5. Invalidar/revocar el refreshToken

**Response 200:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### 3.3 POST `/auth/refresh`

**Descripción:** Renovar el accessToken usando el refreshToken.

**Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Lógica de negocio:**
1. Validar que el refreshToken sea válido y no esté expirado/revocado
2. Verificar que el usuario siga activo y la cuenta no haya expirado
3. Generar nuevo accessToken
4. (Opcional) Rotar el refreshToken

**Response 200:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "newRefresh..."
}
```

**Errores:**
| Código | Error | Descripción |
|--------|-------|-------------|
| 401 | `INVALID_REFRESH_TOKEN` | Token inválido o expirado |
| 403 | `USER_INACTIVE` | Usuario desactivado después del login |

---

### 3.4 POST `/auth/heartbeat`

**Descripción:** El frontend envía un heartbeat cada 30 segundos para mantener la sesión activa. Requiere autenticación.

**Headers:** `Authorization: Bearer <accessToken>`

**Body:**
```json
{
  "sessionId": "1718234567890_a3bf9k2x1"
}
```

**Lógica de negocio:**
1. Actualizar `lastHeartbeat` de la sesión a `NOW()`
2. Actualizar `lastHeartbeat` del usuario a `NOW()`

**Response 200:**
```json
{
  "message": "OK"
}
```

> **IMPORTANTE:** Implementar un cron job o proceso que limpie sesiones cuyo `lastHeartbeat` sea mayor a 5 minutos. Al limpiar, decrementar `activeSessionsCount` y actualizar `hasActiveSession`.

---

### 3.5 POST `/auth/forgot-password`

**Descripción:** Enviar correo de restablecimiento de contraseña.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Lógica de negocio:**
1. Verificar que el email exista en la base de datos
2. Generar token de reset (expiración 1 hora)
3. Enviar correo con link de restablecimiento
4. Siempre responder 200 (no revelar si el email existe o no)

**Response 200:**
```json
{
  "message": "Si el correo existe, se enviará un enlace de restablecimiento"
}
```

---

### 3.6 POST `/auth/reset-password`

**Descripción:** Restablecer contraseña con token recibido por correo.

**Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newPassword123"
}
```

**Response 200:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 4. Endpoints de Gestión de Usuarios

> Todos requieren `Authorization: Bearer <accessToken>`. Los endpoints de escritura requieren rol `superadmin` o `admin`.

### 4.1 POST `/users`

**Descripción:** Crear nuevo usuario. Solo `superadmin` y `admin`.

**Body:** `CreateUserData` (ver sección 1.3)

**Lógica de negocio:**
1. Validar que el email no exista
2. Hashear el password (bcrypt recomendado)
3. Crear el usuario con valores default: `active: true`, `activeSessionsCount: 0`, `hasActiveSession: false`, `maxSessions: 1`
4. Retornar el usuario creado (sin password)

**Response 201:**
```json
{
  "uid": "generated-uuid",
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "document": "...",
  "gender": "masculino",
  "role": "member",
  "active": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "maxSessions": 1,
  "activeSessionsCount": 0,
  "hasActiveSession": false
}
```

---

### 4.2 GET `/users`

**Descripción:** Obtener todos los usuarios.

**Query params opcionales:**
- `role` — Filtrar por rol (ej: `?role=member`)

**Response 200:**
```json
[
  {
    "uid": "...",
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "document": "...",
    "gender": "masculino",
    "role": "member",
    "active": true,
    "activeUntil": "2025-12-31T00:00:00Z",
    "avatarUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-06-01T00:00:00Z",
    "maxSessions": 1,
    "activeSessionsCount": 1,
    "hasActiveSession": true
  }
]
```

---

### 4.3 GET `/users/:uid`

**Descripción:** Obtener un usuario por UID.

**Response 200:** Objeto `User` (sin password)

**Response 404:**
```json
{
  "error": "USER_NOT_FOUND",
  "message": "Usuario no encontrado"
}
```

---

### 4.4 PUT `/users/:uid`

**Descripción:** Actualizar usuario. Solo `superadmin` y `admin`.

**Body:** `UpdateUserData` (ver sección 1.3) — Solo los campos que se envíen se actualizan.

**Lógica:** Agregar `updatedAt: NOW()` automáticamente.

**Response 200:**
```json
{
  "message": "Usuario actualizado exitosamente"
}
```

---

### 4.5 DELETE `/users/:uid`

**Descripción:** Eliminar usuario. Solo `superadmin`.

**Lógica:**
1. Eliminar todas las sesiones activas del usuario
2. Eliminar el avatar del storage si existe
3. Eliminar el registro del usuario

**Response 200:**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

---

### 4.6 PUT `/users/:uid/toggle-status`

**Descripción:** Activar/desactivar usuario.

**Body:**
```json
{
  "active": false
}
```

**Response 200:**
```json
{
  "message": "Estado actualizado"
}
```

---

### 4.7 POST `/users/:uid/reset-sessions`

**Descripción:** Resetear el contador de sesiones de un usuario (admin action).

**Lógica:**
1. Eliminar todas las sesiones activas del usuario
2. Setear `activeSessionsCount = 0`
3. Setear `hasActiveSession = false`

**Response 200:**
```json
{
  "message": "Sesiones reseteadas"
}
```

---

### 4.8 POST `/users/:uid/force-logout`

**Descripción:** Forzar cierre de TODAS las sesiones de un usuario. Solo `superadmin` y `admin`.

**Lógica:**
1. Eliminar todas las sesiones del usuario
2. Revocar todos los refreshTokens del usuario
3. Setear `activeSessionsCount = 0`
4. Setear `hasActiveSession = false`

> **IMPORTANTE:** El frontend detectará que el token fue revocado en la próxima petición o refresh, y redirigirá al login.

**Response 200:**
```json
{
  "message": "Logout forzado exitosamente"
}
```

---

## 5. Endpoint de Storage (Avatar)

### 5.1 POST `/users/:uid/avatar`

**Descripción:** Subir imagen de perfil.

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: Archivo de imagen (jpg, png, webp)

**Lógica:**
1. Validar que sea imagen (max 5MB recomendado)
2. Guardar en disco/S3 con nombre: `{uid}_{timestamp}.{ext}`
3. Actualizar `avatarUrl` del usuario
4. Eliminar avatar anterior si existe

**Response 200:**
```json
{
  "avatarUrl": "https://your-vps.com/storage/avatars/uid_1718234567890.jpg"
}
```

---

### 5.2 DELETE `/users/:uid/avatar`

**Descripción:** Eliminar imagen de perfil.

**Lógica:**
1. Eliminar archivo del storage
2. Setear `avatarUrl = null` en el usuario

**Response 200:**
```json
{
  "message": "Avatar eliminado"
}
```

---

## 6. Reglas de Negocio Críticas

### 6.1 Jerarquía de Roles
```
superadmin > admin > member > viewer > guest
```

- `superadmin`: Acceso total, sin límite de sesiones, no se le aplica limpieza automática de sesiones
- `admin`: Puede gestionar usuarios (CRUD), forzar logout, resetear sesiones
- `member`: Usuario regular con acceso a la plataforma
- `viewer`: Solo lectura
- `guest`: Rol por defecto al registrarse, acceso mínimo

### 6.2 Control de Sesiones
- Cada usuario tiene un `maxSessions` configurable (default: 1)
- `superadmin` **NO tiene límite** de sesiones (ignorar `maxSessions`)
- El heartbeat se envía cada **30 segundos** desde el frontend
- Sesiones sin heartbeat por más de **5 minutos** deben limpiarse automáticamente
- Al limpiar sesiones inactivas: decrementar `activeSessionsCount` y actualizar `hasActiveSession`

### 6.3 Validaciones en Login
El orden de validación es importante para los mensajes de error correctos:
1. Credenciales válidas
2. Usuario activo (`active === true`)
3. Cuenta no expirada (`activeUntil`)
4. Límite de sesiones no alcanzado

### 6.4 Formato de Fechas
- Todas las fechas deben retornarse en formato **ISO 8601**: `"2025-01-15T14:30:00Z"`
- El frontend parsea las fechas con `new Date(dateString)`

---

## 7. Respuestas de Error (Formato Estándar)

Todas las respuestas de error deben seguir este formato:

```json
{
  "error": "ERROR_CODE",
  "message": "Mensaje descriptivo en español"
}
```

### Códigos HTTP esperados:
| Código | Uso |
|--------|-----|
| 200 | Operación exitosa |
| 201 | Recurso creado |
| 400 | Datos inválidos / Validación fallida |
| 401 | No autenticado / Token inválido o expirado |
| 403 | Sin permisos / Usuario inactivo / Cuenta expirada |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: email duplicado) |
| 429 | Límite alcanzado (sesiones / intentos) |
| 500 | Error interno del servidor |

---

## 8. Seguridad

- **Passwords:** Hashear con bcrypt (cost factor 10+)
- **JWT Secret:** Usar clave fuerte, almacenar en variable de entorno
- **Rate Limiting:** Limitar intentos de login a 5 por minuto por IP/email
- **CORS:** Configurar para permitir solo los dominios del frontend
- **HTTPS:** Obligatorio en producción
- **Tokens revocados:** Mantener una blacklist de refreshTokens revocados (por force-logout)
- **Sanitización:** Validar y sanitizar todos los inputs

---

## 9. Cron Jobs Necesarios

### 9.1 Limpieza de Sesiones Inactivas
- **Frecuencia:** Cada 2-3 minutos
- **Lógica:** Buscar sesiones con `lastHeartbeat` > 5 minutos atrás, eliminarlas y actualizar contadores del usuario
- **Excepción:** No limpiar sesiones de usuarios con `role === 'superadmin'`

---

## 10. Resumen de Endpoints

| Método | Endpoint | Descripción | Auth | Rol Mínimo |
|--------|----------|-------------|------|------------|
| POST | `/auth/login` | Login | No | - |
| POST | `/auth/logout` | Logout | Sí | Cualquiera |
| POST | `/auth/refresh` | Renovar token | No | - |
| POST | `/auth/heartbeat` | Mantener sesión | Sí | Cualquiera |
| POST | `/auth/forgot-password` | Solicitar reset | No | - |
| POST | `/auth/reset-password` | Resetear password | No | - |
| GET | `/users` | Listar usuarios | Sí | admin |
| GET | `/users/:uid` | Obtener usuario | Sí | Cualquiera* |
| POST | `/users` | Crear usuario | Sí | admin |
| PUT | `/users/:uid` | Actualizar usuario | Sí | admin |
| DELETE | `/users/:uid` | Eliminar usuario | Sí | superadmin |
| PUT | `/users/:uid/toggle-status` | Activar/desactivar | Sí | admin |
| POST | `/users/:uid/reset-sessions` | Resetear sesiones | Sí | admin |
| POST | `/users/:uid/force-logout` | Forzar logout | Sí | admin |
| POST | `/users/:uid/avatar` | Subir avatar | Sí | Cualquiera* |
| DELETE | `/users/:uid/avatar` | Eliminar avatar | Sí | Cualquiera* |

> *Cualquiera = el propio usuario o un admin/superadmin

---

## 11. Notas para Integración Frontend

Una vez completados los endpoints, en el frontend haremos:

1. **Reemplazar `AuthService`** — Cambiar Firebase Auth por llamadas HTTP a `/auth/*`
2. **Reemplazar `UserFirebaseRepository`** — Ya existe `UserApiRepository` que apunta a `/users`, solo ajustar contratos
3. **Reemplazar `StorageService`** — Cambiar Firebase Storage por upload a `/users/:uid/avatar`
4. **Reemplazar Guards** — Cambiar de `user$` (Firebase observable) a validación por JWT almacenado en localStorage
5. **Implementar interceptor HTTP** — Para inyectar `Authorization: Bearer` en todas las peticiones y manejar refresh automático en 401

El frontend almacenará en localStorage:
- `accessToken`
- `refreshToken`
- `sessionId`
- `isLoggedIn` (flag booleano)
