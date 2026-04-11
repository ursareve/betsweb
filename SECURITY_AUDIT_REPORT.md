# 🔒 AUDITORÍA DE SEGURIDAD - BETSWEB

## ⚠️ VULNERABILIDADES CRÍTICAS ENCONTRADAS

### 1. **CREDENCIALES EXPUESTAS EN CÓDIGO FUENTE** 🔴 CRÍTICO

**Ubicación:** `src/environments/environment.ts` y `environment.prod.ts`

```typescript
apiAccessKey: '7rN2kLp9QxWbV5mJt3Yf',  // ❌ API Key expuesta
firebaseConfig: {
  apiKey: "AIzaSyAeQowCM4rVVsrydCGio9XS2CWshGqgZY4",  // ❌ Expuesta
  // ... más credenciales
}
```

**Riesgo:** Cualquiera con acceso al código fuente puede:
- Acceder a tu API backend
- Usar tu proyecto Firebase
- Realizar operaciones no autorizadas

**Solución:**
- Mover `apiAccessKey` a variables de entorno
- Firebase apiKey es pública pero debe tener reglas de seguridad estrictas
- Usar Firebase Security Rules para proteger datos

---

### 2. **CONTRASEÑAS EN MODELO DE USUARIO** 🔴 CRÍTICO

**Ubicación:** `src/app/models/user.model.ts`

```typescript
export interface CreateUserData {
  password: string;  // ❌ Contraseña en modelo
}
```

**Ubicación:** `src/app/core/repositories/user-firebase.repository.ts`

```typescript
await createUserWithEmailAndPassword(
  this.auth, 
  userData.email, 
  userData.password  // ❌ Contraseña manejada en frontend
)
```

**Riesgo:** 
- Contraseñas podrían quedar en logs
- Exposición en memoria del navegador
- Posible intercepción en red si no hay HTTPS

**Solución:**
- ✅ Ya usa Firebase Auth (contraseñas hasheadas)
- ⚠️ Asegurar que SIEMPRE se use HTTPS
- ⚠️ No guardar contraseñas en ningún lado del frontend

---

### 3. **DATOS DE USUARIO EN LOCALSTORAGE** 🟡 MEDIO

**Ubicación:** Múltiples archivos

```typescript
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('rememberEmail', email);  // ❌ Email en localStorage
```

**Riesgo:**
- LocalStorage es accesible por JavaScript
- Vulnerable a XSS (Cross-Site Scripting)
- Datos persisten incluso después de cerrar navegador

**Solución:**
- Usar sessionStorage para datos temporales
- Encriptar datos sensibles antes de guardar
- Implementar Content Security Policy (CSP)

---

### 4. **CONSOLE.LOG CON DATOS SENSIBLES** 🟡 MEDIO

**Ubicación:** Múltiples archivos

```typescript
console.log('Notificación recibida en app:', notification);
console.log(this.winwin, this.maxOver, this.maxUnder);
```

**Riesgo:**
- Datos visibles en DevTools del navegador
- Pueden revelar lógica de negocio
- Exposición de estructura de datos

**Solución:**
- Eliminar console.log en producción
- Usar un servicio de logging que se desactive en prod

---

### 5. **FALTA DE FIRESTORE SECURITY RULES** 🔴 CRÍTICO

**No se encontró:** `firestore.rules`

**Riesgo:**
- Sin reglas, cualquiera puede leer/escribir en Firestore
- Usuarios pueden modificar su propio rol
- Acceso no autorizado a datos de otros usuarios

**Solución URGENTE:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer su propia información
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      // No permitir cambiar rol, maxSessions, activeSessionsCount
                      !request.resource.data.diff(resource.data).affectedKeys()
                        .hasAny(['role', 'maxSessions', 'active']);
      
      // Solo superadmin puede modificar cualquier usuario
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
  }
}
```

---

### 6. **IP DEL SERVIDOR EXPUESTA** 🟡 MEDIO

**Ubicación:** `environment.ts`

```typescript
apiUrl: 'http://194.163.187.97/api',  // ❌ IP expuesta
```

**Riesgo:**
- Facilita ataques DDoS
- Revela infraestructura
- No usa HTTPS

**Solución:**
- Usar dominio en lugar de IP
- **URGENTE:** Implementar HTTPS
- Usar CloudFlare o similar para protección DDoS

---

### 7. **FALTA DE SANITIZACIÓN DE INPUTS** 🟡 MEDIO

**Ubicación:** Formularios y componentes

**Riesgo:**
- Vulnerable a XSS si se inyecta HTML/JavaScript
- Posible SQL Injection en backend

**Solución:**
- Angular sanitiza automáticamente en templates
- Validar y sanitizar en backend
- Usar DomSanitizer para contenido dinámico

---

### 8. **SESSION HIJACKING POSIBLE** 🟡 MEDIO

**Ubicación:** Sistema de sesiones

**Riesgo:**
- sessionId predecible: `${Date.now()}_${Math.random()}`
- Sin validación de IP/User-Agent
- Sin detección de sesiones duplicadas

**Solución:**
- Usar crypto.randomUUID() o similar
- Validar IP/User-Agent en backend
- Implementar detección de anomalías

---

## 📊 RESUMEN DE VULNERABILIDADES

| Severidad | Cantidad | Prioridad |
|-----------|----------|-----------|
| 🔴 Crítica | 3 | URGENTE |
| 🟡 Media | 4 | Alta |
| 🟢 Baja | 0 | - |

---

## ✅ RECOMENDACIONES INMEDIATAS

### 1. **Implementar Firestore Security Rules** (URGENTE)
### 2. **Migrar a HTTPS** (URGENTE)
### 3. **Mover apiAccessKey a variables de entorno**
### 4. **Eliminar console.log en producción**
### 5. **Implementar Content Security Policy**
### 6. **Usar dominio en lugar de IP**
### 7. **Mejorar generación de sessionId**
### 8. **Implementar rate limiting en backend**

---

## 🛡️ BUENAS PRÁCTICAS IMPLEMENTADAS

✅ Usa Firebase Authentication (contraseñas hasheadas)
✅ Validación de sesiones con transacciones
✅ Sistema de heartbeat para detectar sesiones inactivas
✅ Validación de roles (superadmin bypass)
✅ Logout automático en cierre de navegador
✅ Validación de token cada 15 minutos

---

## 📝 DATOS SENSIBLES IDENTIFICADOS

| Dato | Ubicación | Riesgo | Protección Actual |
|------|-----------|--------|-------------------|
| **Contraseñas** | Firebase Auth | Bajo | ✅ Hasheadas por Firebase |
| **Email** | localStorage | Medio | ⚠️ Sin encriptar |
| **UID** | Firestore | Bajo | ⚠️ Depende de Security Rules |
| **Role** | Firestore | Alto | ❌ Sin Security Rules |
| **API Keys** | environment.ts | Crítico | ❌ Expuestas en código |
| **Session tokens** | Firebase | Bajo | ✅ Manejados por Firebase |
| **FCM Token** | Firestore | Medio | ⚠️ Depende de Security Rules |

---

## 🎯 PLAN DE ACCIÓN PRIORITARIO

### Semana 1 (CRÍTICO):
1. Implementar Firestore Security Rules
2. Migrar a HTTPS
3. Ocultar apiAccessKey

### Semana 2 (ALTO):
4. Eliminar console.log en producción
5. Implementar CSP headers
6. Mejorar sessionId generation

### Semana 3 (MEDIO):
7. Encriptar datos en localStorage
8. Implementar rate limiting
9. Agregar logging de seguridad

---

**Fecha de auditoría:** $(date)
**Auditor:** Amazon Q Security Analysis
