import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, useWindowDimensions, ActivityIndicator, Modal, Pressable } from 'react-native';

import { ArrowLeft, Lock, MapPin, Plus, CreditCard, Banknote, ShieldCheck, ChevronRight, CheckCircle2, Store, Clock, RefreshCcw, Wifi, AlertCircle, Ticket, CalendarX, X } from 'lucide-react-native';

import { router, useLocalSearchParams } from 'expo-router';

import LocationMapModal from '../components/LocationMapModal';
import { useCart } from '../context/CartContext';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, updateDoc, getDoc, query, where, getDocs } from 'firebase/firestore';

export default function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const { cart, cartTotal, clearCart } = useCart();
  const isDesktop = width >= 1024;
  
  const [deliveryType, setDeliveryType] = useState('home'); // 'home' or 'store'
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'card'
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>({
    main: 'Nueva Providencia 1515',
    sub: 'Providencia, RM',
    lat: -33.4425,
    lng: -70.6400,
    category: 'CASA'
  });
  const [userAddresses, setUserAddresses] = useState<any[]>([]);

  const fetchAddresses = async () => {
    if (!auth.currentUser) return;
    try {
      // 1. Fetch all addresses from Direcciones collection
      const q = query(collection(db, 'Direcciones'), where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const addresses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserAddresses(addresses);

      // 2. Fetch default address from user profile to select it
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().direccionDefault) {
        setSelectedLocation(userDoc.data().direccionDefault);
      } else if (addresses.length > 0) {
        // Fallback to the first address if no default is set
        setSelectedLocation(addresses[0]);
      }
    } catch (error) {
      console.log("Error loading addresses:", error);
    }
  };

  // Load addresses on mount
  React.useEffect(() => {
    fetchAddresses();
  }, []);

  const [showNewCardForm, setShowNewCardForm] = useState(false);


  const [selectedCardId, setSelectedCardId] = useState('visa-1');
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponModal, setCouponModal] = useState({ visible: false, title: '', message: '', type: 'error' as 'error' | 'warning' | 'success' });


  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const codeToValidate = couponCode.toUpperCase().trim();
      
      // 1. Check if the user has already used this coupon
      if (auth.currentUser) {
        const usedQuery = query(
          collection(db, 'Orden'), 
          where('creadorId', '==', auth.currentUser.uid),
          where('cuponAplicado.code', '==', codeToValidate)
        );
        const usedSnapshot = await getDocs(usedQuery);
        if (!usedSnapshot.empty) {
          setCouponModal({
            visible: true,
            title: 'Cupón ya utilizado',
            message: 'Ya has aprovechado este descuento en una compra anterior.',
            type: 'warning'
          });
          setAppliedCoupon(null);
          setIsValidatingCoupon(false);
          return;
        }
      }

      // 2. Check if coupon exists and is active
      const q = query(collection(db, 'Coupons'), where('code', '==', codeToValidate), where('active', '==', true));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setCouponModal({
          visible: true,
          title: 'Código no válido',
          message: 'El cupón que ingresaste no existe o ya no se encuentra activo.',
          type: 'error'
        });
        setAppliedCoupon(null);
      } else {
        const coupon = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as any;
        
        // 3. Check expiration
        if (coupon.expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiry = new Date(coupon.expiryDate);
          
          if (isNaN(expiry.getTime())) {
            console.warn('Invalid expiry date format:', coupon.expiryDate);
          } else if (today > expiry) {
            setCouponModal({
              visible: true,
              title: 'Cupón expirado',
              message: 'Lamentablemente este descuento ya ha vencido.',
              type: 'error'
            });
            setAppliedCoupon(null);
            setIsValidatingCoupon(false);
            return;
          }
        }
        
        if (cartTotal < coupon.minAmount) {
          setCouponModal({
            visible: true,
            title: 'Monto insuficiente',
            message: `Este cupón requiere una compra mínima de $${coupon.minAmount.toLocaleString()}`,
            type: 'warning'
          });
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
        }
      }
    } catch (error) {
      console.log("Error validating coupon:", error);
    } finally {
      setIsValidatingCoupon(false);
    }
  };


  const shipping = 0;
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (cartTotal * (appliedCoupon.value / 100)) 
        : appliedCoupon.value)
    : 0;
  const total = cartTotal + shipping - discount;

  const handlePayment = async () => {
    if (cart.length === 0) {
      console.log("Cannot create order: Cart is empty");
      return;
    }
    
    setIsLoading(true);
    console.log("Starting order process for user:", auth.currentUser?.uid);
    
    try {
      const orderData = {
        items: cart.map(item => ({
          id: item.ID_productos || '',
          nombre: item.nombre || '',
          precio: item.precio || 0,
          cantidad: item.cantidad || 0,
          medida: item.medida || '',
          subtotal: item.subtotal || 0,
          foto: item.foto || ''
        })),
        total: total,
        subtotal: cartTotal,
        envio: shipping,
        descuento: discount,
        cuponAplicado: appliedCoupon ? {
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          valor: appliedCoupon.value,
          tipo: appliedCoupon.type
        } : null,
        metodoPago: paymentMethod,
        tipoEntrega: deliveryType,
        direccion: deliveryType === 'home' ? {
          ...selectedLocation,
          texto: `${selectedLocation.main}, ${selectedLocation.sub}`
        } : { main: 'Saku Central', sub: 'Retiro en Tienda', texto: 'Retiro en Sucursal Saku' },
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(), // Fallback to string if serverTimestamp is tricky
        timestamp: serverTimestamp(),
        creadorId: auth.currentUser?.uid || null,
        creador: auth.currentUser ? doc(db, 'users', auth.currentUser.uid) : null,
        codigoRetiro: (() => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code = '';
          for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        })()
      };

      console.log("Order Data to be sent:", orderData);

      // 1. Create the Order
      const docRef = await addDoc(collection(db, 'Orden'), orderData);
      console.log("Order document created with ID:", docRef.id);

      // 1.5 Create Admin Notification
      try {
        await addDoc(collection(db, 'Notifications'), {
          title: 'Nuevo Pedido #' + docRef.id.slice(-4).toUpperCase(),
          desc: `El cliente ha realizado una compra de $${total.toLocaleString()}.`,
          time: new Date().toISOString(),
          type: 'order',
          read: false,
          orderId: docRef.id,
          timestamp: serverTimestamp()
        });
        console.log("Admin notification created.");
      } catch (notifError) {
        console.error("Error creating admin notification:", notifError);
      }

      // 2. Clear the cart in Firestore (productosseleccionados)
      console.log("Cleaning up cart items from Firestore...");
      const batch = writeBatch(db);
      let itemsToBatch = 0;
      cart.forEach((item) => {
        if (item.firebaseId) {
          const itemRef = doc(db, 'productosseleccionados', item.firebaseId);
          batch.delete(itemRef);
          itemsToBatch++;
        }
      });
      
      if (itemsToBatch > 0) {
        await batch.commit();
        console.log(`Successfully cleared ${itemsToBatch} items from cart.`);
      }

      // 3. Navigate to Home with success parameter
      clearCart(); // Local context clear
      router.replace('/?success=1');

    } catch (error: any) {
      console.error("Error creating order:", error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ 
          height: 90, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 40,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ 
              position: 'absolute', left: 20, top: 40, width: 44, height: 44, 
              backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' 
            }}
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Checkout</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#9CA3AF' }}>{cart.length} productos</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Delivery Type Tabs */}
          <View style={{ backgroundColor: '#F3F4F6', borderRadius: 24, margin: 20, padding: 6, flexDirection: 'row' }}>
            <TouchableOpacity 
              onPress={() => setDeliveryType('home')}
              style={{ 
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 14, borderRadius: 18, backgroundColor: deliveryType === 'home' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000', shadowOpacity: deliveryType === 'home' ? 0.05 : 0, shadowRadius: 10
              }}
            >
              <Store size={18} color={deliveryType === 'home' ? '#111827' : '#9CA3AF'} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: deliveryType === 'home' ? '#111827' : '#9CA3AF' }}>Entrega</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDeliveryType('store')}
              style={{ 
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 14, borderRadius: 18, backgroundColor: deliveryType === 'store' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000', shadowOpacity: deliveryType === 'store' ? 0.05 : 0, shadowRadius: 10
              }}
            >
              <Store size={18} color={deliveryType === 'store' ? '#111827' : '#9CA3AF'} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: deliveryType === 'store' ? '#111827' : '#9CA3AF' }}>Recolección</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Section */}
          <View style={{ paddingHorizontal: 20 }}>
            {deliveryType === 'home' ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                    <MapPin size={18} color="#F47321" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Dirección de Entrega</Text>
                </View>

                {userAddresses.map((addr) => (
                  <TouchableOpacity 
                    key={addr.id || `${addr.lat}-${addr.lng}`}
                    onPress={async () => {
                      setSelectedLocation(addr);
                      if (auth.currentUser) {
                        try {
                          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                            direccionDefault: addr
                          });
                        } catch (e) { console.log("Error updating default addr:", e); }
                      }
                    }}
                    style={{ 
                      borderWidth: 2, 
                      borderColor: (selectedLocation?.id === addr.id || (selectedLocation?.lat === addr.lat && selectedLocation?.lng === addr.lng)) ? '#F47321' : '#F3F4F6', 
                      borderRadius: 24, padding: 16, backgroundColor: '#FFFFFF',
                      flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
                      <MapPin size={22} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>{addr.category || 'Dirección'}</Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{addr.main}, {addr.sub}</Text>
                    </View>
                    {(selectedLocation?.id === addr.id || (selectedLocation?.lat === addr.lat && selectedLocation?.lng === addr.lng)) && (
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity 
                  onPress={() => setIsMapModalOpen(true)}
                  style={{ 
                    height: 60, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 20,
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 30
                  }}
                >
                  <Plus size={18} color="#F47321" strokeWidth={3} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#F47321' }}>Agregar nueva dirección</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={{ backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 25 }}>
                  <MapPin size={20} color="#6366F1" />
                  <Text style={{ flex: 1, fontSize: 13, color: '#6366F1', fontWeight: '700' }}>Retira tu pedido sin costo adicional.</Text>
                </View>

                <TouchableOpacity style={{ 
                  borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 24, padding: 20, backgroundColor: '#FFFFFF',
                  marginBottom: 30
                }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Saku Providencia</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Av. Providencia 1234</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Payment Method Section */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                <CreditCard size={18} color="#1E1B4B" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Método de Pago</Text>
            </View>

            <TouchableOpacity 
              onPress={() => setPaymentMethod('cash')}
              style={{ 
                borderWidth: 2, borderColor: paymentMethod === 'cash' ? '#1E1B4B' : '#F9FAFB', borderRadius: 24, padding: 16, 
                backgroundColor: paymentMethod === 'cash' ? '#EEF2FF' : '#F9FAFB',
                flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#D1E0FF', justifyContent: 'center', alignItems: 'center' }}>
                <Banknote size={22} color="#1E1B4B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Efectivo</Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>Pago contra entrega</Text>
              </View>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: paymentMethod === 'cash' ? '#1E1B4B' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setPaymentMethod('card')}
              style={{ 
                borderWidth: 2, borderColor: paymentMethod === 'card' ? '#1E1B4B' : '#F9FAFB', borderRadius: 24, padding: 16, 
                backgroundColor: paymentMethod === 'card' ? '#EEF2FF' : '#F9FAFB',
                marginBottom: 30
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                  <CreditCard size={22} color="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Tarjeta</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>Débito o crédito</Text>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: paymentMethod === 'card' ? '#1E1B4B' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                </View>
              </View>

              {paymentMethod === 'card' && (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {/* Visa Card */}
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedCardId('visa-1');
                          setShowNewCardForm(false);
                        }}
                        style={{ 
                          width: 140, height: 90, borderRadius: 16, backgroundColor: '#1E1B4B', padding: 12,
                          borderWidth: 2, borderColor: selectedCardId === 'visa-1' && !showNewCardForm ? '#10B981' : 'transparent'
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png' }} style={{ width: 35, height: 12 }} resizeMode="contain" />
                          {selectedCardId === 'visa-1' && !showNewCardForm && (
                            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ marginTop: 'auto' }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Visa</Text>
                          <Text style={{ color: 'white', fontSize: 14, fontWeight: '900' }}>•••• 4242</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Mastercard Card */}
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedCardId('master-1');
                          setShowNewCardForm(false);
                        }}
                        style={{ 
                          width: 140, height: 90, borderRadius: 16, backgroundColor: '#7C2D12', padding: 12,
                          borderWidth: 2, borderColor: selectedCardId === 'master-1' && !showNewCardForm ? '#10B981' : 'transparent'
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png' }} style={{ width: 35, height: 20 }} resizeMode="contain" />
                          {selectedCardId === 'master-1' && !showNewCardForm && (
                            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ marginTop: 'auto' }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Mastercard</Text>
                          <Text style={{ color: 'white', fontSize: 14, fontWeight: '900' }}>•••• 5555</Text>
                        </View>
                      </TouchableOpacity>

                      {/* New Card Button */}
                      <TouchableOpacity 
                        onPress={() => setShowNewCardForm(true)}
                        style={{ 
                          width: 120, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', 
                          justifyContent: 'center', alignItems: 'center', gap: 6, borderStyle: 'solid', borderWidth: 2, borderColor: showNewCardForm ? '#10B981' : '#E5E7EB'
                        }}
                      >
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' }}>
                          <Plus size={18} color="#10B981" />
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>Nueva Tarjeta</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>

                  {showNewCardForm && (
                    <View style={{ marginTop: 24, gap: 16 }}>
                      {/* Card Preview */}
                      <View style={{ 
                        width: '100%', height: 180, borderRadius: 24, backgroundColor: '#1E1B4B', padding: 24,
                        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ width: 40, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 }} />
                          <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', fontStyle: 'italic' }}>Visa</Text>
                        </View>
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: '700', marginTop: 30, letterSpacing: 2 }}>
                          {cardDetails.number ? cardDetails.number.replace(/(.{4})/g, '$1 ') : '#### #### #### ####'}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <View>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' }}>TITULAR</Text>
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' }}>{cardDetails.name || 'Nombre del titular'}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' }}>VENCE</Text>
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{cardDetails.expiry || 'MM/YY'}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Form Fields */}
                      <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                        <CreditCard size={20} color="#10B981" />
                        <TextInput 
                          placeholder="Número de tarjeta"
                          placeholderTextColor="#9CA3AF"
                          value={cardDetails.number || ''}
                          onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                          style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' }}
                        />
                      </View>

                      <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                        <TextInput 
                          placeholder="Nombre en la tarjeta"
                          placeholderTextColor="#9CA3AF"
                          value={cardDetails.name || ''}
                          onChangeText={(text) => setCardDetails(prev => ({ ...prev, name: text }))}
                          style={{ fontSize: 15, fontWeight: '600' }}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="MM/YY"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.expiry || ''}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, expiry: text }))}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="CVV"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.cvv || ''}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>
                      </View>

                      <TouchableOpacity 
                        onPress={() => setShowNewCardForm(false)}
                        style={{ 
                          backgroundColor: '#10B981', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8
                        }}
                      >
                        <CreditCard size={20} color="white" />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Guardar Tarjeta</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Discount Code */}
          <View style={{ marginHorizontal: 20, marginBottom: 30, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: appliedCoupon ? '#10B981' : '#F3F4F6', flexDirection: 'row', alignItems: 'center' }}>
            <TextInput 
              placeholder="Ingresa tu código de descuento.."
              value={couponCode || ''}
              onChangeText={setCouponCode}
              editable={!appliedCoupon}
              autoCapitalize="characters"
              style={{ flex: 1, paddingHorizontal: 15, fontSize: 14, fontWeight: '600', color: appliedCoupon ? '#10B981' : '#111827' }}
            />
            {appliedCoupon ? (
              <TouchableOpacity 
                onPress={() => {
                  setAppliedCoupon(null);
                  setCouponCode('');
                }}
                style={{ backgroundColor: '#FEE2E2', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 }}
              >
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '900' }}>Quitar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={validateCoupon}
                disabled={isValidatingCoupon || !couponCode}
                style={{ backgroundColor: '#F47321', borderRadius: 14, paddingHorizontal: 25, paddingVertical: 12, opacity: isValidatingCoupon ? 0.6 : 1 }}
              >
                {isValidatingCoupon ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: 'white', fontSize: 14, fontWeight: '900' }}>Aplicar</Text>}
              </TouchableOpacity>
            )}
          </View>

          {/* Order Summary */}
          <View style={{ marginHorizontal: 20, padding: 24, backgroundColor: '#FFFFFF', borderRadius: 32, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 20 }}>Resumen de Orden</Text>
            
            <View style={{ gap: 15, marginBottom: 25 }}>
              {cart.map((item) => (
                <View key={item.firebaseId || `${item.ID_productos}-${item.medida}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF9F5', justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={{ uri: item.foto }} style={{ width: '80%', height: '80%' }} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', textTransform: 'uppercase' }} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '700' }}>x{item.cantidad} · ${(item.precio || 0).toLocaleString()}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>${(item.subtotal || 0).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '700' }}>Subtotal</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>${cartTotal.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '700' }}>Envío</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#10B981' }}>Gratis</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '700' }}>Descuento</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>$0</Text>
              </View>
              
              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 5 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Total</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#F47321' }}>${total.toLocaleString()}</Text>
              </View>

              <TouchableOpacity 
                onPress={handlePayment}
                disabled={isLoading || cart.length === 0}
                style={{ 
                  backgroundColor: isLoading ? '#9CA3AF' : '#22C55E', borderRadius: 20, height: 60, justifyContent: 'center', alignItems: 'center',
                  marginTop: 25, shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>PEDIR CONTRA ENTREGA</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* MAP MODAL */}

        <LocationMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          onSave={async (location) => {
            setSelectedLocation(location);
            setIsMapModalOpen(false);

            // Save to Direcciones and User Profile
            if (auth.currentUser) {
              try {
                const addressData = {
                  ...location,
                  userId: auth.currentUser.uid,
                  creadoEn: serverTimestamp()
                };
                
                // 1. Save to Direcciones collection
                await addDoc(collection(db, 'Direcciones'), addressData);
                
                // 2. Set as default in User Profile
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                  direccionDefault: location
                });
                
                console.log("Address saved and set as default successfully");
              } catch (error) {
                console.error("Error saving address:", error);
              }
            }
            // Refetch addresses to show the new one
            fetchAddresses();
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* HEADER */}
      <View style={{ 
        height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: isDesktop ? 60 : 20
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={18} color="#111827" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Volver</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1A2E' }}>Checkout Seguro</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Lock size={16} color="#10B981" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>Encriptado 256-bit</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: isDesktop ? 60 : 20, paddingVertical: 40 }}>
        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 40, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
          
          {/* LEFT COLUMN: FORMS */}
          <View style={{ flex: 1.5, gap: 32 }}>
            
            {/* DELIVERY TYPE TABS */}
            <View style={{ backgroundColor: '#F3F4F6', borderRadius: 20, padding: 6, flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={() => setDeliveryType('home')}
                style={{ 
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                  paddingVertical: 14, borderRadius: 16, backgroundColor: deliveryType === 'home' ? '#FFFFFF' : 'transparent',
                  shadowColor: '#000', shadowOpacity: deliveryType === 'home' ? 0.05 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
                }}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                    <MapPin size={14} color="#6B7280" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: deliveryType === 'home' ? '#111827' : '#9CA3AF', letterSpacing: 1 }}>ENTREGA A DOMICILIO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setDeliveryType('store')}
                style={{ 
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                  paddingVertical: 14, borderRadius: 16, backgroundColor: deliveryType === 'store' ? '#FFFFFF' : 'transparent',
                  shadowColor: '#000', shadowOpacity: deliveryType === 'store' ? 0.05 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
                }}
              >
                 <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                    <CheckCircle2 size={14} color="#6B7280" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: deliveryType === 'store' ? '#111827' : '#9CA3AF', letterSpacing: 1 }}>RETIRO EN SUCURSAL</Text>
              </TouchableOpacity>
            </View>

            {/* DELIVERY ADDRESS OR STORE PICKUP SECTION */}
            {deliveryType === 'home' ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                    <MapPin size={18} color="#F47321" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Dirección de Entrega</Text>
                </View>

                <View style={{ gap: 12 }}>
                  {userAddresses.map((addr) => (
                    <TouchableOpacity 
                      key={addr.id || `${addr.lat}-${addr.lng}`}
                      onPress={async () => {
                        setSelectedLocation(addr);
                        // Update default address in profile
                        if (auth.currentUser) {
                          try {
                            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                              direccionDefault: addr
                            });
                          } catch (e) { console.log("Error updating default addr:", e); }
                        }
                      }}
                      style={{ 
                        borderWidth: 2, borderColor: selectedLocation?.id === addr.id || (selectedLocation?.lat === addr.lat && selectedLocation?.lng === addr.lng) ? '#F47321' : '#F3F4F6', 
                        borderRadius: 20, padding: 20, backgroundColor: selectedLocation?.id === addr.id ? '#FFFBF7' : '#FFFFFF',
                        flexDirection: 'row', alignItems: 'center', gap: 16
                      }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
                        <MapPin size={22} color="white" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{addr.category || 'Dirección'}</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>{addr.main}, {addr.sub}</Text>
                      </View>
                      {(selectedLocation?.id === addr.id || (selectedLocation?.lat === addr.lat && selectedLocation?.lng === addr.lng)) && (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity 
                    onPress={() => setIsMapModalOpen(true)}
                    style={{ 
                      height: 80, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 20,
                      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF'
                    }}
                  >
                    <Plus size={20} color="#F47321" strokeWidth={3} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#F47321' }}>Agregar nueva dirección</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Store size={18} color="#6366F1" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Sucursal disponible</Text>
                </View>

                <TouchableOpacity style={{ 
                  borderWidth: 2, borderColor: '#1E1B4B', borderRadius: 20, padding: 24, backgroundColor: '#FFFFFF',
                  shadowColor: '#1E1B4B', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B' }}>Saku Vet Central</Text>
                      <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Av. Providencia 1234, Providencia</Text>
                      
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Clock size={16} color="#9CA3AF" />
                          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>09:00 - 20:00</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={16} color="#9CA3AF" />
                          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>1.2 km</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 10 }}>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '800' }}>• Stock disponible</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#6366F1' }}>Hoy, 15:00 hrs</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* PAYMENT METHOD SECTION */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
                  <Banknote size={18} color="#10B981" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Método de Pago</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity 
                  onPress={() => setPaymentMethod('cash')}
                  style={{ 
                    flex: 1, borderWidth: 2, borderColor: paymentMethod === 'cash' ? '#1E1B4B' : '#F3F4F6', borderRadius: 20, padding: 20, 
                    backgroundColor: paymentMethod === 'cash' ? '#F5F3FF' : '#FFFFFF',
                    flexDirection: 'row', alignItems: 'center', gap: 16
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}>
                    <Banknote size={22} color="#1E1B4B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Efectivo / Transfer</Text>
                    <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '500', marginTop: 2 }}>Al momento de entrega</Text>
                  </View>
                  {paymentMethod === 'cash' && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1E1B4B', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setPaymentMethod('card')}
                  style={{ 
                    flex: 1, borderWidth: 2, borderColor: paymentMethod === 'card' ? '#1E1B4B' : '#F3F4F6', borderRadius: 20, padding: 20, 
                    backgroundColor: paymentMethod === 'card' ? '#F5F3FF' : '#FFFFFF',
                    flexDirection: 'row', alignItems: 'center', gap: 16
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}>
                    <CreditCard size={22} color="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Tarjeta Bancaria</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>Crédito / Débito Segura</Text>
                  </View>
                  {paymentMethod === 'card' && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1E1B4B', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Saved Cards and Form (Desktop) */}
              {paymentMethod === 'card' && (
                <View style={{ marginTop: 24, padding: 32, backgroundColor: '#F9FAFB', borderRadius: 24 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#6B7280' }}>Tus Tarjetas Guardadas</Text>
                    <TouchableOpacity onPress={() => setCardDetails({ number: '', name: '', expiry: '', cvv: '' })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <RefreshCcw size={12} color="#EF4444" />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#EF4444' }}>Limpiar Datos de Pago</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                    <TouchableOpacity 
                      onPress={() => setShowNewCardForm(true)}
                      style={{ 
                        width: 120, height: 120, borderRadius: 20, backgroundColor: '#FFFFFF', 
                        justifyContent: 'center', alignItems: 'center', gap: 8, borderStyle: 'solid', borderWidth: 2, borderColor: showNewCardForm ? '#10B981' : '#E5E7EB'
                      }}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' }}>
                        <Plus size={20} color="#10B981" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>Nueva Tarjeta</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 16 }}>
                      <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                        <CreditCard size={20} color="#10B981" />
                        <TextInput 
                          placeholder="Número de tarjeta"
                          placeholderTextColor="#9CA3AF"
                          value={cardDetails.number || ''}
                          onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                          style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' }}
                        />
                      </View>

                      <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                        <TextInput 
                          placeholder="Nombre en la tarjeta"
                          placeholderTextColor="#9CA3AF"
                          value={cardDetails.name || ''}
                          onChangeText={(text) => setCardDetails(prev => ({ ...prev, name: text }))}
                          style={{ fontSize: 15, fontWeight: '600' }}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="MM/YY"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.expiry || ''}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, expiry: text }))}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="CVV"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.cvv || ''}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                         <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB' }} />
                         <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Guardar mi tarjeta para futuras compras</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={{ 
                          backgroundColor: '#10B981', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8
                        }}
                      >
                        <Lock size={18} color="white" />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Finalizar Compra Segura</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Card Preview (Desktop) */}
                    <View style={{ 
                      width: 320, height: 200, borderRadius: 24, backgroundColor: '#1E1B4B', padding: 32,
                      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Wifi size={24} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', fontStyle: 'italic' }}>Tarjeta</Text>
                      </View>
                      <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginTop: 40, letterSpacing: 3 }}>
                        {cardDetails.number ? cardDetails.number.replace(/(.{4})/g, '$1 ') : '#### #### #### ####'}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <View>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' }}>TITULAR</Text>
                          <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>{cardDetails.name || 'NOMBRE DEL TITULAR'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' }}>VENCE</Text>
                          <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>{cardDetails.expiry || 'MM/YY'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <View style={{ flex: 1, maxWidth: isDesktop ? 420 : '100%' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 24 }}>Resumen de Orden</Text>
              
              <View style={{ gap: 20, marginBottom: 32 }}>
                {cart.map((item) => (
                  <View key={item.firebaseId || `${item.ID_productos}-${item.medida}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ position: 'relative' }}>
                      <Image source={{ uri: item.foto }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                      <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#000', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{item.cantidad}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{item.nombre}</Text>
                      {item.medida && <Text style={{ fontSize: 11, color: '#F47321', fontWeight: '700' }}>{item.medida}</Text>}
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>${(item.precio || 0).toLocaleString()}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }}>${(item.subtotal || 0).toLocaleString()}</Text>
                  </View>
                ))}
              </View>

              {/* Promo Code */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
                <TextInput 
                  placeholder="Código promocional"
                  value={couponCode || ''}
                  onChangeText={setCouponCode}
                  editable={!appliedCoupon}
                  autoCapitalize="characters"
                  placeholderTextColor="#BFBFBF"
                  style={{ flex: 1, height: 50, backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: appliedCoupon ? '#10B981' : '#F3F4F6', color: appliedCoupon ? '#10B981' : '#111827' }}
                />
                {appliedCoupon ? (
                  <TouchableOpacity 
                    onPress={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    style={{ backgroundColor: '#FEE2E2', borderRadius: 14, paddingHorizontal: 20, justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '900' }}>Quitar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={validateCoupon}
                    disabled={isValidatingCoupon || !couponCode}
                    style={{ backgroundColor: '#F47321', borderRadius: 14, paddingHorizontal: 20, justifyContent: 'center', opacity: isValidatingCoupon ? 0.6 : 1 }}
                  >
                    {isValidatingCoupon ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: 'white', fontSize: 14, fontWeight: '900' }}>Aplicar</Text>}
                  </TouchableOpacity>
                )}
              </View>

              {/* Totals */}
              <View style={{ gap: 12, marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>Subtotal</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>${cartTotal.toLocaleString()} CLP</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>Envío</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#10B981' }}>Gratis</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>Descuento</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: discount > 0 ? '#EF4444' : '#111827' }}>
                    {discount > 0 ? `- $${discount.toLocaleString()}` : '$0'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 32 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Total</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '800' }}>CLP</Text>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#F47321' }}>${total.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handlePayment}
                disabled={isLoading || cart.length === 0}
                style={{ 
                  backgroundColor: isLoading ? '#9CA3AF' : '#10B981', borderRadius: 20, height: 64, justifyContent: 'center', alignItems: 'center',
                  shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>
                    PAGAR ${total.toLocaleString()} EN {paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>


      {/* COUPON ERROR/WARNING MODAL */}
      <Modal
        visible={couponModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCouponModal({ ...couponModal, visible: false })}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          onPress={() => setCouponModal({ ...couponModal, visible: false })}
        >
          <View 
            style={{ 
              backgroundColor: '#fff', borderRadius: 32, width: '100%', maxWidth: 400, padding: 32, alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ 
              width: 72, height: 72, borderRadius: 36, 
              backgroundColor: couponModal.type === 'error' ? '#FEF2F2' : '#FFF7ED', 
              justifyContent: 'center', alignItems: 'center', marginBottom: 20
            }}>
              {couponModal.type === 'error' ? (
                <CalendarX size={32} color="#EF4444" />
              ) : (
                <AlertCircle size={32} color="#F47321" />
              )}
            </View>

            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>{couponModal.title}</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>{couponModal.message}</Text>

            <TouchableOpacity 
              onPress={() => setCouponModal({ ...couponModal, visible: false })}
              style={{ 
                width: '100%', backgroundColor: '#111827', borderRadius: 16, height: 54, 
                justifyContent: 'center', alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* MAP MODAL */}
      <LocationMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSave={async (location) => {
          setSelectedLocation(location);
          setIsMapModalOpen(false);

          // Save to Direcciones and User Profile
          if (auth.currentUser) {
            try {
              const addressData = {
                ...location,
                userId: auth.currentUser.uid,
                creadoEn: serverTimestamp()
              };
              
              // 1. Save to Direcciones collection
              await addDoc(collection(db, 'Direcciones'), addressData);
              
              // 2. Set as default in User Profile
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                direccionDefault: location
              });
              
              console.log("Address saved and set as default successfully");
            } catch (error) {
              console.error("Error saving address:", error);
            }
          }
          // Refetch addresses to show the new one
          fetchAddresses();
        }}
      />
    </View>
  );
}
