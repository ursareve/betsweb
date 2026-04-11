import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

export const forceLogoutUser = onCall(
  async (request) => {
    // Validar que quien llama esté autenticado
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Usuario no autenticado'
      );
    }

    // Validar que quien llama sea admin o superadmin
    const callerUid = request.auth.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    const callerRole = callerDoc.data()?.role;

    if (callerRole !== 'admin' && callerRole !== 'superadmin') {
      throw new HttpsError(
        'permission-denied',
        'No autorizado. Solo administradores pueden forzar logout.'
      );
    }

    const uid = request.data.uid;

    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'UID de usuario requerido'
      );
    }

    try {
      // Revocar todos los refresh tokens del usuario
      await admin.auth().revokeRefreshTokens(uid);

      // Actualizar Firestore para resetear sesiones
      await admin.firestore().collection('users').doc(uid).update({
        activeSessionsCount: 0,
        hasActiveSession: false
      });

      return { 
        success: true,
        message: 'Usuario desconectado exitosamente'
      };
    } catch (error: any) {
      throw new HttpsError(
        'internal',
        'Error al forzar logout: ' + error.message
      );
    }
  }
);
