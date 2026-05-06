import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { HeartOff, ArrowLeft, Heart, ShoppingCart, Clock, CreditCard, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { auth } from '../../lib/firebase';
import AuthModal from '../../components/AuthModal';

const FavoriteCard = React.memo(({ item, isDesktop, toggleFavorite, addToCart, setShowAuthModal, cart }: any) => {
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const currentVariant = item.variants && item.variants.length > 0 ? item.variants[selectedVarIndex] : null;
  const displayPrice = currentVariant
    ? 'CLP $' + Math.round(currentVariant.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : (typeof item.price === 'number' ? `CLP $${item.price.toLocaleString("de-DE")}` : `${item.price}`.replace('CLP CLP', 'CLP'));

  const cartQty = cart
    .filter((c: any) => String(c.ID_productos) === String(item.id))
    .reduce((acc: number, c: any) => acc + (c.cantidad || 0), 0);

  return (
    <View
      style={{
        width: isDesktop ? '23.5%' : '47%',
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12,
        borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10,
        overflow: 'hidden',
        justifyContent: 'space-between',
        minHeight: isDesktop ? 480 : undefined
      }}
    >
      <View>
        {item.promo ? (
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{item.promo}</Text>
          </View>
        ) : null}

        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
          <Image 
            source={{ uri: item.image }} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
          <TouchableOpacity
            onPress={() => toggleFavorite(item)}
            style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}
          >
            <Heart size={15} color="#EF4444" fill="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 9, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>{item.category || 'PRODUCTO'}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 8, textTransform: 'uppercase' }} numberOfLines={2}>{item.name}</Text>

        {/* Variant chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {item.variants && item.variants.length > 0 ? (
            item.variants.map((v: any, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedVarIndex(i)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  borderWidth: selectedVarIndex === i ? 2 : 1,
                  borderColor: selectedVarIndex === i ? '#63348C' : '#D1D5DB'
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: selectedVarIndex === i ? '#63348C' : '#9CA3AF', textTransform: 'uppercase' }}>{v.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#63348C' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' }}>UNIDAD</Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize: isDesktop ? 20 : 17, fontWeight: '900', color: '#111827', marginBottom: 10 }}>{displayPrice}</Text>
      </View>

      {/* Agregar button */}
      <TouchableOpacity
        onPress={() => {
          if (!auth.currentUser) { setShowAuthModal(true); return; }
          const finalPrice = currentVariant ? currentVariant.price : (typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9]/g, '')));
          addToCart({ id: item.id, name: item.name + (currentVariant ? ` (${currentVariant.label})` : ''), price: finalPrice, image: item.image, quantity: 1 });
        }}
        style={{
          backgroundColor: '#63348C', borderRadius: 12, paddingVertical: 12,
          alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          shadowColor: '#63348C', shadowOpacity: 0.25, shadowRadius: 8
        }}
      >
        <ShoppingCart size={15} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>
          {cartQty > 0 ? `Agregar (${cartQty})` : 'Agregar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const FavoriteServiceCard = ({ item, isDesktop, toggleFavorite, router }: any) => {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/servicio/${item.id}`)}
      activeOpacity={1}
      style={{
        width: isDesktop ? '23.5%' : '47%', // Cambiado para que coincida con FavoriteCard
        backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16,
        borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15,
        justifyContent: 'space-between',
        minHeight: isDesktop ? 480 : undefined
      }}
    >
      <View>
        <View style={{ width: '100%', height: isDesktop ? 180 : 140, borderRadius: 20, overflow: 'hidden', marginBottom: 15 }}>
          <Image 
            source={{ uri: item.image }} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); toggleFavorite(item); }}
            style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}
          >
            <Heart size={18} color="#EF4444" fill="#EF4444" />
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(99, 52, 140, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>${(item.price || 0).toLocaleString("de-DE")}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 9, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>SERVICIO</Text>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 6 }} numberOfLines={2}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Clock size={14} color="#64748B" />
          <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700' }}>{item.duration || '45 min'}</Text>
        </View>

        <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 15 }} numberOfLines={2}>
          {item.description || 'Servicio profesional para tu mascota.'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push(`/servicio/${item.id}`)}
        style={{
          backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 12,
          alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          shadowColor: '#10B981', shadowOpacity: 0.25, shadowRadius: 8
        }}
      >
        <CreditCard size={15} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Reservar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FavoritesScreen = React.memo(function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart, cart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isDesktop = width >= 768;

  const [isReady, setIsReady] = useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* HEADER Optimizado para Notch */}
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

          {isDesktop && (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ position: 'absolute', left: 40, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <ArrowLeft size={18} color="#111827" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Volver</Text>
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>
            {favorites.length === 0 && !isDesktop ? 'Favoritos' : `Mis Favoritos (${favorites.length})`}
          </Text>
        </View>
      </View>

      {!isReady ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#63348C" />
          <Text style={{ marginTop: 12, fontSize: 14, fontWeight: '600', color: '#9CA3AF' }}>Cargando favoritos...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#FFFFFF', padding: 15, paddingBottom: 100 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 100 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ 
                width: 100, height: 100, backgroundColor: '#FFF5F5', borderRadius: 50,
                justifyContent: 'center', alignItems: 'center', marginBottom: 25
              }}>
                <Heart size={40} color="#F87171" fill="#F87171" strokeWidth={2} />
              </View>
              
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 8 }}>
                Sin favoritos
              </Text>
              
              <Text style={{ 
                fontSize: 14, color: '#9CA3AF', fontWeight: '600', textAlign: 'center', 
                marginBottom: 30, maxWidth: 220
              }}>
                Toca el corazón en cualquier producto para guardarlo aquí.
              </Text>

              <TouchableOpacity 
                onPress={() => router.push('/')}
                style={{ 
                  backgroundColor: '#63348C', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40,
                }}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Explorar productos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 100 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {/* Limit rendered components on mount to avoid freezing */}
            {favorites.slice(0, 12).map((item) => {
              if (item.type === 'service') {
                return (
                  <FavoriteServiceCard
                    key={item.id}
                    item={item}
                    isDesktop={isDesktop}
                    toggleFavorite={toggleFavorite}
                    router={router}
                  />
                );
              }
              return (
                <FavoriteCard
                  key={item.id}
                  item={item}
                  isDesktop={isDesktop}
                  toggleFavorite={toggleFavorite}
                  addToCart={addToCart}
                  setShowAuthModal={setShowAuthModal}
                  cart={cart}
                />
              );
            })}
          </View>
        </ScrollView>
      )}

      <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
});
export default FavoritesScreen;
