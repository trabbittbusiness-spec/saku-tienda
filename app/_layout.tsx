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
import { Vibration, AppState } from 'react-native';
import Constants from 'expo-constants';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('Notifications not available in this environment');
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Registrar para notificaciones Push cada vez que se inicia la app o cambia el usuario
        const { registerForPushNotificationsAsync } = require('../lib/notifications');
        registerForPushNotificationsAsync(currentUser.uid).catch((err: any) => {
          console.log('Error registering push notifications on layout load:', err);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    // Listen for notification responses (clicks)
    let subscription: any = null;
    try {
      if (Notifications && Notifications.addNotificationResponseReceivedListener) {
        subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
          const data = response.notification.request.content.data;
          if (data?.orderId) {
            router.push(`/orders/${data.orderId}`);
          } else {
            router.push('/orders');
          }
        });
      }
    } catch (e) {
      console.log('Notifications not available in this environment');
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // Persistent Alarm Logic (Replicating Admin behavior)
  useEffect(() => {
    let soundObject: any = null;
    let vibrationInterval: any = null;
    
    const getAudio = () => {
      try { return require('expo-av').Audio; } catch (e) { return null; }
    };
    const getNotifications = () => {
      try { return require('expo-notifications'); } catch (e) { return null; }
    };

    const setupAudio = async () => {
      const AudioModule = getAudio();
      if (AudioModule) {
        try {
          await AudioModule.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            interruptionModeIOS: (AudioModule as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: (AudioModule as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            playThroughEarpieceAndroid: false,
          });
        } catch (e) { console.log("Audio mode setup error:", e); }
      }
    };
    setupAudio();

    const startAlarm = async () => {
      if (isAlarmActive) return;
      console.log("ALARM: Starting persistent alert for Tienda...");
      setIsAlarmActive(true);
      const AudioModule = getAudio();
      if (!AudioModule) return;

      try {
        if (!soundObject) {
          const { sound } = await AudioModule.Sound.createAsync(
            require('../assets/audio/saku_compra.mp3'),
            { 
              shouldPlay: true, 
              isLooping: true, 
              volume: 1.0,
              androidImplementation: 'MediaPlayer'
            },
            (status: any) => {
               if (status.isLoaded && !status.isPlaying && status.didJustFinish && !status.isLooping) {
                 sound.replayAsync();
               }
            }
          );
          soundObject = sound;
        }
        
        await soundObject.setStatusAsync({ shouldPlay: true, isLooping: true, volume: 1.0 });

        Vibration.cancel();
        Vibration.vibrate([1000, 500, 1000, 500], true);
        vibrationInterval = "active";
      } catch (err) { console.error("Error starting alarm:", err); }
    };

    const stopAlarm = async () => {
      setIsAlarmActive(false);
      try {
        if (soundObject) {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
          soundObject = null;
        }
        if (vibrationInterval) {
          Vibration.cancel();
          vibrationInterval = null;
        }
      } catch (err) { console.error("Error stopping alarm:", err); }
    };

    let notificationListener: any;
    let responseListener: any;
    const NotificationsModule = getNotifications();

    if (NotificationsModule && Constants.appOwnership !== 'expo') {
      notificationListener = NotificationsModule.addNotificationReceivedListener((notification: any) => {
        console.log("ALARM: Notification received, triggering alarm");
        startAlarm();
      });

      responseListener = NotificationsModule.addNotificationResponseReceivedListener((response: any) => {
        stopAlarm();
      });
    }

    const appStateListener = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        stopAlarm();
      }
    });

    stopAlarm(); 

    return () => {
      if (notificationListener) notificationListener.remove();
      if (responseListener) responseListener.remove();
      appStateListener.remove();
      stopAlarm();
    };
  }, []);

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
