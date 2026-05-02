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
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
  InteractionManager
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
  FileText,
  CheckCircle2,
  HeartPulse,
  Award,
  Quote,
  HelpCircle,
  Gift,
  Shield,
  RotateCcw,
  Clock,
  MessageCircle,
  X,
  Bone,
  ShoppingBag,
  Sparkles,
  Activity,
  Pizza,
  Scissors,
  User,
  ShoppingCart,
  Pill,
  Syringe,
  Disc,
  ShowerHead,
  Fish,
  Cookie,
  Leaf,
  Box,
  Tag
} from 'lucide-react-native';

import Header from '../../components/Header';
import AuthModal from '../../components/AuthModal';
import LoadingScreen from '../../components/LoadingScreen';
import CategoryBar from '../../components/CategoryBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useRouter } from 'expo-router';

import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, where, doc } from 'firebase/firestore';

export interface Variant {
  label: string;
  price: number;
}

export interface ProductItem {
  id: string | number;
  category: string;
  name: string;
  price: string;
  numericPrice?: number;
  rating: number;
  image: string;
  promo?: boolean;
  medida?: string;
  variants?: Variant[];
}

const BREAKPOINT = 1024; // Aumentar breakpoint para desktop real

// ── SHARED DATA ───────────────────────────────────────────────────────────────
const mobileHeroSlides = [
  {
    id: 1,
    badge: 'LANZAMIENTO',
    badgeColor: '#63348C',
    title: 'Nueva Línea ProPlan',
    subtitle: 'Nutrición avanzada.',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=900',
  },
  {
    id: 2,
    badge: 'OFERTA',
    badgeColor: '#63348C',
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
    badgeTextColor: '#63348C',
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
  { id: 2, name: 'Gato',     icon: CatIcon, color: '#63348C', bg: '#EEF0FF' },
  { id: 3, name: 'Exóticos', icon: Bird,    color: '#2EC4B6', bg: '#E9F9F8' },
  { id: 4, name: 'Servicios', icon: Stethoscope, color: '#E74C3C', bg: '#FDECEA' },
];

const MOCK_PRODUCTS: ProductItem[] = [
  { id: 1, category: 'PERRO O GATO', name: 'BRIT CARE GRAIN FREE SENIOR & LIGHT ...', price: 'CLP $74.990', rating: 5, image: 'https://images.unsplash.com/photo-1589924691106-073b19f55de7?q=80&w=500' },
  { id: 2, category: 'PERRO O GATO', name: 'ROYAL CANIN XSMALL PUPPY 2,5 KG', price: 'CLP $32.990', rating: 5, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500' },
  { id: 3, category: 'PERRO O GATO', name: 'PETEVER FORTE 150 ML', price: 'CLP $19.200', rating: 5, image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=500' },
];

// ══════════════════════════════════════════════════════════════════════════════
//  MOBILE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function MobileHeroCarousel({ screenWidth, slides = [], onPress }: { screenWidth: number, slides?: any[], onPress?: (item: any) => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const CARD_W = screenWidth - 32;
  const indexRef = useRef(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % slides.length;
      flatListRef.current?.scrollToIndex({
        index: indexRef.current,
        animated: true
      });
      setActiveSlide(indexRef.current);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
    indexRef.current = idx;
    if (idx !== activeSlide) setActiveSlide(idx);
  };

  return (
    <View style={{ marginHorizontal: 15, borderRadius: 24, overflow: 'hidden', height: 260, marginTop: -130, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 25, elevation: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FFFFFF' }}>
      <FlatList
        ref={flatListRef}
        data={slides}
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
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => { if (onPress) onPress(item); }}
            style={{ width: CARD_W, height: 260 }}
          >
            <Image 
              source={typeof item.image === 'string' ? { uri: item.image, cache: 'force-cache' } : (item.imageUrl ? { uri: item.imageUrl, cache: 'force-cache' } : item.image)} 
              style={{ width: '100%', height: '100%' }} 
              resizeMode="cover" 
            />
            {!!item.badge && (
              <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: item.badgeColor, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>{item.badge}</Text>
              </View>
            )}
            {!!(item.title || item.subtitle) && (
              <View style={{ position: 'absolute', bottom: 20, left: 16, right: 60 }}>
                {!!item.title && <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', lineHeight: 28, letterSpacing: -0.5 }}>{item.title}</Text>}
                {!!item.subtitle && <Text style={{ color: 'rgba(255,255,255,1)', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{item.subtitle}</Text>}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <View style={{ position: 'absolute', bottom: 24, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {slides.map((_, i) => (
          <View key={i} style={{ width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === activeSlide ? 'white' : 'rgba(255,255,255,0.5)' }} />
        ))}
      </View>
    </View>
  );
}

const DesktopProductCard = React.memo(({ item, liked, quantities, setQuantities, toggleFavorite, addToCart, setShowAuthModal }: any) => {
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const currentVariant = item.variants && item.variants.length > 0 ? item.variants[selectedVarIndex] : null;
  const displayPrice = currentVariant 
    ? 'CLP $' + Math.round(currentVariant.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : item.price;

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/product/${item.id}`)}
      key={item.id} style={{ 
        width: 290, backgroundColor: 'white', borderRadius: 16, padding: 20,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 2,
        borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden'
      }}
    >
      {item.promo && (
        <View style={{ 
          position: 'absolute', top: 0, left: 0, backgroundColor: '#22C55E', 
          paddingHorizontal: 14, paddingVertical: 6, borderBottomRightRadius: 14, zIndex: 20,
        }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>OFERTA</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              type: 'product'
            });
          }}
          style={{ padding: 5 }}
        >
          <Heart size={24} color={liked ? '#EF4444' : '#D1D1D1'} fill={liked ? '#EF4444' : 'transparent'} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 220, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
        <Image source={{ uri: item.image }} style={{ width: '90%', height: '100%' }} resizeMode="contain" />
      </View>

      <View style={{ alignItems: 'flex-start', width: '100%' }}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' }}>{item.category}</Text>
        <Text 
          style={{ fontSize: 16, fontWeight: '700', color: '#13132B', lineHeight: 22, height: 44, textTransform: 'uppercase' }} 
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
          {item.variants && item.variants.length > 0 ? (
            item.variants.map((v: any, i: number) => (
              <TouchableOpacity 
                key={i}
                onPress={(e) => { e.stopPropagation(); setSelectedVarIndex(i); }}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  borderWidth: selectedVarIndex === i ? 2 : 1,
                  borderColor: selectedVarIndex === i ? '#63348C' : '#D1D5DB'
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: selectedVarIndex === i ? '#63348C' : '#9CA3AF', textTransform: 'uppercase' }}>{v.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#63348C' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' }}>UNIDAD</Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginTop: 5 }}>
          {displayPrice}
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' }}>
          {!auth.currentUser ? (
            <TouchableOpacity 
              onPress={(e) => {
                if (e?.stopPropagation) e.stopPropagation();
                router.push('/login');
              }}
              style={{ 
                flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
                shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 8
              }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>Iniciar Sesión</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12 }}>
                <TouchableOpacity 
                  onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); setQuantities((prev: any) => ({...prev, [item.id]: Math.max(1, (prev[item.id] || 1) - 1)})) }} 
                  style={{ padding: 8 }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#4B5563' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '800', marginHorizontal: 8 }}>{quantities[item.id] || 1}</Text>
                <TouchableOpacity 
                  onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); setQuantities((prev: any) => ({...prev, [item.id]: (prev[item.id] || 1) + 1})) }} 
                  style={{ padding: 8 }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#4B5563' }}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                onPress={(e) => {
                  if (e?.stopPropagation) e.stopPropagation();
                  if (!auth.currentUser) {
                    setShowAuthModal(true);
                    return;
                  }
                  const finalPrice = currentVariant ? currentVariant.price : (item.numericPrice || 0);
                  addToCart({
                    id: item.id,
                    name: item.name + (currentVariant ? ` (${currentVariant.label})` : ''),
                    price: finalPrice,
                    image: item.image,
                    quantity: quantities[item.id] || 1
                  });
                  setQuantities((prev: any) => ({...prev, [item.id]: 1}));
                }}
                style={{ 
                  flex: 1, backgroundColor: '#F47321', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#F47321', shadowOpacity: 0.2, shadowRadius: 8
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14, letterSpacing: -0.3 }}>+ Agregar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const MobileProductCard = React.memo(({ item, onAuthRequired }: { item: ProductItem, onAuthRequired: () => void }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const liked = isFavorite(item.id);

  const currentVariant = item.variants && item.variants.length > 0 ? item.variants[selectedVarIndex] : null;
  const displayPrice = currentVariant 
    ? 'CLP $' + Math.round(currentVariant.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : item.price;

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/product/${item.id}`)}
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
        padding: 12,
      }}
    >
      {item.promo && (
        <View style={{ 
          position: 'absolute', top: 0, left: 0, backgroundColor: '#22C55E', 
          paddingHorizontal: 12, paddingVertical: 6, borderBottomRightRadius: 12, zIndex: 20,
        }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 }}>OFERTA</Text>
        </View>
      )}
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            rating: item.rating,
            type: 'product'
          });
        }} 
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
      >
        <Heart size={20} color={liked ? '#EF4444' : '#E5E7EB'} fill={liked ? '#EF4444' : 'transparent'} strokeWidth={2} />
      </TouchableOpacity>

      <View style={{ width: '100%', height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Image source={{ uri: item.image }} style={{ width: '90%', height: '90%' }} resizeMode="contain" />
      </View>

      <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>{item.category}</Text>
      
      <Text 
        style={{ fontSize: 13, fontWeight: '700', color: '#1A1A2E', lineHeight: 16, marginBottom: 10, minHeight: 32, textTransform: 'uppercase' }} 
        numberOfLines={2}
      >
        {item.name}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {item.variants && item.variants.length > 0 ? (
          item.variants.map((v, i) => (
            <TouchableOpacity 
              key={i}
              onPress={(e) => { e.stopPropagation(); setSelectedVarIndex(i); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: '#FFFFFF',
                borderWidth: selectedVarIndex === i ? 2 : 1,
                borderColor: selectedVarIndex === i ? '#63348C' : '#D1D5DB'
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: selectedVarIndex === i ? '#63348C' : '#9CA3AF', textTransform: 'uppercase' }}>{v.label}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#63348C' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' }}>UNIDAD</Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 14 }}>{displayPrice}</Text>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          if (!auth.currentUser) {
            onAuthRequired();
            return;
          }
          const finalPrice = currentVariant ? currentVariant.price : (item.numericPrice || 0);
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
          {(() => {
            const cartQty = cart
              .filter((c: any) => String(c.ID_productos) === String(item.id))
              .reduce((acc: number, c: any) => acc + (c.cantidad || 0), 0);
            return cartQty > 0 ? `Agregar (${cartQty})` : 'Agregar';
          })()}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

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
        backgroundColor: '#63348C',
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
    };
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
        backgroundColor: '#63348C',
        opacity: 0.4,
      }, style]}
    />
  );
}

function ActiveOrderBanner({ count }: { count: number }) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(2.5, { duration: 1500 }), -1, false);
    pulseOpacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
  }, []);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  return (
    <TouchableOpacity
      onPress={() => router.push('/orders')}
      activeOpacity={0.9}
      style={{
        marginHorizontal: 15,
        marginTop: 20,
        backgroundColor: '#10B981', // Verde principal
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: 'rgba(255,255,255,0.25)',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Animación de Ondas */}
          <Animated.View style={[{
            position: 'absolute',
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: 'rgba(255,255,255,0.6)',
          }, rStyle]} />
          
          <Package size={26} color="#FFFFFF" />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
            {count} {count === 1 ? 'Orden Activa' : 'Órdenes Activas'}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 1 }}>
            Toca para ver el seguimiento en vivo
          </Text>
        </View>
      </View>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
        <ChevronRight size={20} color="#FFFFFF" strokeWidth={3} />
      </View>
    </TouchableOpacity>
  );
}

function DesktopSubHeader() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const dogCategories = [
    { name: 'Alimento', slug: 'Alimento', icon: Bone, color: '#D97706' },
    { name: 'Cuidado e Higiene', slug: 'Cuidado e higiene', icon: ShowerHead, color: '#EC4899' },
    { name: 'Medicamentos', slug: 'Medicamentos', icon: Pill, color: '#3B82F6' },
    { name: 'Juguetes', slug: 'Juguetes', icon: Disc, color: '#F59E0B' },
    { name: 'Accesorios', slug: 'Accesorios', icon: Tag, color: '#0D9488' },
    { name: 'Snacks', slug: 'Snacks', icon: Cookie, color: '#F43F5E' }
  ];
 
  const catCategories = [
    { name: 'Alimento', slug: 'Alimento', icon: Fish, color: '#D97706' },
    { name: 'Arenas y Areneros', slug: 'Arenas y areneros', icon: Box, color: '#06B6D4' },
    { name: 'Cuidado e Higiene', slug: 'Cuidado e higiene', icon: ShowerHead, color: '#EC4899' },
    { name: 'Medicamentos', slug: 'Medicamentos', icon: Pill, color: '#3B82F6' },
    { name: 'Juguetes', slug: 'Juguetes', icon: Disc, color: '#F59E0B' },
    { name: 'Snacks', slug: 'Snacks', icon: Cookie, color: '#F43F5E' }
  ];
 
  const farmaciaCategories = [
    { name: 'Perro o gato', slug: 'Perro o gato', icon: Stethoscope, color: '#3B82F6' },
    { name: 'Exoticos', slug: 'Exoticos', icon: HeartPulse, color: '#8B5CF6' }
  ];

  const exoticCategories = [
    { name: 'Alimento', slug: 'Alimento', icon: Leaf, color: '#D97706' },
    { name: 'Snacks', slug: 'Snacks', icon: Cookie, color: '#F43F5E' },
    { name: 'Juguetes', slug: 'Juguetes', icon: Disc, color: '#F59E0B' },
    { name: 'Accesorios', slug: 'Accesorios', icon: Tag, color: '#0D9488' },
    { name: 'Medicamentos', slug: 'Medicamentos', icon: Syringe, color: '#3B82F6' }
  ];

  const renderDropdown = (categories: any[], animal?: string, isFarmacia: boolean = false) => (
    <View style={{ 
      position: 'absolute', top: 38, left: -10, backgroundColor: 'rgba(255, 255, 255, 0.98)', 
      borderRadius: 20, padding: 10, width: 230,
      shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 25, shadowOffset: { width: 0, height: 12 },
      borderWidth: 1, borderColor: '#F1F5F9', zIndex: 1000,
    }}>
      <View style={{ gap: 2 }}>
        {categories.map((cat, idx) => (
          <TouchableOpacity 
            key={idx}
            onPress={() => {
              setActiveMenu(null);
              if (isFarmacia) {
                router.push(`/search?tipo=${cat.slug}&category=Medicamentos`);
              } else {
                const extra = animal === 'Exoticos' ? '&tipo=Exoticos' : '';
                router.push(`/search?animal=${animal}&category=${cat.slug}${extra}`);
              }
            }}
            style={{ 
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, 
              backgroundColor: 'transparent'
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${cat.color}10`, justifyContent: 'center', alignItems: 'center' }}>
               <cat.icon size={16} color={cat.color} strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isFarmacia && (
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
          <TouchableOpacity 
            onPress={() => {
              setActiveMenu(null);
              const extra = animal === 'Exoticos' ? '&tipo=Exoticos' : '';
              router.push(`/search?animal=${animal}${extra}`);
            }}
            style={{ 
              paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#F47321'
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF' }}>VER TODO {animal?.toUpperCase()}</Text>
            <ArrowRight size={14} color="#FFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ backgroundColor: 'white', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', zIndex: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 40, paddingLeft: 80 }}>
        
        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => router.push('/search?filter=promo')}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: '#1A1A2E' }}>¡OFERTAS GUAU!</Text>
          </TouchableOpacity>
        </View>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity 
            onPress={() => setActiveMenu(activeMenu === 'perro' ? null : 'perro')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Text style={{ fontWeight: '700', fontSize: 13, color: activeMenu === 'perro' ? '#63348C' : '#444' }}>MUNDO PERRO</Text>
            <ChevronDown size={14} color={activeMenu === 'perro' ? '#63348C' : '#444'} />
          </TouchableOpacity>
          {activeMenu === 'perro' && renderDropdown(dogCategories, 'Perro')}
        </View>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity 
            onPress={() => setActiveMenu(activeMenu === 'gato' ? null : 'gato')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Text style={{ fontWeight: '700', fontSize: 13, color: activeMenu === 'gato' ? '#63348C' : '#444' }}>MUNDO GATO</Text>
            <ChevronDown size={14} color={activeMenu === 'gato' ? '#63348C' : '#444'} />
          </TouchableOpacity>
          {activeMenu === 'gato' && renderDropdown(catCategories, 'Gato')}
        </View>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity 
            onPress={() => setActiveMenu(activeMenu === 'exotico' ? null : 'exotico')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Text style={{ fontWeight: '700', fontSize: 13, color: activeMenu === 'exotico' ? '#63348C' : '#444' }}>MUNDO EXÓTICO</Text>
            <ChevronDown size={14} color={activeMenu === 'exotico' ? '#63348C' : '#444'} />
          </TouchableOpacity>
          {activeMenu === 'exotico' && renderDropdown(exoticCategories, 'Exoticos')}
        </View>

        <View style={{ position: 'relative', alignItems: 'center' }}>
          <View style={{ 
            position: 'absolute', 
            top: -16,
            left: '50%',
            transform: [{ translateX: -45 }],
            width: 90,
            backgroundColor: '#EF4444',
            paddingVertical: 2,
            borderRadius: 4,
            zIndex: 999,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ 
              color: 'white', 
              fontSize: 7.5, 
              fontWeight: '900', 
              textTransform: 'uppercase',
              textAlign: 'center'
            }} numberOfLines={1}>
              ESPECIAL SALUD
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/search',
              params: { category: 'Medicamentos' }
            })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>FARMACIA</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/servicios')}><Text style={{ fontWeight: '700', fontSize: 13, color: '#444' }}>SERVICIOS VETERINARIOS</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const desktopHeroSlides = [
  { 
    id: 1, 
    image: require('../../assets/images/royal_canin_promo_banner.png'), 
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

function DesktopHeroSlider({ slides = [], onPress }: { slides?: any[], onPress?: (item: any) => void }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  const currentSlide = slides[activeSlide];
  if (!currentSlide) return null;
  
  const imageSource = typeof currentSlide.image === 'string' 
    ? { uri: currentSlide.image, cache: 'force-cache' } 
    : (currentSlide.imageUrl ? { uri: currentSlide.imageUrl, cache: 'force-cache' } : currentSlide.image);

  const isFullImage = !!currentSlide.imageUrl;

  return (
    <View style={{ width: '100%', height: 450, backgroundColor: 'white', position: 'relative' }}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => onPress?.(currentSlide)}
        style={{ flex: 1, flexDirection: 'row' }}
      >
        {isFullImage ? (
          <View style={{ flex: 1 }}>
            <Image source={imageSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ) : (
          <>
            <View style={{ width: '45%', justifyContent: 'center', paddingLeft: 100, backgroundColor: 'white' }}>
              <View style={{ backgroundColor: '#63348C', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 15 }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>{currentSlide.brand}</Text>
              </View>
              <Text style={{ fontSize: 90, fontWeight: '300', color: '#1A1A2E', lineHeight: 95 }}>{currentSlide.title}</Text>
              <Text style={{ fontSize: 105, fontWeight: '900', color: '#1A1A2E', marginTop: -25, fontStyle: 'italic', letterSpacing: -2 }}>{currentSlide.highlight}</Text>
              <Text style={{ fontSize: 18, color: '#666', marginTop: 20, fontWeight: '500', maxWidth: 350 }}>{currentSlide.subtitle}</Text>
              <View style={{ backgroundColor: '#63348C', alignSelf: 'flex-start', paddingHorizontal: 50, paddingVertical: 18, borderRadius: 35, marginTop: 40 }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 20 }}>COMPRAR</Text>
              </View>
            </View>
            <View style={{ width: '55%', position: 'relative', overflow: 'hidden' }}>
              <Image source={imageSource} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              {currentSlide.id !== 1 && (
                <View style={{ position: 'absolute', right: 50, top: '25%', backgroundColor: 'rgba(255,255,255,0.9)', padding: 30, borderRadius: 100, width: 180, height: 180, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#63348C' }}>
                   <Text style={{ fontSize: 40, fontWeight: '900', color: '#63348C' }}>{currentSlide.discount}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </TouchableOpacity>
      {slides.length > 1 && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'box-none' }}>
          <TouchableOpacity onPress={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' }}>
            <ChevronLeft size={35} color="#1A1A2E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveSlide((activeSlide + 1) % slides.length)} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' }}>
            <ChevronRight size={35} color="#1A1A2E" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const HomeScreen = React.memo(function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= BREAKPOINT;
  const insets = useSafeAreaInsets();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { 
    products: globalProducts, 
    loadingProducts, 
    mobileBanners: globalMobileBanners, 
    desktopBanners: globalDesktopBanners, 
    portadasData 
  } = useProducts();
  const params = useLocalSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessageDetails, setSuccessMessageDetails] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [mobileBanners, setMobileBanners] = useState<any[]>([]);
  const [desktopBannersList, setDesktopBannersList] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const offersScrollRef = useRef<FlatList>(null);
  const currentOffersX = useRef(0);
  const testimonialsScrollRef = useRef<FlatList>(null);
  const currentTestimonialsX = useRef(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (params.logout === 'true') {
      setShowAuthModal(true);
    }
  }, [params.logout]);
  const handleBannerNavigation = (item: any) => {
    console.log('Banner clicked:', {
      id: item.id,
      tipoDestino: item.tipoDestino,
      filters: {
        servicio: item.filtroServicioCat,
        animales: item.filtroAnimales,
        categorias: item.filtroCategorias,
        marcas: item.filtroMarcas
      }
    });
    if (!item) return;

    if (item.tipoDestino === 'servicios') {
      const params = new URLSearchParams();
      if (item.filtroServicioCat) {
        params.append('category', item.filtroServicioCat);
      }
      const qs = params.toString();
      router.push(qs ? `/servicios?${qs}` : '/servicios');
      return;
    }

    if (item.tipoDestino === 'productos') {
      const searchParams = new URLSearchParams();
      
      if (item.filtroAnimales && Array.isArray(item.filtroAnimales) && item.filtroAnimales.length > 0) {
        searchParams.append('animal', item.filtroAnimales[0]); // Pick first for now as search supports one via param
      }
      
      if (item.filtroCategorias && Array.isArray(item.filtroCategorias) && item.filtroCategorias.length > 0) {
        searchParams.append('category', item.filtroCategorias[0]);
      }
      
      if (item.filtroMarcas && Array.isArray(item.filtroMarcas) && item.filtroMarcas.length > 0) {
        searchParams.append('marca', item.filtroMarcas[0]);
      }

      const queryString = searchParams.toString();
      router.push(queryString ? `/search?${queryString}` : '/search');
      return;
    }

    // Fallback original logic if tipoDestino is not set or is 'ninguno'
    const searchParams = new URLSearchParams();
    
    if (item.categorias) {
      const cat = Array.isArray(item.categorias) ? item.categorias[0] : item.categorias;
      if (cat) searchParams.append('category', cat);
    }
    
    if (item.marcas) {
      const brand = Array.isArray(item.marcas) ? item.marcas[0] : item.marcas;
      if (brand) searchParams.append('marca', brand);
    }

    const queryString = searchParams.toString();
    router.push(queryString ? `/search?${queryString}` : '/search');
  };

  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const q = query(
          collection(db, 'Orden'),
          where('creador', '==', userRef)
        );
        
        unsubscribeOrders = onSnapshot(q, (snapshot) => {
          const activeOnes = snapshot.docs.filter(doc => {
            const estado = (doc.data().estado || '').toLowerCase();
            return ['pendiente', 'procesando', 'enviado', 'pago aceptado'].includes(estado);
          });
          setActiveOrdersCount(activeOnes.length);
          setHasActiveOrders(activeOnes.length > 0);
        });
      } else {
        setHasActiveOrders(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const [showNewsletterSuccess, setShowNewsletterSuccess] = useState(false);

  useEffect(() => {
    if (params.success === '1') {
      const checkScheduleAndShow = async () => {
        let extraMsg = '';
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const docSnap = await getDoc(doc(db, 'Configuracion', 'tienda_horarios'));
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const now = new Date();
            const daysMap = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
            const currentDayId = daysMap[now.getDay()];
            
            // Format current date as YYYY-MM-DD for holiday checking
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            
            const isHoliday = data.holidays?.some((h: any) => h.date === todayStr);
            
            if (isHoliday) {
              const holidayObj = data.holidays.find((h: any) => h.date === todayStr);
              extraMsg = `🎉 ¡Recibimos tu orden! Como hoy es día de descanso (${holidayObj.reason}), la gestionaremos a primera hora en nuestro próximo día hábil. ¡Gracias por tu preferencia!`;
            } else {
              const todayConfig = data.weekly?.[currentDayId];
              if (todayConfig && !todayConfig.isOpen) {
                extraMsg = '🌙 ¡Tu pedido está confirmado! Hoy nos encontramos cerrados, pero no te preocupes, lo procesaremos a primera hora en nuestro próximo día hábil.';
              } else if (todayConfig && todayConfig.isOpen) {
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                const [endH, endM] = todayConfig.end.split(':').map(Number);
                const [startH, startM] = todayConfig.start.split(':').map(Number);
                
                const currentTime = currentHour + currentMin / 60;
                const endTime = endH + endM / 60;
                const startTime = startH + startM / 60;
                
                if (currentTime < startTime || currentTime >= endTime) {
                  extraMsg = '🌙 ¡Orden recibida con éxito! En este momento nuestra tienda está cerrada, pero gestionaremos tu pedido apenas abramos nuestras puertas el día de mañana. ¡Descansa!';
                }
              }
            }
          }
        } catch (error) {
          console.log("Error fetching shop schedule:", error);
        }
        
        setSuccessMessageDetails(extraMsg);
        setShowSuccessModal(true);
        router.setParams({ success: undefined });
      };
      
      checkScheduleAndShow();
    }
  }, [params.success]);

  const handleSubscribe = async () => {
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa un correo electrónico válido.');
      } else {
        import('react-native').then(({ Alert }) => {
          Alert.alert('Atención', 'Por favor ingresa un correo electrónico válido.');
        });
      }
      return;
    }
    
    setSubscribing(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'Newsletter'), {
        email: newsletterEmail.toLowerCase().trim(),
        createdAt: serverTimestamp(),
        active: true
      });
      
      setShowNewsletterSuccess(true);
      setNewsletterEmail('');
    } catch (error) {
      console.error('Error subscribing:', error);
      if (Platform.OS === 'web') {
        alert('Ocurrió un error al procesar tu suscripción.');
      } else {
        import('react-native').then(({ Alert }) => {
          Alert.alert('Error', 'No se pudo completar la suscripción. Intenta más tarde.');
        });
      }
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    if (globalProducts.length > 0) setProducts(globalProducts);
    setMobileBanners(globalMobileBanners.length > 0 ? globalMobileBanners : []);
    setDesktopBannersList(globalDesktopBanners.length > 0 ? globalDesktopBanners : []);
  }, [globalProducts, globalMobileBanners, globalDesktopBanners]);





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
    offersScrollRef.current?.scrollToOffset({ offset: currentOffersX.current, animated: true });
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
        
        {hasActiveOrders && screenWidth < BREAKPOINT && (
          <View style={{ maxWidth: 1400, alignSelf: 'center', width: '100%', paddingHorizontal: 40, marginTop: 20 }}>
            <ActiveOrderBanner count={activeOrdersCount} />
          </View>
        )}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          <DesktopHeroSlider slides={desktopBannersList} onPress={handleBannerNavigation} />

          <View style={{ paddingHorizontal: 40 }}>
            {/* HERO CAROUSEL FOR MOBILE (In Desktop ScrollView) */}
            {!isDesktop && <MobileHeroCarousel screenWidth={screenWidth} slides={mobileBanners} onPress={handleBannerNavigation} />}
            {isDesktop && <View style={{ height: 10 }} />}
            {/* TRUST BAR (Refined Spacing & Layout) */}
            <View style={{ 
              marginTop: 40,
              marginBottom: 40,
              backgroundColor: '#FFFFFF', 
              borderRadius: 32, 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              paddingVertical: 22,
              paddingHorizontal: 40,
              borderWidth: 1,
              borderColor: '#F1F5F9',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.05,
              shadowRadius: 25,
              elevation: 4
            }}>
              {[
                { 
                  icon: MapPin, 
                  title: 'Ubicación', 
                  sub: 'Alba 3 parcela 29, Chamisero, Colina', 
                  color: '#63348C', 
                  bg: '#F5F3FF',
                  onPress: () => Linking.openURL('https://www.google.com/maps?q=Veterinaria+Vet+Animal+Welfare,+Chicureo,+Colina,+Regi%C3%B3n+Metropolitana&ftid=0x9662b92ef85c9f3f:0x3842e439d9264146&entry=gps&shh=CAE&lucs=,94297699,94284496,94231188,94280568,47071704,94218641,94282134,94286869&g_ep=CAISEjI2LjE2LjAuODk4OTU0MjE1MBgAIIgnKkgsOTQyOTc2OTksOTQyODQ0OTYsOTQyMzExODgsOTQyODQ0OTksOTQyODIxMzQsOTQyODY4NjlCAkNM&skid=957960ea-60bb-43ff-a671-737364e55019&g_st=ic')
                },
                { icon: Clock, title: 'Horario', sub: 'Lun-Dom 9AM - 6PM', color: '#63348C', bg: '#FFF7ED' },
                { 
                  icon: MessageCircle, 
                  title: 'WhatsApp', 
                  sub: 'Soporte Directo', 
                  color: '#63348C', 
                  bg: '#ECFDF5',
                  onPress: () => Linking.openURL('https://chat.whatsapp.com/DCMfqmSSpv6LwHuiUDhWri')
                }
              ].map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={item.onPress}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 24, 
                    flex: 1, 
                    justifyContent: 'center', 
                    borderRightWidth: idx < 2 ? 1 : 0, 
                    borderRightColor: '#F1F5F9' 
                  }}
                >
                  <View style={{ 
                    backgroundColor: item.bg, 
                    width: 60, 
                    height: 60, 
                    borderRadius: 20, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                  }}>
                    <item.icon size={28} color={item.color} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 }}>{item.title}</Text>
                    <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '700' }}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>



            {/* COMPACT DARK PREMIUM BANNERS - ROW 1 */}
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 40, marginBottom: 24 }}>
              {/* Compact Dark Cat Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#0A0A2E', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.15)'
              }}>
                {(() => {
                  const item = portadasData.find(p => Number(p.index) === 1);
                  const bgColor = item?.backgroundColor || '#0A0A2E';
                  return (
                    <View style={{ flex: 1, backgroundColor: bgColor }}>
                      <Image 
                        source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=800' }} 
                        style={{ position: 'absolute', right: 0, top: 0, width: item?.imageUrl ? '100%' : '60%', height: '100%', opacity: 0.9 }} 
                        resizeMode="cover" 
                      />
                      <LinearGradient
                        colors={[bgColor, 'transparent']}
                        start={{ x: 0.35, y: 0 }}
                        end={{ x: 0.7, y: 0 }}
                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                      />
                      <View style={{ flex: 1, padding: 32, justifyContent: 'center', zIndex: 10 }}>
                         <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 }}>
                            <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 }}>{item?.badge || 'CAT EXCLUSIVE'}</Text>
                         </View>
                         <Text style={{ fontSize: 36, fontWeight: '900', color: 'white', lineHeight: 38 }}>{item?.title || 'Ahorra\ny Limpia'}</Text>
                         <Text style={{ fontSize: 15, color: '#9CA3AF', fontWeight: '700', marginTop: 8 }}>{item?.subtitle || '20% OFF Arena Premium'}</Text>
                         
                         <TouchableOpacity 
                            onPress={() => handleBannerNavigation(item)}
                            style={{ marginTop: 24, backgroundColor: '#10B981', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}
                          >
                             <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>{item?.buttonText || 'DESCUBRIR'}</Text>
                          </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>

              {/* Compact Dark Dog Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#000000', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                {(() => {
                  const item = portadasData.find(p => Number(p.index) === 2);
                  const bgColor = item?.backgroundColor || '#000000';
                  return (
                    <View style={{ flex: 1, backgroundColor: bgColor }}>
                      <Image 
                        source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800' }} 
                        style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', opacity: 0.8 }} 
                        resizeMode="cover" 
                      />
                      <LinearGradient
                        colors={[bgColor, 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.75, y: 0 }}
                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                      />
                      <View style={{ flex: 1, padding: 32, justifyContent: 'center', zIndex: 10 }}>
                         <Text style={{ fontSize: 120, fontWeight: '900', color: 'rgba(34, 197, 94, 0.04)', position: 'absolute', top: -10, left: -10 }}>30</Text>
                         <View style={{ backgroundColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 }}>
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 }}>{item?.badge || 'DOG SPECIAL'}</Text>
                         </View>
                         <Text style={{ fontSize: 36, fontWeight: '900', color: 'white', lineHeight: 38 }}>{item?.title || 'Snacks\nGourmet'}</Text>
                         <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: 8 }}>{item?.subtitle || '30% Off para el Rey'}</Text>
                         
                         <TouchableOpacity 
                            onPress={() => handleBannerNavigation(item)}
                            style={{ marginTop: 24, backgroundColor: '#10B981', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}
                          >
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>{item?.buttonText || 'DESCUBRIR'}</Text>
                         </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
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
                {(() => {
                  const item = portadasData.find(p => Number(p.index) === 3);
                  const bgColor = item?.backgroundColor || '#1A0A0A';
                  return (
                    <View style={{ flex: 1, backgroundColor: bgColor }}>
                      <Image 
                        source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800' }} 
                        style={{ position: 'absolute', right: 0, bottom: 0, width: item?.imageUrl ? '100%' : '60%', height: '100%', opacity: 0.8 }} 
                        resizeMode="cover" 
                      />
                      <LinearGradient
                        colors={[bgColor, 'transparent']}
                        start={{ x: 0.4, y: 0 }}
                        end={{ x: 0.7, y: 0 }}
                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                      />
                      <View style={{ flex: 1, padding: 32, zIndex: 10, justifyContent: 'center' }}>
                         <Text style={{ fontSize: 10, fontWeight: '900', color: '#10B981', letterSpacing: 2, marginBottom: 10 }}>{item?.badge || 'CARE UNIT'}</Text>
                         <Text style={{ fontSize: 38, fontWeight: '900', color: 'white', lineHeight: 40 }}>{item?.title || 'Salud\nal 100%'}</Text>
                         <View style={{ backgroundColor: '#10B981', marginTop: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' }}>
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{item?.subtitle || '-15% DCTO'}</Text>
                         </View>
                         <TouchableOpacity 
                            onPress={() => handleBannerNavigation(item)}
                            style={{ marginTop: 24, borderBottomWidth: 1.5, borderBottomColor: '#10B981', alignSelf: 'flex-start' }}
                         >
                            <Text style={{ fontSize: 15, fontWeight: '900', color: '#10B981' }}>{item?.buttonText || 'Comprar Farmacia'}</Text>
                         </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
              </View>

              {/* Compact Dark Accessoires Banner */}
              <View style={{ 
                flex: 1, height: 280, backgroundColor: '#0A0A1A', borderRadius: 32, 
                overflow: 'hidden', position: 'relative',
                borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.1)'
              }}>
                {(() => {
                  const item = portadasData.find(p => Number(p.index) === 4);
                  const bgColor = item?.backgroundColor || '#0A0A1A';
                  return (
                    <View style={{ flex: 1, backgroundColor: bgColor }}>
                      <Image 
                        source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800' }} 
                        style={{ position: 'absolute', right: 0, top: 0, width: item?.imageUrl ? '100%' : '60%', height: '100%', opacity: 0.8 }} 
                        resizeMode="cover" 
                      />
                      <LinearGradient
                        colors={[bgColor, 'transparent']}
                        start={{ x: 0.4, y: 0 }}
                        end={{ x: 0.75, y: 0 }}
                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }}
                      />
                      <View style={{ flex: 1, padding: 32, zIndex: 10, justifyContent: 'center' }}>
                         <Text style={{ fontSize: 42, fontWeight: '900', color: 'white' }}>{item?.title ? item.title.split('.')[0] : 'Juega.'}</Text>
                         <Text style={{ fontSize: 42, fontWeight: '300', color: 'rgba(255,255,255,0.6)', marginTop: -10 }}>{item?.title?.includes('.') ? item.title.split('.')[1] : 'Vive.'}</Text>
                         <Text style={{ fontSize: 15, color: '#10B981', fontWeight: '900', marginTop: 12 }}>{item?.subtitle || '25% Off en Accesorios'}</Text>
                         <TouchableOpacity 
                            onPress={() => handleBannerNavigation(item)}
                            style={{ marginTop: 24, backgroundColor: '#10B981', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, alignSelf: 'flex-start' }}
                         >
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>{item?.buttonText || 'VER CATÁLOGO'}</Text>
                         </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}
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

                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://chat.whatsapp.com/DCMfqmSSpv6LwHuiUDhWri')}
                  style={{ 
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

                <FlatList
                  ref={offersScrollRef as any}
                  data={products.filter(p => p.promo).slice(0, 15)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  windowSize={3}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ gap: 24, paddingVertical: 10, paddingRight: 50 }}
                  renderItem={({ item }) => <DesktopProductCard item={item} liked={isFavorite(item.id)} quantities={quantities} setQuantities={setQuantities} toggleFavorite={toggleFavorite} addToCart={addToCart} setShowAuthModal={setShowAuthModal} />}
                />


                {/* Pagination Dots */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 40 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#63348C' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0' }} />
                </View>
              </View>
            </View>

            {/* TESTIMONIALS SECTION - DESKTOP */}
            <View style={{ marginBottom: 120 }}>
              <View style={{ marginBottom: 50, alignItems: 'center' }}>
                <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, marginBottom: 16 }}>
                  <Text style={{ color: '#16A34A', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>HUELLAS DE FELICIDAD</Text>
                </View>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#1A1A2E', textAlign: 'center' }}>
                  Lo que dicen nuestros clientes<Text style={{ color: '#63348C' }}>.</Text>
                </Text>
                <Text style={{ fontSize: 18, color: '#6B7280', marginTop: 12, textAlign: 'center', maxWidth: 600 }}>
                  Historias reales de familias que confían en Saku para el bienestar de sus mascotas.
                </Text>
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
                    name: 'César Mella',
                    tag: 'Papá de Toby',
                    time: 'Hace 4 meses',
                    comment: 'Excelente atención y entrega oportuna. Mi perro está feliz con sus nuevos juguetes y los regalitos que mandaron.',
                    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=200'
                  },
                  {
                    id: 2,
                    name: 'Erwin Alegría',
                    tag: 'Cliente Frecuente',
                    time: 'Hace 2 meses',
                    comment: 'Increíble servicio; pedí en la mañana y llegó el mismo día. Las personas de entrega son muy amables. ¡Sigan así!',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200'
                  },
                  {
                    id: 3,
                    name: 'Alejandra Rodríguez',
                    tag: 'Mamá de Luna',
                    time: 'Hace 2 meses',
                    comment: 'La mejor experiencia comprando productos para mi gatita. 100% confiable y los regalos sorpresa son un detalle hermoso.',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200'
                  },
                  {
                    id: 4,
                    name: 'Jose Vial',
                    tag: 'Dueño de Bruno',
                    time: 'Hace 5 meses',
                    comment: 'Excelente stock de alimentos premium. Siempre encuentro lo que necesito y a buen precio. ¡Recomendado!',
                    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200'
                  }
                ].map((testimonial) => (
                  <View key={testimonial.id} style={{ 
                    width: 360, 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: 24, 
                    padding: 32,
                    borderWidth: 1, 
                    borderColor: '#F3F4F6',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.05,
                    shadowRadius: 20,
                    elevation: 5
                  }}>
                    <View style={{ position: 'absolute', top: 20, right: 32, opacity: 0.1 }}>
                      <Quote size={40} color="#63348C" />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <Image source={{ uri: testimonial.avatar }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#F3F4F6' }} />
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>{testimonial.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, color: '#63348C', fontWeight: '800' }}>{testimonial.tag}</Text>
                          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
                          <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>{testimonial.time}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 26, fontWeight: '500', fontStyle: 'italic' }}>
                      "{testimonial.comment}"
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 40 }}>
                <TouchableOpacity 
                  onPress={() => handleTestimonialsScroll('left')}
                  style={{ width: 40, height: 40, backgroundColor: '#63348C', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                >
                  <ChevronLeft size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleTestimonialsScroll('right')}
                  style={{ width: 40, height: 40, backgroundColor: '#63348C', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                >
                  <ChevronRight size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SOCIAL FOLLOW SECTION - DESKTOP */}
            <View style={{ marginBottom: 60, alignItems: 'center' }}>
              <Text style={{ color: '#63348C', fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 }}>
                NOS ENCANTAN LAS MASCOTAS FELICES Y SALUDABLES
              </Text>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#1A1A2E' }}>
                Síguenos en @vet_animal_welfare_
              </Text>
            </View>
          </View>

          {/* FEATURES BAR - DESKTOP - FULL WIDTH */}
          <View style={{ 
            backgroundColor: '#F9FAFB', 
            paddingVertical: 60, 
            paddingHorizontal: '4%',
            flexDirection: 'row', 
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#F3F4F6'
          }}>
            <View style={{ flexDirection: 'row', width: '100%', maxWidth: 1400, justifyContent: 'space-between' }}>
              {[
                { icon: Truck, title: 'Despacho Saku', sub: 'Entregas rápidas y seguras', color: '#63348C' },
                { icon: HeartPulse, title: 'Atención Experta', sub: 'Asesoría y soporte experto', color: '#EF4444' },
                { icon: ShieldCheck, title: 'Pago Protegido', sub: 'Seguridad total con WebPay', color: '#63348C' },
                { icon: Award, title: 'Sello Premium', sub: 'Calidad garantizada 100%', color: '#F59E0B' }
              ].map((feature, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 20, paddingHorizontal: 20 }}>
                  <View style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 20, 
                    backgroundColor: 'white', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    shadowColor: feature.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 2
                  }}>
                    <feature.icon size={32} color={feature.color} strokeWidth={1.5} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#1A1A2E', marginBottom: 2 }}>{feature.title}</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{feature.sub}</Text>
                  </View>
                  {idx < 3 && (
                    <View style={{ position: 'absolute', right: 0, width: 1, height: 40, backgroundColor: '#E5E7EB' }} />
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
              colors={['rgba(99,52,140,0.92)', 'rgba(99,52,140,0.95)']}
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
                  value={newsletterEmail}
                  onChangeText={setNewsletterEmail}
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
                <TouchableOpacity 
                  onPress={handleSubscribe}
                  disabled={subscribing}
                  style={{ 
                    backgroundColor: '#63348C', 
                    height: '100%', 
                    paddingHorizontal: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderTopRightRadius: 6,
                    borderBottomRightRadius: 6,
                    opacity: subscribing ? 0.7 : 1
                  }}
                >
                  {subscribing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>SUSCRIBIRSE</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
            {/* MINIMALIST BOUTIQUE REDESIGNED DESKTOP FOOTER */}
            <View style={{ backgroundColor: '#FFFFFF', width: '100%', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 80, paddingBottom: 40 }}>
              <View style={{ maxWidth: 1400, alignSelf: 'center', width: '100%', paddingHorizontal: '4%' }}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  
                  {/* BRAND & MISSION */}
                  <View style={{ flex: 1.5, paddingRight: 60 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25 }}>
                      <View style={{ width: 40, height: 40, backgroundColor: '#111827', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <DogIcon size={22} color="white" />
                      </View>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -1 }}>Tienda Saku<Text style={{ color: '#63348C' }}>.</Text></Text>
                    </View>
                    <Text style={{ color: '#6B7280', fontSize: 16, lineHeight: 26, fontWeight: '500', marginBottom: 30 }}>
                      Amor incondicional, calidad excepcional. El ecosistema premium para el bienestar de tu mascota.
                    </Text>
                    
                    {/* SOCIALS */}
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                      {[
                        { name: 'facebook-square', url: 'https://www.facebook.com/Vetanimalcarewelfare/' },
                        { name: 'instagram', url: 'https://www.instagram.com/vet_animal_welfare_/' }
                      ].map((social, idx) => (
                        <TouchableOpacity key={idx} onPress={() => Linking.openURL(social.url)}>
                          <FontAwesome name={social.name as any} size={22} color="#111827" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* ESSENTIAL NAVIGATION */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 25 }}>TIENDA</Text>
                    <View style={{ gap: 12 }}>
                      {[
                        { name: 'Ofertas Flash', route: '/search?promo=true' },
                        { name: 'Alimentos', route: '/search?category=Alimento' },
                        { name: 'Accesorios', route: '/search?category=Accesorios' },
                        { name: 'Farmacia', route: '/search?category=Farmacia' },
                        { name: 'Servicios', route: '/servicios' }
                      ].map(item => (
                        <TouchableOpacity key={item.name} onPress={() => router.push(item.route as any)}>
                          <Text style={{ color: '#4B5563', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 25 }}>AYUDA Y LEGAL</Text>
                    <View style={{ gap: 12 }}>
                      {[
                        { name: 'Centro de Ayuda', route: '/support' },
                        { name: 'Seguimiento', route: '/orders' },
                        { name: 'Sobre Nosotros', route: '/company' },
                        { name: 'Privacidad', route: '/legal' },
                        { name: 'Términos', route: '/legal' }
                      ].map(item => (
                        <TouchableOpacity key={item.name} onPress={() => router.push(item.route as any)}>
                          <Text style={{ color: '#4B5563', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* BOUTIQUE CONTACT & TRUST */}
                  <View style={{ flex: 1.2, backgroundColor: '#F9FAFB', borderRadius: 24, padding: 25 }}>
                    <Text style={{ color: '#111827', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 20 }}>SOPORTE</Text>
                    
                    <View style={{ gap: 18, marginBottom: 25 }}>
                      <TouchableOpacity 
                        onPress={() => Linking.openURL('https://chat.whatsapp.com/DCMfqmSSpv6LwHuiUDhWri')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                      >
                        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' }}>
                          <FontAwesome name="whatsapp" size={16} color="white" />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>+56 9 8378 1062</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => Linking.openURL('mailto:sakudeveloperchile@gmail.com')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                      >
                        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' }}>
                          <FontAwesome name="envelope" size={14} color="white" />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>sakudeveloperchile@gmail.com</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 12 }}>PAGOS SEGUROS</Text>
                      <View style={{ flexDirection: 'row', gap: 10, opacity: 0.5 }}>
                        <FontAwesome name="cc-visa" size={20} color="#111827" />
                        <FontAwesome name="cc-mastercard" size={20} color="#111827" />
                        <FontAwesome name="credit-card" size={20} color="#111827" />
                      </View>
                    </View>
                  </View>

                </View>

                {/* MINIMALIST BOTTOM BAR */}
                <View style={{ marginTop: 60, paddingTop: 30, borderTopWidth: 1, borderTopColor: '#F9FAFB', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700' }}>© {new Date().getFullYear()} TIENDA SAKU. TODO POR ELLOS.</Text>
                  <TouchableOpacity><Text style={{ color: '#63348C', fontSize: 12, fontWeight: '900' }}>CONFIGURACIÓN DE COOKIES</Text></TouchableOpacity>
                </View>

              </View>
            </View>
          </ScrollView>

          {/* SUCCESS ORDER MODAL (DESKTOP) */}
          <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSuccessModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ 
                width: 480, backgroundColor: '#FFFFFF', borderRadius: 40, padding: 48, alignItems: 'center',
                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 20
              }}>
                <View style={{ 
                  width: 88, height: 88, borderRadius: 44, backgroundColor: '#DCFCE7', 
                  justifyContent: 'center', alignItems: 'center', marginBottom: 28
                }}>
                  <CheckCircle2 size={44} color="#63348C" />
                </View>
                
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>¡Pedido Realizado!</Text>
                <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                  Tu pedido ha sido procesado exitosamente. Recibirás un correo con el detalle de tu compra.
                </Text>

                <TouchableOpacity 
                  onPress={() => setShowSuccessModal(false)}
                  style={{ 
                    width: '100%', backgroundColor: '#63348C', borderRadius: 20, height: 64, 
                    justifyContent: 'center', alignItems: 'center', shadowColor: '#63348C', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>Volver al Inicio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
    );

  }

  // ── MOBILE LAYOUT ─────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <Header />
        <MobileHeroCarousel screenWidth={screenWidth} slides={mobileBanners} onPress={handleBannerNavigation} />
        
        {/* Section: Categories */}
        <View style={{ marginTop: 32 }}>
          <View style={{ paddingHorizontal: 15, marginBottom: 18 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 }}>Explora categorías</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 30, paddingBottom: 10 }}>
            {[
              { id: 1, name: 'Perros',   img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400', route: '/search?animal=Perro' },
              { id: 2, name: 'Gatos',    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400', route: '/search?animal=Gato' },
              { id: 3, name: 'Exóticos', img: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=400', route: '/search?animal=Exoticos&tipo=Exoticos' },
              { id: 4, name: 'Servicios',img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400', route: '/servicios' }
            ].map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                activeOpacity={0.8}
                onPress={() => cat.route && router.push(cat.route as any)}
                style={{ 
                  width: '23.5%', 
                  height: 65, 
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 10,
                  borderWidth: 1,
                  borderColor: '#F3F4F6',
                  shadowColor: '#63348C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3
                }}
              >
                {/* Floating Avatar */}
                <View style={{ 
                  position: 'absolute', 
                  top: -28, 
                  width: 56, 
                  height: 56, 
                  borderRadius: 28, 
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 5
                }}>
                  <Image 
                    source={{ uri: cat.img }} 
                    style={{ width: '100%', height: '100%', borderRadius: 28, borderWidth: 2, borderColor: '#FFFFFF' }} 
                    resizeMode="cover" 
                  />
                </View>
                
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.2 }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contenido pesado diferido para no congelar la navegación */}
        <>
            {hasActiveOrders && <ActiveOrderBanner count={activeOrdersCount} />}

            {/* Section: Promotions */}
            <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1A2E', letterSpacing: -0.5 }}>Últimas promociones</Text>
            <TouchableOpacity style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#D97706' }}>VER TODO</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={products.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={true}
            contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <MobileProductCard 
                item={item} 
                onAuthRequired={() => setShowAuthModal(true)} 
              />
            )}
          />

        </View>

        {/* WhatsApp Community Banner - MOBILE ONLY ASSET */}
        <TouchableOpacity 
          onPress={() => Linking.openURL('https://chat.whatsapp.com/DCMfqmSSpv6LwHuiUDhWri')}
          activeOpacity={0.9} 
          style={{ 
            marginHorizontal: 15, 
            marginTop: 32, 
            marginBottom: 40,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: '#25D366',
            shadowColor: '#63348C',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <Image 
            source={require('../../assets/images/whatsapp_banner_v2.png')} 
            style={{ width: '100%', height: 120 }} 
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* MOBILE DYNAMIC BANNERS (2x2 GRID) */}
        <View style={{ marginHorizontal: 15, marginBottom: 40, gap: 12 }}>
          {/* Fila 1 */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Mobile Banner 1: Cat */}
            <View style={{ flex: 1, height: 200, backgroundColor: '#0A0A2E', borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.15)' }}>
              {(() => {
                const item = portadasData.find(p => Number(p.index) === 1);
                const bgColor = item?.backgroundColor || '#0A0A2E';
                return (
                  <View style={{ flex: 1, backgroundColor: bgColor }}>
                    <Image source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=800' }} style={{ position: 'absolute', right: 0, top: 0, width: item?.imageUrl ? '100%' : '60%', height: '100%', opacity: 0.9 }} resizeMode="cover" />
                    <LinearGradient colors={[bgColor, 'transparent']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }} />
                    <View style={{ flex: 1, padding: 14, justifyContent: 'center', zIndex: 10 }}>
                       <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginBottom: 6 }}>
                          <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 8, letterSpacing: 0.5 }}>{item?.badge || 'CAT EXCLUSIVE'}</Text>
                       </View>
                       <Text style={{ fontSize: 20, fontWeight: '900', color: 'white', lineHeight: 22 }}>{item?.title || 'Ahorra\ny Limpia'}</Text>
                       <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginTop: 4 }}>{item?.subtitle || '20% OFF Arena Premium'}</Text>
                       <TouchableOpacity onPress={() => handleBannerNavigation(item)} style={{ marginTop: 12, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>{item?.buttonText || 'DESCUBRIR'}</Text>
                       </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Mobile Banner 2: Dog */}
            <View style={{ flex: 1, height: 200, backgroundColor: '#000000', borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              {(() => {
                const item = portadasData.find(p => Number(p.index) === 2);
                const bgColor = item?.backgroundColor || '#000000';
                return (
                  <View style={{ flex: 1, backgroundColor: bgColor }}>
                    <Image source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800' }} style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                    <LinearGradient colors={[bgColor, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }} />
                    <View style={{ flex: 1, padding: 14, justifyContent: 'center', zIndex: 10 }}>
                       <Text style={{ fontSize: 50, fontWeight: '900', color: 'rgba(34, 197, 94, 0.06)', position: 'absolute', top: -5, left: -5 }}>30</Text>
                       <View style={{ backgroundColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginBottom: 6 }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 8, letterSpacing: 0.5 }}>{item?.badge || 'DOG SPECIAL'}</Text>
                       </View>
                       <Text style={{ fontSize: 20, fontWeight: '900', color: 'white', lineHeight: 22 }}>{item?.title || 'Snacks\nGourmet'}</Text>
                       <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginTop: 4 }}>{item?.subtitle || '30% Off para el Rey'}</Text>
                       <TouchableOpacity onPress={() => handleBannerNavigation(item)} style={{ marginTop: 12, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>{item?.buttonText || 'DESCUBRIR'}</Text>
                       </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* Fila 2 */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Mobile Banner 3: Pharmacy */}
            <View style={{ flex: 1, height: 200, backgroundColor: '#1A0A0A', borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255, 77, 23, 0.15)' }}>
              {(() => {
                const item = portadasData.find(p => Number(p.index) === 3);
                const bgColor = item?.backgroundColor || '#1A0A0A';
                return (
                  <View style={{ flex: 1, backgroundColor: bgColor }}>
                    <Image source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=800' }} style={{ position: 'absolute', right: 0, bottom: 0, width: item?.imageUrl ? '100%' : '60%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                    <LinearGradient colors={[bgColor, 'transparent']} start={{ x: 0.3, y: 0 }} end={{ x: 0.8, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }} />
                    <View style={{ flex: 1, padding: 14, zIndex: 10, justifyContent: 'center' }}>
                       <Text style={{ fontSize: 8, fontWeight: '900', color: '#10B981', letterSpacing: 1, marginBottom: 6 }}>{item?.badge || 'CARE UNIT'}</Text>
                       <Text style={{ fontSize: 22, fontWeight: '900', color: 'white', lineHeight: 24 }}>{item?.title || 'Salud\nal 100%'}</Text>
                       <View style={{ backgroundColor: '#10B981', marginTop: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 11 }}>{item?.subtitle || '-15% DCTO'}</Text>
                       </View>
                       <TouchableOpacity onPress={() => handleBannerNavigation(item)} style={{ marginTop: 12, borderBottomWidth: 1.5, borderBottomColor: '#10B981', alignSelf: 'flex-start' }}>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#10B981' }}>{item?.buttonText || 'Comprar Farmacia'}</Text>
                       </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Mobile Banner 4: Accessories */}
            <View style={{ flex: 1, height: 200, backgroundColor: '#0A0A1A', borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.1)' }}>
              {(() => {
                const item = portadasData.find(p => Number(p.index) === 4);
                const bgColor = item?.backgroundColor || '#0A0A1A';
                return (
                  <View style={{ flex: 1, backgroundColor: bgColor }}>
                    <Image source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800' }} style={{ position: 'absolute', right: 0, top: 0, width: item?.imageUrl ? '100%' : '60%', height: '100%', opacity: 0.8 }} resizeMode="cover" />
                    <LinearGradient colors={[bgColor, 'transparent']} start={{ x: 0.3, y: 0 }} end={{ x: 0.8, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', zIndex: 5 }} />
                    <View style={{ flex: 1, padding: 14, zIndex: 10, justifyContent: 'center' }}>
                       <Text style={{ fontSize: 24, fontWeight: '900', color: 'white' }}>{item?.title ? item.title.split('.')[0] : 'Juega.'}</Text>
                       <Text style={{ fontSize: 24, fontWeight: '300', color: 'rgba(255,255,255,0.6)', marginTop: -6 }}>{item?.title?.includes('.') ? item.title.split('.')[1] : 'Vive.'}</Text>
                       <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '900', marginTop: 8 }}>{item?.subtitle || '25% Off en Accesorios'}</Text>
                       <TouchableOpacity onPress={() => handleBannerNavigation(item)} style={{ marginTop: 12, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>{item?.buttonText || 'VER CATÁLOGO'}</Text>
                       </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>

        {/* MOBILE NEWSLETTER BANNER */}
        <View style={{ width: '100%', height: 160, position: 'relative', overflow: 'hidden', marginBottom: 40 }}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1200' }} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(99,52,140,0.92)', 'rgba(99,52,140,0.95)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: -0.5 }}>
              Inscríbete y recibe nuestras promociones
            </Text>

            <View style={{ flexDirection: 'row', width: '100%', height: 48 }}>
              <TextInput 
                placeholder="Su dirección de correo electrónico"
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={newsletterEmail}
                onChangeText={setNewsletterEmail}
                style={{ 
                  flex: 1, 
                  backgroundColor: 'white', 
                  height: '100%', 
                  borderTopLeftRadius: 6, 
                  borderBottomLeftRadius: 6,
                  paddingHorizontal: 15,
                  fontSize: 13,
                  color: '#1A1A2E'
                }}
              />
              <TouchableOpacity 
                onPress={handleSubscribe}
                disabled={subscribing}
                style={{ 
                  backgroundColor: '#63348C', 
                  height: '100%', 
                  paddingHorizontal: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  opacity: subscribing ? 0.7 : 1
                }}
              >
                {subscribing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>SUSCRIBIRSE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PREMIUM MOBILE REDESIGNED FOOTER */}
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          



          {/* Navigation Links */}
          <View style={{ marginBottom: 40 }}>
            {[
              { label: 'PRODUCTOS Y OFERTAS', route: '/search' },
              { label: 'CENTRO DE AYUDA', route: '/support' },
              { label: 'SOBRE NOSOTROS', route: '/company' },
              { label: 'POLÍTICAS LEGALES', route: '/legal' }
            ].map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                onPress={() => router.push(item.route as any)}
                style={{ 
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
                  paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: 0.3 }}>{item.label}</Text>
                <ChevronRight size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Social Presence */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 25, marginBottom: 35 }}>
            {[
              { id: 'facebook-square', url: 'https://www.facebook.com/Vetanimalcarewelfare/' },
              { id: 'instagram', url: 'https://www.instagram.com/vet_animal_welfare_/' }
            ].map((social) => (
              <TouchableOpacity key={social.id} onPress={() => Linking.openURL(social.url)}>
                <FontAwesome name={social.id as any} size={24} color="#111827" />
              </TouchableOpacity>
            ))}
          </View>
          {/* Payment Methods - Trust Section */}
          <View style={{ marginBottom: 35, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 18, letterSpacing: 1.2 }}>MÉTODOS DE PAGO SEGUROS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 10 }}>
              {[
                'cc-visa', 'cc-mastercard', 'cc-amex', 'cc-diners-club', 'credit-card'
              ].map((icon, idx) => (
                <View key={idx} style={{ 
                  width: 54, height: 36, backgroundColor: '#FFFFFF', borderRadius: 8, 
                  borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
                }}>
                  <FontAwesome name={icon as any} size={22} color="#1F2937" />
                </View>
              ))}
            </View>
          </View>
          
          <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
            © 2026 Saku · Todos los derechos reservados
          </Text>
        </View>
        </>
      </ScrollView>

      {/* SUCCESS ORDER MODAL */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            width: isDesktop ? 480 : '100%', backgroundColor: '#FFFFFF', borderRadius: 40, padding: isDesktop ? 48 : 32, alignItems: 'center',
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 20
          }}>
            <View style={{ 
              width: 88, height: 88, borderRadius: 44, backgroundColor: '#DCFCE7', 
              justifyContent: 'center', alignItems: 'center', marginBottom: 28
            }}>
              <CheckCircle2 size={44} color="#63348C" />
            </View>
            
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>¡Pedido Realizado!</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: successMessageDetails ? 16 : 32 }}>
              Tu pedido ha sido procesado exitosamente. Recibirás un correo con el detalle de tu compra.
            </Text>

            {successMessageDetails ? (
              <View style={{ backgroundColor: '#EEF2FF', padding: 16, borderRadius: 16, marginBottom: 32, width: '100%' }}>
                <Text style={{ fontSize: 14, color: '#4F46E5', fontWeight: '600', textAlign: 'center', lineHeight: 20 }}>
                  {successMessageDetails}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity 
              onPress={() => setShowSuccessModal(false)}
              style={{ 
                width: '100%', backgroundColor: '#63348C', borderRadius: 20, height: 64, 
                justifyContent: 'center', alignItems: 'center', shadowColor: '#63348C', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Newsletter Success Modal */}
      <Modal
        visible={showNewsletterSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewsletterSuccess(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Animated.View 
            entering={ZoomIn.duration(400)}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: 30, 
              padding: 40, 
              alignItems: 'center', 
              width: '100%', 
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10
            }}
          >
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
              <CheckCircle2 size={50} color="#63348C" />
            </View>
            
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1A1A2E', textAlign: 'center', marginBottom: 15 }}>
              ¡Suscripción Exitosa!
            </Text>
            
            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 35 }}>
              Gracias por unirte. Pronto recibirás nuestras mejores ofertas y novedades directamente en tu correo.
            </Text>
            
            <TouchableOpacity 
              onPress={() => setShowNewsletterSuccess(false)}
              style={{ 
                backgroundColor: '#63348C', 
                width: '100%', 
                paddingVertical: 18, 
                borderRadius: 15, 
                alignItems: 'center',
                shadowColor: '#63348C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8
              }}
            >
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>GENIAL</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* AUTH MODAL */}
      <AuthModal 
        isVisible={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </View>
  );
});

export default HomeScreen;
