import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, useWindowDimensions, TextInput, Animated } from 'react-native';
import { ArrowLeft, Star, Heart, ShoppingCart, Truck, Store, Plus, Minus, ChevronRight, ShoppingBag } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '../../components/Header';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, cart } = useCart();
  const { id } = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('1kg');
  const [selectedImage, setSelectedImage] = useState(0);

  // Animation states
  const [showCartAnim, setShowCartAnim] = useState(false);
  const cartScale = React.useRef(new Animated.Value(0)).current;
  const cartOpacity = React.useRef(new Animated.Value(0)).current;
  const bubblePos = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bubbleScale = React.useRef(new Animated.Value(0)).current;
  const bubbleOpacity = React.useRef(new Animated.Value(0)).current;

  const handleAddToCart = () => {
    // 1. Add to cart context
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: quantity,
      selectedSize: selectedSize
    });

    // 2. Start Animation Sequence
    setShowCartAnim(true);
    
    // Reset states
    bubblePos.setValue({ x: 0, y: 300 });
    bubbleScale.setValue(1);
    bubbleOpacity.setValue(1);
    cartScale.setValue(0);
    cartOpacity.setValue(0);

    // STEP 1: Modal Appears First
    Animated.parallel([
      Animated.spring(cartScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(cartOpacity, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start(() => {
      
      // STEP 2: Bubble Flies into the visible Modal
      Animated.parallel([
        Animated.timing(bubblePos.y, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(bubbleScale, { toValue: 0.2, duration: 450, useNativeDriver: true }),
        Animated.timing(bubbleOpacity, { toValue: 0.5, duration: 450, useNativeDriver: true })
      ]).start(() => {
        bubbleOpacity.setValue(0);
        
        // STEP 3: "POPCORN" EFFECT (Modal grows/shakes on impact)
        Animated.spring(cartScale, { 
          toValue: 1.3, 
          friction: 3, 
          tension: 150, 
          useNativeDriver: true 
        }).start();

        // STEP 4: Auto-hide after being large for a moment
        setTimeout(() => {
          Animated.timing(cartOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setShowCartAnim(false);
          });
        }, 1500);
      });
    });
  };

  const product = {
    id: id || '1',
    name: 'ROYAL CANIN XSMALL PUPPY 2,5 KG',
    category: 'ALIMENTO',
    price: 32990,
    rating: 5,
    reviews: 12,
    description: 'Royal Canin® X-Small Junior® es un producto específicamente diseñado para satisfacer las necesidades de cachorros de razas pequeñas de menos de 4Kg como aquellos de raza Maltés, Pomerania, Pinscher miniatura, Papillón, gracias al tamaño de los granos ya que representan un alivio al tamaño de sus mandíbulas y sus sistemas digestivos que deben ser cuidados adecuadamente con nutrición especializada al brindar alta energía y proteínas L.I.P y prebióticos que contribuyen con una flora intestinal balanceada, perfecta para facilitar el tránsito intestinal.',
    images: [
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=201',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=202',
    ]
  };

  const relatedProducts = [
    { name: 'Bravecto Antipulgas 10-20kg', price: 35000, brand: 'MSD', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200' },
    { name: 'NexGard Espectra 15-30kg', price: 28900, brand: 'BOEHRINGER', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=200' },
    { name: 'Apoquel 16mg x 20 comp', price: 45000, brand: 'ZOETIS', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=200' },
    { name: 'Simparica Trio 10-20kg', price: 32000, brand: 'ZOETIS', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=200' },
  ];

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header Image Area */}
          <View style={{ width: '100%', height: 420, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <Image source={{ uri: product.images[0] }} style={{ width: '85%', height: '85%' }} resizeMode="contain" />
            
            {/* Action Buttons */}
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ position: 'absolute', top: 20, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}
            >
              <ArrowLeft size={20} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => toggleFavorite(product)}
              style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}
            >
              <Heart size={20} color={isFavorite(product.id) ? '#EF4444' : '#111827'} fill={isFavorite(product.id) ? '#EF4444' : 'transparent'} />
            </TouchableOpacity>

            {/* Badge */}
            <View style={{ position: 'absolute', top: 60, right: 20, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>En Stock</Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 25 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 }}>{product.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#111827' }}>5</Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>(234)</Text>
              </View>
            </View>

            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', lineHeight: 28, marginBottom: 15 }}>{product.name}</Text>
            
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1E1B4B', marginBottom: 25 }}>
              ${product.price.toLocaleString()}
            </Text>

            {/* Size Selector */}
            <View style={{ marginBottom: 35 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 15 }}>Tamaño</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['1kg', '3kg', '7.5kg', '15kg'].map((size) => (
                  <TouchableOpacity 
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    style={{ 
                      flex: 1, height: 48, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center',
                      borderColor: selectedSize === size ? '#1E1B4B' : '#E5E7EB',
                      backgroundColor: selectedSize === size ? '#1E1B4B' : '#FFFFFF'
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: selectedSize === size ? 'white' : '#6B7280' }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 25 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 10 }}>Descripción</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500', lineHeight: 22 }}>
                Alimento premium para mascotas. Fórmula balanceada con ingredientes de alta calidad para mantener la salud y vitalidad de tu mascota.
              </Text>
            </View>

            {/* Features */}
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 12 }}>Características</Text>
              <View style={{ gap: 8 }}>
                {['Proteínas de alta calidad', 'Omega 3 y 6 para pelaje brillante', 'Antioxidantes naturales', 'Sin colorantes artificiales'].map((feature, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#1E1B4B' }} />
                    <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Related */}
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 20 }}>También te puede interesar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15 }}>
                {[
                  { name: 'Pro Plan Adulto OptiDerma 3kg', price: 32000, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200' },
                  { name: 'Acana Pacifica Perro 2kg', price: 25900, image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=200' },
                  { name: 'Orijen Cat & Kitten 1.8kg', price: 38000, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=200' }
                ].map((item, i) => (
                  <View key={i} style={{ width: 140, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
                    <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                      <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                      <TouchableOpacity style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1 }}>
                        <Heart size={12} color="#D1D5DB" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#111827', height: 32 }} numberOfLines={2}>{item.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#111827', marginTop: 4 }}>${item.price.toLocaleString()}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: '#FFFFFF', 
          borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', 
          paddingHorizontal: 20, paddingBottom: 20, gap: 12
        }}>
          <View style={{ 
            flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', 
            borderRadius: 16, height: 60, borderWidth: 1, borderColor: '#F3F4F6'
          }}>
            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 40, alignItems: 'center' }}>
              <Minus size={18} color="#111827" />
            </TouchableOpacity>
            <Text style={{ width: 30, textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#111827' }}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={{ width: 40, alignItems: 'center' }}>
              <Plus size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleAddToCart}
            style={{ 
              flex: 1, backgroundColor: '#F47321', borderRadius: 16, height: 60, 
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            <ShoppingCart size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }}>
              Agregar • ${(product.price * quantity).toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Animation Overlay */}
        {showCartAnim && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
            
            {/* Flying Bubble (Product image placeholder) */}
            <Animated.View style={{
              position: 'absolute',
              width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF',
              elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
              justifyContent: 'center', alignItems: 'center',
              transform: [
                { translateX: bubblePos.x },
                { translateY: bubblePos.y },
                { scale: bubbleScale }
              ],
              opacity: bubbleOpacity,
              pointerEvents: 'none'
            }}>
              <Image source={{ uri: product.images[0] }} style={{ width: 60, height: 60 }} resizeMode="contain" />
            </Animated.View>

            {/* Clickable Cart Indicator Modal */}
            <Animated.View style={{ 
              backgroundColor: '#FFFFFF', padding: 25, borderRadius: 32,
              shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 10 },
              transform: [
                { scale: cartScale }
              ],
              opacity: cartOpacity,
              alignItems: 'center', justifyContent: 'center'
            }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  setShowCartAnim(false);
                  router.push('/cart');
                }}
                style={{ alignItems: 'center' }}
              >
                <View style={{ position: 'relative' }}>
                  <ShoppingBag size={64} color="#9CA3AF" strokeWidth={1.5} />
                  <View style={{ 
                    position: 'absolute', top: -5, right: -12, 
                    backgroundColor: '#F47321', width: 34, height: 34, borderRadius: 17,
                    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF'
                  }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginTop: 15 }}>Ir a mi carrito →</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Header />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* BREADCRUMBS */}
        <View style={{ 
          paddingHorizontal: isDesktop ? 60 : 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
          flexDirection: 'row', alignItems: 'center', gap: 12
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ 
            flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', 
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' 
          }}>
            <ArrowLeft size={14} color="#6B7280" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280' }}>Volver</Text>
          </TouchableOpacity>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>Inicio</Text>
            <ChevronRight size={12} color="#D1D5DB" />
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>Perro o gato</Text>
            <ChevronRight size={12} color="#D1D5DB" />
            <Text style={{ fontSize: 12, color: '#111827', fontWeight: '800' }}>Alimento</Text>
          </View>
        </View>

        <View style={{ 
          flexDirection: isDesktop ? 'row' : 'column', gap: 60, paddingHorizontal: isDesktop ? 60 : 20, 
          paddingVertical: 40, maxWidth: 1200, alignSelf: 'center', width: '100%' 
        }}>
          
          {/* LEFT: IMAGES */}
          <View style={{ flex: 1 }}>
            <View style={{ 
              width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 32, 
              justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'
            }}>
              <Image source={{ uri: product.images[selectedImage] }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              <TouchableOpacity 
                onPress={() => toggleFavorite({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0],
                  category: product.category
                })}
                style={{ 
                  position: 'absolute', top: 24, right: 24, width: 44, height: 44, borderRadius: 22, 
                  backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
                  shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
                }}
              >
                <Heart size={20} color={isFavorite(product.id) ? '#EF4444' : '#D1D5DB'} fill={isFavorite(product.id) ? '#EF4444' : 'transparent'} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              {product.images.map((img, i) => (
                <TouchableOpacity 
                  key={i}
                  onPress={() => setSelectedImage(i)}
                  style={{ 
                    width: 70, height: 70, borderRadius: 12, borderWidth: 2, 
                    borderColor: selectedImage === i ? '#F47321' : 'transparent',
                    padding: 4, backgroundColor: '#FFFFFF'
                  }}
                >
                  <Image source={{ uri: img }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* RIGHT: INFO */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 }}>{product.category}</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#111827', lineHeight: 40, marginBottom: 16 }}>{product.name}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#F59E0B' }}>{product.rating}</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>{product.reviews} valoraciones</Text>
            </View>

            <Text style={{ fontSize: 42, fontWeight: '900', color: '#1E1B4B', marginBottom: 24 }}>
              ${product.price.toLocaleString()}
            </Text>

            <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '500', lineHeight: 24, marginBottom: 32 }}>
              {product.description}
            </Text>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 16 }}>Tamaño o Formato disponible</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {['Pequeño', 'Mediano', 'Familiar'].map((size) => (
                  <TouchableOpacity 
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    style={{ 
                      paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
                      borderColor: selectedSize === size ? '#1E1B4B' : '#E5E7EB',
                      backgroundColor: selectedSize === size ? '#1E1B4B' : '#FFFFFF'
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: selectedSize === size ? 'white' : '#6B7280' }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 40 }}>
              <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', 
                borderRadius: 16, paddingHorizontal: 12, height: 60, borderWidth: 1, borderColor: '#F3F4F6' 
              }}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: 10 }}>
                  <Minus size={18} color="#111827" />
                </TouchableOpacity>
                <Text style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#111827' }}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={{ padding: 10 }}>
                  <Plus size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={() => {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0],
                    quantity: quantity,
                    selectedSize: selectedSize
                  });
                  // Optionally show a confirmation or navigate to cart
                }}
                style={{ 
                  flex: 1, backgroundColor: '#F47321', borderRadius: 16, height: 60, 
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                  shadowColor: '#F47321', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                <ShoppingCart size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }}>
                  Agregar al carrito — ${(product.price * quantity).toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Truck size={20} color="#6366F1" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Despacho Express</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>Recíbelo hoy mismo en menos de 90 minutos en RM.</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Store size={20} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Retiro en Tienda</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>Disponible para retiro inmediato en sucursales Saku Vet.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* RELATED PRODUCTS */}
        <View style={{ paddingHorizontal: isDesktop ? 60 : 20, maxWidth: 1200, alignSelf: 'center', width: '100%', marginTop: 60 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 32 }}>También te podría interesar</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {relatedProducts.map((item, i) => (
              <View key={i} style={{ 
                width: isDesktop ? '23%' : '47%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16,
                borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10
              }}>
                <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                    <Heart size={14} color="#D1D5DB" />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 4 }}>{item.brand}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', height: 40 }}>{item.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>${item.price.toLocaleString()}</Text>
                  <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
                    <Plus size={16} color="white" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
