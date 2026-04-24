import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, Image } from 'react-native';
import { HeartOff, ArrowLeft, Heart, ShoppingBag, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { favorites, toggleFavorite } = useFavorites();
  const isDesktop = width >= 1024;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* HEADER */}
      <View style={{ 
        height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20
      }}>
        {isDesktop && (
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 40, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft size={18} color="#111827" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Volver</Text>
          </TouchableOpacity>
        )}
        
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
          {favorites.length === 0 && !isDesktop ? 'Favoritos' : `Mis Favoritos (${favorites.length})`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#FFFFFF' }}>
        {favorites.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
            {isDesktop ? (
              <View style={{ alignItems: 'center' }}>
                <View style={{ 
                  width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFF5F5',
                  justifyContent: 'center', alignItems: 'center', marginBottom: 32
                }}>
                  <HeartOff size={60} color="#F87171" strokeWidth={1.5} />
                </View>

                <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 16 }}>
                  ¡Tu lista está vacía!
                </Text>
                
                <Text style={{ 
                  fontSize: 16, color: '#6B7280', fontWeight: '500', textAlign: 'center', 
                  lineHeight: 24, maxWidth: 400, marginBottom: 40 
                }}>
                  Parece que aún no has marcado ningún producto como favorito. Explora nuestra tienda y guarda lo que más te guste.
                </Text>

                <TouchableOpacity 
                  onPress={() => router.push('/')}
                  style={{ 
                    backgroundColor: '#F47321', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32,
                    shadowColor: '#F47321', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Explorar productos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
                <View style={{ 
                  width: 160, height: 160, backgroundColor: '#FFFFFF', borderRadius: 45,
                  justifyContent: 'center', alignItems: 'center', marginBottom: 35,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 25, shadowOffset: { width: 0, height: 12 }
                }}>
                  <Heart size={72} color="#1A1A40" strokeWidth={2} />
                </View>
                
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 15 }}>
                  Sin favoritos
                </Text>
                
                <Text style={{ 
                  fontSize: 15, color: '#9CA3AF', fontWeight: '600', textAlign: 'center', 
                  lineHeight: 22, marginBottom: 45, maxWidth: 280
                }}>
                  Toca el corazón en cualquier producto para guardarlo aquí
                </Text>

                <TouchableOpacity 
                  onPress={() => router.push('/')}
                  style={{ 
                    backgroundColor: '#1A1A40', borderRadius: 32, paddingVertical: 18, paddingHorizontal: 65,
                    shadowColor: '#1A1A40', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Descubrir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {favorites.map((item) => (
              <TouchableOpacity 
                onPress={() => router.push(`/product/${item.id}`)}
                key={item.id} 
                style={{ 
                  width: isDesktop ? '23.5%' : '47%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16,
                  borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10,
                  overflow: 'hidden'
                }}
              >
                {item.promo && (
                  <View style={{ 
                    position: 'absolute', top: 12, left: -22, backgroundColor: '#22C55E', 
                    width: 90, height: 24, transform: [{ rotate: '-45deg' }], 
                    justifyContent: 'center', alignItems: 'center', zIndex: 20,
                    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
                  }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 }}>PROMO</Text>
                  </View>
                )}
                <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item);
                    }}
                    style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}
                  >
                    <Heart size={16} color="#EF4444" fill="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' }}>{item.category || 'PRODUCTO'}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', height: 40 }} numberOfLines={2}>{item.name}</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E1B4B' }}>
                    {typeof item.price === 'number' ? `$${item.price.toLocaleString()} CLP` : `${item.price} CLP`.replace('CLP CLP', 'CLP')}
                  </Text>
                  <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
                    <ShoppingBag size={16} color="white" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
