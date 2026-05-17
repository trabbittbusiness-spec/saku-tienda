import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, TextInput, Animated, Alert, Share, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, Star, Heart, ShoppingCart, Truck, Store, Plus, Minus, ChevronRight, ShoppingBag, Share2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import AuthModal from '../../components/AuthModal';
import LoadingScreen from '../../components/LoadingScreen';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart, cart, cartCount } = useCart();
  const { id } = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = React.useRef<any>(null);
  const [scrollX, setScrollX] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        let data: any = null;
        let finalId = id as string;

        // 1. Intentar buscar por el ID del documento de Firebase
        const productRef = doc(db, 'Products', id as string);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          data = productSnap.data();
          finalId = productSnap.id;
        } else {
          // 2. Si no se encuentra, intentar buscar por el campo ID_productos
          const q = query(collection(db, 'Products'), where('ID_productos', '==', id as string));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            data = docSnap.data();
            finalId = docSnap.id;
          }
        }

        if (data) {
          const images = [];
          if (data.foto1) images.push(data.foto1);
          if (data.foto2) images.push(data.foto2);
          if (data.foto3) images.push(data.foto3);
          
          if (images.length === 0) {
            images.push('https://placehold.co/500x500/F3F4F6/9CA3AF.png?text=Saku');
          }

          const sizesArray = Array.isArray(data.sizes) && data.sizes.length > 0 ? data.sizes : (data.medida ? [data.medida] : ['Único']);
          const productCategory = data.categoria || data.Tipo || data.animal || 'General';

          setProduct({
            id: finalId,
            name: data.nombre || 'Producto sin nombre',
            category: productCategory,
            price: data.precio || 0,
            rating: 5,
            reviews: 0,
            description: data.descripcion || 'Sin descripción',
            images: images,
            sizes: sizesArray,
            variants: data.variants || [],
            promo: data.estadoPromocion === true,
            type: 'product'
          });
          
          setSelectedVariantIndex(0);

          // Fetch Related Products
          try {
            const qRelated = query(
              collection(db, 'Products'),
              where('categoria', '==', productCategory),
              // Limit to 6 related products
            );
            const relatedSnap = await getDocs(qRelated);
            const related = relatedSnap.docs
              .map(doc => ({
                id: doc.id,
                name: doc.data().nombre,
                price: doc.data().precio,
                brand: doc.data().marca || doc.data().Tipo || '',
                image: (doc.data().foto1 || doc.data().foto || 'https://placehold.co/200x200/F3F4F6/9CA3AF.png?text=Saku').replace(/https:\/\/via\.placeholder\.com\/\d+/g, 'https://placehold.co/200x200/F3F4F6/9CA3AF.png?text=Saku'),
                promo: doc.data().estadoPromocion === true
              }))
              .filter(p => p.id !== finalId) // Exclude current product
              .slice(0, 6);
            
            setRelatedProducts(related);
          } catch (relError) {
            console.log("Error fetching related:", relError);
          }
        }
      } catch (e) {
        console.error("Error fetching product:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  // Animation states
  const [showCartAnim, setShowCartAnim] = useState(false);
  const cartScale = React.useRef(new Animated.Value(0)).current;
  const cartOpacity = React.useRef(new Animated.Value(0)).current;
  const bubblePos = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bubbleScale = React.useRef(new Animated.Value(0)).current;
  const bubbleOpacity = React.useRef(new Animated.Value(0)).current;

  const handleAddToCart = async () => {
    if (loading || !product) return;

    if (!auth.currentUser) {
      setShowAuthModal(true);
      return;
    }

    const itemData = {
      ID_productos: product.id,
      nombre: product.name,
      precio: product.variants && product.variants.length > 0 ? product.variants[selectedVariantIndex].price : product.price,
      foto: product.images[0],
      cantidad: quantity,
      medida: product.variants && product.variants.length > 0 ? product.variants[selectedVariantIndex].label : (product.sizes ? product.sizes[0] : ''),
      subtotal: (product.variants && product.variants.length > 0 ? product.variants[selectedVariantIndex].price : product.price) * quantity,
      creator: auth.currentUser ? doc(db, 'users', auth.currentUser.uid) : null,
      fechaCreacion: new Date()
    };

    // 1. Add to cart via context (this now handles Firestore synchronization)
    addToCart(itemData);

    // 2. Start Animation Sequence immediately for feedback
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
  
  const handleShare = async () => {
    if (!product) return;
    const shareUrl = `https://saku-tienda.web.app/product/${id}`;
    const shareText = `¡Mira este producto en Tienda Saku: ${product.name}!`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Tienda Saku',
              text: shareText,
              url: shareUrl
            });
            return; // Si funcionó, terminamos aquí
          } catch (e) {
            console.log('User cancelled share or not supported via navigator');
          }
        }
        
        // Fallback si navigator.share falla o no está disponible en PC
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          const { setStringAsync } = await import('expo-clipboard');
          await setStringAsync(shareUrl);
        }
        showToast('Enlace copiado');
      } else {
        // En móvil nativo usar el share sheet del sistema
        await Share.share({
          message: Platform.OS === 'ios' ? shareText : `${shareText}\n${shareUrl}`,
          url: shareUrl, // iOS usa este campo para que abra correctamente el link universal
          title: 'Tienda Saku'
        });
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Si no está cargando y no hay producto, mostrar error
  if (!loading && !product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Producto no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 15, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
            <Text style={{ fontWeight: '800' }}>Volver</Text>
          </TouchableOpacity>
        </View>
        <AuthModal 
          isVisible={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </View>
    );
  }

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          {/* Header Image Area */}
          <View style={{ width: '100%', height: 420, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            {!loading && product?.promo && (
              <View style={{ 
                position: 'absolute', top: 25, left: -30, backgroundColor: '#10B981', 
                width: 120, height: 32, transform: [{ rotate: '-45deg' }], 
                justifyContent: 'center', alignItems: 'center', zIndex: 20,
                shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
              }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>OFERTA</Text>
              </View>
            )}
            {loading ? (
              <View style={{ width: '85%', height: '85%', backgroundColor: '#F3F4F6', borderRadius: 20 }} />
            ) : (
              <Image 
                source={{ uri: product.images[0] }} 
                style={{ width: '85%', height: '85%' }} 
                contentFit="contain" 
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
              />
            )}
            
            {/* Action Buttons */}
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ 
                position: 'absolute', 
                top: Platform.OS === 'ios' ? insets.top : insets.top + 10, 
                left: 20, 
                width: 44, height: 44, borderRadius: 22, 
                backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', 
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 
              }}
            >
              <ArrowLeft size={20} color="#111827" />
            </TouchableOpacity>

            {!loading && (
              <View style={{ 
                position: 'absolute', 
                top: Platform.OS === 'ios' ? insets.top : insets.top + 10, 
                right: 20, 
                flexDirection: 'row', gap: 10 
              }}>
                <TouchableOpacity 
                  onPress={handleShare}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}
                >
                  <Share2 size={20} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => toggleFavorite(product)}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}
                >
                  <Heart size={20} color={isFavorite(product.id) ? '#EF4444' : '#111827'} fill={isFavorite(product.id) ? '#EF4444' : 'transparent'} />
                </TouchableOpacity>
              </View>
            )}

            {/* Badge */}
            <View style={{ 
              position: 'absolute', 
              top: Platform.OS === 'ios' ? insets.top + 45 : insets.top + 55, 
              right: 20, 
              backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 
            }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>En Stock</Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 25 }}>
            {loading ? (
              <>
                <View style={{ width: 80, height: 12, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 10 }} />
                <View style={{ width: '90%', height: 28, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 15 }} />
                <View style={{ width: 120, height: 32, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 25 }} />
              </>
            ) : (
              <>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 }}>{product.category}</Text>
                </View>

                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', lineHeight: 28, marginBottom: 15 }}>{product.name}</Text>
                
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827', marginTop: 8 }}>
                  ${((product.variants && product.variants.length > 0 ? product.variants[selectedVariantIndex].price : product.price) || 0).toLocaleString("de-DE")} CLP
                </Text>
              </>
            )}

            {/* Size Selector */}
            <View style={{ marginBottom: 35 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 15 }}>Tamaño</Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {loading ? (
                  <View style={{ width: 100, height: 48, backgroundColor: '#F3F4F6', borderRadius: 14 }} />
                ) : product.variants && product.variants.length > 0 ? (
                  product.variants.map((v: any, i: number) => (
                    <TouchableOpacity 
                      key={i}
                      onPress={() => setSelectedVariantIndex(i)}
                      style={{ 
                        flex: 1, minWidth: 80, height: 48, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
                        borderColor: '#7C3AED',
                        backgroundColor: selectedVariantIndex === i ? '#7C3AED' : '#FFFFFF'
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: selectedVariantIndex === i ? '#FFFFFF' : '#7C3AED', textTransform: 'uppercase' }}>{v.label}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  product.sizes.map((size: string) => (
                    <View key={size} style={{ flex: 1, minWidth: 80, height: 48, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', borderColor: '#7C3AED', backgroundColor: '#FFFFFF' }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase' }}>{size}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 25 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 10 }}>Descripción</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500', lineHeight: 22 }}>
                {loading ? 'Cargando descripción...' : product.description}
              </Text>
            </View>
          </View>

          {/* Related Products Carousel (Mobile) - Full Width to avoid clipping */}
          {relatedProducts.length > 0 && (
            <View style={{ marginTop: 30, marginBottom: 20 }}>
              {/* Header with Title and Arrows - Padded to match content */}
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 20, 
                paddingHorizontal: 25 
              }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>También te podría interesar</Text>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    onPress={() => scrollRef.current?.scrollTo({ x: Math.max(0, scrollX - 240), animated: true })}
                    style={{ 
                      width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', 
                      borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
                      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                    }}
                  >
                    <ArrowLeft size={16} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => scrollRef.current?.scrollTo({ x: scrollX + 240, animated: true })}
                    style={{ 
                      width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', 
                      borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
                      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
                    }}
                  >
                    <ChevronRight size={20} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView 
                ref={scrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false} 
                onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
                contentContainerStyle={{ 
                  paddingHorizontal: 25, // This keeps cards aligned initially but lets them scroll to edge
                  gap: 16, 
                  paddingBottom: 10 
                }}
                style={{ width: '100%' }}
              >
                {relatedProducts.map((item, i) => (
                  <View 
                    key={i} 
                    style={{ 
                      width: 180, 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: 20, 
                      padding: 12, 
                      borderWidth: 1, 
                      borderColor: '#F3F4F6',
                      shadowColor: '#000',
                      shadowOpacity: 0.03,
                      shadowRadius: 10,
                      elevation: 1
                    }}
                  >
                    {/* Badge and Heart */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>-25%</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => toggleFavorite(item)}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Heart size={14} color={isFavorite(item.id) ? '#EF4444' : '#D1D5DB'} fill={isFavorite(item.id) ? '#EF4444' : 'transparent'} />
                      </TouchableOpacity>
                    </View>

                    {/* Image */}
                    <TouchableOpacity 
                      onPress={() => router.push(`/product/${item.id}`)}
                      style={{ width: '100%', height: 110, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Image 
                        source={{ uri: item.image }} 
                        style={{ width: '100%', height: '100%' }} 
                        contentFit="contain" 
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827', height: 32 }} numberOfLines={2}>{item.name}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#DC2626', marginTop: 4 }}>${item.price.toLocaleString("de-DE")}</Text>
                      
                      <TouchableOpacity 
                        onPress={() => router.push(`/product/${item.id}`)}
                        style={{ 
                          backgroundColor: '#311D4E', 
                          height: 36, 
                          borderRadius: 8, 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          marginTop: 10 
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>Ver detalles</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 15, 
          paddingTop: 15,
          backgroundColor: '#FFFFFF', 
          borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', 
          paddingHorizontal: 20, gap: 12,
          shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 20
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
            disabled={loading}
            onPress={handleAddToCart}
            style={{ 
              flex: 1, backgroundColor: loading ? '#E5E7EB' : '#F47321', borderRadius: 16, height: 60, 
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              shadowColor: '#F47321', shadowOpacity: 0.2, shadowRadius: 8
            }}
          >
            <ShoppingCart size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }}>
              {loading ? 'Cargando...' : `Agregar • $${((product.variants && product.variants.length > 0 ? product.variants[selectedVariantIndex].price : product.price) * quantity).toLocaleString("de-DE")}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Animation Overlay (Shared for Mobile and Web) */}
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
              <Image 
                source={{ uri: product.images[0] }} 
                style={{ width: 60, height: 60 }} 
                contentFit="contain" 
                cachePolicy="memory-disk"
              />
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
                    backgroundColor: '#63348C', width: 34, height: 34, borderRadius: 17,
                    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF'
                  }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>
                      {cartCount}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginTop: 15 }}>Ir a mi carrito →</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
        <AuthModal 
          isVisible={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
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
            {loading ? (
              <View style={{ width: 60, height: 12, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
            ) : (
              <Text style={{ fontSize: 12, color: '#111827', fontWeight: '800' }}>{product.category}</Text>
            )}
          </View>
        </View>

        <View style={{ 
          flexDirection: isDesktop ? 'row' : 'column', gap: 60, paddingHorizontal: isDesktop ? 60 : 20, 
          paddingVertical: 40, maxWidth: 1200, alignSelf: 'center', width: '100%' 
        }}>
          
          {/* LEFT: IMAGE GALLERY */}
          <View style={{ flex: 1, overflow: 'hidden', borderRadius: 24 }}>
            <View style={{ 
              width: '100%', height: 600, backgroundColor: '#F9FAFB', borderRadius: 24, 
              justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' 
            }}>
              {!loading && product?.promo && (
                <View style={{ 
                  position: 'absolute', top: 35, left: -45, backgroundColor: '#22C55E', 
                  width: 180, height: 44, transform: [{ rotate: '-45deg' }], 
                  justifyContent: 'center', alignItems: 'center', zIndex: 20,
                  shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
                }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 2 }}>PROMO</Text>
                </View>
              )}
              {loading ? (
                <View style={{ width: '100%', height: '100%', backgroundColor: '#F3F4F6' }} />
              ) : (
                <Image 
                  source={{ uri: product.images[selectedImage] }} 
                  style={{ width: '100%', height: '100%' }} 
                  contentFit="contain" 
                  transition={200}
                  cachePolicy="memory-disk"
                  priority="high"
                />
              )}
              {!loading && (
                <View style={{ position: 'absolute', top: 24, right: 24, flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity 
                    onPress={handleShare}
                    style={{ 
                      width: 44, height: 44, borderRadius: 22, 
                      backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
                      shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
                    }}
                  >
                    <Share2 size={20} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => toggleFavorite({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.images[0],
                      category: product.category,
                      type: 'product'
                    })}
                    style={{ 
                      width: 44, height: 44, borderRadius: 22, 
                      backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
                      shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
                    }}
                  >
                    <Heart size={20} color={isFavorite(product.id) ? '#EF4444' : '#D1D5DB'} fill={isFavorite(product.id) ? '#EF4444' : 'transparent'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
              {loading ? (
                [1,2,3].map(i => <View key={i} style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: '#F3F4F6' }} />)
              ) : (
                product.images.map((img: string, i: number) => (
                  <TouchableOpacity 
                    key={i}
                    onPress={() => setSelectedImage(i)}
                    style={{ 
                      width: 70, height: 70, borderRadius: 12, borderWidth: 2, 
                      borderColor: selectedImage === i ? '#10B981' : 'transparent',
                      padding: 4, backgroundColor: '#FFFFFF'
                    }}
                  >
                    <Image 
                      source={{ uri: img }} 
                      style={{ width: '100%', height: '100%', borderRadius: 8 }} 
                      contentFit="contain" 
                      cachePolicy="memory-disk"
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* RIGHT: INFO */}
          <View style={{ flex: 1 }}>
            {loading ? (
              <>
                <View style={{ width: 100, height: 12, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 12 }} />
                <View style={{ width: '80%', height: 32, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 20 }} />
                <View style={{ width: 150, height: 42, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 24 }} />
                <View style={{ width: '100%', height: 80, backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 32 }} />
              </>
            ) : (
              <>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 }}>{product.category}</Text>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#111827', lineHeight: 40, marginBottom: 24 }}>{product.name}</Text>

                <Text style={{ fontSize: 42, fontWeight: '900', color: '#111827', marginBottom: 24 }}>
                  ${((product.variants && product.variants.length > 0 ? product.variants[selectedVariantIndex].price : product.price) || 0).toLocaleString("de-DE")} CLP
                </Text>

                <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '500', lineHeight: 24, marginBottom: 32 }}>
                  {product.description}
                </Text>
              </>
            )}

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 16 }}>Tamaño o Formato disponible</Text>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                {loading ? (
                  <View style={{ width: 120, height: 45, backgroundColor: '#F3F4F6', borderRadius: 14 }} />
                ) : product.variants && product.variants.length > 0 ? (
                  product.variants.map((v: any, i: number) => (
                    <TouchableOpacity 
                      key={i}
                      onPress={() => setSelectedVariantIndex(i)}
                      style={{ 
                        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5,
                        borderColor: '#7C3AED',
                        backgroundColor: selectedVariantIndex === i ? '#7C3AED' : '#FFFFFF'
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '800', color: selectedVariantIndex === i ? '#FFFFFF' : '#7C3AED', textTransform: 'uppercase' }}>{v.label}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  product.sizes.map((size: string) => (
                    <View key={size} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, borderColor: '#7C3AED', backgroundColor: '#FFFFFF' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase' }}>{size}</Text>
                    </View>
                  ))
                )}
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
                disabled={loading}
                onPress={handleAddToCart}
                style={{ 
                  flex: 1, backgroundColor: loading ? '#E5E7EB' : '#F47321', borderRadius: 16, height: 60, 
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
                  shadowColor: '#F47321', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                <ShoppingCart size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }}>
                  {loading ? 'Cargando...' : `Agregar al carrito — $${(product.price * quantity).toLocaleString("de-DE")} CLP`}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 24, padding: 24, gap: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Truck size={20} color="#63348C" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Despacho Express</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>Recíbelo hoy mismo en menos de 90 minutos en RM.</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Store size={20} color="#63348C" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Retiro en Tienda</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>Disponible para retiro inmediato en sucursales Saku Vet.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* RELATED PRODUCTS CAROUSEL */}
        {relatedProducts.length > 0 && (
          <View style={{ width: '100%', marginTop: 60, marginBottom: 40 }}>
            {/* Header with Title and Arrows */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingHorizontal: isDesktop ? 60 : 20,
              marginBottom: 24,
              maxWidth: 1400,
              alignSelf: 'center',
              width: '100%'
            }}>
              <Text style={{ fontSize: isDesktop ? 28 : 20, fontWeight: '900', color: '#111827' }}>También te podría interesar</Text>
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  onPress={() => scrollRef.current?.scrollTo({ x: Math.max(0, scrollX - 280), animated: true })}
                  style={{ 
                    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', 
                    borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', 
                    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
                  }}
                >
                  <ArrowLeft size={18} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => scrollRef.current?.scrollTo({ x: scrollX + 280, animated: true })}
                  style={{ 
                    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', 
                    borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', 
                    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
                  }}
                >
                  <ChevronRight size={22} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ScrollView - Full width to avoid clipping shadow */}
            <ScrollView 
              ref={scrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
              contentContainerStyle={{ 
                paddingHorizontal: isDesktop ? 60 : 20,
                gap: 16, 
                paddingBottom: 20,
                paddingTop: 10
              }}
              style={{ width: '100%' }}
            >
              {relatedProducts.map((item, i) => (
                <View 
                  key={i} 
                  style={{ 
                    width: isDesktop ? 280 : 220, 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: 20, 
                    padding: 16,
                    borderWidth: 1, 
                    borderColor: '#F3F4F6', 
                    shadowColor: '#000', 
                    shadowOpacity: 0.05, 
                    shadowRadius: 10,
                    elevation: 2,
                    overflow: 'hidden'
                  }}
                >
                  {item.promo && (
                    <View style={{ 
                      position: 'absolute', top: 12, left: -22, backgroundColor: '#63348C', 
                      width: 90, height: 24, transform: [{ rotate: '-45deg' }], 
                      justifyContent: 'center', alignItems: 'center', zIndex: 20,
                      shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
                    }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 }}>PROMO</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>

                    <TouchableOpacity 
                      onPress={() => toggleFavorite(item)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Heart size={16} color={isFavorite(item.id) ? '#EF4444' : '#D1D5DB'} fill={isFavorite(item.id) ? '#EF4444' : 'transparent'} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    onPress={() => router.push(`/product/${item.id}`)}
                    style={{ width: '100%', height: 150, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  </TouchableOpacity>

                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', height: 40 }} numberOfLines={2}>{item.name}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#DC2626', marginTop: 8 }}>${item.price.toLocaleString("de-DE")}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Medida: {item.brand || '1 unidad'}</Text>

                    <TouchableOpacity 
                      onPress={() => router.push(`/product/${item.id}`)}
                      style={{ 
                        backgroundColor: '#311D4E', 
                        height: 44, 
                        borderRadius: 10, 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        marginTop: 15 
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>Ver detalles</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Floating Animation Overlay (Shared for Mobile and Web) */}
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
                  backgroundColor: '#63348C', width: 34, height: 34, borderRadius: 17,
                  justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF'
                }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>
                    {cartCount}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginTop: 15 }}>Ir a mi carrito →</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
        <AuthModal 
          isVisible={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
        {toastMessage && (
          <View style={{ position: 'absolute', bottom: 120, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, zIndex: 10000 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{toastMessage}</Text>
          </View>
        )}
      </View>
    );
}
