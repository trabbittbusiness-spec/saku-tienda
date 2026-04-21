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
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import Animated, { ZoomIn, useSharedValue, withRepeat, withTiming, withDelay, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { 
  Heart, 
  Star, 
  Plus, 
  Package, 
  Dog as DogIcon, 
  Cat as CatIcon, 
  Bird, 
  Stethoscope, 
  ChevronRight, 
  Truck, 
  MapPin, 
  ChevronDown,
  ChevronLeft,
  ArrowRight,
  Zap,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  FileText
} from 'lucide-react-native';
import Header from '../components/Header';
import CategoryBar from '../components/CategoryBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFavorites } from '../context/FavoritesContext';

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
    badgeColor: '#FFFFFF',
    badgeTextColor: '#EE5A24',
    title: 'Descuento en Bravecto',
    subtitle: 'Protección por 12 semanas.',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200',
    bgColor: '#EE5A24',
    buttonText: 'Ver ofertas →'
  },
  topRight: {
    badge: 'LANZAMIENTO',
    badgeColor: '#FFFFFF',
    badgeTextColor: '#0AA096',
    title: 'Nueva Línea ProPlan',
    subtitle: 'Nutrición avanzada.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=600',
    overlayColor: 'rgba(10, 160, 150, 0.7)',
    bgColor: '#2EC4B6'
  },
  bottomRight: {
    badge: 'OFERTA',
    badgeColor: '#FFFFFF',
    badgeTextColor: '#F47321',
    title: 'Camas Ortopédicas',
    subtitle: 'Hasta 40% OFF.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=600',
    overlayColor: 'rgba(244, 115, 33, 0.3)',
    bgColor: '#F5DBC4'
  }
};

const desktopPromos = [
  { ...desktopBanners.main, id: 1 },
  { ...desktopBanners.topRight, id: 2 },
  { ...desktopBanners.bottomRight, id: 3 },
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
  const { toggleFavorite, isFavorite } = useFavorites();
  const liked = isFavorite(item.id);

  return (
    <TouchableOpacity 
      onPress={() => router.push('/product/1')}
      style={{ 
        width: 170, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 20, 
        marginRight: 16, 
        overflow: 'visible',
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 16, 
        elevation: 5, 
        borderWidth: 1, 
        borderColor: '#F0F0F0', 
        padding: 12 
      }}
    >
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            rating: item.rating
          });
        }} 
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
      >
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
        onPress={() => router.push('/product/1')}
        style={{ 
          backgroundColor: '#1F8A70', 
          borderRadius: 12, 
          paddingVertical: 10, 
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Agregar +</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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


function DesktopSubHeader() {
  return (
    <View style={{ backgroundColor: 'white', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', zIndex: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 40, paddingLeft: 80 }}>
        
        <View style={{ position: 'relative' }}>
          <TouchableOpacity><Text style={{ fontWeight: '800', fontSize: 13, color: '#1A1A2E' }}>¡OFERTAS GUAU!</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>MUNDO PERRO</Text>
          <ChevronDown size={14} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>MUNDO GATO</Text>
          <ChevronDown size={14} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>ACCESORIOS</Text>
          <ChevronDown size={14} color="#444" />
        </TouchableOpacity>

        <View style={{ position: 'relative' }}>
          <View style={{ position: 'absolute', top: -14, left: 10, backgroundColor: '#FF4D17', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
            <Text style={{ color: 'white', fontSize: 6.5, fontWeight: '900' }}>Especial Salud</Text>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>FARMACIA</Text>
            <ChevronDown size={14} color="#444" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity><Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>SERVICIOS VETERINARIOS</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function DesktopPromoBanner() {
  return (
    <View style={{ width: '100%', height: 60, backgroundColor: '#E60012', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Left Red Section */}
      <View style={{ width: 80, backgroundColor: '#E60012' }} />

      {/* Main Content with Green Gradient */}
      <View style={{ flex: 1, backgroundColor: '#22C55E', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
            <Megaphone size={22} color="#22C55E" />
          </View>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '400' }}>Ya abrimos </Text>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>¡Nuevas tiendas!</Text>
        </View>

        {/* Store Icon */}
        <View style={{ marginLeft: 30, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
           <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 10 }}>DUAL</Text>
        </View>

        {/* Locations */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
           <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Te estamos esperando en:</Text>
           <View>
             <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>• <Text style={{ fontWeight: '900' }}>Las Brisas</Text> Autop. Los Libertadores KM 16, Colina</Text>
             <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>• <Text style={{ fontWeight: '900' }}>Los Toros</Text> Av. Concha y Toro 3909, Vivo Outlet</Text>
           </View>
        </View>
      </View>
    </View>
  );
}

const desktopHeroSlides = [
  { 
    id: 1, 
    image: require('../assets/images/royal_canin_promo_banner.png'), 
    title: "Ofertas", 
    highlight: "guau!", 
    brand: "Dr.Pet",
    subtitle: "En alimentos seleccionados Royal Canin variedades",
    discount: "25% Dcto."
  },
  { 
    id: 2, 
    image: { uri: "https://vetsmart.com.br/images/banner_secundario_desk.jpg" }, 
    title: "Cuida su", 
    highlight: "salud", 
    brand: "Farmacia",
    subtitle: "Todo lo que necesitan para estar sanos",
    discount: "15% OFF"
  }
];

function DesktopHeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % desktopHeroSlides.length);
    }, 6000); // Cambia cada 6 segundos
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ width: '100%', height: 450, backgroundColor: 'white', position: 'relative' }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Left Side: Brand & Main Title */}
        <View style={{ width: '45%', justifyContent: 'center', paddingLeft: 100, backgroundColor: 'white' }}>
          <View style={{ backgroundColor: '#22C55E', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 15 }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>{desktopHeroSlides[activeSlide].brand}</Text>
          </View>
          <Text style={{ fontSize: 90, fontWeight: '300', color: '#1A1A2E', lineHeight: 95 }}>{desktopHeroSlides[activeSlide].title}</Text>
          <Text style={{ fontSize: 105, fontWeight: '900', color: '#1A1A2E', marginTop: -25, fontStyle: 'italic', letterSpacing: -2 }}>{desktopHeroSlides[activeSlide].highlight}</Text>
          
          <Text style={{ fontSize: 18, color: '#666', marginTop: 20, fontWeight: '500', maxWidth: 350 }}>
            {desktopHeroSlides[activeSlide].subtitle}
          </Text>

          <TouchableOpacity style={{ backgroundColor: '#22C55E', alignSelf: 'flex-start', paddingHorizontal: 50, paddingVertical: 18, borderRadius: 35, marginTop: 40, shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 20 }}>COMPRAR</Text>
          </TouchableOpacity>
        </View>

        {/* Right Side: Product Image & Discount Highlight */}
        <View style={{ width: '55%', position: 'relative', overflow: 'hidden' }}>
          <Image 
            source={desktopHeroSlides[activeSlide].image} 
            style={{ width: '100%', height: '100%' }} 
            resizeMode="contain"
          />
          
          {/* Discount Overlay (Only if not already prominent in image) */}
          {desktopHeroSlides[activeSlide].id !== 1 && (
            <View style={{ position: 'absolute', right: 50, top: '25%', backgroundColor: 'rgba(255,255,255,0.9)', padding: 30, borderRadius: 100, width: 180, height: 180, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#22C55E' }}>
               <Text style={{ fontSize: 40, fontWeight: '900', color: '#22C55E' }}>{desktopHeroSlides[activeSlide].discount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Modern Navigation Arrows */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'box-none' }}>
        <TouchableOpacity 
          onPress={() => setActiveSlide((activeSlide - 1 + desktopHeroSlides.length) % desktopHeroSlides.length)}
          style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
        >
          <ChevronLeft size={35} color="#1A1A2E" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setActiveSlide((activeSlide + 1) % desktopHeroSlides.length)}
          style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
        >
          <ChevronRight size={35} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const { toggleFavorite, isFavorite } = useFavorites();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();
  const offersScrollRef = useRef<ScrollView>(null);
  const testimonialsScrollRef = useRef<ScrollView>(null);
  const currentOffersX = useRef(0);
  const currentTestimonialsX = useRef(0);
  const isDesktop = screenWidth >= BREAKPOINT;

  const handleOffersScroll = (direction: 'left' | 'right') => {
    const cardWidth = 290 + 24; // Width + gap
    const totalItems = 8;
    const itemsInView = Math.floor(screenWidth / cardWidth);
    const maxScroll = cardWidth * (totalItems - Math.max(1, itemsInView));
    
    const scrollStep = cardWidth * 2; // Move 2 cards at a time

    if (direction === 'left') {
      if (currentOffersX.current <= 0) {
        currentOffersX.current = maxScroll;
      } else {
        currentOffersX.current = Math.max(0, currentOffersX.current - scrollStep);
      }
    } else {
      if (currentOffersX.current >= maxScroll - 10) { // Tiny buffer
        currentOffersX.current = 0;
      } else {
        currentOffersX.current = Math.min(maxScroll, currentOffersX.current + scrollStep);
      }
    }
    offersScrollRef.current?.scrollTo({ x: currentOffersX.current, animated: true });
  };

  const handleTestimonialsScroll = (direction: 'left' | 'right') => {
    const cardWidth = 320 + 20; // Width + gap
    const totalItems = 4;
    const scrollStep = cardWidth;
    
    // Calculate how many items are visible to know the limit
    const visibleWidth = screenWidth - 100; // Account for container margins
    const itemsInView = Math.floor(visibleWidth / cardWidth);
    const maxScroll = Math.max(0, cardWidth * (totalItems - itemsInView));

    if (direction === 'left') {
      if (currentTestimonialsX.current <= 0) {
        currentTestimonialsX.current = maxScroll;
      } else {
        currentTestimonialsX.current = Math.max(0, currentTestimonialsX.current - scrollStep);
      }
    } else {
      if (currentTestimonialsX.current >= maxScroll - 5) {
        currentTestimonialsX.current = 0;
      } else {
        currentTestimonialsX.current = Math.min(maxScroll, currentTestimonialsX.current + scrollStep);
      }
    }
    testimonialsScrollRef.current?.scrollTo({ x: currentTestimonialsX.current, animated: true });
  };

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Header />
        <DesktopSubHeader />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          <DesktopPromoBanner />
          <DesktopHeroSlider />

          <View style={{ paddingHorizontal: 40 }}>
            {/* TRUST BAR (Image 2 Footer) */}
            <View style={{ 
              marginTop: 40, 
              backgroundColor: '#F8F9FA', 
              borderRadius: 20, 
              flexDirection: 'row', 
              justifyContent: 'space-around', 
              paddingVertical: 32,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: '#EEEEEE'
            }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E0E0E0' }}>
                <View style={{ backgroundColor: '#1A1A2E', padding: 10, borderRadius: 12 }}>
                  <Stethoscope size={20} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A2E' }}>¿Necesitas ayuda?</Text>
                  <Text style={{ fontSize: 13, color: '#666', fontWeight: '500' }}>Contáctanos, te ayudamos</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E0E0E0' }}>
                <View style={{ backgroundColor: '#1A1A2E', padding: 10, borderRadius: 12 }}>
                  <Package size={20} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A2E' }}>Mis pedidos</Text>
                  <Text style={{ fontSize: 13, color: '#666', fontWeight: '500' }}>Sigue tu pedido en vivo</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E0E0E0' }}>
                <View style={{ backgroundColor: '#1A1A2E', padding: 10, borderRadius: 12 }}>
                  <MapPin size={20} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A2E' }}>Sucursales</Text>
                  <Text style={{ fontSize: 13, color: '#666', fontWeight: '500' }}>22 Tiendas en el país</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1, justifyContent: 'center' }}>
                <View style={{ backgroundColor: '#1A1A2E', padding: 10, borderRadius: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 12 }}>?</Text>
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A2E' }}>Preguntas frecuentes</Text>
                  <Text style={{ fontSize: 13, color: '#666', fontWeight: '500' }}>Resuelve tus dudas</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* CATEGORIES SECTION */}
            <View style={{ marginTop: 60, marginBottom: 40 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1A6332', marginBottom: 30, letterSpacing: -0.5 }}>Comprar por categorías</Text>
              
              <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'space-between' }}>
                {[
                  { id: 1, title: 'PERRO', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=800' },
                  { id: 2, title: 'GATO', image: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=800' },
                  { id: 3, title: 'FARMACIA', image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800' },
                  { id: 4, title: 'ACCESORIOS', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800' },
                  { id: 5, title: 'OFERTAS', image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800' },
                ].map((cat) => (
                  <TouchableOpacity 
                    key={cat.id}
                    style={{ 
                      flex: 1, 
                      aspectRatio: 0.85, 
                      backgroundColor: '#EEEEEE', 
                      borderRadius: 12, 
                      padding: 5,
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Image 
                      source={{ uri: cat.image }} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        position: 'absolute',
                        bottom: 40,
                      }} 
                      resizeMode="cover"
                    />
                    <View style={{ 
                      width: '100%', 
                      height: 50, 
                      backgroundColor: '#E5E5E5', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 8,
                    }}>
                      <Text style={{ fontWeight: '900', fontSize: 16, color: '#1A1A2E' }}>{cat.title}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Navigation Arrows for Categories (Visual only as requested by image reference) */}
              <View style={{ position: 'absolute', top: '55%', left: -25, zIndex: 30 }}>
                 <TouchableOpacity style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <ChevronLeft size={24} color="#666" />
                 </TouchableOpacity>
              </View>
              <View style={{ position: 'absolute', top: '55%', right: -25, zIndex: 30 }}>
                 <TouchableOpacity style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <ChevronRight size={24} color="#666" />
                 </TouchableOpacity>
              </View>
            </View>

            {/* COMPACT DARK PREMIUM BANNERS - ROW 1 */}
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 40, marginBottom: 24 }}>
              {/* Compact Dark Cat Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#0A0A2E', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.15)'
              }}>
                <Image 
                   source={{ uri: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=800' }} 
                   style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', opacity: 0.9 }} 
                   resizeMode="cover" 
                />
                <LinearGradient
                  colors={['#0A0A2E', 'transparent']}
                  start={{ x: 0.35, y: 0 }}
                  end={{ x: 0.7, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                />
                <View style={{ flex: 1, padding: 32, justifyContent: 'center', zIndex: 10 }}>
                   <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderWidth: 1, borderColor: '#22C55E', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 }}>
                      <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 }}>CAT EXCLUSIVE</Text>
                   </View>
                   <Text style={{ fontSize: 36, fontWeight: '900', color: 'white', lineHeight: 38 }}>Ahorra{'\n'}y Limpia</Text>
                   <Text style={{ fontSize: 15, color: '#22C55E', fontWeight: '700', marginTop: 8 }}>20% OFF Arena Premium</Text>
                   
                   <TouchableOpacity style={{ marginTop: 24, backgroundColor: '#22C55E', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
                      <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>COMPRAR</Text>
                   </TouchableOpacity>
                </View>
              </View>

              {/* Compact Dark Dog Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#000000', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <Image 
                   source={{ uri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800' }} 
                   style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', opacity: 0.8 }} 
                   resizeMode="cover" 
                />
                <LinearGradient
                  colors={['#000000', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.75, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                />
                <View style={{ flex: 1, padding: 32, justifyContent: 'center', zIndex: 10 }}>
                   <Text style={{ fontSize: 120, fontWeight: '900', color: 'rgba(34, 197, 94, 0.04)', position: 'absolute', top: -10, left: -10 }}>30</Text>
                   <View style={{ backgroundColor: '#22C55E', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 }}>
                      <Text style={{ color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 }}>DOG SPECIAL</Text>
                   </View>
                   <Text style={{ fontSize: 36, fontWeight: '900', color: 'white', lineHeight: 38 }}>Snacks{'\n'}Gourmet</Text>
                   <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: 8 }}>30% Off para el Rey</Text>
                   
                   <TouchableOpacity style={{ marginTop: 24, backgroundColor: '#22C55E', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
                      <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>DESCUBRIR</Text>
                   </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* COMPACT DARK PREMIUM BANNERS - ROW 2 */}
            <View style={{ flexDirection: 'row', gap: 24, marginBottom: 40 }}>
              {/* Compact Dark Pharmacy Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#1A0A0A', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(255, 77, 23, 0.15)'
              }}>
                <Image 
                   source={{ uri: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800' }} 
                   style={{ position: 'absolute', right: 0, bottom: 0, width: '60%', height: '100%', opacity: 0.8 }} 
                   resizeMode="cover" 
                />
                <LinearGradient
                  colors={['#1A0A0A', 'transparent']}
                  start={{ x: 0.4, y: 0 }}
                  end={{ x: 0.7, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                />
                <View style={{ flex: 1, padding: 32, zIndex: 10, justifyContent: 'center' }}>
                   <Text style={{ fontSize: 10, fontWeight: '900', color: '#FF4D17', letterSpacing: 2, marginBottom: 10 }}>CARE UNIT</Text>
                   <Text style={{ fontSize: 38, fontWeight: '900', color: 'white', lineHeight: 40 }}>Salud{'\n'}al 100%</Text>
                   <View style={{ backgroundColor: '#FF4D17', marginTop: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>-15% DCTO</Text>
                   </View>
                   <TouchableOpacity style={{ marginTop: 24, borderBottomWidth: 1.5, borderBottomColor: '#FF4D17', alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#FF4D17' }}>Comprar Farmacia</Text>
                   </TouchableOpacity>
                </View>
              </View>

              {/* Compact Dark Accessoires Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#0A0A1A', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.1)'
              }}>
                <Image 
                   source={{ uri: 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800' }} 
                   style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', opacity: 0.8 }} 
                   resizeMode="cover" 
                />
                <LinearGradient
                  colors={['#0A0A1A', 'transparent']}
                  start={{ x: 0.4, y: 0 }}
                  end={{ x: 0.75, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                />
                <View style={{ flex: 1, padding: 32, zIndex: 10, justifyContent: 'center' }}>
                   <Text style={{ fontSize: 42, fontWeight: '900', color: 'white' }}>Juega.</Text>
                   <Text style={{ fontSize: 42, fontWeight: '300', color: 'rgba(255,255,255,0.6)', marginTop: -10 }}>Vive.</Text>
                   <Text style={{ fontSize: 15, color: '#22C55E', fontWeight: '900', marginTop: 12 }}>25% Off en Accesorios</Text>
                   
                   <TouchableOpacity style={{ marginTop: 24, backgroundColor: 'white', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}>
                      <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>VER CATÁLOGO</Text>
                   </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* HIGH-FIDELITY WHATSAPP COMMUNITY BANNER - FIX */}
            <View style={{ 
              width: '100%', height: 160, borderRadius: 20, 
              overflow: 'hidden', marginBottom: 80, position: 'relative',
              backgroundColor: '#25D366'
            }}>
              <LinearGradient
                colors={['#128C7E', '#25D366']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 40 }}>
                {/* WhatsApp Icon - Clean Silhouette */}
                <FontAwesome name="whatsapp" size={85} color="white" />

                {/* Cat Image - integrated without square background */}
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800' }} 
                  style={{ 
                    width: 250, height: 250, position: 'absolute', left: 120, bottom: -40,
                    zIndex: 20, transform: [{ rotate: '-10deg' }]
                  }} 
                  resizeMode="contain"
                />

                <View style={{ flex: 1, marginRight: 15, zIndex: 10 }}>
                  <Text style={{ fontSize: 27, fontWeight: '900', color: 'white', lineHeight: 28, letterSpacing: -1.2, textAlign: 'right' }}>
                    ¡Únete a nuestra{'\n'}comunidad{'\n'}de WhatsApp!
                  </Text>
                </View>

                <View style={{ width: 1.5, height: 80, backgroundColor: 'rgba(255,255,255,0.4)' }} />

                <View style={{ flex: 1, marginLeft: 20, zIndex: 10, justifyContent: 'center' }}>
                   <Text style={{ fontSize: 16.5, color: 'white', fontWeight: '800', lineHeight: 22 }}>
                     Sé el primero en enterarte de nuestras ofertas, promociones y novedades.
                   </Text>
                </View>

                <TouchableOpacity style={{ 
                  backgroundColor: '#075E54', paddingHorizontal: 30, paddingVertical: 15, 
                  borderRadius: 6, zIndex: 10,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                  marginLeft: 20
                }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>ÚNETE AQUÍ</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* WEEKLY OFFERS SECTION */}
            <View style={{ marginBottom: 80 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#0A2E1A' }}>¡Ofertas de la semana!</Text>
              </View>

              <View style={{ position: 'relative', marginHorizontal: 30 }}>
                {/* Carousel Navigation Arrows - Moved slightly inward to be inside touchable area */}
                <TouchableOpacity 
                  onPress={() => handleOffersScroll('left')}
                  style={{ 
                  position: 'absolute', left: -45, top: '40%', zIndex: 60,
                  width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF',
                  justifyContent: 'center', alignItems: 'center', shadowColor: '#000', 
                  shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
                }}>
                  <ChevronLeft size={28} color="#0A2E1A" strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleOffersScroll('right')}
                  style={{ 
                  position: 'absolute', right: -45, top: '40%', zIndex: 60,
                  width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF',
                  justifyContent: 'center', alignItems: 'center', shadowColor: '#000', 
                  shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
                }}>
                  <ChevronRight size={28} color="#0A2E1A" strokeWidth={2.5} />
                </TouchableOpacity>

                <ScrollView 
                  ref={offersScrollRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={{ gap: 24, paddingVertical: 10, paddingRight: 50 }}
                >
                  {[
                    { id: 1, name: 'Royal Dog Hypoallergenic', price: '$ 19.943 - $ 75.742', perKg: '$ 7.575 x kg', img: 'https://cdn.royalcanin-weshare-online.com/p2mXf2QBBK995S_G-S1C/v137/canine-veterinary-diet-hypoallergenic-dry' },
                    { id: 2, name: 'Royal Dog Anallergic', price: '$ 34.267 - $ 74.243', perKg: '$ 9.281 x kg', img: 'https://cdn.royalcanin-weshare-online.com/pGmXf2QBBK995S_G-S1C/v1/canine-veterinary-diet-anallergic-dry' },
                    { id: 3, name: 'Royal Dog Diabetic 10 Kg', price: '$ 68.993', oldPrice: '$ 91.990', perKg: '$ 6.900 x kg', img: 'https://cdn.royalcanin-weshare-online.com/p2mXf2QBBK995S_G-S1C/v137/canine-veterinary-diet-diabetic-dry' },
                    { id: 4, name: 'Royal Dog Hepatic Canine', price: '$ 14.993 - $ 68.993', perKg: '$ 6.900 x kg', img: 'https://cdn.royalcanin-weshare-online.com/q2mXf2QBBK995S_G-S1C/v1/canine-veterinary-diet-hepatic-dry' },
                    { id: 5, name: 'Purina Pro Plan Puppy Large', price: '$ 42.990 - $ 89.990', perKg: '$ 5.990 x kg', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800' },
                    { id: 6, name: 'Bravecto Perro 20-40kg', price: '$ 32.500', oldPrice: '$ 38.900', perKg: '1 comp.', img: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800' },
                    { id: 7, name: 'Royal Canin Urinary Gato', price: '$ 12.490 - $ 45.990', perKg: '$ 11.200 x kg', img: 'https://cdn.royalcanin-weshare-online.com/D2mXf2QBBK995S_G-S1C/v1/feline-veterinary-diet-urinary-s-o-dry' },
                    { id: 8, name: 'Zee.Dog Air Mesh Harness', price: '$ 18.900 - $ 25.900', perKg: 'Accesorios', img: 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800' }
                    ].map((item) => {
                      const liked = isFavorite(item.id);
                      
                      return (
                        <TouchableOpacity 
                          onPress={() => router.push('/product/1')}
                          key={item.id} style={{ 
                            width: 290, backgroundColor: 'white', borderRadius: 16, padding: 20,
                            shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 2,
                            borderWidth: 1, borderColor: '#F0F0F0'
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <View style={{ backgroundColor: '#C41E3A', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}>
                              <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>-25%</Text>
                            </View>
                            <TouchableOpacity 
                              onPress={(e) => {
                                e.stopPropagation();
                                toggleFavorite({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  image: item.img
                                });
                              }}
                              style={{ padding: 5 }}
                            >
                              <Heart size={24} color={liked ? '#EF4444' : '#D1D1D1'} fill={liked ? '#EF4444' : 'transparent'} strokeWidth={2} />
                            </TouchableOpacity>
                          </View>

                          <View style={{ height: 220, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                            <Image source={{ uri: item.img }} style={{ width: '90%', height: '100%' }} resizeMode="contain" />
                          </View>

                      <View style={{ alignItems: 'flex-start', marginBottom: 20, width: '100%' }}>
                        <Text style={{ fontSize: 17, color: '#1A1A2E', fontWeight: '500', marginBottom: 10, minHeight: 48 }}>{item.name}</Text>
                        <View style={{ minHeight: 50 }}>
                          {item.oldPrice && (
                            <Text style={{ fontSize: 14, color: '#BBB', textDecorationLine: 'line-through', marginBottom: 2 }}>{item.oldPrice}</Text>
                          )}
                          <Text style={{ fontSize: 20, fontWeight: '900', color: '#C41E3A' }}>{item.price}</Text>
                          <Text style={{ fontSize: 13, color: '#999', marginTop: 4 }}>desde ({item.perKg})</Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        onPress={() => router.push('/product/1')}
                        style={{ 
                          backgroundColor: '#0A2919', paddingVertical: 16, borderRadius: 10, alignItems: 'center', width: '100%',
                          shadowColor: '#0A2919', shadowOpacity: 0.2, shadowRadius: 10
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Ver detalles</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
                </ScrollView>

                {/* Pagination Dots */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 40 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                </View>
              </View>
            </View>

            {/* TESTIMONIALS SECTION - DESKTOP */}
            <View style={{ marginBottom: 100 }}>
              <View style={{ marginBottom: 40 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#1A1A2E' }}>
                  Lo que dicen nuestros clientes<Text style={{ color: '#22C55E' }}>.</Text>
                </Text>
                
                <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A2E' }}>4.7</Text>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="#FACC15" color="#FACC15" strokeWidth={0} />)}
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#666', marginTop: 5 }}>Basado en 1327 opiniones</Text>
                <TouchableOpacity style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 15, color: '#22C55E', fontWeight: '700' }}>Leer todos los comentarios</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={testimonialsScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
              >
                {[
                  {
                    id: 1,
                    name: 'cesar maximiliano mella\ngonzalez',
                    time: 'Hace 4 meses',
                    comment: 'Excelente atención y entrega oportuna, con buenos regalos.',
                    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=200'
                  },
                  {
                    id: 2,
                    name: 'Erwin Alegria',
                    time: 'Hace 2 meses',
                    comment: 'Soy un antiguo cliente\nExcelente servicio; dependiendo la hora en la cual realice el pedido, estos se reciben en el mismo día.\nSon muy afables las personas que realizan las entrega\nSigan así !!!! .... y ojalá pudiesen otorgar algún beneficio a quienes somos Clientes Frecuentes, a fin de mantener la fidelidad...',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200'
                  },
                  {
                    id: 3,
                    name: 'Alejandro Rodriguez Soria',
                    time: 'Hace 2 meses',
                    comment: 'La mejor experiencia que e tenido comprando productos de mascotas 100 % confiable vino el día de la entrega vino en una bolsa con 4 regalos\nTiene una clienta más desde ahora !\nGracias !!',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200'
                  },
                  {
                    id: 4,
                    name: 'jose vial',
                    time: 'Hace 5 meses',
                    comment: 'en la descripcion de la oferta dice +2 kg y lata de regalo,te adjunto el envase que corresponde con la promo...',
                    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200'
                  }
                ].map((testimonial) => (
                  <View key={testimonial.id} style={{ 
                    width: 320, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 25,
                    borderWidth: 1, borderColor: '#EEE'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 }}>
                      <Image source={{ uri: testimonial.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A2E' }}>{testimonial.name}</Text>
                        <Text style={{ fontSize: 13, color: '#999' }}>{testimonial.time}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2, marginBottom: 15 }}>
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#FACC15" color="#FACC15" strokeWidth={0} />)}
                    </View>
                    <Text style={{ fontSize: 14, color: '#444', lineHeight: 20 }}>{testimonial.comment}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 40 }}>
                <TouchableOpacity 
                  onPress={() => handleTestimonialsScroll('left')}
                  style={{ width: 40, height: 40, backgroundColor: '#22C55E', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                >
                  <ChevronLeft size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleTestimonialsScroll('right')}
                  style={{ width: 40, height: 40, backgroundColor: '#22C55E', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                >
                  <ChevronRight size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SOCIAL FOLLOW SECTION - DESKTOP */}
            <View style={{ marginBottom: 60, alignItems: 'center' }}>
              <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }}>
                NOS ENCANTAN LAS MASCOTAS FELICES Y SALUDABLES
              </Text>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#1A1A2E' }}>
                Síguenos en @drpetchile
              </Text>
            </View>
          </View>

          {/* FEATURES BAR - DESKTOP - FULL WIDTH */}
          <View style={{ 
            backgroundColor: '#F7F7F7', 
            paddingVertical: 50, 
            paddingHorizontal: '4%', // Dynamic padding for inner content alignment
            flexDirection: 'row', 
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginBottom: 0,
            borderTopWidth: 1,
            borderColor: '#EDEDED'
          }}>
            <View style={{ flexDirection: 'row', width: '100%', maxWidth: 1400, justifyContent: 'space-between' }}>
              {[
                { icon: Truck, title: 'Despachos', sub: 'Santiago y Coquimbo' },
                { icon: MessageSquare, title: 'SAC', sub: 'Atención al cliente' },
                { icon: ShieldCheck, title: 'Compras seguras', sub: 'WebPay Plus' },
                { icon: FileText, title: 'Garantía', sub: 'Políticas de garantía' }
              ].map((feature, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 15, paddingLeft: idx > 0 ? 30 : 0 }}>
                  <View style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}>
                    <feature.icon size={32} color="#1A1A2E" strokeWidth={1} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1A2E' }}>{feature.title}</Text>
                    <Text style={{ fontSize: 13, color: '#666' }}>{feature.sub}</Text>
                  </View>
                  {idx < 3 && (
                    <View style={{ position: 'absolute', right: 0, width: 1, height: 50, backgroundColor: '#DDD' }} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* HIGH-FIDELITY NEWSLETTER SECTION - DESKTOP - FULL WIDTH */}
          <View style={{ height: 260, position: 'relative', overflow: 'hidden', width: '100%' }}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1200' }} 
              style={{ width: '100%', height: '100%', position: 'absolute' }} 
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(34,197,94,0.92)', 'rgba(6,78,59,0.95)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 28, letterSpacing: -0.5 }}>
                Inscríbete y recibe nuestras promociones
              </Text>

              <View style={{ flexDirection: 'row', width: '100%', maxWidth: 700, height: 58 }}>
                <TextInput 
                  placeholder="Su dirección de correo electrónico"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'white', 
                    height: '100%', 
                    borderTopLeftRadius: 6, 
                    borderBottomLeftRadius: 6,
                    paddingHorizontal: 25,
                    fontSize: 16,
                    color: '#1A1A2E'
                  }}
                />
                <TouchableOpacity style={{ 
                  backgroundColor: '#22C55E', 
                  height: '100%', 
                  paddingHorizontal: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6
                }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>SUSCRIBIRSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
            {/* LIGHT CLOUD PREMIUM FOOTER - DESKTOP */}
            <View style={{ backgroundColor: '#FFFFFF', width: '100%', paddingTop: 90, paddingBottom: 40, paddingHorizontal: '4%' }}>
              <View style={{ maxWidth: 1400, alignSelf: 'center', width: '100%' }}>
                
                {/* Main Content Grid */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 60 }}>
                  
                  {/* Brand & Mission */}
                  <View style={{ flex: 1.5, paddingRight: 50 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                      <View style={{ width: 54, height: 54, backgroundColor: '#ECFDF5', borderRadius: 27, justifyContent: 'center', alignItems: 'center' }}>
                        <DogIcon size={28} color="#10B981" strokeWidth={2.5} />
                      </View>
                      <Text style={{ fontSize: 38, fontWeight: '900', color: '#10B981', letterSpacing: -1 }}>Dr.Pet®</Text>
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 15, letterSpacing: -0.5, lineHeight: 32 }}>
                      Amor incondicional,{'\n'}calidad excepcional.
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 16, lineHeight: 26, fontWeight: '500' }}>
                      Cuidamos a los que más amas. El mejor ecosistema de bienestar animal en todo el país.
                    </Text>
                    
                    {/* Floating Social Pills */}
                    <View style={{ flexDirection: 'row', gap: 15, marginTop: 40 }}>
                      {[
                        { name: 'facebook-square' },
                        { name: 'youtube-play' },
                        { name: 'instagram' },
                        { name: 'linkedin-square' }
                      ].map((social, idx) => (
                        <TouchableOpacity key={idx} style={{ 
                          width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', 
                          justifyContent: 'center', alignItems: 'center', 
                          borderWidth: 1, borderColor: '#E5E7EB',
                          shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
                        }}>
                          <FontAwesome name={social.name as any} size={20} color="#10B981" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Navigation Columns */}
                  <View style={{ flex: 2.5, flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 40, paddingTop: 15 }}>
                    <View>
                      <Text style={{ color: '#111827', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 30 }}>MARKETPLACE</Text>
                      <View style={{ gap: 20 }}>
                        {['Ofertas Flash', 'Alimento Especial', 'Accesorios Premium', 'Farmacia Vet'].map(item => (
                          <TouchableOpacity key={item}><Text style={{ color: '#4B5563', fontSize: 16, fontWeight: '500' }}>{item}</Text></TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text style={{ color: '#111827', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 30 }}>SOPORTE</Text>
                      <View style={{ gap: 20 }}>
                        {['Preguntas Frecuentes', 'Seguimiento Pedido', 'Cambios y Devoluciones', 'Contacto Directo'].map(item => (
                          <TouchableOpacity key={item}><Text style={{ color: '#4B5563', fontSize: 16, fontWeight: '500' }}>{item}</Text></TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text style={{ color: '#111827', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 30 }}>COMPAÑÍA</Text>
                      <View style={{ gap: 20 }}>
                        {['Nuestra Historia', 'Sustentabilidad', 'Bases Legales', 'Tiendas Físicas'].map(item => (
                          <TouchableOpacity key={item}><Text style={{ color: '#4B5563', fontSize: 16, fontWeight: '500' }}>{item}</Text></TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* BOTTOM FLOATING LEGAL PILL */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: '#F9FAFB', 
                  paddingVertical: 20,
                  paddingHorizontal: 30,
                  borderRadius: 100,
                  marginTop: 20,
                  borderWidth: 1,
                  borderColor: '#F3F4F6'
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>© {new Date().getFullYear()} SAKU CLOUD TECHNOLOGY.</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 25, alignItems: 'center' }}>
                    <TouchableOpacity><Text style={{ color: '#4B5563', fontSize: 13, fontWeight: '600' }}>Políticas de Privacidad</Text></TouchableOpacity>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
                    <TouchableOpacity><Text style={{ color: '#4B5563', fontSize: 13, fontWeight: '600' }}>Términos de Servicio</Text></TouchableOpacity>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
                    <TouchableOpacity><Text style={{ color: '#10B981', fontSize: 13, fontWeight: '800' }}>Configurar Cookies</Text></TouchableOpacity>
                  </View>
                </View>

              </View>
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
            source={{ uri: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=800' }} 
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

        {/* Newsletter Section */}
        <View style={{ height: 320, position: 'relative', overflow: 'hidden' }}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=800' }} 
            style={{ width: '100%', height: '100%', position: 'absolute' }} 
            resizeMode="cover"
          />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 30, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 24, lineHeight: 34 }}>
              Inscríbete y recibe nuestras promociones
            </Text>
            
            <TextInput 
              placeholder="Su dirección de correo electrónico"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                width: '100%', 
                height: 56, 
                borderRadius: 14, 
                paddingHorizontal: 20, 
                fontSize: 15,
                color: 'white',
                marginBottom: 16,
                borderWidth: 1,
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
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#2E852D' }}>Dr.Pet®</Text>
            <Text style={{ fontSize: 18, color: '#666', fontStyle: 'italic', marginTop: -5 }}>Todo por tu mascota</Text>
          </View>
          
          <View style={{ gap: 10, marginBottom: 40 }}>
            <Text style={{ fontSize: 16, color: '#444', fontWeight: '500' }}>Región Metropolitana</Text>
            <Text style={{ fontSize: 16, color: '#444', fontWeight: '500' }}>Email: contacto@doctorpet.cl</Text>
          </View>

          <View style={{ gap: 2 }}>
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>PRODUCTOS</Text>
              <ChevronRight size={20} color="#2E852D" />
            </TouchableOpacity>
            
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>AYUDA</Text>
              <ChevronRight size={20} color="#2E852D" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Social & Copyright */}
        <View style={{ backgroundColor: '#092B19', paddingTop: 40, paddingBottom: 60, paddingHorizontal: 20, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {['facebook', 'youtube-play', 'instagram', 'linkedin'].map((social) => (
              <TouchableOpacity key={social} style={{ width: 48, height: 48, backgroundColor: 'white', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome name={social as any} size={24} color="#092B19" />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
            © 2026 Dr.Pet · Todos los derechos reservados
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}
