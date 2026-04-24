import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  // Configuration for Android channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Check if it's a physical device (or web)
  if (Device.isDevice || Platform.OS === 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.experienceId;
    
    try {
      token = (await Notifications.getDevicePushTokenAsync()).data;
      // Alternatively, if the user needs Expo tokens:
      // token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.log('Error getting device token:', e);
      // Fallback to expo token if device token fails
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (err) {
        console.log('Final fallback failed:', err);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (token && userId) {
    try {
      const tokensRef = collection(db, 'users', userId, 'fcm_tokens');
      
      // Check if this token already exists for this user to avoid duplicates
      const q = query(tokensRef, where('fcm_token', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Save to the subcollection as requested
        await addDoc(tokensRef, {
          fcm_token: token,
          device_type: Platform.OS.toUpperCase(), // "IOS", "ANDROID", etc.
          created_at: serverTimestamp(),
        });
        console.log('FCM Token registered successfully');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  return token;
}
