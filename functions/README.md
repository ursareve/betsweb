# Firebase Cloud Functions

## Instalación

1. Instalar Firebase CLI globalmente (solo una vez):
```bash
npm install -g firebase-tools
```

2. Iniciar sesión en Firebase:
```bash
firebase login
```

3. Instalar dependencias de las funciones:
```bash
cd functions
npm install
```

## Despliegue

Desde la carpeta raíz del proyecto:

```bash
cd functions
npm run deploy
```

O desplegar solo una función específica:
```bash
firebase deploy --only functions:forceLogoutUser
```

## Funciones Disponibles

### forceLogoutUser
Fuerza el cierre de sesión de un usuario revocando todos sus refresh tokens.

**Permisos**: Solo admin o superadmin

**Parámetros**:
- `uid` (string): UID del usuario a desconectar

**Uso desde Angular**:
```typescript
await this.authService.forceLogoutUser(uid);
```

## Desarrollo Local

Para probar las funciones localmente:

```bash
cd functions
npm run serve
```

Esto iniciará el emulador de Firebase Functions en `http://localhost:5001`

## Logs

Ver logs de las funciones en producción:

```bash
firebase functions:log
```

## Notas Importantes

- Las funciones requieren que el usuario que las llama tenga rol `admin` o `superadmin`
- La función `forceLogoutUser` revoca los refresh tokens Y resetea los contadores de sesión en Firestore
- Después de forzar logout, el usuario deberá iniciar sesión nuevamente
