import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag, Search, User, Heart, Home, LogIn } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { usePathname, router } from 'expo-router';
import { auth } from '../lib/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PremiumNavbar = ({ currentPath }: { currentPath: string }) => {
  const pathname = currentPath;
  const insets = useSafeAreaInsets();

  const { cartCount } = useCart();

  const NAV_ITEMS = [
    { name: 'Inicio',    icon: Home,        path: '/',        badge: 0 },
    ...(auth.currentUser ? [
      { name: 'Favoritos', icon: Heart,       path: '/favorites', badge: 0 },
    ] : []),
    { name: 'Buscar',    icon: Search,      path: '/search',  badge: 0 },
    { name: 'Carrito',   icon: ShoppingBag, path: '/cart',    badge: cartCount },
    { 
      name: auth.currentUser ? 'Perfil' : 'Entrar',    
      icon: auth.currentUser ? User : LogIn,        
      path: auth.currentUser ? '/profile' : '/login', 
      badge: 0 
    },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 36,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 30,
        zIndex: 999,
      }}
    >
      {NAV_ITEMS.map((item, index) => {
        const isActive = pathname === item.path || (item.path === '/' && pathname === '/index');
        return (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (isActive) return;
              // Navigate usa el historial existente si la pantalla ya está en el Stack, previniendo desmontaje.
              router.navigate(item.path as any);
            }}
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            activeOpacity={0.7}
          >
            {/* Icon container — dark circle if active */}
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10, // Modern rounded square
                  backgroundColor: isActive ? '#F47321' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 2,
                }}
              >
                <item.icon
                  size={22}
                  color={isActive ? '#FFFFFF' : '#B0B0B0'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>

              {/* Badge */}
              {item.badge > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#F47321',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>
                    {item.badge}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={{
                fontSize: 10,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#F47321' : '#B0B0B0',
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default PremiumNavbar;
