import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure how notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    let deviceToken;
    let expoToken;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
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
      
      // Attempt to get both tokens for maximum reliability
      try {
        deviceToken = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('Device token obtained:', deviceToken);
      } catch (e) {
        console.warn('Failed to get device token:', e);
      }

      try {
        expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo token obtained:', expoToken);
      } catch (e) {
        console.warn('Failed to get Expo token:', e);
      }
    } else {
      console.warn('Must use physical device for push notifications');
      return null;
    }

    const primaryToken = deviceToken || expoToken;

    if (primaryToken) {
      console.log('--- STARTING FIRESTORE UPDATE ---');
      try {
        const tokenData = {
          fcm_token: deviceToken || null,
          expo_token: expoToken || null,
          fcmToken: deviceToken || null, // Compatibility
          pushToken: expoToken || null, // Compatibility
          device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
          updated_at: serverTimestamp(),
        };

        // 1. Save to subcollection (using deviceToken as ID if possible, else expoToken)
        const tokenId = deviceToken || expoToken.replace(/[^a-zA-Z0-9]/g, '_');
        const subRef = collection(db, 'users', userId, 'fcm_tokens');
        const tokenDocRef = doc(subRef, tokenId);
        await setDoc(tokenDocRef, tokenData, { merge: true });
        console.log('Subcollection updated.');

        // 2. Update main user doc
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcm_token: deviceToken || null,
          expo_token: expoToken || null,
          fcmToken: deviceToken || null,
          pushToken: expoToken || null,
          last_token_update: serverTimestamp(),
          device_platform: Platform.OS
        });
        console.log('Main user doc updated.');

      } catch (err) {
        console.error('CRITICAL ERROR in Firestore update:', err);
      }
      console.log('--- ENDING FIRESTORE UPDATE ---');
    }

    return primaryToken;
  } catch (error) {
    console.error('Push Notifications registration failed:', error);
    return null;
  }
}
