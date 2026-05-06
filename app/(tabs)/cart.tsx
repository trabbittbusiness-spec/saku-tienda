import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { auth } from '../../lib/firebase';
import AuthModal from '../../components/AuthModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CartScreen = React.memo(function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;

  React.useEffect(() => {
    if (isDesktop) {
      router.replace('/');
    }
  }, [isDesktop]);

  const [isReady, setIsReady] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    if (!isReady) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Header Optimizado para Notch */}
          <View style={{ 
            paddingTop: insets.top,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
            zIndex: 100
          }}>
            <View style={{ 
              height: 64,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20
            }}>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Mi Carrito</Text>
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#63348C" />
            <Text style={{ marginTop: 12, fontSize: 14, fontWeight: '600', color: '#9CA3AF' }}>Cargando carrito...</Text>
          </View>
        </View>
      );
    }

    if (cart.length === 0) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Header Optimizado para Notch */}
          <View style={{ 
            paddingTop: insets.top,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
            zIndex: 100
          }}>
            <View style={{ 
              height: 64,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20
            }}>
              <TouchableOpacity 
                onPress={() => router.push('/')}
                style={{ 
                  position: 'absolute', 
                  left: 15, 
                  width: 44, 
                  height: 44, 
                  borderRadius: 22, 
                  backgroundColor: '#F9FAFB', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#F3F4F6'
                }}
              >
                <ChevronLeft size={24} color="#111827" strokeWidth={3} />
              </TouchableOpacity>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Mi Carrito</Text>
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 100 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 100, height: 100, backgroundColor: '#FFF7ED', borderRadius: 50,
                justifyContent: 'center', alignItems: 'center', marginBottom: 25
              }}>
                <ShoppingBag size={40} color="#FF7F32" strokeWidth={2} />
              </View>
              
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 8 }}>
                Carrito vacío
              </Text>
              
              <Text style={{ 
                fontSize: 14, color: '#9CA3AF', fontWeight: '600', textAlign: 'center', 
                marginBottom: 30, maxWidth: 220
              }}>
                Añade productos a tu carrito para verlos aquí.
              </Text>

              <TouchableOpacity 
                onPress={() => router.push('/')}
                style={{ 
                  backgroundColor: '#63348C', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40,
                }}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Ir a la tienda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header Optimizado para Notch */}
        <View style={{ 
          paddingTop: insets.top,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
          zIndex: 100
        }}>
          <View style={{ 
            height: 64,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20
          }}>
            <TouchableOpacity 
              onPress={() => router.push('/')}
              style={{ 
                position: 'absolute', 
                left: 15, 
                width: 44, 
                height: 44, 
                borderRadius: 22, 
                backgroundColor: '#F9FAFB', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#F3F4F6'
              }}
            >
              <ChevronLeft size={24} color="#111827" strokeWidth={3} />
            </TouchableOpacity>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Mi Carrito</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '700' }}>{cart.length} productos</Text>
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/orders')}
              style={{ 
                position: 'absolute', 
                right: 20, 
                width: 44, 
                height: 44, 
                backgroundColor: '#F9FAFB', 
                borderRadius: 12, 
                justifyContent: 'center', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#F3F4F6'
              }}
            >
              <ShoppingBag size={20} color="#111827" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 180 }}>
          {cart.map((item) => (
            <View key={item.firebaseId || `${item.ID_productos}-${item.medida}`} style={{ 
              backgroundColor: '#FFFFFF', borderRadius: 28, padding: 16, marginBottom: 15, 
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: '#F3F4F6',
              shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, shadowOffset: { width: 0, height: 4 }
            }}>
              {/* Image Container */}
              <View style={{ width: 85, height: 85, backgroundColor: '#FFF9F5', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                  source={{ uri: item.foto }} 
                  style={{ width: '80%', height: '80%' }} 
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>

              <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#111827', textTransform: 'uppercase' }} numberOfLines={2}>
                      {item.nombre}
                    </Text>
                    {item.medida && item.medida !== 'Único' && (
                      <Text style={{ fontSize: 11, color: '#63348C', fontWeight: '800', marginTop: 2 }}>
                        FORMATO: {item.medida}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeFromCart(item.firebaseId || item.ID_productos)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF1F1', justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}
                  >
                    <Trash2 size={14} color="#F87171" />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 4 }}>
                  ${(item.precio || 0).toLocaleString("de-DE")} CLP c/u
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>
                    ${(item.subtotal || 0).toLocaleString("de-DE")} CLP
                  </Text>
                  
                  {/* Quantity Selector */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' }}>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.ID_productos, item.cantidad - 1)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                    >
                      <Minus size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827', minWidth: 30, textAlign: 'center' }}>
                      {item.cantidad}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.ID_productos, item.cantidad + 1)}
                      style={{ backgroundColor: '#63348C', paddingHorizontal: 12, paddingVertical: 8 }}
                    >
                      <Plus size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Floating Checkout Button */}
        <View style={{ 
          position: 'absolute', 
          bottom: isDesktop ? 40 : insets.bottom + 135, 
          left: 0, right: 0, 
          paddingHorizontal: 20, zIndex: 100 
        }}>
          <TouchableOpacity 
            onPress={() => {
              if (!auth.currentUser) {
                setShowAuthModal(true);
                return;
              }
              router.push('/checkout');
            }}
            style={{ 
              backgroundColor: '#10B981', borderRadius: 24, padding: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }
            }}
          >
            <View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>CHECKOUT</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>{cart.length} productos</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>${cartTotal.toLocaleString("de-DE")} CLP</Text>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <ArrowLeft size={18} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={() => router.back()} 
        />
        <View style={{ 
          width: 520, 
          backgroundColor: '#FFFFFF', 
          height: '100%', 
          shadowColor: '#000', 
          shadowOffset: { width: -10, height: 0 }, 
          shadowOpacity: 0.1, 
          shadowRadius: 20, 
          elevation: 15 
        }}>
          {renderContent()}
        </View>
      </View>
    );
  }

  return (
    <>
      {renderContent()}
      <AuthModal 
        isVisible={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
});
export default CartScreen;
