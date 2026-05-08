import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, serverTimestamp, doc, query, where, onSnapshot, Timestamp, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, useWindowDimensions, ActivityIndicator, Modal, Pressable, Alert, Linking, StyleSheet, StatusBar } from 'react-native';
import * as Audio from 'expo-audio';
import { ArrowLeft, Lock, Plus, CreditCard, ShieldCheck, Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, Check, X, ChevronDown, ChevronUp, Banknote, Wifi, AlertCircle, RefreshCcw, Star, Shield, Info, ShoppingBag } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../lib/firebase';
import { mpService } from '../lib/mercadopago';
import Header from '../components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../components/Skeleton';
export default function CheckoutServicioScreen() {
  const insets = useSafeAreaInsets();
  const [purchaseSound, setPurchaseSound] = useState<any>(null);
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const isDesktop = width >= 768;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [agendaConfig, setAgendaConfig] = useState<any>({
    diasLibres: [],
    fechasBloqueadas: [],
    agendaActiva: true,
    mensajePublico: ''
  });
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    rut: ''
  });
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderData, setLastOrderData] = useState<any>(null);
  const showError = (title: string, message: string) => {
    setIsLoading(false);
    setIsProcessingPayment(false);
    setErrorModal({ visible: true, title, message });
  };
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    setCardDetails(prev => ({ ...prev, expiry: formatted.substring(0, 5) }));
  };
  const handleRutChange = (text: string) => {
    let value = text.replace(/[^0-9kK]/g, '');
    if (value.length > 9) value = value.slice(0, 9);

    if (value.length > 1) {
      const dv = value.slice(-1);
      const rut = value.slice(0, -1);
      let formatted = '';
      for (let i = rut.length - 1, j = 1; i >= 0; i--, j++) {
        formatted = rut.charAt(i) + formatted;
        if (j % 3 === 0 && i !== 0) formatted = '.' + formatted;
      }
      value = formatted + '-' + dv;
    }
    setCardDetails(prev => ({ ...prev, rut: value.toUpperCase() }));
  };
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [savedCardCVV, setSavedCardCVV] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const fetchSavedCards = async () => {
    if (!auth.currentUser?.uid) return;
    setIsLoadingCards(true);
    try {
      const cardsSnap = await getDocs(
        collection(db, 'users', auth.currentUser.uid, 'savedCards')
      );
      const cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSavedCards(cards);
      if (cards.length > 0 && !selectedCardId && !showNewCardForm) {
        setSelectedCardId(cards[0].id);
      }
    } catch (e) {
      console.log('Error fetching saved cards:', e);
    } finally {
      setIsLoadingCards(false);
    }
  };
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await (Audio as any).Sound.createAsync(
          require('../assets/audio/sonido-de-compra.mp3')
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
  useEffect(() => {
    fetchSavedCards();
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(userDoc => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.rut) setCardDetails(prev => ({ ...prev, rut: data.rut }));

          const fName = data.display_name || auth.currentUser?.displayName || '';
          const lName = data.apellido || '';
          const fullName = [fName, lName].filter(Boolean).join(' ');
          const userPhone = data.telefono || data.phone || data.phone_number || '';
          setClientInfo({ name: fullName, phone: userPhone });
        }
      }).catch(e => console.log('Error loading user data:', e));
    }
  }, []);
  const [service, setService] = useState<any>(null);
  useEffect(() => {
    if (!params.serviceId) return;
    const unsub = onSnapshot(doc(db, 'Servicios', params.serviceId as string), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setService({
          id: docSnap.id,
          nombre: data.nombre,
          precio: Number(data.precio || 0),
          categoria: data.categoria || 'Servicio',
          descripcion: data.descripcion || '',
          animal: data.animal || '',
          foto: data.foto1 || data.foto || data.imagen || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500',
          requiresPetDetails: data.requiresPetDetails || false,
          weightRanges: data.weightRanges || []
        });
      }
    });
    return () => unsub();
  }, [params.serviceId]);
  // ---- MULTI-MASCOTA Y DATOS DE CLIENTE STATE ----
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '' });
  const [petCount, setPetCount] = useState(1);
  const [petsDetails, setPetsDetails] = useState<Array<{name: string, weight: string, date: Date|null, hour: string|null, calendarOpen: boolean, bookings: string[]}>>(
    [{ name: '', weight: '', date: null, hour: null, calendarOpen: false, bookings: [] }]
  );
  // Sync petCount with petsDetails array
  const updatePetCount = (newCount: number) => {
    const count = Math.max(1, Math.min(10, newCount));
    setPetCount(count);
    setPetsDetails(prev => {
      const arr = [...prev];
      while (arr.length < count) arr.push({ name: '', weight: '', date: null, hour: null, calendarOpen: false, bookings: [] });
      return arr.slice(0, count);
    });
  };
  const updatePet = (idx: number, field: string, value: any) => {
    setPetsDetails(prev => prev.map((p, i) => i === idx ? { 
      ...p, 
      [field]: value,
      hour: field === 'date' ? null : (field === 'hour' ? value : p.hour),
      calendarOpen: field === 'calendarOpen' ? value : (field === 'hour' ? false : p.calendarOpen)
    } : p));
  };
  const isFormValid = (): boolean => {
    if (isLoading) return false;
    if (clientInfo.name.trim().length < 3 || clientInfo.phone.trim().length < 8) return false;
    if (!service?.requiresPetDetails) return true;
    return petsDetails.every(p => 
      p.name.trim() !== '' && 
      p.weight && !isNaN(parseFloat(p.weight)) &&
      p.date && p.hour
    );
  };
  // Price calculation by weight range
  const getPriceForWeight = (weightKg: number): number => {
    if (!service?.weightRanges || service.weightRanges.length === 0) return service?.precio || 0;
    const range = service.weightRanges.find((r: any) => weightKg >= r.min && weightKg <= r.max);
    return range ? range.price : service?.precio || 0;
  };
  const areAllWeightsEntered = (): boolean => {
    if (!service?.requiresPetDetails) return true;
    return petsDetails.every(p => p.weight && !isNaN(parseFloat(p.weight)));
  };
  const getPriceRangeText = (): string => {
    if (!service?.weightRanges || service.weightRanges.length === 0) return `$${(service?.precio || 0).toLocaleString("de-DE")}`;
    const prices = service.weightRanges.map((r: any) => r.price);
    const min = Math.min(...prices) * petCount;
    const max = Math.max(...prices) * petCount;
    return `CLP $${min.toLocaleString("de-DE")} - $${max.toLocaleString("de-DE")}`;
  };
  const calcTotalPrice = (): number => {
    if (!service?.requiresPetDetails) return service?.precio || 0;
    if (petCount === 1 && (!service?.weightRanges || service.weightRanges.length === 0)) return service?.precio || 0;
    return petsDetails.reduce((sum, p) => {
      const w = parseFloat(p.weight);
      const price = isNaN(w) ? 0 : getPriceForWeight(w);
      return sum + price;
    }, 0);
  };
  useEffect(() => {
    const q = query(collection(db, 'Configuracion'), where('tipo', '==', 'agenda'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        if (data.customHours) setAvailableHours([...data.customHours].sort());
        setAgendaConfig({
          diasLibres: data.diasLibres || [],
          fechasBloqueadas: data.fechasBloqueadas || [],
          agendaActiva: data.agendaActiva !== undefined ? data.agendaActiva : true,
          mensajePublico: data.mensajePublico || ''
        });
      } else {
        setAvailableHours(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
      }
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    if (!selectedDate) return;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const q = query(collection(db, 'Agendas'), where('fecha', '>=', Timestamp.fromDate(startOfDay)), where('fecha', '<=', Timestamp.fromDate(endOfDay)));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const date = doc.data().fecha.toDate();
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      });
      setBookings(list);
    });
    return () => unsub();
  }, [selectedDate]);
  const handlePayment = async () => {
    if (!auth.currentUser) return showError("Error", "Inicia sesión.");

    // Validate multi-pet or single-pet
    if (service?.requiresPetDetails && petCount > 1) {
      for (let i = 0; i < petCount; i++) {
        const p = petsDetails[i];
        if (!p.date || !p.hour) return showError("Atención", `Selecciona fecha y hora para la mascota ${i + 1}.`);
      }
    } else {
      if (!selectedHour || !selectedDate || !service) return showError("Atención", "Reserva tu fecha y hora primero.");
    }

    if (paymentMethod === 'card') {
      if (showNewCardForm || savedCards.length === 0) {
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.rut) {
          showError('Datos incompletos', 'Por favor completa todos los campos de la tarjeta, incluyendo el RUT.');
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }
      } else if (selectedCardId) {
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

    const externalRef = `SAKU-SERV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    try {
      let cardToken = null;
      let paymentMethodId = 'account_money';
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
          // Detect brand if missing
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
          return;
        }
      }
      // 2. Process Payment and optionally save card
      if (paymentMethod === 'card' && cardToken) {

        // Save card if requested
        if (showNewCardForm && saveCard && auth.currentUser?.uid) {
          try {
            const userEmail = auth.currentUser.email || `${auth.currentUser.uid}@saku-user.com`;
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
              await addDoc(collection(db, 'users', auth.currentUser.uid, 'savedCards'), cardMeta);
              fetchSavedCards();
            }
          } catch (saveError) {
            console.log('Error registering card (continuing payment):', saveError);
          }
        }
        // Save RUT and Profile Info to profile
        if (auth.currentUser?.uid) {
          try {
            const updates: any = {};
            if (cardDetails.rut) updates.rut = cardDetails.rut;
            if (clientInfo.name) {
              updates.display_name = clientInfo.name;
              updates.apellido = ''; // Clear so display_name is solely used if we just have one string
            }
            if (clientInfo.phone) updates.telefono = clientInfo.phone;

            if (Object.keys(updates).length > 0) {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
            }
          } catch (e) { console.log('Error saving User Info:', e); }
        }
        let payerId: string | undefined = undefined;
        if (!showNewCardForm && selectedCardId) {
          const selectedCard = savedCards.find(c => c.id === selectedCardId);
          if (selectedCard) {
            payerId = selectedCard.customerId;
          }
        }
        const totalAmount = calcTotalPrice();
        const paymentBody = {
          transaction_amount: totalAmount,
          token: cardToken,
          description: `Reserva de Servicio: ${service.nombre}`,
          payment_method_id: paymentMethodId,
          issuer_id: issuerId,
          external_reference: externalRef,
          items: [{
            id: service.id || '',
            title: service.nombre || 'Servicio Saku',
            quantity: petCount,
            unit_price: totalAmount,
            picture_url: service.foto || ''
          }],
          payer: {
            email: auth.currentUser?.email || 'anon@saku.com',
            identification: {
              type: 'RUT',
              number: cardDetails.rut.replace(/[^0-9kK]/g, '')
            },
            ...(payerId && { id: payerId })
          }
        };

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
      }
      // 3. Update User Profile if missing
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const updates: any = {};
      if (!userData.display_name && clientInfo.name) {
        updates.display_name = clientInfo.name;
      }
      if (!userData.telefono && !userData.phone_number && clientInfo.phone) {
        updates.telefono = clientInfo.phone;
      }
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
      }

      const userName = clientInfo.name || auth.currentUser.displayName || 'Usuario';

      let userAddress = userData.direccionPrincipal || 'Sin ubicación';
      let userLat: number | null = null;
      let userLng: number | null = null;

      try {
        const addrDocs = await getDocs(query(collection(db, 'Direcciones'), where('userId', '==', auth.currentUser.uid)));
        const principal = addrDocs.docs.find(d => d.data().principal === true) || addrDocs.docs[0];
        if (principal) {
          const d = principal.data();
          userAddress = d.direccion || d.main || userAddress;
          userLat = d.lat || d.latitude || null;
          userLng = d.lng || d.longitude || null;
        }
      } catch (e) { console.log("Addr fetch err", e); }
      const totalAmount = calcTotalPrice();
      // Build per-pet entries
      const petsToSave = service.requiresPetDetails ? petsDetails : [{ date: selectedDate, hour: selectedHour, weight: '', name: '' }];
      for (let i = 0; i < petsToSave.length; i++) {
        const petEntry = petsToSave[i];
        const [h, m] = (petEntry.hour || '00:00').split(':').map(Number);
        const finalBookingDate = new Date(petEntry.date || new Date());
        finalBookingDate.setHours(h, m, 0, 0);
        const petWeight = parseFloat(petEntry.weight);
        const petPrice = isNaN(petWeight) ? service.precio : getPriceForWeight(petWeight);
        await addDoc(collection(db, 'Agendas'), {
          fecha: Timestamp.fromDate(finalBookingDate),
          servicioId: service.id,
          servicioNombre: service.nombre,
          usuarioId: auth.currentUser.uid,
          clienteNombre: clientInfo.name || userName,
          nombre: clientInfo.name || userName,
          nombreCliente: clientInfo.name || userName,
          clienteTelefono: clientInfo.phone,
          mascotaNombre: petEntry.name || `Mascota ${i + 1}`,
          clienteUbicacion: userAddress,
          clienteLat: userLat,
          clienteLng: userLng,
          estado: 'Pendientes',
          color: '#63348C',
          usuario: userName,
          servicio: service.nombre,
          categoria: service.categoria,
          descripcion: service.descripcion,
          animal: service.animal,
          address: userAddress,
          external_reference: externalRef,
          numerMascota: i + 1,
          totalMascotas: petsToSave.length,
          pesoMascota: isNaN(petWeight) ? null : petWeight,
          precioMascota: petPrice
        });
      }

      // Notify Admin (Internal)
      await addDoc(collection(db, 'Notifications'), {
        title: 'Nueva Reserva #' + externalRef.slice(-4).toUpperCase(),
        desc: `${userName} reservó ${service.nombre} para ${petsToSave.length} mascota(s) por $${totalAmount.toLocaleString("de-DE")}.`,
        time: new Date().toISOString(),
        type: 'system',
        read: false,
        timestamp: serverTimestamp()
      });

      // Notify Admins via Push Notification
      try {
        const adminsSnap = await getDocs(query(collection(db, 'users'), where('IsAdmin', '==', true)));
        if (!adminsSnap.empty) {
          const adminRefsArr = adminsSnap.docs.map(d => `users/${d.id}`);
          const adminRefsString = adminRefsArr.join(',');

          await addDoc(collection(db, 'ff_user_push_notifications'), {
            initial_page_name: 'agenda',
            notification_text: `${userName} reservó ${service.nombre} para ${petsToSave.length} mascota(s) por $${totalAmount.toLocaleString("de-DE")}.`,
            notification_title: '📅 ¡Nueva Reserva de Servicio!',
            num_sent: adminsSnap.size,
            parameter_data: JSON.stringify({ externalRef }),
            sender: doc(db, 'users', auth.currentUser?.uid || 'system'),
            status: 'pending',
            app_target: 'admin',
            timestamp: serverTimestamp(),
            user_refs: adminRefsString
          });
        }
      } catch (pushErr) {
        console.error('Error sending admin service push:', pushErr);
      }

      // Email Notification (Firebase Trigger Email Extension)
      try {
        const petDetailsSummary = petsToSave.map((p, i) => 
          `<li><strong>Mascota ${i + 1}:</strong> ${p.name || 'Sin nombre'} (${p.weight}kg) - ${new Date(p.date || new Date()).toLocaleDateString()} a las ${p.hour}</li>`
        ).join('');

        const emailHtml = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #63348C; text-align: center;">¡Reserva Confirmada!</h1>
            <p style="font-size: 16px; color: #1e293b;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
              Tu reserva para el servicio <strong>${service.nombre}</strong> ha sido procesada con éxito. 
              A continuación, los detalles de tu cita:
            </p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>ID de Orden:</strong> #${externalRef}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #1e293b;"><strong>Total Pagado:</strong> $${totalAmount.toLocaleString("de-DE")}</p>
            </div>
            <h3 style="color: #1e293b; font-size: 16px;">Detalles de Mascotas:</h3>
            <ul style="color: #64748b; font-size: 14px; padding-left: 20px;">
              ${petDetailsSummary}
            </ul>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
              Este es un correo automático de Saku. Por favor, no respondas a este mensaje.
            </p>
          </div>
        `;

        await addDoc(collection(db, 'mail'), {
          to: [auth.currentUser.email, 'sakudeveloperchile@gmail.com'],
          message: {
            subject: `Confirmación de Reserva Saku - #${externalRef.slice(-6)}`,
            html: emailHtml,
          },
          timestamp: serverTimestamp()
        });
        console.log('Confirmation emails queued');
      } catch (emailErr) {
        console.error('Error queuing emails:', emailErr);
      }

      async function playSuccessSound() {
        try {
          if (purchaseSound) purchaseSound.replayAsync().catch(() => {});
        } catch (error) {
          console.log('Error playing success sound:', error);
        }
      }

      setLastOrderData({ orderId: externalRef, total: totalAmount });
      setShowSuccessModal(true);
      playSuccessSound();
    } catch (e: any) {
      showError("Error", e.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
      setIsProcessingPayment(false);
    }
  };
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewDate]);
  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDesktop ? "dark-content" : "light-content"} />

      {isDesktop && <Header />}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={isDesktop ? styles.desktopScrollContent : styles.mobileScrollContent}
      >
        {isDesktop ? (
          <View style={styles.webRoot}>
            <View style={styles.webBgShape1} />
            <View style={styles.webBgShape2} />
            <View style={styles.webWrapper}>
              <View style={styles.webTopNav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.webBackLink}>
                  <ArrowLeft size={18} color="#64748B" />
                  <Text style={styles.webBackLinkLabel}>Volver</Text>
                </TouchableOpacity>
                <View style={styles.breadcrumbRow}>
                  <Text style={styles.breadcrumbItem}>Servicios</Text>
                  <ChevronRight size={14} color="#CBD5E1" style={{ marginHorizontal: 8 }} />
                  <Text style={styles.breadcrumbCurrent}>Confirmar Reserva</Text>
                </View>
                <View style={{ flex: 1 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={styles.webSecureBadge}>
                    <Lock size={14} color="#166534" />
                    <Text style={styles.webSecureTxt}>PAGO 100% SEGURO</Text>
                  </View>
                </View>
              </View>
              <View style={styles.webMainGrid}>
                {/* COLUMNA IZQUIERDA: CONTENIDO Y PASOS */}
                <View style={styles.webLeftCol}>
                  <Text style={styles.webPageTitle}>Completar Reserva</Text>

                  {/* PASO 1: DATOS DEL CLIENTE */}
                  <View style={styles.webSectionCard}>
                    <View style={styles.webSectionHeader}>
                      <View style={styles.webStepIcon}><Info size={20} color="#63348C" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.webSectionTitle}>1. Mis Datos</Text>
                        <Text style={styles.webSectionSubtitle}>Información de contacto para la reserva.</Text>
                      </View>
                    </View>
                    <View style={styles.webDivider} />

                    <View style={styles.webFormRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.webInputLabel}>Nombre Completo</Text>
                        <TextInput
                          value={clientInfo.name}
                          onChangeText={(t) => setClientInfo(prev => ({ ...prev, name: t }))}
                          placeholder="Ej: Juan Pérez"
                          style={styles.webInput}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.webInputLabel}>Teléfono Móvil</Text>
                        <TextInput
                          value={clientInfo.phone}
                          onChangeText={(t) => setClientInfo(prev => ({ ...prev, phone: t }))}
                          placeholder="Ej: +56 9 1234 5678"
                          keyboardType="phone-pad"
                          style={styles.webInput}
                        />
                      </View>
                    </View>
                  </View>
                  {/* PASO 2: MASCOTAS Y AGENDA */}
                  <View style={styles.webSectionCard}>
                    {service?.requiresPetDetails ? (
                      <>
                        <View style={styles.webSectionHeader}>
                          <View style={styles.webStepIcon}><CalendarIcon size={20} color="#63348C" /></View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.webSectionTitle}>2. Mascotas y Agenda</Text>
                            <Text style={styles.webSectionSubtitle}>Ingresa la información y programa la cita de cada mascota.</Text>
                          </View>
                        </View>
                        <View style={styles.webDivider} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                          <Text style={styles.webSublabel}>Cantidad de Mascotas</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <TouchableOpacity onPress={() => updatePetCount(petCount - 1)} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B' }}>-</Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E293B' }}>{petCount}</Text>
                            <TouchableOpacity onPress={() => updatePetCount(petCount + 1)} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B' }}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {petsDetails.map((pet, idx) => (
                          <View key={idx} style={{ marginBottom: 24, padding: 24, backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20 }}>Mascota {idx + 1}</Text>

                            <View style={styles.webFormRow}>
                              <View style={{ flex: 1, marginBottom: 20 }}>
                                <Text style={styles.webInputLabel}>Nombre de la Mascota</Text>
                                <TextInput
                                  value={pet.name}
                                  onChangeText={(t) => updatePet(idx, 'name', t)}
                                  placeholder="Ej: Max"
                                  style={styles.webInputCompact}
                                />
                              </View>

                              {service?.weightRanges?.length > 0 && (
                                <View style={{ flex: 1, marginBottom: 20 }}>
                                  <Text style={styles.webInputLabel}>Peso (kg)</Text>
                                  <TextInput
                                    value={pet.weight}
                                    onChangeText={(t) => updatePet(idx, 'weight', t)}
                                    placeholder="Ej: 15"
                                    keyboardType="numeric"
                                    style={styles.webInputCompact}
                                  />
                                  {pet.weight ? (
                                    <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '800', marginTop: 8 }}>
                                      Precio asignado: ${getPriceForWeight(parseFloat(pet.weight)).toLocaleString("de-DE")}
                                    </Text>
                                  ) : null}
                                </View>
                              )}
                            </View>
                            <View>
                              <Text style={styles.webInputLabel}>Fecha y Hora</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  updatePet(idx, 'calendarOpen', !pet.calendarOpen);
                                  if (pet.date) setSelectedDate(pet.date);
                                }}
                                style={[styles.webDateTrigger, pet.calendarOpen && styles.webDateTriggerActive]}
                              >
                                <CalendarIcon size={20} color={pet.date ? "#63348C" : "#94A3B8"} />
                                <Text style={[styles.webDateTriggerText, pet.date && { color: '#1E293B' }]}>
                                  {pet.date ? `${pet.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}${pet.hour ? ` - ${pet.hour} hrs` : ''}` : 'Seleccionar fecha y hora'}
                                </Text>
                                <ChevronDown size={20} color="#94A3B8" />
                              </TouchableOpacity>
                              {pet.calendarOpen && (
                                <View style={styles.webInlineCalendar}>
                                  <View style={styles.calNavRow}>
                                    <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}>
                                      <ChevronLeft size={22} color="#1E293B" strokeWidth={3} />
                                    </TouchableOpacity>
                                    <Text style={styles.calMonthLabel}>
                                      {viewDate.toLocaleString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + viewDate.toLocaleString('es-ES', { month: 'long' }).slice(1)} {viewDate.getFullYear()}
                                    </Text>
                                    <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}>
                                      <ChevronRight size={22} color="#1E293B" strokeWidth={3} />
                                    </TouchableOpacity>
                                  </View>
                                  <View style={styles.calGridContainer}>
                                    <View style={styles.daysRow}>
                                      {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => <Text key={d} style={styles.dayHead}>{d}</Text>)}
                                    </View>
                                    <View style={styles.datesGrid}>
                                      {calendarDays.map((day, idxd) => {
                                        if (!day) return <View key={idxd} style={styles.dateCell} />;
                                        const isS = pet.date?.toDateString() === day.toDateString();
                                        const isPast = day < new Date(new Date().setHours(0,0,0,0));
                                        const dayOfWeek = day.getDay();
                                        const isLibre = agendaConfig.diasLibres.includes(dayOfWeek);
                                        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                        const isBloqueada = agendaConfig.fechasBloqueadas.includes(dateStr);
                                        const isDisabled = isPast || isLibre || isBloqueada || !agendaConfig.agendaActiva;
                                        return (
                                          <TouchableOpacity key={idxd} disabled={isDisabled}
                                            onPress={() => {
                                              updatePet(idx, 'date', day);
                                              setSelectedDate(day);
                                            }}
                                            style={[styles.dateCell, isS && styles.dateCellA, isDisabled && { opacity: 0.3 }]}>
                                            <Text style={[styles.dateCellT, isS && { color: '#fff', fontWeight: '900' }, isDisabled && { color: '#94A3B8', textDecorationLine: 'line-through' }]}>
                                              {day.getDate()}
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  </View>
                                  {pet.date && (
                                    <View style={{ marginTop: 32 }}>
                                      <Text style={styles.webSublabel}>Horarios Disponibles</Text>
                                      <View style={styles.webHoursGrid}>
                                        {availableHours.map(hour => {
                                          const isB = bookings.includes(hour);
                                          const isS = pet.hour === hour;
                                          return (
                                            <TouchableOpacity key={hour} disabled={isB} onPress={() => updatePet(idx, 'hour', hour)}
                                              style={[styles.webHourChip, isS && styles.webHourChipA, isB && styles.webHourChipB]}>
                                              <Text style={[styles.webHourChipText, isS && { color: '#fff' }, isB && { color: '#CBD5E1' }]}>{hour}</Text>
                                            </TouchableOpacity>
                                          );
                                        })}
                                      </View>
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </>
                    ) : (
                      <>
                        <View style={styles.webSectionHeader}>
                          <View style={styles.webStepIcon}><CalendarIcon size={20} color="#63348C" /></View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.webSectionTitle}>2. Agenda de Cita</Text>
                            <Text style={styles.webSectionSubtitle}>Selecciona la fecha y hora ideal para el servicio.</Text>
                          </View>
                        </View>
                        <View style={styles.webDivider} />
                        <View style={styles.webCalendarSection}>
                          {!agendaConfig.agendaActiva && (
                            <View style={styles.webAlertBox}>
                              <AlertCircle size={20} color="#EF4444" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.webAlertTitle}>Agenda Temporalmente Inactiva</Text>
                                <Text style={styles.webAlertText}>{agendaConfig.mensajePublico || 'No estamos recibiendo citas en este momento.'}</Text>
                              </View>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => (agendaConfig.agendaActiva ? setIsCalendarOpen(!isCalendarOpen) : null)}
                            disabled={!agendaConfig.agendaActiva}
                            style={[styles.webDateTrigger, isCalendarOpen && styles.webDateTriggerActive]}
                          >
                            <CalendarIcon size={20} color={selectedDate ? "#63348C" : "#94A3B8"} />
                            <Text style={[styles.webDateTriggerText, selectedDate && { color: '#1E293B' }]}>
                              {selectedDate ? `${selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}${selectedHour ? ` - ${selectedHour} hrs` : ''}` : 'Seleccionar Fecha'}
                            </Text>
                            <ChevronDown size={20} color="#94A3B8" />
                          </TouchableOpacity>
                          {isCalendarOpen && (
                            <View style={styles.webInlineCalendar}>
                              <View style={styles.calNavRow}>
                                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}>
                                  <ChevronLeft size={22} color="#1E293B" strokeWidth={3} />
                                </TouchableOpacity>
                                <Text style={styles.calMonthLabel}>
                                  {viewDate.toLocaleString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + viewDate.toLocaleString('es-ES', { month: 'long' }).slice(1)} {viewDate.getFullYear()}
                                </Text>
                                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}>
                                  <ChevronRight size={22} color="#1E293B" strokeWidth={3} />
                                </TouchableOpacity>
                              </View>
                              <View style={styles.calGridContainer}>
                                <View style={styles.daysRow}>
                                  {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => <Text key={d} style={styles.dayHead}>{d}</Text>)}
                                </View>
                                <View style={styles.datesGrid}>
                                  {calendarDays.map((day, idx) => {
                                    if (!day) return <View key={idx} style={styles.dateCell} />;
                                    const isS = selectedDate?.toDateString() === day.toDateString();
                                    const isPast = day < new Date(new Date().setHours(0,0,0,0));
                                    const dayOfWeek = day.getDay();
                                    const isLibre = agendaConfig.diasLibres.includes(dayOfWeek);
                                    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                    const isBloqueada = agendaConfig.fechasBloqueadas.includes(dateStr);
                                    const isDisabled = isPast || isLibre || isBloqueada || !agendaConfig.agendaActiva;
                                    return (
                                      <TouchableOpacity key={idx} disabled={isDisabled}
                                        onPress={() => { setSelectedDate(day); setSelectedHour(null); }}
                                        style={[styles.dateCell, isS && styles.dateCellA, isDisabled && { opacity: 0.3 }]}>
                                        <Text style={[styles.dateCellT, isS && { color: '#fff', fontWeight: '900' }, isDisabled && { color: '#94A3B8', textDecorationLine: 'line-through' }]}>
                                          {day.getDate()}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>

                              {selectedDate && (
                                <View style={{ marginTop: 32 }}>
                                  <Text style={styles.webSublabel}>Horarios Disponibles</Text>
                                  <View style={styles.webHoursGrid}>
                                    {availableHours.map(hour => {
                                      const isB = bookings.includes(hour);
                                      const isS = selectedHour === hour;
                                      return (
                                        <TouchableOpacity key={hour} disabled={isB} onPress={() => { setSelectedHour(hour); setIsCalendarOpen(false); }}
                                          style={[styles.webHourChip, isS && styles.webHourChipA, isB && styles.webHourChipB]}>
                                          <Text style={[styles.webHourChipText, isS && { color: '#fff' }, isB && { color: '#CBD5E1' }]}>{hour}</Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                  {/* PASO 3: METODO DE PAGO */}
                  <View style={styles.webSectionCard}>
                    <View style={styles.webSectionHeader}>
                      <View style={styles.webStepIcon}><CreditCard size={20} color="#63348C" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.webSectionTitle}>3. Método de Pago</Text>
                        <Text style={styles.webSectionSubtitle}>Transacciones seguras procesadas por MercadoPago.</Text>
                      </View>
                    </View>
                    <View style={styles.webDivider} />
                    <View style={styles.webPaymentMethods}>
                      <View style={styles.webPaymentOption}>
                        <View style={styles.webPaymentOptionIcon}>
                          <CreditCard size={24} color="#63348C" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.webPaymentOptionTitle}>Tarjeta de Crédito o Débito</Text>
                          <Text style={styles.webPaymentOptionSub}>Hasta 12 cuotas sin interés.</Text>
                        </View>
                        <View style={styles.webPaymentCheck}><Check size={14} color="#fff" /></View>
                      </View>
                      <View style={styles.webCardsArea}>
                        <View style={styles.webCardsHeader}>
                          <Text style={styles.webSublabel}>Tus Tarjetas</Text>
                          <TouchableOpacity onPress={() => setCardDetails({ number: '', name: '', expiry: '', cvv: '', rut: cardDetails.rut })}>
                            <Text style={styles.webClearBtn}>Limpiar</Text>
                          </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                          <TouchableOpacity
                            onPress={() => { setShowNewCardForm(true); setSelectedCardId(null); }}
                            style={[styles.webNewCardBtn, showNewCardForm && styles.webNewCardBtnActive]}
                          >
                            <Plus size={24} color="#63348C" />
                            <Text style={styles.webNewCardBtnText}>Nueva</Text>
                          </TouchableOpacity>
                          {savedCards.map((card) => (
                            <TouchableOpacity
                              key={card.id}
                              onPress={() => { setSelectedCardId(card.id); setShowNewCardForm(false); setSavedCardCVV(''); }}
                              style={[styles.webSavedCard, selectedCardId === card.id && !showNewCardForm && styles.webSavedCardActive]}
                            >
                              <View style={styles.webCardBrandRow}>
                                <Text style={styles.webCardBrand}>{card.brand || 'Tarjeta'}</Text>
                                <TouchableOpacity
                                  onPress={async () => {
                                    if (auth.currentUser) {
                                      const { deleteDoc, doc } = await import('firebase/firestore');
                                      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'savedCards', card.id));
                                      fetchSavedCards();
                                    }
                                  }}
                                >
                                  <X size={14} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.webCardNumberMask}>**** {card.last4}</Text>
                              <Text style={styles.webCardExpiry}>Vence: {card.expMonth}/{card.expYear.toString().slice(-2)}</Text>
                              {selectedCardId === card.id && !showNewCardForm && (
                                <View style={styles.webCardSelectBadge}><Check size={10} color="#63348C" /></View>
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        {selectedCardId && !showNewCardForm && (
                          <View style={styles.webCvvPrompt}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.webInputLabel}>Código de Seguridad (CVV)</Text>
                              <TextInput
                                placeholder="3 o 4 dígitos"
                                value={savedCardCVV}
                                onChangeText={setSavedCardCVV}
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                style={styles.webInputCompact}
                              />
                            </View>
                            <ShieldCheck size={24} color="#63348C" />
                          </View>
                        )}
                        {showNewCardForm && (
                          <View style={styles.webNewCardForm}>
                            <View style={styles.webFormRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.webInputLabel}>Número de Tarjeta</Text>
                                <TextInput
                                  placeholder="0000 0000 0000 0000"
                                  value={cardDetails.number}
                                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                                  keyboardType="numeric"
                                  maxLength={19}
                                  style={styles.webInput}
                                />
                              </View>
                            </View>
                            <View style={styles.webFormRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.webInputLabel}>Nombre</Text>
                                <TextInput
                                  placeholder="Ej: Juan Pérez"
                                  value={cardDetails.name}
                                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, name: text }))}
                                  style={styles.webInput}
                                />
                              </View>
                            </View>
                            <View style={styles.webFormRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.webInputLabel}>RUT</Text>
                                <TextInput
                                  placeholder="12.345.678-9"
                                  value={cardDetails.rut}
                                  onChangeText={handleRutChange}
                                  style={styles.webInput}
                                />
                              </View>
                            </View>
                            <View style={styles.webFormRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.webInputLabel}>Vencimiento</Text>
                                <TextInput
                                  placeholder="MM/YY"
                                  value={cardDetails.expiry}
                                  onChangeText={handleExpiryChange}
                                  keyboardType="numeric"
                                  maxLength={5}
                                  style={styles.webInput}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.webInputLabel}>CVV</Text>
                                <TextInput
                                  placeholder="123"
                                  value={cardDetails.cvv}
                                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                                  keyboardType="numeric"
                                  maxLength={4}
                                  style={styles.webInput}
                                />
                              </View>
                            </View>
                            <TouchableOpacity
                              onPress={() => setSaveCard(!saveCard)}
                              style={styles.webCheckboxRow}
                            >
                              <View style={[styles.webCheckbox, saveCard && styles.webCheckboxChecked]}>
                                {saveCard && <Check size={12} color="#fff" />}
                              </View>
                              <Text style={styles.webCheckboxText}>Guardar tarjeta</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
                {/* COLUMNA DERECHA: RESUMEN */}
                <View style={styles.webRightCol}>
                  <View style={styles.webStickyContainer}>
                    <View style={styles.webSummaryCard}>
                      <Text style={styles.webSummaryTitle}>Resumen</Text>

                      <View style={styles.webServicePreview}>
                        <Image source={{ uri: service?.foto }} style={styles.webServiceImg} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.webServiceName}>{service?.nombre}</Text>
                          <Text style={styles.webServiceCat}>{service?.categoria}</Text>
                        </View>
                      </View>
                      <View style={styles.webDivider} />
                      <View style={styles.webSummaryDetails}>
                        {service?.requiresPetDetails ? (
                          <>
                            <View style={styles.webSummaryInlineRow}>
                              <View style={styles.webSummaryInlineItem}>
                                <Text style={styles.webSummaryLabel}>MASCOTAS</Text>
                                <Text style={styles.webSummaryValue}>{petCount}</Text>
                              </View>
                              <View style={styles.webSummaryDivider} />
                              <View style={[styles.webSummaryInlineItem, { flex: 1.5 }]}>
                                <Text style={styles.webSummaryLabel}>FECHA Y HORA</Text>
                                <Text style={[styles.webSummaryValue, (petCount <= 1 && !petsDetails[0]?.date) && { color: '#94A3B8' }]} numberOfLines={1}>
                                  {petCount > 1 ? 'Múltiples' : (petsDetails[0]?.date && petsDetails[0]?.hour ? `${petsDetails[0].date.toLocaleDateString()} ${petsDetails[0].hour}` : 'Pendiente')}
                                </Text>
                              </View>
                              <View style={styles.webSummaryDivider} />
                              <View style={styles.webSummaryInlineItem}>
                                <Text style={styles.webSummaryLabel}>DURACIÓN</Text>
                                <Text style={styles.webSummaryValue}>{service?.duracion || '1 hr'}</Text>
                              </View>
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={styles.webSummaryRow}>
                              <CalendarIcon size={18} color="#64748B" />
                              <Text style={styles.webSummaryText}>
                                {selectedDate ? selectedDate.toLocaleDateString() : 'Fecha pendiente'}
                              </Text>
                            </View>
                            <View style={styles.webSummaryRow}>
                              <Clock size={18} color="#64748B" />
                              <Text style={styles.webSummaryText}>
                                {selectedHour ? `${selectedHour} hrs` : 'Hora pendiente'}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                      <View style={styles.webDivider} />
                      <View style={styles.webPriceRows}>
                        <View style={[styles.webPriceRow, { marginTop: 12, justifyContent: areAllWeightsEntered() ? 'space-between' : 'center' }]}>
                          {areAllWeightsEntered() ? (
                            <>
                              <Text style={styles.webTotalLabel}>Total a Pagar</Text>
                              <Text style={styles.webTotalVal}>${calcTotalPrice().toLocaleString("de-DE")}</Text>
                            </>
                          ) : (
                            <Text style={styles.webTotalVal}>{getPriceRangeText()}</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={handlePayment}
                        disabled={!isFormValid()}
                        style={[styles.webPayBtn, (!isFormValid() || isLoading) && { opacity: 0.5, backgroundColor: '#94A3B8', shadowColor: 'transparent' }]}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Lock size={18} color="#fff" />
                            <Text style={styles.webPayBtnText}>Pagar Reserva</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <View style={styles.webTrustBox}>
                        <ShieldCheck size={20} color="#10B981" />
                        <Text style={styles.webTrustText}>Protegido por Saku Guarantee</Text>
                      </View>
                    </View>
                    <View style={styles.webNoticeBox}>
                      <Info size={20} color="#63348C" />
                      <Text style={styles.webNoticeText}>
                        Puedes cancelar o reprogramar hasta 24 horas antes sin costo adicional.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.mobileWrapper}>
            <View style={[styles.header, { paddingTop: insets.top, height: 70 + insets.top }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#1E293B" /></TouchableOpacity>
              <Text style={styles.headerTitle}>Confirmar Reserva</Text>
              <View style={styles.secureBadge}><Lock size={14} color="#63348C" /><Text style={styles.secureTxt}>SEGURO</Text></View>
            </View>
            <View style={{ padding: 20 }}>
              <View style={styles.mainLayout}>
                <View style={styles.leftSide}>
                  {/* 1. Mis Datos */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionLabel}>1. Mis Datos</Text>
                    <View style={{ marginBottom: 15 }}>
                      <Text style={styles.webInputLabel}>Nombre Completo</Text>
                      <TextInput
                        value={clientInfo.name}
                        onChangeText={(t) => setClientInfo(prev => ({ ...prev, name: t }))}
                        placeholder="Ej: Juan Pérez"
                        style={styles.webInputCompact}
                      />
                    </View>
                    <View>
                      <Text style={styles.webInputLabel}>Teléfono Móvil</Text>
                      <TextInput
                        value={clientInfo.phone}
                        onChangeText={(t) => setClientInfo(prev => ({ ...prev, phone: t }))}
                        placeholder="Ej: +56 9 1234 5678"
                        keyboardType="phone-pad"
                        style={styles.webInputCompact}
                      />
                    </View>
                  </View>

                  {/* 2. Mascotas y Agenda */}
                  <View style={[styles.sectionCard, { marginTop: 25 }]}>
                    {service?.requiresPetDetails ? (
                      <>
                        <Text style={styles.sectionLabel}>2. Mascotas y Agenda</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                          <Text style={styles.subLabel}>Cantidad de Mascotas</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <TouchableOpacity onPress={() => updatePetCount(petCount - 1)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B' }}>-</Text>
                            </TouchableOpacity>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E293B' }}>{petCount}</Text>
                            <TouchableOpacity onPress={() => updatePetCount(petCount + 1)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B' }}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {petsDetails.map((pet, idx) => (
                          <View key={idx} style={{ marginBottom: 20, padding: 15, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 15 }}>Mascota {idx + 1}</Text>
                            <View style={{ marginBottom: 15 }}>
                              <Text style={styles.webInputLabel}>Nombre de la Mascota</Text>
                              <TextInput
                                value={pet.name}
                                onChangeText={(t) => updatePet(idx, 'name', t)}
                                placeholder="Ej: Max"
                                style={styles.webInputCompact}
                              />
                            </View>
                            {service?.weightRanges?.length > 0 && (
                              <View style={{ marginBottom: 15 }}>
                                <Text style={styles.webInputLabel}>Peso (kg)</Text>
                                <TextInput
                                  value={pet.weight}
                                  onChangeText={(t) => updatePet(idx, 'weight', t)}
                                  placeholder="Ej: 15"
                                  keyboardType="numeric"
                                  style={styles.webInputCompact}
                                />
                                {pet.weight ? (
                                  <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '800', marginTop: 6 }}>
                                    Precio asignado: ${getPriceForWeight(parseFloat(pet.weight)).toLocaleString("de-DE")}
                                  </Text>
                                ) : null}
                              </View>
                            )}
                            <View>
                              <Text style={styles.webInputLabel}>Fecha y Hora</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  updatePet(idx, 'calendarOpen', !pet.calendarOpen);
                                  if (pet.date) setSelectedDate(pet.date);
                                }}
                                style={[styles.dateSelectorTrigger, pet.calendarOpen && styles.dateSelectorTriggerActive]}
                              >
                                <View style={styles.dateInfoBox}>
                                  <CalendarIcon size={18} color={pet.date ? "#63348C" : "#94A3B8"} />
                                  <Text style={[styles.dateTriggerTxt, !pet.date && { color: '#94A3B8' }]}>
                                    {pet.date ? `${pet.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}${pet.hour ? ` ${pet.hour}` : ''}` : 'Seleccionar'}
                                  </Text>
                                </View>
                                {pet.calendarOpen ? <ChevronUp size={18} color="#63348C" /> : <ChevronDown size={18} color="#94A3B8" />}
                              </TouchableOpacity>
                              {pet.calendarOpen && (
                                <View style={styles.inlineCalendar}>
                                  <View style={styles.calNavRow}>
                                    <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}>
                                      <ChevronLeft size={22} color="#1E293B" strokeWidth={3} />
                                    </TouchableOpacity>
                                    <Text style={styles.calMonthLabel}>
                                      {viewDate.toLocaleString('es-ES', { month: 'short' }).charAt(0).toUpperCase() + viewDate.toLocaleString('es-ES', { month: 'short' }).slice(1)} {viewDate.getFullYear()}
                                    </Text>
                                    <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}>
                                      <ChevronRight size={22} color="#1E293B" strokeWidth={3} />
                                    </TouchableOpacity>
                                  </View>
                                  <View style={styles.calGridContainer}>
                                    <View style={styles.daysRow}>
                                      {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => <Text key={d} style={styles.dayHead}>{d}</Text>)}
                                    </View>
                                    <View style={styles.datesGrid}>
                                      {calendarDays.map((day, idxd) => {
                                        if (!day) return <View key={idxd} style={styles.dateCell} />;
                                        const isS = pet.date?.toDateString() === day.toDateString();
                                        const isPast = day < new Date(new Date().setHours(0,0,0,0));
                                        const dayOfWeek = day.getDay();
                                        const isLibre = agendaConfig.diasLibres.includes(dayOfWeek);
                                        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                        const isBloqueada = agendaConfig.fechasBloqueadas.includes(dateStr);
                                        const isDisabled = isPast || isLibre || isBloqueada || !agendaConfig.agendaActiva;
                                        return (
                                          <TouchableOpacity key={idxd} disabled={isDisabled}
                                            onPress={() => {
                                              updatePet(idx, 'date', day);
                                              setSelectedDate(day);
                                            }}
                                            style={[styles.dateCell, isS && styles.dateCellA, isDisabled && { opacity: 0.3 }]}>
                                            <Text style={[styles.dateCellT, isS && { color: '#fff', fontWeight: '900' }, isDisabled && { color: '#94A3B8', textDecorationLine: 'line-through' }]}>
                                              {day.getDate()}
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  </View>
                                  {pet.date && (
                                    <View style={{ marginTop: 20 }}>
                                      <Text style={styles.subLabel}>Horarios Disponibles</Text>
                                      <View style={styles.hoursGrid}>
                                        {availableHours.map(hour => {
                                          const isB = bookings.includes(hour);
                                          const isS = pet.hour === hour;
                                          return (
                                            <TouchableOpacity key={hour} disabled={isB} onPress={() => updatePet(idx, 'hour', hour)}
                                              style={[styles.hourChip, isS && styles.hourChipA, isB && styles.hourChipB]}>
                                              <Text style={[styles.hourChipT, isS && { color: '#fff' }, isB && { color: '#CBD5E1' }]}>{hour}</Text>
                                            </TouchableOpacity>
                                          );
                                        })}
                                      </View>
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </>
                    ) : (
                      <>
                        <Text style={styles.sectionLabel}>2. Agenda de Cita</Text>
                        {!agendaConfig.agendaActiva && (
                          <View style={styles.alertBox}>
                            <Text style={styles.alertTitle}>Agenda Inactiva</Text>
                            <Text style={styles.alertText}>{agendaConfig.mensajePublico || 'Lo sentimos, no estamos recibiendo citas.'}</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => (agendaConfig.agendaActiva ? setIsCalendarOpen(!isCalendarOpen) : null)}
                          disabled={!agendaConfig.agendaActiva}
                          style={[styles.dateSelectorTrigger, isCalendarOpen && styles.dateSelectorTriggerActive, !agendaConfig.agendaActiva && { opacity: 0.5 }]}>
                          <View style={styles.dateInfoBox}>
                             <CalendarIcon size={20} color={selectedDate ? "#63348C" : "#94A3B8"} />
                             <Text style={[styles.dateTriggerTxt, !selectedDate && { color: '#94A3B8' }]}>
                                {selectedDate ? `${selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}${selectedHour ? ` - ${selectedHour} hrs` : ''}` : 'Seleccionar Fecha'}
                             </Text>
                          </View>
                          {isCalendarOpen ? <ChevronUp size={20} color="#63348C" /> : <ChevronDown size={20} color="#94A3B8" />}
                        </TouchableOpacity>
                        {isCalendarOpen && (
                          <View style={styles.inlineCalendar}>
                             <View style={styles.calNavRow}>
                                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}>
                                   <ChevronLeft size={22} color="#1E293B" strokeWidth={3} />
                                </TouchableOpacity>
                                <Text style={styles.calMonthLabel}>
                                   {viewDate.toLocaleString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + viewDate.toLocaleString('es-ES', { month: 'long' }).slice(1)} {viewDate.getFullYear()}
                                </Text>
                                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}>
                                   <ChevronRight size={22} color="#1E293B" strokeWidth={3} />
                                </TouchableOpacity>
                             </View>
                             <View style={styles.calGridContainer}>
                                <View style={styles.daysRow}>
                                   {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => <Text key={d} style={styles.dayHead}>{d}</Text>)}
                                </View>
                                <View style={styles.datesGrid}>
                                   {calendarDays.map((day, idx) => {
                                      if (!day) return <View key={idx} style={styles.dateCell} />;
                                      const isS = selectedDate?.toDateString() === day.toDateString();
                                      const isPast = day < new Date(new Date().setHours(0,0,0,0));
                                      const dayOfWeek = day.getDay();
                                      const isLibre = agendaConfig.diasLibres.includes(dayOfWeek);
                                      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                      const isBloqueada = agendaConfig.fechasBloqueadas.includes(dateStr);
                                      const isDisabled = isPast || isLibre || isBloqueada || !agendaConfig.agendaActiva;
                                      return (
                                         <TouchableOpacity key={idx} disabled={isDisabled}
                                            onPress={() => { setSelectedDate(day); setSelectedHour(null); }}
                                             style={[styles.dateCell, isS && styles.dateCellA, isDisabled && { opacity: 0.3 }]}>
                                            <Text style={[styles.dateCellT, isS && { color: '#fff', fontWeight: '900' }, isDisabled && { color: '#94A3B8', textDecorationLine: 'line-through' }]}>
                                              {day.getDate()}
                                            </Text>
                                         </TouchableOpacity>
                                      );
                                   })}
                                </View>
                             </View>
                          </View>
                        )}
                        {selectedDate && !isCalendarOpen && (
                          <View style={{ marginTop: 25 }}>
                             <Text style={styles.subLabel}>Horarios disponibles</Text>
                             <View style={styles.hoursGrid}>
                                {availableHours.map(hour => {
                                   const isB = bookings.includes(hour);
                                   const isS = selectedHour === hour;
                                   return (
                                      <TouchableOpacity key={hour} disabled={isB} onPress={() => { setSelectedHour(hour); setIsCalendarOpen(false); }}
                                         style={[styles.hourChip, isS && styles.hourChipA, isB && styles.hourChipB]}>
                                         <Text style={[styles.hourChipT, isS && { color: '#fff' }, isB && { color: '#CBD5E1' }]}>{hour}</Text>
                                      </TouchableOpacity>
                                   );
                                })}
                             </View>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* 3. Método de Pago */}
                  <View style={[styles.sectionCard, { marginTop: 25 }]}>
                    <Text style={styles.sectionLabel}>3. Método de Pago</Text>
                    <View style={styles.paymentMethodCard}>
                      <CreditCard size={22} color="#63348C" />
                      <Text style={styles.paymentMethodTitle}>Tarjeta Bancaria</Text>
                      <Check size={18} color="#63348C" />
                    </View>
                    <View style={styles.cardsScrollArea}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 15 }}>
                        <TouchableOpacity
                          onPress={() => { setShowNewCardForm(true); setSelectedCardId(null); }}
                          style={[styles.mobileNewCardBtn, showNewCardForm && styles.mobileNewCardBtnActive]}
                        >
                          <Plus size={20} color="#63348C" />
                          <Text style={styles.mobileNewCardBtnText}>Nueva</Text>
                        </TouchableOpacity>
                        {savedCards.map(card => (
                          <TouchableOpacity
                            key={card.id}
                            onPress={() => { setSelectedCardId(card.id); setShowNewCardForm(false); }}
                            style={[styles.mobileSavedCard, selectedCardId === card.id && !showNewCardForm && styles.mobileSavedCardActive]}
                          >
                            <Text style={styles.mobileCardNumber}>**** {card.last4}</Text>
                            {selectedCardId === card.id && !showNewCardForm && (
                              <View style={styles.mobileCardSelectBadge}>
                                <Check size={12} color="#10B981" />
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    {selectedCardId && !showNewCardForm && (
                      <View style={{ marginTop: 20 }}>
                        <Text style={styles.webInputLabel}>Código de Seguridad (CVV)</Text>
                        <TextInput
                          placeholder="3 o 4 dígitos"
                          value={savedCardCVV}
                          onChangeText={setSavedCardCVV}
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                          style={styles.webInputCompact}
                        />
                      </View>
                    )}
                    {showNewCardForm && (
                      <View style={{ marginTop: 20, gap: 15 }}>
                        <View>
                          <Text style={styles.webInputLabel}>Número de Tarjeta</Text>
                          <TextInput
                            placeholder="0000 0000 0000 0000"
                            value={cardDetails.number}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, number: text }))}
                            keyboardType="numeric"
                            maxLength={19}
                            style={styles.webInputCompact}
                          />
                        </View>
                        <View>
                          <Text style={styles.webInputLabel}>Nombre Titular</Text>
                          <TextInput
                            placeholder="Ej: Juan Pérez"
                            value={cardDetails.name}
                            onChangeText={(text) => setCardDetails(prev => ({ ...prev, name: text }))}
                            style={styles.webInputCompact}
                          />
                        </View>
                        <View>
                          <Text style={styles.webInputLabel}>RUT Titular</Text>
                          <TextInput
                            placeholder="12.345.678-9"
                            value={cardDetails.rut}
                            onChangeText={handleRutChange}
                            style={styles.webInputCompact}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.webInputLabel}>Vencimiento</Text>
                            <TextInput
                              placeholder="MM/YY"
                              value={cardDetails.expiry}
                              onChangeText={handleExpiryChange}
                              keyboardType="numeric"
                              maxLength={5}
                              style={styles.webInputCompact}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.webInputLabel}>CVV</Text>
                            <TextInput
                              placeholder="123"
                              value={cardDetails.cvv}
                              onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                              keyboardType="numeric"
                              maxLength={4}
                              style={styles.webInputCompact}
                            />
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => setSaveCard(!saveCard)}
                          style={styles.webCheckboxRow}
                        >
                          <View style={[styles.webCheckbox, saveCard && styles.webCheckboxChecked]}>
                            {saveCard && <Check size={12} color="#fff" />}
                          </View>
                          <Text style={styles.webCheckboxText}>Guardar tarjeta</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.rightSide}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.serviceBrief}>
                      <Image source={{ uri: service?.foto }} style={styles.briefImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.briefName}>{service?.nombre}</Text>
                        <Text style={styles.briefPrice}>${(service?.precio || 0).toLocaleString("de-DE")}</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    
                    {service?.requiresPetDetails ? (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '700' }}>Mascotas</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '800' }}>{petCount}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '700' }}>Cita</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '800' }}>
                            {petCount > 1 ? 'Múltiples' : (petsDetails[0]?.date && petsDetails[0]?.hour ? `${petsDetails[0].date.toLocaleDateString()} ${petsDetails[0].hour}` : 'Pendiente')}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '700' }}>Cita</Text>
                          <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '800' }}>
                            {selectedDate ? selectedDate.toLocaleDateString() : 'Pendiente'} {selectedHour ? selectedHour : ''}
                          </Text>
                        </View>
                      </>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                      {areAllWeightsEntered() ? (
                        <>
                          <Text style={styles.totalLabel}>Total</Text>
                          <Text style={styles.totalPrice}>${calcTotalPrice().toLocaleString("de-DE")}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.totalLabel}>Total</Text>
                          <Text style={styles.totalPrice}>{getPriceRangeText()}</Text>
                        </>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={handlePayment}
                      disabled={!isFormValid()}
                      style={[styles.payBtn, (!isFormValid() || isLoading) && { opacity: 0.5, backgroundColor: '#94A3B8' }]}
                    >
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Confirmar Reserva</Text>}
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 8 }}>
                      <ShieldCheck size={16} color="#10B981" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>Saku Guarantee</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}><Check size={40} color="#fff" /></View>
            <Text style={styles.modalTitle}>¡Reserva Confirmada!</Text>
            <Text style={styles.modalMsg}>Tu cita ha sido agendada con éxito. Te hemos enviado un correo con los detalles.</Text>

            <View style={styles.orderSummary}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>Orden ID</Text>
                <Text style={{ color: '#111827', fontWeight: '800' }}>#{lastOrderData?.orderId?.slice(-8)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>Total Pagado</Text>
                <Text style={{ color: '#111827', fontWeight: '800' }}>${lastOrderData?.total?.toLocaleString("de-DE")}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/');
              }}
              style={styles.successBtn}
            >
              <Text style={styles.successBtnText}>Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ERROR MODAL */}
      <Modal visible={errorModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <AlertCircle size={40} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalMsg}>{errorModal.message}</Text>
            <TouchableOpacity
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
              style={styles.modalBtn}
            >
              <Text style={styles.modalBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  desktopScrollContent: { paddingBottom: 100, backgroundColor: '#F8FAFC' },
  mobileScrollContent: { paddingBottom: 50, backgroundColor: '#F8FAFC' },
  /* WEB STYLES */
  webRoot: { flex: 1, backgroundColor: '#F8FAFC', minHeight: '100vh', position: 'relative' },
  webBgShape1: { position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(99, 52, 140, 0.03)' },
  webBgShape2: { position: 'absolute', bottom: -150, left: -100, width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(16, 185, 129, 0.03)' },
  webWrapper: { maxWidth: 1400, width: '95%', alignSelf: 'center', marginTop: 40, zIndex: 1 },

  webTopNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 20 },
  webBackLink: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' },
  webBackLinkLabel: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbItem: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  breadcrumbCurrent: { fontSize: 14, color: '#1E293B', fontWeight: '800' },

  webCartAction: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  webCartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#63348C', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  webCartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  webSecureBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' },
  webSecureTxt: { fontSize: 11, fontWeight: '900', color: '#166534', letterSpacing: 0.5 },
  webMainGrid: { flexDirection: 'row', gap: 40, alignItems: 'stretch' },
  webLeftCol: { flex: 1.6 },
  webRightCol: { flex: 1 },

  webPageTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginBottom: 32, letterSpacing: -0.5 },

  webSectionCard: { backgroundColor: '#fff', borderRadius: 32, padding: 32, marginBottom: 30, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 30 },
  webSectionHeader: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  webStepIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(99, 52, 140, 0.08)', justifyContent: 'center', alignItems: 'center' },
  webSectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  webSectionSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '600' },
  webDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

  webCalendarSection: {},
  webAlertBox: { flexDirection: 'row', gap: 16, backgroundColor: '#FEF2F2', padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#FEE2E2' },
  webAlertTitle: { fontSize: 15, fontWeight: '800', color: '#991B1B' },
  webAlertText: { fontSize: 14, color: '#B91C1C', marginTop: 2, lineHeight: 20 },

  webDateTrigger: { height: 70, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  webDateTriggerActive: { borderColor: '#63348C', backgroundColor: '#fff', shadowColor: '#63348C', shadowOpacity: 0.05, shadowRadius: 15 },
  webDateTriggerText: { flex: 1, fontSize: 16, fontWeight: '800', color: '#94A3B8' },

  webInlineCalendar: { marginTop: 20, padding: 30, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 40 },
  webSublabel: { fontSize: 14, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
  webHoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  webHourChip: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0' },
  webHourChipA: { backgroundColor: '#63348C', borderColor: '#63348C' },
  webHourChipB: { opacity: 0.2 },
  webHourChipText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

  webPaymentMethods: { gap: 16 },
  webPaymentOption: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 24, borderRadius: 24, backgroundColor: '#fff', borderWidth: 2, borderColor: '#63348C' },
  webPaymentOptionIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(99, 52, 140, 0.08)', justifyContent: 'center', alignItems: 'center' },
  webPaymentOptionTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
  webPaymentOptionSub: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '600' },
  webPaymentCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' },

  webCardsArea: { marginTop: 32, padding: 32, backgroundColor: '#F8FAFC', borderRadius: 24 },
  webCardsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  webClearBtn: { fontSize: 13, fontWeight: '800', color: '#63348C' },

  webNewCardBtn: { width: 140, height: 180, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  webNewCardBtnActive: { borderColor: '#63348C', backgroundColor: '#F5F3FF' },
  webNewCardBtnText: { marginTop: 12, fontSize: 14, fontWeight: '800', color: '#63348C' },

  webSavedCard: { width: 220, height: 180, borderRadius: 24, backgroundColor: '#63348C', padding: 24, justifyContent: 'space-between' },
  webSavedCardActive: { borderWidth: 3, borderColor: '#10B981' },
  webCardBrandRow: { flexDirection: 'row', justifyContent: 'space-between' },
  webCardBrand: { color: '#fff', fontSize: 12, fontWeight: '900', opacity: 0.8 },
  webCardNumberMask: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  webCardExpiry: { color: '#fff', fontSize: 12, fontWeight: '700', opacity: 0.7 },
  webCardSelectBadge: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  webCvvPrompt: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  webInputCompact: { height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontWeight: '700', marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' },

  webNewCardForm: { marginTop: 24, gap: 20 },
  webFormRow: { flexDirection: 'row', gap: 20 },
  webInputLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8 },
  webInput: { height: 60, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, fontSize: 16, fontWeight: '700', color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0' },
  webCheckboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  webCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  webCheckboxChecked: { backgroundColor: '#63348C', borderColor: '#63348C' },
  webCheckboxText: { fontSize: 14, fontWeight: '700', color: '#64748B' },

  webStickyContainer: {
    position: 'sticky' as any,
    top: 20,
    zIndex: 10,
  },
  webSummaryCard: { backgroundColor: '#fff', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 40 },
  webSummaryTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 16 },
  webServicePreview: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  webServiceImg: { width: 80, height: 80, borderRadius: 20 },
  webServiceName: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  webServiceCat: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 4 },

  webSummaryDetails: { marginBottom: 24 },
  webSummaryInlineRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, alignItems: 'center', gap: 4 },
  webSummaryInlineItem: { flex: 1, alignItems: 'center', gap: 4 },
  webSummaryDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  webSummaryLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
  webSummaryValue: { fontSize: 13, fontWeight: '800', color: '#1E293B' },

  webPriceRows: { gap: 12 },
  webPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webPriceLabel: { fontSize: 15, color: '#64748B', fontWeight: '700' },
  webPriceVal: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  webTotalLabel: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  webTotalVal: { fontSize: 28, fontWeight: '900', color: '#000000' },

  webPayBtn: { height: 70, backgroundColor: '#10B981', borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 20 },
  webPayBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  webTrustBox: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 24 },
  webTrustText: { fontSize: 13, fontWeight: '800', color: '#10B981' },
  webNoticeBox: { marginTop: 24, backgroundColor: 'rgba(99, 52, 140, 0.05)', padding: 24, borderRadius: 24, flexDirection: 'row', gap: 16 },
  webNoticeText: { flex: 1, fontSize: 13, color: '#63348C', fontWeight: '700', lineHeight: 20 },
  /* MODAL STYLES */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successModal: { backgroundColor: '#fff', borderRadius: 40, padding: 48, width: '100%', maxWidth: 500, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 50 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
  modalMsg: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 24, fontWeight: '600' },
  orderSummary: { width: '100%', backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, marginBottom: 32 },
  orderId: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textAlign: 'center' },
  orderTotal: { fontSize: 24, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginTop: 8 },
  successBtn: { backgroundColor: '#1E293B', width: '100%', height: 70, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  successBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  errorModal: { backgroundColor: '#fff', borderRadius: 40, padding: 48, width: '100%', maxWidth: 500, alignItems: 'center' },
  modalBtn: { backgroundColor: '#EF4444', width: '100%', height: 70, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  modalBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  /* MOBILE STYLES */
  mobileWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { height: 70, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  secureTxt: { fontSize: 10, fontWeight: '900', color: '#63348C' },

  mainLayout: { gap: 25 },
  leftSide: {},
  rightSide: {},
  sectionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionLabel: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
  dateSelectorTrigger: { height: 60, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  dateSelectorTriggerActive: { borderColor: '#63348C' },
  dateInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateTriggerTxt: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

  inlineCalendar: { marginTop: 15, padding: 15, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calMonthLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  calGridContainer: {},
  daysRow: { flexDirection: 'row', marginBottom: 10 },
  dayHead: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '900', color: '#94A3B8' },
  datesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  dateCellA: { backgroundColor: '#63348C' },
  dateCellT: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  subLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 15 },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hourChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  hourChipA: { backgroundColor: '#63348C', borderColor: '#63348C' },
  hourChipB: { opacity: 0.2 },
  hourChipT: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

  paymentMethodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  paymentMethodTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#1E293B' },

  cardsScrollArea: { marginTop: 10 },
  mobileNewCardBtn: { width: 100, height: 100, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mobileNewCardBtnActive: { borderColor: '#63348C' },
  mobileNewCardBtnText: { fontSize: 12, fontWeight: '800', color: '#63348C', marginTop: 8 },
  mobileSavedCard: { width: 160, height: 100, borderRadius: 16, backgroundColor: '#63348C', padding: 16, justifyContent: 'flex-end', marginRight: 12 },
  mobileSavedCardActive: { borderWidth: 2, borderColor: '#10B981' },
  mobileCardNumber: { color: '#fff', fontSize: 15, fontWeight: '800' },
  mobileCardSelectBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  summaryTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
  serviceBrief: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 },
  briefImg: { width: 50, height: 50, borderRadius: 12 },
  briefName: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  briefPrice: { fontSize: 14, fontWeight: '800', color: '#63348C' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  totalPrice: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  payBtn: { backgroundColor: '#10B981', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  alertBox: { backgroundColor: '#FEF2F2', padding: 15, borderRadius: 16, marginBottom: 15 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B' },
  alertText: { fontSize: 13, color: '#B91C1C', marginTop: 4 }
});
