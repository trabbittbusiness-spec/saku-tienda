import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, serverTimestamp, doc, query, where, onSnapshot, Timestamp, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, useWindowDimensions, ActivityIndicator, StyleSheet, Alert, Platform, Modal } from 'react-native';
import { ArrowLeft, Lock, Plus, CreditCard, ShieldCheck, Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, Check, X, ChevronDown, ChevronUp, Banknote, Wifi, AlertCircle, RefreshCcw } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../lib/firebase';
import { mpService } from '../lib/mercadopago';

export default function CheckoutServicioScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const isDesktop = width >= 1024;
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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
    fetchSavedCards();
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(userDoc => {
        if (userDoc.exists() && userDoc.data().rut) {
          setCardDetails(prev => ({ ...prev, rut: userDoc.data().rut }));
        }
      }).catch(e => console.log('Error loading user RUT:', e));
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
          foto: data.foto1 || data.foto || data.imagen || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500'
        });
      }
    });
    return () => unsub();
  }, [params.serviceId]);

  useEffect(() => {
    const q = query(collection(db, 'Configuracion'), where('tipo', '==', 'agenda'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        if (data.customHours) setAvailableHours([...data.customHours].sort());
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
    if (!selectedHour || !selectedDate || !service) return showError("Atención", "Reserva tu fecha y hora primero.");
    
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

        // Save RUT to profile
        if (auth.currentUser?.uid && cardDetails.rut) {
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { rut: cardDetails.rut });
          } catch (e) { console.log('Error saving RUT:', e); }
        }

        let payerId: string | undefined = undefined;
        if (!showNewCardForm && selectedCardId) {
          const selectedCard = savedCards.find(c => c.id === selectedCardId);
          if (selectedCard) {
            payerId = selectedCard.customerId;
          }
        }

        const paymentBody = {
          transaction_amount: service.precio,
          token: cardToken,
          description: `Reserva de Servicio: ${service.nombre}`,
          payment_method_id: paymentMethodId,
          issuer_id: issuerId,
          external_reference: externalRef,
          items: [{
            id: service.id || '',
            title: service.nombre || 'Servicio Saku',
            quantity: 1,
            unit_price: service.precio || 0,
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
          showError("Pago Rechazado", `El pago no pudo ser aprobado: ${paymentResult.status_detail}`);
          return;
        }
      }

      // 3. Create Service Order and Agenda
      const [h, m] = selectedHour!.split(':').map(Number);
      const finalBookingDate = new Date(selectedDate);
      finalBookingDate.setHours(h, m, 0, 0);
      
      const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      const fullName = [userData.display_name, userData.apellido].filter(Boolean).join(' ');
      const userName = fullName || auth.currentUser.displayName || 'Usuario';
      
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

      const agendaRef = await addDoc(collection(db, 'Agendas'), {
        fecha: Timestamp.fromDate(finalBookingDate),
        servicioId: service.id,
        servicioNombre: service.nombre,
        usuarioId: auth.currentUser.uid,
        clienteNombre: userName,
        clienteUbicacion: userAddress,
        clienteLat: userLat,
        clienteLng: userLng,
        estado: 'Pendientes',
        color: '#6366F1',
        usuario: userName,
        servicio: service.nombre,
        categoria: service.categoria,
        descripcion: service.descripcion,
        animal: service.animal,
        address: userAddress,
        external_reference: externalRef
      });
      
      // Notify Admin
      await addDoc(collection(db, 'Notifications'), {
        title: 'Nueva Reserva #' + externalRef.slice(-4).toUpperCase(),
        desc: `${userName} reservó ${service.nombre} por $${service.precio.toLocaleString()}.`,
        time: new Date().toISOString(),
        type: 'system',
        read: false,
        timestamp: serverTimestamp()
      });
      
      setLastOrderData({ orderId: externalRef, total: service.precio });
      setShowSuccessModal(true);

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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout de Servicio</Text>
        <View style={styles.secureBadge}><Lock size={14} color="#10B981" /><Text style={styles.secureTxt}>PAGO SEGURO</Text></View>
      </View>

      <ScrollView contentContainerStyle={{ padding: isDesktop ? 40 : 20 }}>
        <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
           
           {/* LEFT: FORM SECTIONS */}
           <View style={[styles.leftSide, isDesktop && { flex: 1.5 }]}>
              
              <View style={styles.sectionCard}>
                 <Text style={styles.sectionLabel}>Reserva tu cita</Text>
                 <TouchableOpacity onPress={() => setIsCalendarOpen(!isCalendarOpen)} 
                    style={[styles.dateSelectorTrigger, isCalendarOpen && styles.dateSelectorTriggerActive]}>
                    <View style={styles.dateInfoBox}>
                       <CalendarIcon size={20} color="#3B1E54" />
                       <Text style={styles.dateTriggerTxt}>
                          {selectedDate ? selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Seleccionar Fecha'}
                       </Text>
                    </View>
                    {isCalendarOpen ? <ChevronUp size={20} color="#3B1E54" /> : <ChevronDown size={20} color="#94A3B8" />}
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
                                const isP = day < new Date(new Date().setHours(0,0,0,0));
                                return (
                                   <TouchableOpacity key={idx} disabled={isP} 
                                      onPress={() => { setSelectedDate(day); setIsCalendarOpen(false); }}
                                      style={[styles.dateCell, isS && styles.dateCellA]}>
                                      <Text style={[styles.dateCellT, isS && { color: '#fff', fontWeight: '900' }, isP && { color: '#E2E8F0' }]}>{day.getDate()}</Text>
                                   </TouchableOpacity>
                                );
                             })}
                          </View>
                       </View>
                    </View>
                 )}

                 {selectedDate && !isCalendarOpen && (
                    <View style={{ marginTop: 25 }}>
                       <Text style={styles.subLabel}>Horarios disponibles para el {selectedDate.toLocaleDateString()}</Text>
                       <View style={styles.hoursGrid}>
                          {availableHours.map(hour => {
                             const isB = bookings.includes(hour);
                             const isS = selectedHour === hour;
                             return (
                                <TouchableOpacity key={hour} disabled={isB} onPress={() => setSelectedHour(hour)}
                                   style={[styles.hourChip, isS && styles.hourChipA, isB && styles.hourChipB]}>
                                   <Text style={[styles.hourChipT, isS && { color: '#fff' }, isB && { color: '#CBD5E1' }]}>{hour}</Text>
                                </TouchableOpacity>
                             );
                          })}
                       </View>
                    </View>
                 )}
               </View>

               <View style={[styles.sectionCard, { marginTop: 25 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }}>
                    <CreditCard size={18} color="#6366F1" />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Método de Pago</Text>
                </View>

                <View style={{ flexDirection: 'column', gap: 16 }}>
                  <View 
                    style={{ 
                      borderWidth: 2, borderColor: '#1E1B4B', borderRadius: 20, padding: 20, 
                      backgroundColor: '#F5F3FF',
                      flexDirection: 'row', alignItems: 'center', gap: 16
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}>
                      <CreditCard size={22} color="#1E1B4B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Tarjeta Bancaria</Text>
                      <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '500', marginTop: 2 }}>Crédito / Débito Segura</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1E1B4B', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
                    </View>
                  </View>
                </View>

                {/* Saved Cards and Form */}
                {paymentMethod === 'card' && (
                  <View style={{ marginTop: 24, padding: isDesktop ? 32 : 16, backgroundColor: '#F9FAFB', borderRadius: 24 }}>
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
                            justifyContent: 'center', alignItems: 'center', gap: 8, borderStyle: 'solid', borderWidth: 2, borderColor: showNewCardForm ? '#10B981' : '#E5E7EB'
                          }}
                        >
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' }}>
                            <Plus size={20} color="#10B981" />
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>Nueva Tarjeta</Text>
                        </TouchableOpacity>

                        {isLoadingCards ? (
                          <ActivityIndicator size="small" color="#1E1B4B" style={{ marginLeft: 20 }} />
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
                                width: 140, height: 90, borderRadius: 16, backgroundColor: '#1E1B4B', padding: 12,
                                borderWidth: 2, borderColor: selectedCardId === card.id && !showNewCardForm ? '#10B981' : 'transparent',
                                position: 'relative'
                              }}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>{card.brand || 'Tarjeta'}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  {selectedCardId === card.id && !showNewCardForm && (
                                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                                      <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>
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
                                    <X size={14} color="rgba(255,255,255,0.6)" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', marginTop: 12, letterSpacing: 2 }}>
                                **** {card.last4}
                              </Text>
                              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 }}>
                                Vence: {card.expMonth}/{card.expYear.toString().slice(-2)}
                              </Text>
                            </TouchableOpacity>
                          ))
                        )}
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
                            <ShieldCheck size={24} color="#10B981" />
                          </View>
                          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>Por tu seguridad, ingresa los 3 o 4 dígitos al reverso de tu tarjeta.</Text>
                        </View>
                      )}

                      {showNewCardForm && (
                        <View style={{ 
                          marginTop: 24, 
                          flexDirection: isDesktop ? 'row' : 'column-reverse', 
                          gap: 32, 
                          alignItems: isDesktop ? 'flex-start' : 'stretch' 
                        }}>
                          {/* Form Fields */}
                          <View style={{ flex: 1, gap: 16 }}>
                            <View style={{ height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                              <CreditCard size={20} color="#10B981" />
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
                                borderColor: saveCard ? '#10B981' : '#D1D5DB',
                                backgroundColor: saveCard ? '#10B981' : 'transparent',
                                justifyContent: 'center', alignItems: 'center'
                              }}>
                                {saveCard && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
                              </View>
                              <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>Guardar mi tarjeta para futuras reservas</Text>
                            </TouchableOpacity>
                          </View>

                          {/* Card Preview */}
                          <View style={{ 
                            width: isDesktop ? 310 : '100%', 
                            height: isDesktop ? 190 : 170, 
                            borderRadius: 20,
                            backgroundColor: '#1E1B4B', 
                            padding: isDesktop ? 22 : 20,
                            shadowColor: '#1E1B4B', 
                            shadowOpacity: 0.45, 
                            shadowRadius: 24, 
                            shadowOffset: { width: 0, height: 12 }
                          }}>
                            {/* Top Row: Chip + Brand */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                {/* Chip */}
                                <View style={{ width: isDesktop ? 30 : 28, height: isDesktop ? 24 : 22, borderRadius: 4, backgroundColor: '#C9A84C', justifyContent: 'center', alignItems: 'center' }}>
                                  <View style={{ width: isDesktop ? 20 : 18, height: isDesktop ? 16 : 14, borderRadius: 2, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.3)' }} />
                                </View>
                                <Wifi size={isDesktop ? 15 : 14} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '90deg' }] }} />
                              </View>
                              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: isDesktop ? 14 : 13, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 }}>SAKU</Text>
                            </View>

                            {/* Card Number */}
                            <Text 
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              style={{ 
                                color: 'white', 
                                fontSize: isDesktop ? 17 : 16, 
                                fontWeight: '700', 
                                marginTop: isDesktop ? 16 : 14, 
                                letterSpacing: 3, 
                                fontFamily: 'monospace' 
                              }}
                            >
                              {cardDetails.number 
                                ? cardDetails.number.replace(/\s/g,'').replace(/(.{4})/g, '$1 ').trim()
                                : '•••• •••• •••• ••••'}
                            </Text>

                            {/* Bottom Row: Name + Expiry */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                              <View style={{ flex: 1, marginRight: 16 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: isDesktop ? 9 : 8, fontWeight: '700', letterSpacing: 1 }}>TITULAR</Text>
                                <Text 
                                  numberOfLines={1}
                                  style={{ color: 'white', fontSize: isDesktop ? 12 : 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}
                                >{cardDetails.name || 'NOMBRE DEL TITULAR'}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: isDesktop ? 9 : 8, fontWeight: '700', letterSpacing: 1 }}>VENCE</Text>
                                <Text style={{ color: 'white', fontSize: isDesktop ? 12 : 11, fontWeight: '700', marginTop: 2 }}>{cardDetails.expiry || 'MM/YY'}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
            </View>

           {/* RIGHT: SUMMARY CARD */}
           <View style={[styles.rightSide, isDesktop && { flex: 1 }]}>
              <View style={styles.summaryCard}>
                 <Text style={styles.summaryTitle}>Resumen de Reserva</Text>
                 
                 <View style={styles.serviceBrief}>
                     {service?.foto ? (
                       <Image 
                          source={{ uri: service.foto }} 
                          style={styles.briefImg} 
                          resizeMode="cover"
                       />
                     ) : (
                       <View style={[styles.briefImg, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                          <ActivityIndicator size="small" color="#3B1E54" />
                       </View>
                     )}
                     <View style={{ flex: 1 }}>
                        <Text style={styles.briefName}>{service?.nombre || 'Cargando...'}</Text>
                        <Text style={styles.briefPrice}>${(service?.precio || 0).toLocaleString()}</Text>
                     </View>
                  </View>

                 <View style={styles.divider} />

                 <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Subtotal</Text>
                    <Text style={styles.costVal}>${(service?.precio || 0).toLocaleString()}</Text>
                 </View>
                 <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Gestión</Text>
                    <Text style={[styles.costVal, { color: '#10B981' }]}>Bonificado</Text>
                 </View>

                 <View style={[styles.divider, { marginVertical: 20 }]} />

                 <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${(service?.precio || 0).toLocaleString()}</Text>
                 </View>

                 {selectedDate && selectedHour && (
                    <View style={styles.selectionConfirmation}>
                       <Clock size={16} color="#3B1E54" />
                       <Text style={styles.selectionText}>{selectedDate.toLocaleDateString()} a las {selectedHour}</Text>
                    </View>
                 )}

                 <TouchableOpacity 
                    onPress={handlePayment} 
                    disabled={isLoading || !selectedHour || !service}
                    style={[styles.payButton, (isLoading || !selectedHour || !service) && { opacity: 0.5 }]}
                 >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonTxt}>RESERVAR Y PAGAR</Text>}
                 </TouchableOpacity>

                 <View style={styles.secureFooter}>
                    <ShieldCheck size={14} color="#64748B" />
                    <Text style={styles.secureFooterTxt}>Checkout 100% encriptado</Text>
                 </View>
              </View>
           </View>
        </View>
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Check size={40} color="#22C55E" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>¡Reserva Confirmada!</Text>
            <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
              Tu pago ha sido procesado exitosamente. Te hemos enviado un correo con los detalles de tu cita.
            </Text>
            
            <View style={{ width: '100%', backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>Orden ID</Text>
                <Text style={{ color: '#111827', fontWeight: '800' }}>#{lastOrderData?.orderId?.slice(-8)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>Total Pagado</Text>
                <Text style={{ color: '#111827', fontWeight: '800' }}>${lastOrderData?.total?.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/');
              }}
              style={{ backgroundColor: '#111827', width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ERROR MODAL */}
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <AlertCircle size={40} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>{errorModal.title}</Text>
            <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
              {errorModal.message}
            </Text>
            <TouchableOpacity 
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
              style={{ backgroundColor: '#EF4444', width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { height: 70, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  secureTxt: { fontSize: 10, fontWeight: '900', color: '#10B981' },

  mainLayout: { maxWidth: 1200, alignSelf: 'center', width: '100%', gap: 40 },
  desktopLayout: { flexDirection: 'row', alignItems: 'flex-start' },

  leftSide: {},
  sectionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 15 },
  sectionLabel: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
  dateSelectorTrigger: { height: 64, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  dateSelectorTriggerActive: { borderColor: '#3B1E54', backgroundColor: '#fff' },
  dateInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateTriggerTxt: { fontSize: 16, fontWeight: '800', color: '#1E293B' },

  inlineCalendar: { marginTop: 15, padding: 20, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, marginBottom: 25 },
  calMonthLabel: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  calGridContainer: { width: '100%' },
  daysRow: { flexDirection: 'row', marginBottom: 15 },
  dayHead: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', color: '#94A3B8' },
  datesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.28%', height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  dateCellA: { backgroundColor: '#3B1E54' },
  dateCellT: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  subLabel: { fontSize: 14, fontWeight: '800', color: '#64748B', marginBottom: 15 },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hourChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  hourChipA: { backgroundColor: '#F47321', borderColor: '#F47321' },
  hourChipB: { opacity: 0.2 },
  hourChipT: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

  paymentMethods: { gap: 12 },
  payCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#F1F5F9' },
  payCardA: { borderColor: '#3B1E54', backgroundColor: '#fff' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  radioIn: { width: 10, height: 10, borderRadius: 5 },
  payText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 15 },
  addCardTxt: { color: '#6366F1', fontSize: 15, fontWeight: '800' },
  newForm: { gap: 12, marginTop: 10 },
  input: { height: 56, backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },

  rightSide: {},
  summaryCard: { backgroundColor: '#fff', borderRadius: 30, padding: 35, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 30 },
  summaryTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 30 },
  serviceBrief: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 30 },
  briefImg: { width: 64, height: 64, borderRadius: 16 },
  briefName: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
  briefPrice: { fontSize: 16, fontWeight: '900', color: '#F47321' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  costLabel: { fontSize: 15, color: '#64748B', fontWeight: '700' },
  costVal: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#F47321' },
  selectionConfirmation: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15, marginBottom: 25 },
  selectionText: { fontSize: 14, fontWeight: '800', color: '#3B1E54' },
  payButton: { backgroundColor: '#10B981', height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 20 },
  payButtonTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  secureFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 25, justifyContent: 'center' },
  secureFooterTxt: { fontSize: 12, color: '#94A3B8', fontWeight: '700' }
});
