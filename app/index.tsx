import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, { ZoomIn, useSharedValue, withRepeat, withTiming, withDelay, useAnimatedStyle } from 'react-native-reanimated';
import { Heart, Star, Plus, Package, Dog as DogIcon, Cat as CatIcon, Bird, Stethoscope, ChevronRight, Truck } from 'lucide-react-native';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

const BREAKPOINT = 1024; // Aumentar breakpoint para desktop real

// ── SHARED DATA ───────────────────────────────────────────────────────────────
const mobileHeroSlides = [
  {
    id: 1,
    badge: 'LANZAMIENTO',
    badgeColor: '#2EC4B6',
    title: 'Nueva Línea ProPlan',
    subtitle: 'Nutrición avanzada.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=900',
  },
  {
    id: 2,
    badge: 'OFERTA',
    badgeColor: '#F47321',
    title: 'Camas Ortopédicas',
    subtitle: 'Hasta 40% OFF.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=900',
  },
];

const desktopBanners = {
  main: {
    badge: 'FARMACIA',
    badgeColor: 'rgba(255,255,255,0.3)', // Color aproximado fondo semitransparente pastel
    title: 'Descuento en Bravecto',
    subtitle: 'Protección por 12 semanas.',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200', // Cachorrito
    gradientLeft: 'rgba(238, 90, 36, 0.9)', // Rojo/Naranja
    gradientRight: 'rgba(238, 90, 36, 0.4)',
  },
  topRight: {
    badge: 'LANZAMIENTO',
    badgeColor: '#FFFFFF',
    badgeTextColor: '#1A1A2E',
    title: 'Nueva Línea ProPlan',
    subtitle: 'Nutrición avanzada.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=600', // Bulldog
    overlayColor: 'rgba(10, 160, 150, 0.7)', // Teal
  },
  bottomRight: {
    badge: 'OFERTA',
    badgeColor: '#FFFFFF',
    badgeTextColor: '#F47321',
    title: 'Camas Ortopédicas',
    subtitle: 'Hasta 40% OFF.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=600', // Gato durmiendo aprox
    overlayColor: 'rgba(244, 115, 33, 0.5)', // Naranja solape
  }
};

const desktopPromos = [
  { ...desktopBanners.main, id: 1 },
  { ...desktopBanners.topRight, id: 2, badgeColor: '#F47321', badgeTextColor: 'white', overlayColor: 'rgba(20, 70, 90, 0.8)' }, // Ajustes menores visuales para la card pequeña
  { ...desktopBanners.bottomRight, id: 3, badgeColor: '#FFFFFF', badgeTextColor: '#333', overlayColor: 'rgba(100, 100, 100, 0.4)' },
];

const petCategories = [
  { id: 1, name: 'Perro',    icon: DogIcon, color: '#FF7D33', bg: '#FFF1E9' },
  { id: 2, name: 'Gato',     icon: CatIcon, color: '#4E5BA6', bg: '#EEF0FF' },
  { id: 3, name: 'Exóticos', icon: Bird,    color: '#2EC4B6', bg: '#E9F9F8' },
  { id: 4, name: 'Servicios', icon: Stethoscope, color: '#E74C3C', bg: '#FDECEA' },
];

const products = [
  { id: 1, category: 'PERRO O GATO', name: 'BRIT CARE GRAIN FREE SENIOR & LIGHT ...', price: '$74.990', rating: 5, image: 'https://images.unsplash.com/photo-1589924691106-073b19f55de7?q=80&w=500' },
  { id: 2, category: 'PERRO O GATO', name: 'ROYAL CANIN XSMALL PUPPY 2,5 KG', price: '$32.990', rating: 5, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500' },
  { id: 3, category: 'PERRO O GATO', name: 'PETEVER FORTE 150 ML', price: '$19.200', rating: 5, image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=500' },
];

// ══════════════════════════════════════════════════════════════════════════════
//  MOBILE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function MobileHeroCarousel({ screenWidth }: { screenWidth: number }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const CARD_W = screenWidth - 32;
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % mobileHeroSlides.length;
      flatListRef.current?.scrollToIndex({
        index: indexRef.current,
        animated: true
      });
      setActiveSlide(indexRef.current);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
    indexRef.current = idx;
    if (idx !== activeSlide) setActiveSlide(idx);
  };

  return (
    <View style={{ marginHorizontal: 15, borderRadius: 20, overflow: 'hidden', height: 260, marginTop: -140, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 25, elevation: 20, backgroundColor: '#FFFFFF' }}>
      <FlatList
        ref={flatListRef}
        data={mobileHeroSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id.toString()}
        getItemLayout={(_, index) => ({
          length: CARD_W,
          offset: CARD_W * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={{ width: CARD_W, height: 260 }}>
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: item.badgeColor, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>{item.badge}</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 20, left: 16, right: 60 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', lineHeight: 28, letterSpacing: -0.5 }}>{item.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,1)', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />
      <View style={{ position: 'absolute', bottom: 24, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {mobileHeroSlides.map((_, i) => (
          <View key={i} style={{ width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === activeSlide ? 'white' : 'rgba(255,255,255,0.5)' }} />
        ))}
      </View>
    </View>
  );
}

function MobileProductCard({ item }: { item: typeof products[0] }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={{ 
      width: 170, 
      backgroundColor: '#FFFFFF', 
      borderRadius: 20, 
      marginRight: 16, 
      overflow: 'visible', // Permitir sombras fuera del contenedor
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 8 }, 
      shadowOpacity: 0.08, 
      shadowRadius: 16, 
      elevation: 5, 
      borderWidth: 1, 
      borderColor: '#F0F0F0', 
      padding: 12 
    }}>
      <TouchableOpacity onPress={() => setLiked(!liked)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
        <Heart size={20} color={liked ? '#EF4444' : '#E5E7EB'} fill={liked ? '#EF4444' : 'transparent'} strokeWidth={2} />
      </TouchableOpacity>

      <View style={{ width: '100%', height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Image source={{ uri: item.image }} style={{ width: '90%', height: '90%' }} resizeMode="contain" />
      </View>

      <Text style={{ fontSize: 9, color: '#1F8A70', fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>{item.category}</Text>
      
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A2E', lineHeight: 16, marginBottom: 10, minHeight: 32 }} numberOfLines={2}>
        {item.name}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A2E' }}>{item.price}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#B0B0B0' }}>{item.rating}</Text>
        </View>
      </View>

      <TouchableOpacity 
        activeOpacity={0.8}
        style={{ 
          backgroundColor: '#1F8A70', 
          borderRadius: 12, 
          paddingVertical: 10, 
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Agregar +</Text>
      </TouchableOpacity>
    </View>
  );
}

function PulseAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.8, { duration: 1500 }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#10B981',
      }, animatedStyle]}
    />
  );
}

function RippleRing({ delay }: { delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withDelay(delay, withRepeat(
        withTiming(1.8, { duration: 1400 }),
        -1,
        false
      ));
      opacity.value = withDelay(delay, withRepeat(
        withTiming(0, { duration: 1400 }),
        -1,
        false
      ));
      // reset to visible after each cycle
      opacity.value = withDelay(delay, withRepeat(
        withTiming(0, { duration: 1400 }),
        -1,
        false
      ));
    };
    // set initial opacity before starting
    opacity.value = 0.5;
    scale.value = 1;
    startAnimation();
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#10B981',
        opacity: 0.4,
      }, style]}
    />
  );
}

function ActiveOrderBanner() {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 8,
        backgroundColor: '#EDFAF3',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#6EE7B7',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      {/* Left: ripple waves + solid circle */}
      <View style={{ 
        width: 80, 
        height: 80, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 8 
      }}>
        <RippleRing delay={0} />
        <RippleRing delay={500} />
        <RippleRing delay={1000} />
        {/* Solid green circle on top */}
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#10B981',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          zIndex: 10,
        }}>
          <View style={{
            width: 18,
            height: 18,
            borderWidth: 2.5,
            borderColor: 'white',
            borderRadius: 3,
          }} />
        </View>
      </View>

      {/* Center: badge + title + subtitle */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <View style={{
            backgroundColor: '#10B981',
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 20,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>1 Orden</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#065F46' }}>Activas</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#059669', fontWeight: '600' }}>
          Toca para ver el estado de tu pedido →
        </Text>
      </View>

      {/* Right: small green square outline */}
      <View style={{
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#34D399',
        borderRadius: 4,
        marginLeft: 8,
      }} />
    </TouchableOpacity>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  DESKTOP COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function DesktopPromoCard({ item, index }: { item: any, index: number }) {
  return (
    <Animated.View entering={ZoomIn.delay(index * 50).duration(500)} style={{ flex: 1, minWidth: 280, height: 180, borderRadius: 20, overflow: 'hidden', marginRight: 20 }}>
      <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: item.overlayColor }} />
      <View style={{ padding: 24, flex: 1, justifyContent: 'flex-start' }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: item.badgeColor, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 }}>
          <Text style={{ color: item.badgeTextColor || 'white', fontSize: 10, fontWeight: '800' }}>{item.badge}</Text>
        </View>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{item.title}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' }}>{item.subtitle}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ alignSelf: 'flex-start', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
          <Text style={{ color: '#1A1A2E', fontSize: 12, fontWeight: '800' }}>Ver ofertas →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= BREAKPOINT;

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Header />
        <CategoryBar />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 40, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* HERO BANNER GRID */}
          <View style={{ flexDirection: 'row', marginTop: 32, gap: 20, height: 420 }}>
            {/* MAIN (Left) */}
            <View style={{ flex: 2, borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
              <Image source={{ uri: desktopBanners.main.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
              {/* Gradients */}
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '60%', backgroundColor: desktopBanners.main.gradientLeft }} />
              <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '40%', backgroundColor: desktopBanners.main.gradientRight }} />

              {/* Content */}
              <View style={{ padding: 48, flex: 1, justifyContent: 'center' }}>
                <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{desktopBanners.main.badge}</Text>
                </View>
                <Text style={{ color: 'white', fontSize: 42, fontWeight: '900', letterSpacing: -1, marginBottom: 8 }}>{desktopBanners.main.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '500', marginBottom: 32 }}>{desktopBanners.main.subtitle}</Text>
                <TouchableOpacity style={{ alignSelf: 'flex-start', backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 }}>
                  <Text style={{ color: '#1A1A2E', fontSize: 14, fontWeight: '800' }}>Ver ofertas →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* RIGHT COLUMN */}
            <View style={{ flex: 1, gap: 20 }}>
              {/* TOP RIGHT */}
              <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
                <Image source={{ uri: desktopBanners.topRight.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: desktopBanners.topRight.overlayColor }} />
                <View style={{ padding: 32, flex: 1, justifyContent: 'center' }}>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: desktopBanners.topRight.badgeColor, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 }}>
                    <Text style={{ color: desktopBanners.topRight.badgeTextColor, fontSize: 10, fontWeight: '900' }}>{desktopBanners.topRight.badge}</Text>
                  </View>
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 4 }}>{desktopBanners.topRight.title}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' }}>{desktopBanners.topRight.subtitle}</Text>
                </View>
              </View>

              {/* BOTTOM RIGHT */}
              <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
                <Image source={{ uri: desktopBanners.bottomRight.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: desktopBanners.bottomRight.overlayColor }} />
                <View style={{ padding: 32, flex: 1, justifyContent: 'center' }}>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: desktopBanners.bottomRight.badgeColor, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 }}>
                    <Text style={{ color: desktopBanners.bottomRight.badgeTextColor, fontSize: 10, fontWeight: '900' }}>{desktopBanners.bottomRight.badge}</Text>
                  </View>
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 4 }}>{desktopBanners.bottomRight.title}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' }}>{desktopBanners.bottomRight.subtitle}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* PROMOCIONES ESPECIALES */}
          <View style={{ marginTop: 48 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 6, height: 24, backgroundColor: '#F47321', borderRadius: 4, marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1A2E' }}>Promociones Especiales</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#888', marginTop: 2 }}>🏷️ Descuentos exclusivos por tiempo limitado</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {desktopPromos.map((item, idx) => (
                <DesktopPromoCard key={item.id} item={item} index={idx} />
              ))}
            </ScrollView>
          </View>

        </ScrollView>
      </View>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <Header />
        <MobileHeroCarousel screenWidth={screenWidth} />
        
        {/* Section: Categories */}
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: 15, marginBottom: 18 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 }}>Explora categorías</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 }}>
            {[
              { id: 1, name: 'Perro',     IconComp: DogIcon,     color: '#C8860A', bg: '#FFF9F0', border: '#F5DEB3' },
              { id: 2, name: 'Gato',      IconComp: CatIcon,     color: '#D4820B', bg: '#FFF9F0', border: '#F5DEB3' },
              { id: 3, name: 'Exóticos',  IconComp: Bird,        color: '#A0522D', bg: '#FFF9F0', border: '#F5DEB3' },
              { id: 4, name: 'Servicios', IconComp: Stethoscope, color: '#C0392B', bg: '#FFF9F0', border: '#F5DEB3' }
            ].map((cat) => (
              <TouchableOpacity key={cat.id} style={{ alignItems: 'center' }} activeOpacity={0.8}>
                <View 
                  style={{ 
                    width: 76, 
                    height: 76, 
                    borderRadius: 26, 
                    backgroundColor: cat.bg, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginBottom: 10,
                    borderWidth: 1.5,
                    borderColor: cat.border,
                    shadowColor: '#D4820B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    elevation: 3
                  }}
                >
                  <cat.IconComp size={36} color={cat.color} strokeWidth={1.8} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2D1B00', textAlign: 'center' }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ActiveOrderBanner />

        {/* Section: Promotions */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 }}>Últimas promociones</Text>
            <TouchableOpacity style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#D97706' }}>VER TODO</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 24 }}>
            {products.map((item) => (
              <MobileProductCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        {/* WhatsApp Community Banner */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={{ 
            marginHorizontal: 15, 
            marginTop: 32, 
            marginBottom: 40,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: '#10B981',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <Image 
            source={require('../assets/images/whatsapp_banner_v2.png')} 
            style={{ width: '100%', height: 120 }} 
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Social Follow Section */}
        <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 40, paddingHorizontal: 20 }}>
          <Text style={{ color: '#2E852D', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12, textAlign: 'center' }}>
            NOS ENCANTAN LAS MASCOTAS FELICES Y SALUDABLES
          </Text>
          <Text style={{ color: '#092B19', fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
            Síguenos en @drpetchile
          </Text>
        </View>

        {/* Footer Info Section */}
        <View style={{ backgroundColor: '#F4F4F4', paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
             <View>
               <Truck size={36} color="#092B19" strokeWidth={1.5} />
             </View>
             <View>
               <Text style={{ color: '#092B19', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 4 }}>
                 DESPACHOS
               </Text>
               <Text style={{ color: '#092B19', fontSize: 16, fontWeight: '500' }}>
                 Santiago y Coquimbo
               </Text>
             </View>
          </View>
        </View>

        {/* Newsletter Section */}
        <View style={{ height: 320, position: 'relative', overflow: 'hidden' }}>
          <Image 
            source={require('../assets/images/newsletter_bg.png')} 
            style={{ width: '100%', height: '100%', position: 'absolute' }} 
            resizeMode="cover"
          />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 30, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 24, lineHeight: 34 }}>
              Inscríbete y recibe nuestras promociones
            </Text>
            
            <TextInput 
              placeholder="Su dirección de correo electrónico"
              placeholderTextColor="rgba(0,0,0,0.4)"
              style={{ 
                backgroundColor: '#FFFFFF', 
                width: '100%', 
                height: 56, 
                borderRadius: 14, 
                paddingHorizontal: 20, 
                fontSize: 15,
                color: '#1A1A2E',
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.3)'
              }}
            />
            
            <TouchableOpacity 
              activeOpacity={0.9}
              style={{ 
                backgroundColor: '#2E852D', 
                width: '100%', 
                height: 54, 
                borderRadius: 8, 
                justifyContent: 'center', 
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 1 }}>SUSCRIBIRSE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Footer Section */}
        <View style={{ backgroundColor: '#F9F9F9', paddingVertical: 40, paddingHorizontal: 25 }}>
          {/* Logo */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#2E852D' }}>Dr.Pet®</Text>
            <Text style={{ fontSize: 18, color: '#666', fontStyle: 'italic', marginTop: -5 }}>Todo por tu mascota</Text>
          </View>
          
          {/* Contact Details */}
          <View style={{ gap: 10, marginBottom: 40 }}>
            <Text style={{ fontSize: 16, color: '#444', fontWeight: '500' }}>Región Metropolitana</Text>
            <Text style={{ fontSize: 16, color: '#444', fontWeight: '500' }}>Oficinas: Av. Santa Clara 301, Huechuraba Of. 3803</Text>
            <Text style={{ fontSize: 16, color: '#444', fontWeight: '500' }}>Email: <Text style={{ color: '#2E852D' }}>contacto@doctorpet.cl</Text></Text>
          </View>

          {/* Accordion Links */}
          <View style={{ gap: 2 }}>
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>PRODUCTOS</Text>
              <ChevronRight size={20} color="#2E852D" strokeWidth={3} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
            
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>AYUDA</Text>
              <ChevronRight size={20} color="#2E852D" strokeWidth={3} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>SOBRE DR.PET</Text>
              <ChevronRight size={20} color="#2E852D" strokeWidth={3} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Social & Copyright */}
        <View style={{ backgroundColor: '#092B19', paddingTop: 40, paddingBottom: 60, paddingHorizontal: 20, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {[
              { name: 'facebook', icon: 'facebook' },
              { name: 'youtube', icon: 'youtube-play' },
              { name: 'instagram', icon: 'instagram' },
              { name: 'linkedin', icon: 'linkedin' }
            ].map((social) => (
              <TouchableOpacity key={social.name} style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome name={social.icon as any} size={24} color="#092B19" />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
            © 2026 Dr.Pet · Todos los derechos reservados
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' }}>
            Política de privacidad · Política de cookies
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
