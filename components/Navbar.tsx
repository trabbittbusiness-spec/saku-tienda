import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag, Search, User, Heart, Home } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { usePathname, router } from 'expo-router';

const PremiumNavbar = React.memo(function PremiumNavbar() {
  const pathname = usePathname();

  const { cartCount } = useCart();

  const NAV_ITEMS = [
    { name: 'Inicio',    icon: Home,        path: '/',        badge: 0 },
    { name: 'Favoritos', icon: Heart,       path: '/favorites', badge: 0 },
    { name: 'Buscar',    icon: Search,      path: '/search',  badge: 0 },
    { name: 'Carrito',   icon: ShoppingBag, path: '/cart',    badge: cartCount },
    { name: 'Perfil',    icon: User,        path: '/profile', badge: 0 },
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
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 8,
        paddingBottom: 26,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      {NAV_ITEMS.map((item, index) => {
        const isActive = pathname === item.path;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(item.path as any)}
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            activeOpacity={0.7}
          >
            {/* Icon container — dark circle if active */}
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: isActive ? '#1A1A2E' : 'transparent',
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
                color: isActive ? '#1A1A2E' : '#B0B0B0',
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export default PremiumNavbar;

