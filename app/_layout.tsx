import React from 'react';
import { Stack, Tabs, usePathname, router } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import PremiumNavbar from '../components/Navbar';
import "../global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../context/FavoritesContext';
import { CartProvider } from '../context/CartContext';
import { ProductsProvider } from '../context/ProductsContext';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useState } from 'react';
import { Vibration, AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Unified dynamic import helper to avoid crashes in Expo Go Android
const getNotificationsModule = () => {
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

const Notifications = getNotificationsModule();
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.log('Error setting notification handler');
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const alarmSound = useAudioPlayer(require('../assets/audio/saku_compra.mp3'));
  alarmSound.loop = true;
  const pathname = usePathname();
  const [loaded, error] = useFonts({
    'Ionicons': require('../assets/fonts/Ionicons.ttf'),
    'FontAwesome': require('../assets/fonts/FontAwesome.ttf'),
  });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);


  useEffect(() => {
    // 1. Auth & Push Registration
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Defer push registration to avoid blocking the UI thread
        setTimeout(() => {
          const { registerForPushNotificationsAsync } = require('../lib/notifications');
          registerForPushNotificationsAsync(currentUser.uid).catch((err: any) => {
            console.log('Error registering push notifications:', err);
          });
        }, 2000); // 2 seconds delay
      }
    });

    // 2. Heavy Setup (Audio, Notifications, Alarm) - Defer until interactions finish
    const { InteractionManager } = require('react-native');
    InteractionManager.runAfterInteractions(() => {
      setupHeavyModules();
    });

    // 3. Clear Notification Badge on Open (iOS)
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        const NotificationsModule = getNotificationsModule();
        if (NotificationsModule && Platform.OS === 'ios') {
          NotificationsModule.setBadgeCountAsync(0).catch(() => {});
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial clear
    const NotificationsModule = getNotificationsModule();
    if (NotificationsModule && Platform.OS === 'ios') {
      NotificationsModule.setBadgeCountAsync(0).catch(() => {});
    }

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const setupHeavyModules = async () => {
    // Setup Audio Mode (permite sonido en modo silencioso en iOS)
    try {
      await setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) { console.log("Audio setup error:", e); }

    // Setup Notification Listeners
    const NotificationsModule = getNotificationsModule();
    if (NotificationsModule && Constants.appOwnership !== 'expo') {
      NotificationsModule.addNotificationReceivedListener((notification: any) => {
        const { Alert: RNAlert } = require('react-native');
        RNAlert.alert(
          notification.request.content.title || 'Notificación Recibida',
          notification.request.content.body || 'Has recibido una nueva actualización.',
          [{ text: 'OK' }]
        );
        startAlarm();
      });

      NotificationsModule.addNotificationResponseReceivedListener((response: any) => {
        stopAlarm();
        const data = response.notification.request.content.data;
        if (data?.orderId) router.push(`/orders/${data.orderId}`);
        else router.push('/orders');
      });
    }
  };

  const startAlarm = async () => {
    if (isAlarmActive) return;
    setIsAlarmActive(true);
    try {
      alarmSound.play();
      Vibration.vibrate([1000, 500, 1000, 500], true);
    } catch (err) { console.error("Alarm error:", err); }
  };

  const stopAlarm = async () => {
    setIsAlarmActive(false);
    try {
      alarmSound.pause();
      Vibration.cancel();
    } catch (err) { console.error("Stop alarm error:", err); }
  };

  useEffect(() => {
    if (loaded || error) {
      // Small delay to ensure the first frame is painted before hiding splash
      setTimeout(() => SplashScreen.hideAsync(), 100);
    }
  }, [loaded, error]);

  // Rest of the component logic...


  if (!loaded && !error) {
    return null;
  }

  const hideNavbarScreens = ['/login', '/checkout', '/addresses', '/account', '/cards', '/security', '/orders', '/servicios', '/checkout-servicio', '/agenda'];
  const shouldHideNavbar = hideNavbarScreens.includes(pathname) || pathname.startsWith('/product/') || pathname.startsWith('/orders/') || pathname.startsWith('/servicio/');

  return (
    <View style={{ flex: 1 }}>
      <FavoritesProvider>
        <ProductsProvider>
          <CartProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8F8F8' },
                animation: 'slide_from_right' // Animación natural para sub-páginas
              }}
            >
              {/* El grupo (tabs) maneja las 5 pantallas persistentes */}
              <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
              
              {/* Todas las demás páginas se apilan encima automáticamente */}
              <Stack.Screen name="login" />
              <Stack.Screen name="checkout" />
            </Stack>
            {!isDesktop && !shouldHideNavbar && <PremiumNavbar currentPath={pathname} />}
          </CartProvider>
        </ProductsProvider>
      </FavoritesProvider>
    </View>
  );
}
