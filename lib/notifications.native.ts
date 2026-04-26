import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function registerForPushNotificationsAsync(userId: string) {
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    console.warn('Push Notifications not supported in Expo Go Android.');
    return null;
  }

  try {
    const Notifications = require('expo-notifications');
    let token;

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
      
      if (finalStatus !== 'granted') return null;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.experienceId;
      
      try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      } catch (e) {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
    }

    if (token && userId) {
      const tokensRef = collection(db, 'users', userId, 'fcm_tokens');
      const q = query(tokensRef, where('fcm_token', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(tokensRef, {
          fcm_token: token,
          device_type: Platform.OS.toUpperCase(),
          created_at: serverTimestamp(),
        });
      }
    }

    return token;
  } catch (error) {
    console.warn('Push Notifications registration failed:', error);
    return null;
  }
}
