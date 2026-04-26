import { Stack, usePathname } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import PremiumNavbar from '../components/Navbar';
import "../global.css";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '../context/FavoritesContext';
import { CartProvider } from '../context/CartContext';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const [loaded, error] = useFonts({
    'Ionicons': require('../assets/fonts/Ionicons.ttf'),
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

  if (!loaded && !error) {
    return null;
  }

  const hideNavbarScreens = ['/login', '/checkout', '/addresses', '/account', '/cards', '/security', '/orders', '/servicios', '/checkout-servicio', '/agenda'];
  const shouldHideNavbar = hideNavbarScreens.includes(pathname) || pathname.startsWith('/product/') || pathname.startsWith('/orders/');

  return (
    <View style={{ flex: 1 }}>
      <FavoritesProvider>
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
      </FavoritesProvider>
    </View>
  );
}
