import { Stack, usePathname, router } from 'expo-router';
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
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.orderId) {
        router.push(`/orders/${data.orderId}`);
      } else {
        router.push('/orders');
      }
    });

    return () => subscription.remove();
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
                contentStyle: { backgroundColor: '#F8F8F8' }
              }}
            >
              <Stack.Screen name="index" />
            </Stack>
            {!isDesktop && !shouldHideNavbar && user && <PremiumNavbar />}
          </CartProvider>
        </ProductsProvider>
      </FavoritesProvider>
    </View>
  );
}
