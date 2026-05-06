import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert, Linking, AppState } from 'react-native';
import { collection, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure how notifications should be handled when the app is foregrounded
let Notifications: any = null;
try {
  if (Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.log('[PUSH] expo-notifications not available:', e);
}

/**
 * Muestra un diálogo BLOQUEANTE que fuerza al usuario a ir a Ajustes
 * cuando iOS no permite mostrar el prompt nativo de notificaciones.
 */
function showForceSettingsAlert(): Promise<void> {
  return new Promise((resolve) => {
    Alert.alert(
      '🔔 Activa las Notificaciones',
      'Para recibir avisos de tus pedidos y entregas, necesitas activar las notificaciones desde los Ajustes de tu iPhone.\n\n' +
      'Ve a: Ajustes → Tienda Saku → Notificaciones → Permitir',
      [
        {
          text: 'Abrir Ajustes Ahora',
          onPress: () => {
            Linking.openSettings();
            // Cuando el usuario regrese de Settings, re-verificamos
            const subscription = AppState.addEventListener('change', (nextState) => {
              if (nextState === 'active') {
                subscription.remove();
                resolve();
              }
            });
          },
        },
        {
          text: 'Más tarde',
          style: 'cancel',
          onPress: () => resolve(),
        },
      ],
      { cancelable: false }
    );
  });
}

export async function registerForPushNotificationsAsync(userId: string) {
  console.log(`[PUSH] ====== INICIO registerForPushNotificationsAsync ======`);
  console.log(`[PUSH] userId: ${userId}`);
  console.log(`[PUSH] Platform: ${Platform.OS}`);
  console.log(`[PUSH] isDevice: ${Device.isDevice}`);
  console.log(`[PUSH] appOwnership: ${Constants.appOwnership}`);

  if (!userId) {
    console.warn('[PUSH] No userId provided, aborting.');
    return null;
  }

  // Solo bloquear en Expo Go Android
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    console.warn('[PUSH] Expo Go Android - not supported.');
    return null;
  }

  try {
    // Cargar el módulo si aún no se cargó
    if (!Notifications) {
      try {
        Notifications = require('expo-notifications');
      } catch (e) {
        console.error('[PUSH] FATAL: Cannot load expo-notifications:', e);
        return null;
      }
    }

    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('saku_tienda_v5', {
        name: 'Saku Alertas v5',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
        lightColor: '#63348C',
        sound: 'saku_compra',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }

    if (!Device.isDevice) {
      console.warn('[PUSH] Not a physical device, aborting.');
      return null;
    }

    // ========== PASO 1: Verificar permisos actuales ==========
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`[PUSH] Permiso actual: "${existingStatus}"`);
    let finalStatus = existingStatus;
    
    // ========== PASO 2: Solicitar permisos si no están concedidos ==========
    if (existingStatus !== 'granted') {
      console.log('[PUSH] Permiso NO concedido, solicitando...');
      
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
      console.log(`[PUSH] Resultado de solicitud: "${finalStatus}"`);
    }
    
    // ========== PASO 3: Si sigue denegado, FORZAR ir a Settings ==========
    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permiso DENEGADO. Mostrando alerta para ir a Settings...');
      
      // Mostrar alerta bloqueante
      await showForceSettingsAlert();
      
      // Re-verificar después de que el usuario volvió de Settings
      const { status: recheck } = await Notifications.getPermissionsAsync();
      console.log(`[PUSH] Re-verificación después de Settings: "${recheck}"`);
      
      if (recheck !== 'granted') {
        console.warn('[PUSH] El usuario no habilitó las notificaciones en Settings.');
        return null;
      }
      
      finalStatus = recheck;
    }

    console.log(`[PUSH] ✅ Permisos CONCEDIDOS. Obteniendo tokens...`);

    // ========== PASO 4: Obtener tokens ==========
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || "a57684e9-cbfa-45dc-8991-74193b1b62a7";
    
    let deviceToken: string | null = null;
    let expoToken: string | null = null;
    
    // Token nativo del dispositivo (APNs en iOS, FCM en Android)
    try {
      console.log('[PUSH] Obteniendo device push token...');
      const dt = await Notifications.getDevicePushTokenAsync();
      deviceToken = dt.data;
      console.log(`[PUSH] Device token: ${deviceToken}`);
    } catch (e: any) {
      console.warn('[PUSH] No se pudo obtener device token:', e?.message || e);
    }
    
    // Token de Expo (funciona para enviar vía Expo Push API)
    try {
      console.log('[PUSH] Obteniendo Expo push token...');
      const et = await Notifications.getExpoPushTokenAsync({ projectId });
      expoToken = et.data;
      console.log(`[PUSH] Expo token: ${expoToken}`);
    } catch (e: any) {
      console.warn('[PUSH] No se pudo obtener Expo token:', e?.message || e);
    }
    
    // PRIORIZAMOS el Expo Token porque es el que mejor funciona con nuestro backend actual
    token = expoToken || deviceToken;

    if (token) {
      console.log(`[PUSH] Token seleccionado: ${token}`);
      
      try {
        const tokenData = {
          fcm_token: deviceToken || null,
          expo_token: expoToken || null,
          fcmToken: deviceToken || null,
          pushToken: expoToken || null,
          device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
          created_at: serverTimestamp(),
        };

        // Guardar en subcolección con un ID limpio
        const tokenId = token.replace(/[^a-zA-Z0-9]/g, '_');
        const subRef = collection(db, 'users', userId, 'fcm_tokens');
        const tokenDocRef = doc(subRef, tokenId);
        await setDoc(tokenDocRef, tokenData);

        // Actualizar doc principal
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcm_token: deviceToken || null,
          expo_token: expoToken || null,
          fcmToken: deviceToken || null,
          pushToken: expoToken || null,
          last_token_update: serverTimestamp(),
          device_platform: Platform.OS,
          // Guardamos el token principal que usará el backend
          notificationToken: token
        });
        console.log('[PUSH] ✅ Tokens guardados exitosamente.');

      } catch (err: any) {
        console.error('[PUSH] ERROR al guardar en Firestore:', err?.message || err);
      }
    } else {
      console.error('[PUSH] ❌ No se obtuvo ningún token. No se puede registrar.');
    }

    return token;
  } catch (error: any) {
    console.error('[PUSH] ERROR FATAL en registro:', error?.message || error);
    // Mostrar error visible para debug
    if (__DEV__) {
      Alert.alert('[DEBUG] Error Push', `${error?.message || error}`);
    }
    return null;
  }
}
