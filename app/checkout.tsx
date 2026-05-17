import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, useWindowDimensions, ActivityIndicator, Modal, Pressable, Alert, Linking, Platform } from 'react-native';
import * as Audio from 'expo-audio';
import { mpService } from '../lib/mercadopago';

import { ArrowLeft, Lock, MapPin, Plus, CreditCard, Banknote, ShieldCheck, ChevronRight, CheckCircle2, Store, Clock, RefreshCcw, Wifi, AlertCircle, Ticket, CalendarX, X, User } from 'lucide-react-native';

import { router, useLocalSearchParams } from 'expo-router';

import LocationMapModal from '../components/LocationMapModal';
import { useCart } from '../context/CartContext';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, updateDoc, getDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export default function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const { cart, cartTotal, clearCart } = useCart();
  const params = useLocalSearchParams();
  const isDesktop = width >= 768;
  
  // 1. ALL STATES AT THE TOP
  const [deliveryType, setDeliveryType] = useState('home'); 
  const [paymentMethod, setPaymentMethod] = useState(params.method === 'card' ? 'card' : 'cash');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    rut: ''
  });
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storeHours, setStoreHours] = useState('09:00 - 18:00');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponModal, setCouponModal] = useState({ visible: false, title: '', message: '', type: 'error' as 'error' | 'warning' | 'success' });
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderData, setLastOrderData] = useState<any>(null);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [savedCardCVV, setSavedCardCVV] = useState('');
  const [isDeletingCard, setIsDeletingCard] = useState<string | null>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '' });
  const [mounted, setMounted] = useState(false);
  
  // Shipping Settings States
  const [shippingConfig, setShippingConfig] = useState<any>(null);
  const [clinicOrigin, setClinicOrigin] = useState<any>(null);
  const [calculatedShipping, setCalculatedShipping] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const [purchaseSound, setPurchaseSound] = useState<any>(null);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await (Audio as any).Sound.createAsync(
          require('../assets/audio/saku_compra.mp3')
        );
        setPurchaseSound(sound);
      } catch (e) {
        console.log('Error loading purchase sound:', e);
      }
    };
    loadSound();
    return () => {
      if (purchaseSound) {
        purchaseSound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playSuccessSound = async () => {
    try {
      if (purchaseSound) {
        await purchaseSound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing success sound:', error);
    }
  };



  // 2. HELPER FUNCTIONS
  const showError = (title: string, message: string) => {
    setIsLoading(false);
    setIsProcessingPayment(false);
    
    // On native platforms, use Alert for better visibility
    if (Platform.OS !== 'web') {
      Alert.alert(title, message);
    }
    
    // Always set state for consistency (and for Web view)
    setErrorModal({ visible: true, title, message });
  };

  const calculateDistance = async (lat1: number, lon1: number, lat2: number, lon2: number) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg`;
      
      // Use direct URL on native platforms to be super fast. 
      // Only use proxy on Web to bypass CORS.
      let res;
      if (Platform.OS === 'web') {
        // Try allorigins with a different path or fallback to another proxy
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];
        
        let success = false;
        for (const proxy of proxies) {
          try {
            res = await fetch(proxy);
            if (res.ok) {
              success = true;
              break;
            }
          } catch (e) {
            console.log(`Proxy ${proxy} failed, trying next...`);
          }
        }
        
        if (!success) throw new Error("All proxies failed");
      } else {
        res = await fetch(url);
      }
      
      const data = await res.json();
      
      if (data.rows?.[0]?.elements?.[0]?.distance) {
        return data.rows[0].elements[0].distance.value / 1000;
      }
      
      throw new Error("No distance data in response");
    } catch (e) {
      console.log("Distance API Error:", e);
      // Fallback with road correction factor (1.45x) if API fails
      const R = 6371; 
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return (R * c) * 1.45;
    }
  };




  const fetchSavedCards = async () => {
    if (!auth.currentUser?.uid) return;
    setIsLoadingCards(true);
    try {
      const cardsSnap = await getDocs(
        collection(db, 'users', auth.currentUser.uid, 'savedCards')
      );
      const cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSavedCards(cards);
      // Auto-select first card if available and nothing selected
      if (cards.length > 0 && !selectedCardId && !showNewCardForm) {
        setSelectedCardId(cards[0].id);
      }
    } catch (e) {
      console.log('Error fetching saved cards:', e);
    } finally {
      setIsLoadingCards(false);
    }
  };

  const fetchAddresses = async () => {
    if (!auth.currentUser?.uid) return;
    setIsLoadingAddresses(true);
    try {
      const q = query(collection(db, 'Direcciones'), where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const addresses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserAddresses(addresses);

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().direccionDefault) {
        setSelectedLocation(userDoc.data().direccionDefault);
      } else if (addresses.length > 0) {
        setSelectedLocation(addresses[0]);
      }
    } catch (error) {
      console.log("Error loading addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // 3. EFFECTS
  useEffect(() => {
    fetchAddresses();
    if (auth.currentUser) {
      fetchSavedCards();
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(userDoc => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.rut) setCardDetails(prev => ({ ...prev, rut: data.rut }));
          
          // Load name and phone
          const fName = data.display_name || auth.currentUser?.displayName || '';
          const lName = data.apellido || '';
          setClientInfo({
            name: [fName, lName].filter(Boolean).join(' '),
            phone: data.telefono || data.phone || ''
          });
        }
      }).catch(e => console.log('Error loading user data:', e));
    }
    
    // Fetch Store Hours for Today
    const fetchHours = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'Configuracion', 'tienda_horarios'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const now = new Date();
          const daysMap = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
          const currentDayId = daysMap[now.getDay()];
          const todayConfig = data.weekly?.[currentDayId];
          if (todayConfig && todayConfig.isOpen) {
            setStoreHours(`${todayConfig.start} - ${todayConfig.end}`);
          } else {
            setStoreHours('Cerrado hoy');
          }
        }
      } catch (error) {
        console.log("Error fetching hours:", error);
      }
    };
    fetchHours();

    // Fetch Shipping Settings in Real-Time
    const unsubShipping = onSnapshot(doc(db, 'Settings', 'shipping'), (snapshot) => {
      if (snapshot.exists()) setShippingConfig(snapshot.data());
    });

    const unsubOrigin = onSnapshot(doc(db, 'ClinicOrigin', 'origin'), (snapshot) => {
      if (snapshot.exists()) setClinicOrigin(snapshot.data());
    });

    setMounted(true);

    return () => {
      unsubShipping();
      unsubOrigin();
    };
  }, []);


  // Booking mode logic: If we are booking a service, ignore the global cart
  const isBookingMode = params.isBooking === 'true';
  const bookingItem = isBookingMode ? {
    ID_productos: params.serviceId as string,
    nombre: params.serviceName as string,
    precio: Number(params.servicePrice || 0),
    foto: params.serviceImage as string,
    cantidad: 1,
    subtotal: Number(params.servicePrice || 0)
  } : null;

  const displayItems = isBookingMode ? [bookingItem] : cart;
  const displaySubtotal = isBookingMode ? Number(params.servicePrice || 0) : cartTotal;


  // Recalculate Shipping whenever dependencies change
  useEffect(() => {
    const updateShipping = async () => {
      if (deliveryType === 'store') {
        setCalculatedShipping(0);
        setIsCalculatingShipping(false);
        return;
      }

      // Try to get origin from either clinicOrigin or shippingConfig
      const origin = clinicOrigin || (shippingConfig?.originLat ? { lat: shippingConfig.originLat, lng: shippingConfig.originLng } : null);

      if (!shippingConfig || !origin || !selectedLocation) {
        setCalculatedShipping(0);
        setIsCalculatingShipping(false);
        return;
      }

      setIsCalculatingShipping(true);

      // Check for free shipping threshold
      if (shippingConfig.freeShippingThreshold > 0 && displaySubtotal >= shippingConfig.freeShippingThreshold) {
        setCalculatedShipping(0);
        setIsCalculatingShipping(false);
        return;
      }

      // PRECISE CALCULATION (Google API)
      const dist = await calculateDistance(
        origin.lat, 
        origin.lng, 
        selectedLocation.lat, 
        selectedLocation.lng
      );

      // ALWAYS calculate cost based on distance, no matter how far.
      const finalCost = (shippingConfig.baseCost || 0) + (dist * (shippingConfig.costPerKm || 0));
      setCalculatedShipping(Math.round(finalCost));
      
      setIsCalculatingShipping(false);
    };

    updateShipping();
  }, [deliveryType, shippingConfig, clinicOrigin, selectedLocation, displaySubtotal]);




  useEffect(() => {
    if (!isLoadingCards && savedCards.length === 0) {
      setShowNewCardForm(true);
      setSelectedCardId(null);
    }
  }, [savedCards, isLoadingCards]);

  const handleRutChange = (text: string) => {
    // Basic RUT formatting (XX.XXX.XXX-X)
    let value = text.replace(/[^0-9kK]/g, '');
    if (value.length > 9) value = value.substring(0, 9);
    
    let formatted = value;
    if (value.length > 1) {
      const body = value.slice(0, -1);
      const dv = value.slice(-1).toUpperCase();
      formatted = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '-' + dv;
    }
    
    setCardDetails(prev => ({ ...prev, rut: formatted }));
  };

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);


  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    setCardDetails(prev => ({ ...prev, expiry: formatted.substring(0, 5) }));
  };

  const shipping = calculatedShipping;
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (displaySubtotal * (appliedCoupon.value / 100)) 
        : appliedCoupon.value)
    : 0;
  const displayTotal = displaySubtotal + (shipping > 0 ? shipping : 0) - discount;
  const total = displayTotal;


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
          if (Platform.OS !== 'web') Alert.alert('Cupón ya utilizado', 'Ya has aprovechado este descuento en una compra anterior.');
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
        if (Platform.OS !== 'web') Alert.alert('Código no válido', 'El cupón que ingresaste no existe o ya no se encuentra activo.');
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
            if (Platform.OS !== 'web') Alert.alert('Cupón expirado', 'Lamentablemente este descuento ya ha vencido.');
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
          if (Platform.OS !== 'web') Alert.alert('Monto insuficiente', `Este cupón requiere una compra mínima de $${coupon.minAmount.toLocaleString("de-DE")}`);
          setCouponModal({
            visible: true,
            title: 'Monto insuficiente',
            message: `Este cupón requiere una compra mínima de $${coupon.minAmount.toLocaleString("de-DE")}`,
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


  // Removed previous shipping/discount calculation as it's now above

  const handlePayment = async () => {
    if (displayItems.length === 0) {
      showError('Carrito vacío', 'Agrega productos al carrito antes de continuar.');
      setIsLoading(false);
      setIsProcessingPayment(false);
      return;
    }

    if (paymentMethod === 'card') {
      // Si el formulario nuevo está visible O no hay tarjetas guardadas, usamos lógica de nueva tarjeta
      if (showNewCardForm || savedCards.length === 0) {
        // Nueva Tarjeta: Validamos campos del formulario
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.rut) {
          showError('Datos incompletos', 'Por favor completa todos los campos de la tarjeta, incluyendo el RUT.');
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }
      } else if (selectedCardId) {
        // Tarjeta Guardada: Solo validamos el CVV guardado
        if (!savedCardCVV) {
          showError('Seguridad', 'Por favor ingresa el CVV de tu tarjeta guardada.');
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }
      }
    }
    
    setIsLoading(true);
    setIsProcessingPayment(true);
    
    // Generate a unique reference for this transaction
    const externalRef = `SAKU-ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      let cardToken = null;
      let paymentMethodId = 'account_money'; // Default if not card
      let issuerId = null;

      // 1. If paying with card, tokenize it first
      if (paymentMethod === 'card') {
        try {
          if (showNewCardForm) {
            // New Card Path
            const [month, year] = cardDetails.expiry.split('/');
            const tokenData: any = await mpService.createCardToken({
              cardNumber: cardDetails.number,
              cardholderName: cardDetails.name,
              cardExpirationMonth: month,
              cardExpirationYear: year,
              securityCode: cardDetails.cvv,
              identificationType: 'RUT',
              identificationNumber: cardDetails.rut.replace(/[^0-9kK]/g, '')
            });

            cardToken = tokenData.id;
            paymentMethodId = tokenData.payment_method_id;
          } else {
            // Saved Card Path
            const selectedCard = savedCards.find(c => c.id === selectedCardId);
            if (!selectedCard?.cardId) {
              throw new Error('Esta tarjeta no está vinculada correctamente. Por favor usa una "Nueva Tarjeta".');
            }

            const tokenData = await mpService.createCardTokenFromSaved(
              selectedCard.cardId,
              savedCardCVV
            );
            cardToken = tokenData.id;
            paymentMethodId = tokenData.payment_method_id || selectedCard.brand || 'visa';
          }

          // Detect brand if missing (only for new cards)
          if (!paymentMethodId && showNewCardForm) {
            const cleanNumber = cardDetails.number.replace(/\s/g, '');
            const bin = cleanNumber.substring(0, 6);
            try {
              const method = await mpService.getPaymentMethod(bin);
              paymentMethodId = method?.id || null;
            } catch (e) {
              console.log('Error detecting payment method:', e);
            }
          }
          
          console.log("Token generated successfully:", cardToken);

        } catch (tokenError: any) {
          showError('Error de Tarjeta', tokenError.message || 'No se pudo procesar la tarjeta. Revisa los datos.');
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }
      }

      // 2. Process Payment and optionally save card
      if (paymentMethod === 'card' && cardToken) {
        
        // Save card to Mercado Pago Customer AND Firestore if requested
        if (showNewCardForm && saveCard && auth.currentUser?.uid) {
          try {
            const userEmail = auth.currentUser.email || `${auth.currentUser.uid}@saku-user.com`;
            console.log('Registering card with Mercado Pago Customer for:', userEmail);
            const mpSaveResult = await mpService.saveCard(cardToken, userEmail);
            
            if (mpSaveResult.success) {
              const [expMonth, expYear] = cardDetails.expiry.split('/');
              const cardMeta = {
                cardId: mpSaveResult.cardId,
                customerId: mpSaveResult.customerId,
                last4: mpSaveResult.last_four_digits,
                holderName: cardDetails.name,
                expMonth,
                expYear: expYear?.length === 2 ? `20${expYear}` : expYear,
                brand: mpSaveResult.payment_method_id || paymentMethodId,
                createdAt: new Date().toISOString(),
              };

              await addDoc(
                collection(db, 'users', auth.currentUser.uid, 'savedCards'),
                cardMeta
              );
              console.log('Card registered and saved to Firestore');
              fetchSavedCards();
            }
          } catch (saveError) {
            console.log('Error registering card (continuing payment):', saveError);
          }
        }

        // Save RUT to user profile for future checkouts
        if (auth.currentUser?.uid && cardDetails.rut) {
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              rut: cardDetails.rut
            });
          } catch (e) {
            console.log('Error saving RUT to profile:', e);
          }
        }

        let payerId: string | undefined = undefined;
        if (!showNewCardForm && selectedCardId) {
          const selectedCard = savedCards.find(c => c.id === selectedCardId);
          console.log('Selected card for payment:', JSON.stringify(selectedCard, null, 2));
          if (selectedCard) {
            payerId = selectedCard.customerId;
          }
        }

        const paymentBody = {
          transaction_amount: displayTotal,
          token: cardToken,
          description: `Compra en Saku: ${displayItems.map(i => i.nombre).join(', ')}`,
          payment_method_id: paymentMethodId,
          issuer_id: issuerId,
          external_reference: externalRef,
          items: displayItems.map((item: any) => ({
            id: item.ID_productos || '',
            title: item.nombre || 'Producto Saku',
            quantity: item.cantidad || 1,
            unit_price: item.precio || 0,
            picture_url: item.foto || item.image || ''
          })),
          payer: {
            email: auth.currentUser?.email || 'anon@saku.com',
            identification: {
              type: 'RUT',
              number: cardDetails.rut.replace(/[^0-9kK]/g, '')
            },
            ...(payerId && { id: payerId })
          }
        };
        console.log('Sending payment to backend:', JSON.stringify(paymentBody, null, 2));
        
        const paymentResult = await mpService.processPayment(paymentBody);

        if (paymentResult.status !== 'approved') {
          const rejectionMessages: Record<string, string> = {
            cc_rejected_insufficient_amount: '💳 Fondos insuficientes. Verifica el saldo de tu tarjeta.',
            cc_rejected_bad_filled_card_number: '🔢 Número de tarjeta incorrecto. Revísalo e intenta nuevamente.',
            cc_rejected_bad_filled_date: '📅 Fecha de vencimiento incorrecta.',
            cc_rejected_bad_filled_security_code: '🔐 CVV incorrecto. Revisa el código de seguridad.',
            cc_rejected_bad_filled_other: '⚠️ Datos de la tarjeta incorrectos. Verifica e intenta de nuevo.',
            cc_rejected_call_for_authorize: '📞 Tu banco requiere autorización. Llama a tu banco para habilitar el pago.',
            cc_rejected_duplicated_payment: '🔄 Pago duplicado detectado. Ya realizaste este pago.',
            cc_rejected_high_risk: '🛡️ Pago rechazado por seguridad. Intenta con otra tarjeta.',
            cc_rejected_max_attempts: '🚫 Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
            cc_rejected_card_disabled: '🚫 Tarjeta deshabilitada. Contacta a tu banco.',
            cc_amount_rate_limit_exceeded: '⏳ Límite de intentos alcanzado. Espera unos minutos.',
          };
          const friendlyMessage = rejectionMessages[paymentResult.status_detail]
            || `❌ Pago rechazado: ${paymentResult.status_detail}`;
          showError('Pago Rechazado', friendlyMessage);

          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }
        // 3.5 Update User Profile if changed
        if (auth.currentUser?.uid) {
          try {
            const updates: any = {};
            if (clientInfo.name) {
              updates.display_name = clientInfo.name;
              updates.apellido = ''; // Simplified to one field
            }
            if (clientInfo.phone) updates.telefono = clientInfo.phone;
            if (Object.keys(updates).length > 0) {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
            }
          } catch (e) { console.log('Error updating profile:', e); }
        }
      }

      // 4. Create Order in Firestore
      const userSnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      const uData = userSnap.exists() ? userSnap.data() : {};
      const userName = [uData.display_name, uData.apellido].filter(Boolean).join(' ') || auth.currentUser?.displayName || 'Usuario';

      const orderData = {
        nombre: clientInfo.name || userName,
        nombreCliente: clientInfo.name || userName,
        emailCliente: auth.currentUser?.email || '',
        telefono: clientInfo.phone || uData.telefono || '',
        items: displayItems.map((item: any) => ({
          id: item.ID_productos || '',
          nombre: item.nombre || '',
          precio: item.precio || 0,
          cantidad: item.cantidad || 0,
          medida: item.medida || '',
          subtotal: item.subtotal || 0,
          foto: item.foto || item.image || ''
        })),
        total: displayTotal,
        subtotal: displaySubtotal,
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
        } : { main: 'Vet Animal Welfare Chicureo', sub: 'Alba 3 parcela 29, Chamisero, Colina', texto: 'Retiro en Sucursal Chicureo' },
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(), 
        timestamp: serverTimestamp(),
        creadorId: auth.currentUser?.uid || null,
        creador: auth.currentUser ? doc(db, 'users', auth.currentUser.uid) : null,
        isServiceBooking: isBookingMode, 
        codigoRetiro: (() => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code = '';
          for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        })()
      };

      const docRef = await addDoc(collection(db, 'Orden'), orderData);
      
      // Notify Admin (Internal)
      await addDoc(collection(db, 'Notifications'), {
        title: 'Nuevo Pedido #' + docRef.id.slice(-4).toUpperCase(),
        desc: `Compra de $${total.toLocaleString("de-DE")} vía ${paymentMethod}.`,
        time: new Date().toISOString(),
        type: 'order',
        read: false,
        orderId: docRef.id,
        timestamp: serverTimestamp()
      });

      // 5. Clear Cart
      if (!isBookingMode) {
        const batch = writeBatch(db);
        cart.forEach((item) => {
          if (item.firebaseId) {
            batch.delete(doc(db, 'productosseleccionados', item.firebaseId));
          }
        });
        await batch.commit();
        clearCart();
      }

      // Play success audio sound
      await playSuccessSound();
      await new Promise(resolve => setTimeout(resolve, 350));

      router.replace('/?success=1');

    } catch (error: any) {
      console.error("Checkout Error:", error);
      showError('Error', 'Hubo un problema al procesar tu orden: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsProcessingPayment(false);
    }
  };

  if (!mounted) return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#63348C" />
    </View>
  );

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
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#9CA3AF' }}>{displayItems.length} {isBookingMode ? 'servicio' : 'productos'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Delivery Type Tabs */}
          <View style={{ backgroundColor: '#F3F4F6', borderRadius: 24, margin: 20, padding: 6, flexDirection: 'row' }}>
            <TouchableOpacity 
              onPress={() => setDeliveryType('home')}
              style={{ 
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                paddingVertical: 12, borderRadius: 16, backgroundColor: deliveryType === 'home' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000', shadowOpacity: deliveryType === 'home' ? 0.05 : 0, shadowRadius: 10
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                  <MapPin size={12} color="#6B7280" />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: deliveryType === 'home' ? '#111827' : '#9CA3AF', letterSpacing: 0.5 }}>ENTREGA A DOMICILIO</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDeliveryType('store')}
              style={{ 
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                paddingVertical: 12, borderRadius: 16, backgroundColor: deliveryType === 'store' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000', shadowOpacity: deliveryType === 'store' ? 0.05 : 0, shadowRadius: 10
              }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                  <CheckCircle2 size={12} color="#6B7280" />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: deliveryType === 'store' ? '#111827' : '#9CA3AF', letterSpacing: 0.5 }}>RETIRO EN SUCURSAL</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Section */}
          <View style={{ paddingHorizontal: 20 }}>
            {deliveryType === 'home' ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                    <MapPin size={18} color="#63348C" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Dirección de Entrega</Text>
                </View>

                {userAddresses.map((addr) => {
                  const isSelected = selectedLocation?.id ? selectedLocation.id === addr.id : (selectedLocation?.lat === addr.lat && selectedLocation?.lng === addr.lng);
                  return (
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
                      borderColor: isSelected ? '#63348C' : '#F3F4F6', 
                      borderRadius: 20, padding: 14, backgroundColor: isSelected ? '#FFFBF7' : '#FFFFFF',
                      flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
                      minHeight: 80
                    }}

                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' }}>
                      <MapPin size={20} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }} numberOfLines={1}>{addr.category || 'Dirección'}</Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 18 }} numberOfLines={3}>
                        {addr.fullAddress || (addr.sub ? `${addr.main}, ${addr.sub}` : addr.main)}
                        {addr.instructions ? `\nInstrucciones: ${addr.instructions}` : ''}
                      </Text>


                    </View>
                    {isSelected && (
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )})}

                <TouchableOpacity 
                  onPress={() => setIsMapModalOpen(true)}
                  style={{ 
                    height: 60, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 20,
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 30
                  }}
                >
                  <Plus size={18} color="#10B981" strokeWidth={3} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#10B981' }}>Agregar nueva dirección</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Store size={18} color="#63348C" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Sucursal disponible</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://www.google.com/maps?q=Veterinaria+Vet+Animal+Welfare,+Chicureo,+Colina,+Regi%C3%B3n+Metropolitana&ftid=0x9662b92ef85c9f3f:0x3842e439d9264146&entry=gps')}
                  style={{ 
                  borderWidth: 2, borderColor: '#63348C', borderRadius: 20, padding: 20, backgroundColor: '#FFFFFF',
                  shadowColor: '#63348C', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 8 },
                  marginBottom: 30
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#63348C' }}>Vet Animal Welfare Chicureo</Text>
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Alba 3 parcela 29, Chamisero, Colina</Text>
                      
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} color="#9CA3AF" />
                          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>{storeHours}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} color="#9CA3AF" />
                          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Sucursal Chicureo</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 10 }}>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: '#63348C', fontSize: 10, fontWeight: '800' }}>• Stock disponible</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* User Details Section */}
          <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                <User size={18} color="#0284C7" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Mis Datos</Text>
            </View>

            <View style={{ gap: 12, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 6, marginLeft: 4 }}>Nombre Completo</Text>
                <TextInput 
                  value={clientInfo.name}
                  onChangeText={(t) => setClientInfo(prev => ({ ...prev, name: t }))}
                  placeholder="Ej: Juan Pérez"
                  style={{ 
                    height: 50, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
                    paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#111827'
                  }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 6, marginLeft: 4 }}>Teléfono de Contacto</Text>
                <TextInput 
                  value={clientInfo.phone}
                  onChangeText={(t) => setClientInfo(prev => ({ ...prev, phone: t }))}
                  placeholder="Ej: +56 9 1234 5678"
                  keyboardType="phone-pad"
                  style={{ 
                    height: 50, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
                    paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#111827'
                  }}
                />
              </View>
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
                <Banknote size={18} color="#63348C" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Método de Pago</Text>
            </View>

            <TouchableOpacity 
              onPress={() => setPaymentMethod('cash')}
              style={{ 
                borderWidth: 2, borderColor: paymentMethod === 'cash' ? '#10B981' : '#F3F4F6', borderRadius: 24, padding: 16, 
                backgroundColor: '#FFFFFF',
                flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12,
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}>
                <Banknote size={22} color="#63348C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Efectivo / Transfer</Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>Al momento de entrega</Text>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: paymentMethod === 'cash' ? '#10B981' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>✓</Text>
              </View>
            </TouchableOpacity>

            <View 
              style={{ 
                borderWidth: 2, borderColor: paymentMethod === 'card' ? '#10B981' : '#F3F4F6', borderRadius: 24, padding: 16, 
                backgroundColor: '#FFFFFF',
                marginBottom: 30,
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
              }}
            >
              <TouchableOpacity 
                onPress={() => setPaymentMethod('card')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                  <CreditCard size={22} color="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Tarjeta Bancaria</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>Crédito / Débito Segura</Text>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: paymentMethod === 'card' ? '#10B981' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>✓</Text>
                </View>
              </TouchableOpacity>

              {paymentMethod === 'card' && (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {isLoadingCards ? (
                        <ActivityIndicator size="small" color="#63348C" style={{ marginLeft: 20 }} />
                      ) : (
                        savedCards.map((card) => (
                          <TouchableOpacity 
                            key={card.id}
                            onPress={() => {
                              setSelectedCardId(card.id);
                              setShowNewCardForm(false);
                              setSavedCardCVV('');
                            }}
                            style={{ 
                              width: 140, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12,
                              borderWidth: 2, borderColor: selectedCardId === card.id && !showNewCardForm ? '#10B981' : '#F3F4F6',
                              position: 'relative'
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Text style={{ color: '#111827', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>{card.brand || 'Tarjeta'}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {selectedCardId === card.id && !showNewCardForm && (
                                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>✓</Text>
                                  </View>
                                )}
                                <TouchableOpacity 
                                  onPress={async () => {
                                    if (auth.currentUser) {
                                      const { deleteDoc, doc } = await import('firebase/firestore');
                                      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'savedCards', card.id));
                                      fetchSavedCards();
                                    }
                                  }}
                                  style={{ padding: 2 }}
                                >
                                  <X size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <View style={{ marginTop: 'auto' }}>
                              <Text style={{ color: '#111827', fontSize: 14, fontWeight: '900' }}>•••• {card.last4}</Text>
                              <Text style={{ color: '#6B7280', fontSize: 10 }}>{card.expMonth}/{card.expYear}</Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}

                      {/* Add New Card Button */}
                      <TouchableOpacity 
                        onPress={() => {
                          setShowNewCardForm(true);
                          setSelectedCardId(null);
                        }}
                        style={{ 
                          width: 140, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12,
                          borderWidth: 2, borderColor: showNewCardForm ? '#10B981' : '#E5E7EB',
                          justifyContent: 'center', alignItems: 'center', gap: 4
                        }}
                      >
                        <Plus size={20} color={showNewCardForm ? '#10B981' : '#9CA3AF'} />
                        <Text style={{ color: showNewCardForm ? '#111827' : '#9CA3AF', fontSize: 12, fontWeight: '700' }}>Nueva Tarjeta</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>

                  {/* Saved Card Security Code Prompt */}
                  {selectedCardId && !showNewCardForm && (
                    <View style={{ marginTop: 24, padding: 20, backgroundColor: '#F9FAFB', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 }}>Seguridad de la tarjeta</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flex: 1, height: 50, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="CVV (Código de seguridad)"
                            placeholderTextColor="#9CA3AF"
                            value={savedCardCVV}
                            onChangeText={setSavedCardCVV}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            style={{ fontSize: 14, fontWeight: '600' }}
                          />
                        </View>
                        <ShieldCheck size={24} color="#63348C" />
                      </View>
                      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>Por tu seguridad, ingresa los 3 o 4 dígitos al reverso de tu tarjeta.</Text>
                    </View>
                  )}

                  {showNewCardForm && (
                    <View style={{ marginTop: 24, gap: 16 }}>
                      {/* Card Preview - Mobile */}
                      <View style={{ 
                        width: '100%', height: 170, borderRadius: 20,
                        backgroundColor: '#63348C', padding: 20,
                        shadowColor: '#63348C', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }
                      }}>
                        {/* Top Row: Chip + Brand */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            {/* Chip */}
                            <View style={{ width: 28, height: 22, borderRadius: 4, backgroundColor: '#C9A84C', justifyContent: 'center', alignItems: 'center' }}>
                              <View style={{ width: 18, height: 14, borderRadius: 2, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)' }} />
                            </View>
                            <Wifi size={14} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
                          </View>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '800', fontStyle: 'italic', letterSpacing: 0.5 }}>SAKU</Text>
                        </View>

                        {/* Card Number */}
                        <Text 
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={{ color: 'white', fontSize: 16, fontWeight: '700', marginTop: 14, letterSpacing: 3, fontFamily: 'monospace' }}
                        >
                          {cardDetails.number 
                            ? cardDetails.number.replace(/\s/g,'').replace(/(.{4})/g, '$1 ').trim()
                            : '•••• •••• •••• ••••'}
                        </Text>

                        {/* Bottom Row: Name + Expiry */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>TITULAR</Text>
                            <Text 
                              numberOfLines={1}
                              style={{ color: 'white', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}
                            >{cardDetails.name || 'NOMBRE DEL TITULAR'}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>VENCE</Text>
                            <Text style={{ color: 'white', fontSize: 11, fontWeight: '700', marginTop: 2 }}>{cardDetails.expiry || 'MM/YY'}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Form Fields */}
                      <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                        <CreditCard size={20} color="#63348C" />
                        <TextInput 
                          placeholder="Número de tarjeta"
                          placeholderTextColor="#9CA3AF"
                          value={cardDetails.number || ''}
                          onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                          keyboardType="numeric"
                          maxLength={19}
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

                      <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                        <TextInput 
                          placeholder="RUT del titular (ej: 12.345.678-9)"
                          placeholderTextColor="#9CA3AF"
                          value={cardDetails.rut || ''}
                          onChangeText={handleRutChange}
                          style={{ fontSize: 15, fontWeight: '600' }}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="MM/YY"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.expiry || ''}
                            onChangeText={handleExpiryChange}
                            keyboardType="numeric"
                            maxLength={5}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="CVV"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.cvv || ''}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                            keyboardType="numeric"
                            maxLength={4}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>
                      </View>

                      <TouchableOpacity 
                        onPress={() => setSaveCard(!saveCard)}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}
                      >
                        <View style={{ 
                          width: 22, height: 22, borderRadius: 6, borderWidth: 2, 
                          borderColor: saveCard ? '#63348C' : '#D1D5DB',
                          backgroundColor: saveCard ? '#63348C' : 'transparent',
                          justifyContent: 'center', alignItems: 'center'
                        }}>
                          {saveCard && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                        </View>
                        <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>Guardar mi tarjeta para futuras compras</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={handlePayment}
                        disabled={isProcessingPayment || isCalculatingShipping || shipping === -1 || (deliveryType === 'home' && !selectedLocation)}
                        style={{ 
                          backgroundColor: '#63348C', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
                          opacity: isProcessingPayment || isCalculatingShipping || shipping === -1 || (deliveryType === 'home' && !selectedLocation) ? 0.6 : 1
                        }}
                      >
                        {isProcessingPayment || isCalculatingShipping ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Lock size={18} color="white" />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Pagar Ahora</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Discount Code */}
          <View style={{ marginHorizontal: 20, marginBottom: 30, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: appliedCoupon ? '#63348C' : '#F3F4F6', flexDirection: 'row', alignItems: 'center' }}>
            <TextInput 
              placeholder="Ingresa tu código de descuento.."
              value={couponCode || ''}
              onChangeText={setCouponCode}
              editable={!appliedCoupon}
              autoCapitalize="characters"
              style={{ flex: 1, paddingHorizontal: 15, fontSize: 14, fontWeight: '600', color: appliedCoupon ? '#63348C' : '#111827' }}
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
              {displayItems.map((item: any) => (
                <View key={item.firebaseId || `${item.ID_productos}-${item.medida}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF9F5', justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={{ uri: (item.foto || item.image || 'https://placehold.co/150x150/F3F4F6/9CA3AF.png?text=Saku').replace(/https:\/\/via\.placeholder\.com\/\d+/g, 'https://placehold.co/150x150/F3F4F6/9CA3AF.png?text=Saku') }} style={{ width: '80%', height: '80%' }} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', textTransform: 'uppercase' }} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '700' }}>x{item.cantidad} · ${(item.precio || 0).toLocaleString("de-DE")}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>${(item.subtotal || 0).toLocaleString("de-DE")}</Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '700' }}>Subtotal</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>${displaySubtotal.toLocaleString("de-DE")}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '700' }}>Envío</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: shipping === 0 ? '#10B981' : (shipping === -1 ? '#EF4444' : '#111827') }}>
                  {isCalculatingShipping ? 'Calculando...' : (shipping === -1 ? 'Fuera de rango' : (shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString("de-DE")}`))}
                </Text>


              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '700' }}>Descuento</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>$0</Text>
              </View>
              
              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 5 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Total</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#000000' }}>${displayTotal.toLocaleString("de-DE")}</Text>
              </View>

               <TouchableOpacity 
                onPress={handlePayment}
                disabled={isLoading || isCalculatingShipping || shipping === -1 || cart.length === 0 || (deliveryType === 'home' && !selectedLocation)}
                style={{ 
                  backgroundColor: (isLoading || isCalculatingShipping || shipping === -1 || cart.length === 0 || (deliveryType === 'home' && !selectedLocation)) ? '#9CA3AF' : '#10B981', borderRadius: 24, height: 60, justifyContent: 'center', alignItems: 'center',
                  marginTop: 25, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                {isLoading || isCalculatingShipping ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>
                    Pagar Ahora • ${displayTotal.toLocaleString("de-DE")}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
        {/* MAP MODAL */}

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
                  <AlertCircle size={32} color="#63348C" />
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

        {/* PAYMENT ERROR MODAL */}
        <Modal
          visible={errorModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
            onPress={() => setErrorModal({ ...errorModal, visible: false })}
          >
            <View 
              style={{ 
                backgroundColor: '#fff', borderRadius: 32, width: '100%', maxWidth: 400, padding: 32, alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10
              }}
              onStartShouldSetResponder={() => true}
            >
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <AlertCircle size={36} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>{errorModal.title}</Text>
              <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>{errorModal.message}</Text>
              <TouchableOpacity 
                onPress={() => setErrorModal({ ...errorModal, visible: false })}
                style={{ width: '100%', backgroundColor: '#EF4444', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

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
          <Lock size={16} color="#64748B" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>Encriptado 256-bit</Text>
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
                    <MapPin size={18} color="#63348C" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Dirección de Entrega</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '2%', rowGap: 12 }}>
                  {userAddresses.map((addr) => {
                    const isSelected = selectedLocation?.id ? selectedLocation.id === addr.id : (selectedLocation?.lat === addr.lat && selectedLocation?.lng === addr.lng);
                    return (
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
                        width: '49%',
                        borderWidth: 2, borderColor: isSelected ? '#63348C' : '#F3F4F6', 
                        borderRadius: 16, padding: 14, backgroundColor: isSelected ? '#FFFBF7' : '#FFFFFF',
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        minHeight: 85
                      }}

                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' }}>
                        <MapPin size={18} color="white" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }} numberOfLines={1}>{addr.category || 'Dirección'}</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                          {addr.fullAddress || (addr.sub ? `${addr.main}, ${addr.sub}` : addr.main)}
                          {addr.instructions ? `\nInstrucciones: ${addr.instructions}` : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )})}

                  <TouchableOpacity 
                    onPress={() => setIsMapModalOpen(true)}
                    style={{ 
                      width: '49%', minHeight: 68, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 16,
                      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF'
                    }}
                  >
                    <Plus size={18} color="#10B981" strokeWidth={3} />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>Agregar nueva</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Store size={18} color="#63348C" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Sucursal disponible</Text>
                </View>

                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://www.google.com/maps?q=Veterinaria+Vet+Animal+Welfare,+Chicureo,+Colina,+Regi%C3%B3n+Metropolitana&ftid=0x9662b92ef85c9f3f:0x3842e439d9264146&entry=gps&shh=CAE&lucs=,94297699,94284496,94231188,94280568,47071704,94218641,94282134,94286869&g_ep=CAISEjI2LjE2LjAuODk4OTU0MjE1MBgAIIgnKkgsOTQyOTc2OTksOTQyODQ0OTYsOTQyMzExODgsOTQyODQ0OTksOTQyODIxMzQsOTQyODY4NjlCAkNM&skid=957960ea-60bb-43ff-a671-737364e55019&g_st=ic')}
                  style={{ 
                  borderWidth: 2, borderColor: '#63348C', borderRadius: 20, padding: 24, backgroundColor: '#FFFFFF',
                  shadowColor: '#63348C', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#63348C' }}>Vet Animal Welfare Chicureo</Text>
                      <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Alba 3 parcela 29, Chamisero, Colina</Text>
                      
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Clock size={16} color="#9CA3AF" />
                          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>{storeHours}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={16} color="#9CA3AF" />
                          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Sucursal Chicureo</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 10 }}>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Text style={{ color: '#63348C', fontSize: 12, fontWeight: '800' }}>• Stock disponible</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* PAYMENT METHOD SECTION */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
                  <Banknote size={18} color="#63348C" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Método de Pago</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity 
                  onPress={() => setPaymentMethod('cash')}
                  style={{ 
                    flex: 1, borderWidth: 2, borderColor: paymentMethod === 'cash' ? '#22C55E' : '#F3F4F6', borderRadius: 20, padding: 20, 
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row', alignItems: 'center', gap: 16,
                    shadowColor: paymentMethod === 'cash' ? '#22C55E' : '#000',
                    shadowOpacity: paymentMethod === 'cash' ? 0.1 : 0.05,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}>
                    <Banknote size={22} color="#63348C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Efectivo / Transfer</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>Al momento de entrega</Text>
                  </View>
                  {paymentMethod === 'cash' && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setPaymentMethod('card')}
                  style={{ 
                    flex: 1, borderWidth: 2, borderColor: paymentMethod === 'card' ? '#22C55E' : '#F3F4F6', borderRadius: 20, padding: 20, 
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row', alignItems: 'center', gap: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2
                  }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}>
                    <CreditCard size={22} color="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Tarjeta Bancaria</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>Crédito / Débito Segura</Text>
                  </View>
                  {paymentMethod === 'card' && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' }}>
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
                    <TouchableOpacity onPress={() => setCardDetails({ number: '', name: '', expiry: '', cvv: '', rut: cardDetails.rut })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <RefreshCcw size={12} color="#EF4444" />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#EF4444' }}>Limpiar Datos de Pago</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <TouchableOpacity 
                        onPress={() => {
                          setShowNewCardForm(true);
                          setSelectedCardId(null);
                        }}
                        style={{ 
                          width: 140, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', 
                          justifyContent: 'center', alignItems: 'center', gap: 8, borderStyle: 'solid', borderWidth: 2, borderColor: showNewCardForm ? '#22C55E' : '#E5E7EB',
                          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
                        }}
                      >
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
                          <Plus size={20} color="#22C55E" />
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#111827' }}>Nueva Tarjeta</Text>
                      </TouchableOpacity>

                      {isLoadingCards ? (
                        <ActivityIndicator size="small" color="#63348C" style={{ marginLeft: 20 }} />
                      ) : (
                        savedCards.map((card) => (
                          <TouchableOpacity 
                            key={card.id}
                            onPress={() => {
                              setSelectedCardId(card.id);
                              setShowNewCardForm(false);
                              setSavedCardCVV('');
                            }}
                            style={{ 
                              width: 140, height: 90, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12,
                              borderWidth: 2, borderColor: selectedCardId === card.id && !showNewCardForm ? '#22C55E' : '#F3F4F6',
                              position: 'relative',
                              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Text style={{ color: '#111827', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>{card.brand || 'Tarjeta'}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {selectedCardId === card.id && !showNewCardForm && (
                                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>✓</Text>
                                  </View>
                                )}
                                <TouchableOpacity 
                                  onPress={async () => {
                                    if (auth.currentUser) {
                                      const { deleteDoc, doc } = await import('firebase/firestore');
                                      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'savedCards', card.id));
                                      fetchSavedCards();
                                    }
                                  }}
                                  style={{ padding: 2 }}
                                >
                                  <X size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <Text style={{ color: '#111827', fontSize: 12, fontWeight: '900', marginTop: 12, letterSpacing: 2 }}>
                              **** {card.last4}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 10, marginTop: 4 }}>
                              Vence: {card.expMonth}/{card.expYear.toString().slice(-2)}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  {/* FORMULARIO DE NUEVA TARJETA (CONDICIONAL) */}
                  {showNewCardForm && (
                    <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, gap: 16 }}>
                        <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                          <CreditCard size={20} color="#63348C" />
                          <TextInput 
                            placeholder="Número de tarjeta"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.number || ''}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                            keyboardType="numeric"
                            maxLength={19}
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

                        <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="RUT del titular (ej: 12.345.678-9)"
                            placeholderTextColor="#9CA3AF"
                            value={cardDetails.rut || ''}
                            onChangeText={handleRutChange}
                            style={{ fontSize: 15, fontWeight: '600' }}
                          />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                            <TextInput 
                              placeholder="MM/YY"
                              placeholderTextColor="#9CA3AF"
                              value={cardDetails.expiry || ''}
                              onChangeText={handleExpiryChange}
                              keyboardType="numeric"
                              maxLength={5}
                              style={{ fontSize: 15, fontWeight: '600' }}
                            />
                          </View>
                          <View style={{ flex: 1, height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' }}>
                            <TextInput 
                              placeholder="CVV"
                              placeholderTextColor="#9CA3AF"
                              value={cardDetails.cvv || ''}
                              onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                              keyboardType="numeric"
                              maxLength={4}
                              style={{ fontSize: 15, fontWeight: '600' }}
                            />
                          </View>
                        </View>

                        <TouchableOpacity 
                          onPress={() => setSaveCard(!saveCard)}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}
                        >
                          <View style={{ 
                            width: 22, height: 22, borderRadius: 6, borderWidth: 2, 
                            borderColor: saveCard ? '#63348C' : '#D1D5DB',
                            backgroundColor: saveCard ? '#63348C' : 'transparent',
                            justifyContent: 'center', alignItems: 'center'
                          }}>
                            {saveCard && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Guardar mi tarjeta para futuras compras</Text>
                        </TouchableOpacity>
                        
                         <TouchableOpacity 
                          onPress={handlePayment}
                          disabled={isProcessingPayment || isCalculatingShipping || shipping === -1 || (deliveryType === 'home' && !selectedLocation)}
                          style={{ 
                            backgroundColor: '#22C55E', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
                            opacity: isProcessingPayment || isCalculatingShipping || (deliveryType === 'home' && !selectedLocation) ? 0.6 : 1
                          }}
                        >
                          {isProcessingPayment || isCalculatingShipping ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <>
                              <Lock size={18} color="white" />
                              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Pagar Ahora</Text>
                            </>
                          )}
                        </TouchableOpacity>

                      </View>

                      {/* Card Preview - Desktop */}
                      <View style={{ 
                        width: 310, height: 190, borderRadius: 20,
                        backgroundColor: '#63348C', padding: 22,
                        shadowColor: '#63348C', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }
                      }}>
                        {/* Top Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <View style={{ width: 30, height: 24, borderRadius: 4, backgroundColor: '#C9A84C', justifyContent: 'center', alignItems: 'center' }}>
                              <View style={{ width: 20, height: 16, borderRadius: 2, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)' }} />
                            </View>
                            <Wifi size={15} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '90deg' }] }} />
                          </View>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 }}>SAKU</Text>
                        </View>

                        {/* Card Number */}
                        <Text 
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={{ color: 'white', fontSize: 17, fontWeight: '700', marginTop: 16, letterSpacing: 3, fontFamily: 'monospace' }}
                        >
                          {cardDetails.number 
                            ? cardDetails.number.replace(/\s/g,'').replace(/(.{4})/g, '$1 ').trim()
                            : '•••• •••• •••• ••••'}
                        </Text>

                        {/* Bottom Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                          <View style={{ flex: 1, marginRight: 16 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>TITULAR</Text>
                            <Text 
                              numberOfLines={1}
                              style={{ color: 'white', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}
                            >{cardDetails.name || 'NOMBRE DEL TITULAR'}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>VENCE</Text>
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700', marginTop: 2 }}>{cardDetails.expiry || 'MM/YY'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* CVV PARA TARJETA GUARDADA (CONDICIONAL) */}
                  {!showNewCardForm && savedCards.length > 0 && selectedCardId && (
                    <View style={{ marginTop: 24, padding: 24, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Código de Seguridad</Text>
                      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                        <View style={{ flex: 1, height: 56, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 16, justifyContent: 'center' }}>
                          <TextInput 
                            placeholder="CVV"
                            placeholderTextColor="#9CA3AF"
                            value={savedCardCVV}
                            onChangeText={setSavedCardCVV}
                            keyboardType="numeric"
                            maxLength={4}
                            style={{ fontSize: 15, fontWeight: '600' }}
                            secureTextEntry
                          />
                        </View>
                        <Text style={{ flex: 2, fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                          Ingresa el código de 3 o 4 dígitos de tu tarjeta seleccionada para confirmar la compra.
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={handlePayment}
                        disabled={isProcessingPayment || isCalculatingShipping || (deliveryType === 'home' && !selectedLocation)}
                        style={{ 
                          backgroundColor: '#22C55E', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24,
                          opacity: isProcessingPayment || isCalculatingShipping || (deliveryType === 'home' && !selectedLocation) ? 0.6 : 1
                        }}
                      >
                        {isProcessingPayment || isCalculatingShipping ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Lock size={18} color="white" />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Confirmar Pago Seguro</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
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
                      <Image source={{ uri: (item.foto || item.image || 'https://placehold.co/150x150/F3F4F6/9CA3AF.png?text=Saku').replace(/https:\/\/via\.placeholder\.com\/\d+/g, 'https://placehold.co/150x150/F3F4F6/9CA3AF.png?text=Saku') }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                      <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#000', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{item.cantidad}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{item.nombre}</Text>
                      {item.medida && <Text style={{ fontSize: 11, color: '#63348C', fontWeight: '700' }}>{item.medida}</Text>}
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>${(item.precio || 0).toLocaleString("de-DE")}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }}>${(item.subtotal || 0).toLocaleString("de-DE")}</Text>
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
                  style={{ flex: 1, height: 50, backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: appliedCoupon ? '#63348C' : '#F3F4F6', color: appliedCoupon ? '#63348C' : '#111827' }}
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
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>${cartTotal.toLocaleString("de-DE")} CLP</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                   <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>Envío</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: shipping === 0 ? '#10B981' : (shipping === -1 ? '#EF4444' : '#111827') }}>
                    {isCalculatingShipping ? 'Calculando...' : (shipping === -1 ? 'Fuera de rango' : (shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString("de-DE")}`)) }
                  </Text>


                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>Descuento</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: discount > 0 ? '#EF4444' : '#111827' }}>
                    {discount > 0 ? `- $${discount.toLocaleString("de-DE")}` : '$0'}
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
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#000000' }}>${total.toLocaleString("de-DE")}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handlePayment}
                disabled={isLoading || isCalculatingShipping || cart.length === 0 || (deliveryType === 'home' && !selectedLocation)}
                style={{ 
                  backgroundColor: (isLoading || isCalculatingShipping || cart.length === 0 || (deliveryType === 'home' && !selectedLocation)) ? '#9CA3AF' : '#10B981', borderRadius: 24, height: 64, justifyContent: 'center', alignItems: 'center',
                  shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                {isLoading || isCalculatingShipping ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 }}>
                    Pagar Ahora • ${total.toLocaleString("de-DE")}
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
                <AlertCircle size={32} color="#63348C" />
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

      {/* PAYMENT ERROR MODAL */}
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          onPress={() => setErrorModal({ ...errorModal, visible: false })}
        >
          <View 
            style={{ 
              backgroundColor: '#fff', borderRadius: 32, width: '100%', maxWidth: 400, padding: 32, alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <AlertCircle size={36} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>{errorModal.title}</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>{errorModal.message}</Text>
            <TouchableOpacity 
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
              style={{ width: '100%', backgroundColor: '#EF4444', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
