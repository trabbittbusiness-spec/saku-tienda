import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';

export default function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const isDesktop = width >= 1024;

  React.useEffect(() => {
    if (isDesktop) {
      router.replace('/');
    }
  }, [isDesktop]);

  const renderContent = () => {
    if (cart.length === 0) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <View style={{ 
            height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20
          }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ position: 'absolute', left: 20, width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
            >
              <ArrowLeft size={18} color="#111827" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Mi Carrito</Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 100 }}>
            <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
              <View style={{ 
                width: 160, height: 160, backgroundColor: '#FFFFFF', borderRadius: 45,
                justifyContent: 'center', alignItems: 'center', marginBottom: 35,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 25, shadowOffset: { width: 0, height: 12 }
              }}>
                <ShoppingBag size={72} color="#FF7F32" strokeWidth={2} />
              </View>
              
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 15 }}>
                Tu carrito está vacío
              </Text>
              
              <Text style={{ 
                fontSize: 15, color: '#9CA3AF', fontWeight: '600', textAlign: 'center', 
                lineHeight: 22, marginBottom: 45, maxWidth: 280
              }}>
                Descubre productos increíbles para tu mascota
              </Text>

              <TouchableOpacity 
                onPress={() => router.push('/')}
                style={{ 
                  backgroundColor: '#FF7F32', borderRadius: 32, paddingVertical: 18, paddingHorizontal: 65,
                  shadowColor: '#FF7F32', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Explorar productos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ 
          backgroundColor: '#FFFFFF', paddingVertical: 20,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 20, width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Mi Carrito</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>{cart.length} productos</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/orders')}
            style={{ position: 'absolute', right: 20, width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ShoppingBag size={20} color="#4B5563" />
          </TouchableOpacity>
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
                <Image source={{ uri: item.foto }} style={{ width: '80%', height: '80%' }} resizeMode="contain" />
              </View>

              <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#111827', textTransform: 'uppercase' }} numberOfLines={2}>
                      {item.nombre}
                    </Text>
                    {item.medida && (
                      <Text style={{ fontSize: 11, color: '#F47321', fontWeight: '800', marginTop: 2 }}>
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
                  ${(item.precio || 0).toLocaleString()} c/u
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>
                    ${(item.subtotal || 0).toLocaleString()}
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
                      style={{ backgroundColor: '#F47321', paddingHorizontal: 12, paddingVertical: 8 }}
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
          position: 'absolute', bottom: isDesktop ? 40 : 110, left: 0, right: 0, 
          paddingHorizontal: 20, zIndex: 100 
        }}>
          <TouchableOpacity 
            onPress={() => router.push('/checkout')}
            style={{ 
              backgroundColor: '#22C55E', borderRadius: 24, padding: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }
            }}
          >
            <View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>CHECKOUT</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>{cart.length} productos</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>${cartTotal.toLocaleString()}</Text>
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

  return renderContent();
}
