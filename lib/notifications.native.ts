import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure how notifications should be handled when the app is foregrounded
if (Constants.appOwnership !== 'expo') {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(userId: string) {
  if (!userId) {
    console.warn('Cannot register for push notifications: No userId provided');
    return null;
  }

  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    console.warn('Push Notifications not supported in Expo Go Android.');
    return null;
  }

  console.log(`Starting push notification registration for user: ${userId}`);

  try {
    const Notifications = require('expo-notifications');
    let token;

    if (Platform.OS === 'android') {
      // We use a specific channel ID to ensure Android creates it fresh with the new sound/vibration
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

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permission for push notifications not granted.');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || "a57684e9-cbfa-45dc-8991-74193b1b62a7";
      
      try {
        console.log('Attempting to get device push token (FCM)...');
        token = (await Notifications.getDevicePushTokenAsync()).data;
      } catch (e) {
        console.warn('Failed to get device push token, falling back to Expo token:', e);
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
    } else {
      console.warn('Must use physical device for push notifications');
      return null;
    }

    if (token) {
      console.log('Token obtained:', token);
      
      console.log('--- STARTING FIRESTORE UPDATE ---');
      try {
        const tokenData = {
          fcm_token: token,
          fcmToken: token, // Added for compatibility
          pushToken: token, // Added for compatibility
          device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
          created_at: serverTimestamp(),
        };

        // 1. FORCE SUBCOLLECTION CREATION FIRST
        console.log('Step 1: Creating subcollection users/' + userId + '/fcm_tokens/' + token);
        const subRef = collection(db, 'users', userId, 'fcm_tokens');
        const tokenDocRef = doc(subRef, token);
        await setDoc(tokenDocRef, tokenData);
        console.log('Step 1 SUCCESS: Subcollection written.');

        // 2. UPDATE MAIN DOC SECOND
        console.log('Step 2: Updating main user doc with multiple fields...');
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcm_token: token,
          fcmToken: token,
          pushToken: token,
          last_token_update: serverTimestamp(),
          device_platform: Platform.OS
        });
        console.log('Step 2 SUCCESS: Main doc updated.');

      } catch (err) {
        console.error('CRITICAL ERROR in Firestore update:', err);
      }
      console.log('--- ENDING FIRESTORE UPDATE ---');
      
      console.log('Push notification registration successful.');
    }

    return token;
  } catch (error) {
    console.error('Push Notifications registration failed:', error);
    return null;
  }
}
