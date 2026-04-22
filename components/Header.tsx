import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput, Pressable, Modal, ScrollView, Image } from 'react-native';
import { BellDot, ChevronDown, MapPin, Search, ShoppingCart, Heart, Store, Truck, Dog as DogIcon, LogOut, User, CreditCard, Shield, ChevronRight, X, Trash2, Minus, Plus, ArrowRight, Bell, ShoppingBag, Home, Briefcase, Star, Check, Navigation } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import LocationMapModal from './LocationMapModal';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, query, collection, where, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';

const BREAKPOINT = 768;

export default function Header() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isActiveOrderOpen, setIsActiveOrderOpen] = useState(false);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    main: 'Nueva Providencia 1515',
    sub: 'Providencia, RM'
  });
  const { cartCount, cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { favorites } = useFavorites();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= BREAKPOINT;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [defaultAddrId, setDefaultAddrId] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserEmail(currentUser.email || '');
        
        // Fetch User Profile (Name and Default Address)
        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const fullName = [data.display_name, data.apellido].filter(Boolean).join(' ');
            setUserName(fullName || currentUser.displayName || 'Usuario');
            
            if (data.direccionDefault) {
              setSelectedLocation({
                main: data.direccionDefault.main,
                sub: data.direccionDefault.sub
              });
              setDefaultAddrId(data.direccionDefault.id);
            }
          }
        });

        // Fetch Addresses Collection
        const qAddr = query(collection(db, 'Direcciones'), where('userId', '==', currentUser.uid));
        const unsubAddresses = onSnapshot(qAddr, (snapshot) => {
          const addrList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAddresses(addrList);
        });

        // Fetch Active Orders (Pendiente or Enviado)
        const qOrders = query(collection(db, 'Ordenes'), where('userId', '==', currentUser.uid));
        const unsubOrders = onSnapshot(qOrders, (snapshot) => {
          const ordersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).filter((o: any) => {
            const status = o.estado?.toLowerCase();
            return status === 'pendiente' || status === 'enviado';
          });
          setActiveOrders(ordersList);
        });

        return () => {
          unsubUser();
          unsubAddresses();
          unsubOrders();
        };
      } else {
        setUserName('');
        setUserEmail('');
        setAddresses([]);
        setDefaultAddrId(null);
        setActiveOrders([]);
      }
    });
    return unsubscribeAuth;
  }, []);

  // Drawer Slide Animation
  const drawerTranslateX = useSharedValue(width);
  useEffect(() => {
    if (isNotificationsOpen) {
      drawerTranslateX.value = withTiming(0, { duration: 250 });
    } else {
      drawerTranslateX.value = withTiming(width, { duration: 200 });
    }
  }, [isNotificationsOpen, width]);

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  const renderNotificationsDrawer = () => {
    return (
      <Modal visible={isNotificationsOpen} transparent animationType="fade" onRequestClose={() => setIsNotificationsOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {isDesktop && <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setIsNotificationsOpen(false)} />}
          <Animated.View style={[{ width: isDesktop ? 420 : '100%', backgroundColor: '#FFFFFF', height: '100%', shadowColor: '#000', shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 }, animatedDrawerStyle]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: isDesktop ? 25 : insets.top + 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Notificaciones</Text>
                <View style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>3</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsNotificationsOpen(false)} style={{ width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
              <TouchableOpacity style={{ flexDirection: 'row', padding: 16, backgroundColor: '#FFF7ED', borderRadius: 16, borderWidth: 1, borderColor: '#FED7AA', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' }}>
                  <Truck size={20} color="#F47321" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Pedido en camino</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>Hace 5 min</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 18 }}>Tu orden #4SO37PD ha sido despachada y está en camino a tu dirección.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', padding: 16, backgroundColor: '#F0FDF4', borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' }}>
                  <ShoppingBag size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Compra confirmada</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>Hace 2 hrs</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 18 }}>Tu compra de Royal Dog Hypoallergenic ha sido confirmada exitosamente.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Bell size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Promoción especial</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>Ayer</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', lineHeight: 18 }}>¡20% de descuento en alimentos premium para tu mascota! Válido hasta el domingo.</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: insets.bottom + 20 }}>
              <TouchableOpacity style={{ backgroundColor: '#F3F4F6', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#6B7280' }}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Pro Dynamic Capsule Animations
  const truckDrive = useSharedValue(0);
  const radarPulse = useSharedValue(0);

  useEffect(() => {
    // Fast subtle bounce for the truck (simulating driving)
    truckDrive.value = withRepeat(withTiming(1, { duration: 150 }), -1, true);
    // Smooth radar pulse for the active dot
    radarPulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animatedTruckStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(truckDrive.value, [0, 1], [0, -1.5]) }],
  }));

  const animatedRadarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(radarPulse.value, [0, 1], [1, 1.8]) }],
    opacity: interpolate(radarPulse.value, [0, 1], [1, 0.2]),
  }));

  const handleSetDefault = async (addr: any) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        direccionDefault: addr
      });
      setIsAddressPickerOpen(false);
    } catch (e) {
      console.error("Error setting default address:", e);
    }
  };

  const handleSaveNewAddress = async (location: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'Direcciones'), {
        ...location,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsMapModalOpen(false);
    } catch (e) {
      console.error("Error saving address:", e);
    }
  };

  if (isDesktop) {
    // ── DESKTOP HEADER (Reference Perfect) ──────────────────────────────────
    return (
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 24,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
          borderTopWidth: 4,
          borderTopColor: '#1E40AF', // Blue top line from image
          zIndex: 999, // FIX: Ensure header is always on top of page content
          elevation: 50,
        }}
      >
        {/* Left Side: Logo */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}
        >
          <View style={{
            backgroundColor: '#3B1E54',
            width: 44,
            height: 44,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Image 
              source={require('../assets/images/logo_saku_cl.png')} 
              style={{ width: 32, height: 32 }} 
              resizeMode="contain" 
            />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1A2E', letterSpacing: -1 }}>
            SAKU<Text style={{ color: '#F47321' }}>.</Text>
          </Text>
        </TouchableOpacity>

        {/* Center: Unified Address & Search Bar */}
        <View style={{
          flex: 1,
          flexShrink: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 30,
          borderWidth: 1.5,
          borderColor: '#F0F0F0',
          marginHorizontal: 15,
          padding: 4,
          maxWidth: 800,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}>
          {/* Address Part */}
          <View style={{ position: 'relative', zIndex: 70, flexShrink: 1 }}>
            {isAddressPickerOpen && (
              <Pressable
                style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 65 }}
                onPress={() => setIsAddressPickerOpen(false)}
              />
            )}
            <TouchableOpacity
              onPress={() => setIsAddressPickerOpen(!isAddressPickerOpen)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF7F0',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 25,
                gap: 8,
                flexShrink: 1,
              }}
            >
              <MapPin size={18} color="#F47321" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, color: '#1A1A2E', fontWeight: '800', flexShrink: 1 }}
              >
                {selectedLocation.main || 'Selecciona tu dirección'}
              </Text>
              <ChevronDown size={14} color="#555" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            </TouchableOpacity>

            {isAddressPickerOpen && (
              <View style={{
                position: 'absolute', top: 48, left: 0, right: 0, minWidth: 380,
                backgroundColor: '#FFFFFF', borderRadius: 22, padding: 12,
                shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 35,
                borderWidth: 1, borderColor: '#F3F4F6', zIndex: 75
              }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginLeft: 12, marginBottom: 12, letterSpacing: 0.5 }}>MIS DIRECCIONES</Text>
                
                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 8 }}>
                    {addresses.map((addr) => {
                      const isSelected = defaultAddrId === addr.id;
                      return (
                        <TouchableOpacity
                          key={addr.id}
                          onPress={() => handleSetDefault(addr)}
                          style={{ 
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
                            paddingVertical: 14, paddingHorizontal: 16, 
                            backgroundColor: isSelected ? '#FFF7ED' : '#FFFFFF', 
                            borderRadius: 16, borderWidth: 1, borderColor: isSelected ? '#F4732140' : '#F9FAFB'
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isSelected ? '#F47321' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                              <MapPin size={18} color={isSelected ? 'white' : '#9CA3AF'} strokeWidth={2} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{addr.category || 'Dirección'}</Text>
                              <Text numberOfLines={1} style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 1 }}>{addr.main}, {addr.sub}</Text>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                              <Check size={14} color="white" strokeWidth={3} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: 8 }} />

                <TouchableOpacity
                  onPress={() => { setIsAddressPickerOpen(false); setIsMapModalOpen(true); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#F0FDF4', borderRadius: 16 }}
                >
                  <Plus size={18} color="#10B981" strokeWidth={3} />
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#10B981' }}>Agregar nueva dirección</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ width: 1.5, height: 30, backgroundColor: '#F0F0F0', marginHorizontal: 8, flexShrink: 0 }} />

          {/* Search Part (Navigates to /search) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/search')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}
          >
            <Search size={20} color="#BFBFBF" strokeWidth={2} style={{ flexShrink: 0 }} />
            <Text
              style={{
                flex: 1,
                paddingHorizontal: 12,
                fontSize: 15,
                fontWeight: '500',
                color: '#BFBFBF'
              }}
            >
              Medicamentos, alimentos, accesorios...
            </Text>
            <View
              style={{
                backgroundColor: '#F47321',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Search size={18} color="white" strokeWidth={3} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Right Side: Status & Icons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Active Order Capsule */}
          {activeOrders.length > 0 && (
            <View style={{ position: 'relative', zIndex: 80 }}>
              {isActiveOrderOpen && (
                <Pressable
                  style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 75 }}
                  onPress={() => setIsActiveOrderOpen(false)}
                />
              )}
              <TouchableOpacity
                onPress={() => setIsActiveOrderOpen(!isActiveOrderOpen)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F5F3F7',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 25,
                    gap: 8,
                  }}
                >
                  <Truck size={18} color="#3B1E54" strokeWidth={2.5} />
                  
                  {/* Subtle Pulsing Dot */}
                  <View style={{ position: 'relative', width: 8, height: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.View style={[{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#F47321' }, animatedRadarStyle]} />
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F47321', zIndex: 2 }} />
                  </View>

                  <Text style={{ fontSize: 15, color: '#1A1A2E', fontWeight: '800' }}>
                    {activeOrders.length} {activeOrders.length === 1 ? 'Orden Activa' : 'Órdenes Activas'}
                  </Text>
                  
                  <ChevronDown size={14} color="#555" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              {isActiveOrderOpen && (
                <View style={{
                  position: 'absolute', top: 52, right: 0, width: 340,
                  backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 35,
                  borderWidth: 1, borderColor: '#F3F4F6', zIndex: 85
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Órdenes Activas</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>Seguimiento en tiempo real</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsActiveOrderOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                      <X size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 12 }}>
                      {activeOrders.map((order) => (
                        <View key={order.id} style={{ backgroundColor: '#F9FAFB', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: order.estado?.toLowerCase() === 'enviado' ? '#F47321' : '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                              {order.estado?.toLowerCase() === 'enviado' ? (
                                <Truck size={20} color="white" strokeWidth={2} />
                              ) : (
                                <Store size={20} color="white" strokeWidth={2} />
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>#{order.orderCode || order.id.slice(0, 8).toUpperCase()}</Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 1 }}>{order.shippingMethod || 'Envío a domicilio'}</Text>
                            </View>
                          </View>
                          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 12, borderStyle: 'dashed' }} />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: order.estado?.toLowerCase() === 'enviado' ? '#3B82F6' : '#F59E0B' }} />
                              <Text style={{ fontSize: 13, fontWeight: '800', color: '#4B5563' }}>{order.estado}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => { setIsActiveOrderOpen(false); router.push(`/orders/${order.id}` as any); }}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '900', color: '#F47321' }}>Ver detalles</Text>
                              <ArrowRight size={14} color="#F47321" strokeWidth={2.5} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  <TouchableOpacity 
                    onPress={() => { setIsActiveOrderOpen(false); router.push('/orders' as any); }}
                    style={{ marginTop: 15, alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#9CA3AF' }}>Ver todo el historial</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Icon Set */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 10 }}>
            <TouchableOpacity 
              onPress={() => router.push('/')}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF3EB', justifyContent: 'center', alignItems: 'center' }}
            >
              <Store size={20} color="#F47321" strokeWidth={1.8} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={20} color="#4B5563" strokeWidth={1.8} />
              {cartCount > 0 && (
                <View style={{
                  position: 'absolute', top: -3, right: -3, backgroundColor: '#F47321',
                  borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: '#FFFFFF'
                }}>
                  <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/favorites')}
              style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
            >
              <Heart size={20} color="#4B5563" strokeWidth={1.8} />
              {favorites.length > 0 && (
                <View style={{
                  position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444',
                  borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: '#FFFFFF'
                }}>
                  <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{favorites.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }} 
              onPress={() => setIsNotificationsOpen(true)}
            >
              <BellDot size={20} color="#4B5563" strokeWidth={1.8} />
              <View style={{
                position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444',
                borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#FFFFFF'
              }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* User Menu Container */}
          <View style={{ position: 'relative', zIndex: 100 }}>
            {/* Transparent overlay for clicking outside */}
            {isAccountMenuOpen && (
              <Pressable
                style={{
                  position: 'absolute', top: -5000, left: -5000, width: 10000, height: 10000, zIndex: 90
                }}
                onPress={() => setIsAccountMenuOpen(false)}
              />
            )}

            <TouchableOpacity
              onPress={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#EFEFEF',
                borderRadius: 30,
                padding: 5,
                paddingHorizontal: 12,
                gap: 10,
                zIndex: 95,
              }}
            >
              <View style={{ gap: 4 }}>
                <View style={{ width: 18, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
                <View style={{ width: 18, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
                <View style={{ width: 18, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
              </View>
              <View style={{
                width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A2E',
                justifyContent: 'center', alignItems: 'center'
              }}>
                {user ? (
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
                ) : (
                  <User size={18} color="white" />
                )}
              </View>
            </TouchableOpacity>

            {/* ACCOUNT POPOVER WIDGET */}
            {isAccountMenuOpen && (
              <View style={{
                position: 'absolute',
                top: 60,
                right: 0,
                backgroundColor: 'white',
                width: 320,
                borderRadius: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 30,
                elevation: 20,
                zIndex: 100,
                padding: 8,
              }}>
                {/* Top Up-Arrow (Triangle) */}
                <View style={{
                  position: 'absolute',
                  top: -10,
                  right: 32,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 12,
                  borderRightWidth: 12,
                  borderBottomWidth: 12,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: 'white',
                }} />

                {/* Conditional Content based on Auth State */}
                {user ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, padding: 16, marginBottom: 5 }}>
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 }}>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>{userName}</Text>
                        <Text style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>{userEmail}</Text>
                      </View>
                    </View>

                    <View style={{ paddingHorizontal: 8 }}>
                      {[
                        { title: 'Mis órdenes', sub: 'Historial y seguimiento', Icon: ShoppingBag, color: '#EC4899', bg: '#FDF2F8', route: '/orders' },
                        { title: 'Mis direcciones', sub: 'Direcciones guardadas', Icon: MapPin, color: '#F59E0B', bg: '#FFFBEB', route: '/addresses' },
                        { title: 'Mi cuenta', sub: 'Datos personales y perfil', Icon: User, color: '#10B981', bg: '#ECFDF5', route: '/account' },
                        { title: 'Mis tarjetas', sub: 'Medios de pago guardados', Icon: CreditCard, color: '#6366F1', bg: '#EEF2FF', route: '/cards' },
                        { title: 'Seguridad', sub: 'Contraseña y 2FA', Icon: Shield, color: '#D97706', bg: '#FEF3C7', route: '/security' },
                      ].map((item, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            setIsAccountMenuOpen(false);
                            if (item.route) router.push(item.route as any);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: item.bg, justifyContent: 'center', alignItems: 'center' }}>
                              <item.Icon size={20} color={item.color} />
                            </View>
                            <View>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 }}>{item.title}</Text>
                              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>{item.sub}</Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                      ))}

                      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 10, marginHorizontal: 10 }} />

                      <TouchableOpacity 
                        onPress={async () => {
                          setIsAccountMenuOpen(false);
                          await signOut(auth);
                          router.replace('/login');
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 5 }}
                      >
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
                          <LogOut size={20} color="#EF4444" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#EF4444', marginBottom: 2 }}>Cerrar sesión</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={{ padding: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1A2E', marginBottom: 8 }}>¡Hola!</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500', marginBottom: 24 }}>Inicia sesión para ver tus órdenes, guardar favoritos y administrar tu cuenta.</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setIsAccountMenuOpen(false);
                        router.push('/login');
                      }}
                      style={{ backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
                    >
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* MAP ADDRESS MODAL */}
        <LocationMapModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          onSave={(location) => {
            setSelectedLocation(location);
            setIsMapModalOpen(false);
          }}
        />

        {/* NOTIFICATIONS DRAWER (UNIVERSAL) */}
        {renderNotificationsDrawer()}

        {/* CART DRAWER MODAL (DESKTOP ONLY) */}
        {isCartOpen && (
          <View style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, flexDirection: 'row' }}>
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setIsCartOpen(false)} />
            <View style={{ width: 520, backgroundColor: '#FFFFFF', height: '100%', shadowColor: '#000', shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Mi Carrito</Text>
                  <View style={{ backgroundColor: '#F47321', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>{cartCount}</Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity 
                    onPress={() => { setIsCartOpen(false); router.push('/orders' as any); }}
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', 
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 
                    }}
                  >
                    <ShoppingBag size={16} color="#4B5563" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#4B5563' }}>Órdenes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsCartOpen(false)} style={{ width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <X size={20} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Items Scroll */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 15 }}>
                {cart.length === 0 ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                    <ShoppingBag size={80} color="#E5E7EB" strokeWidth={1} />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#9CA3AF', marginTop: 20 }}>Tu carrito está vacío</Text>
                  </View>
                ) : (
                  cart.map((item) => (
                    <View key={item.firebaseId || `${item.ID_productos}-${item.medida}`} style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}>
                      <View style={{ width: 100, height: 100, backgroundColor: '#FFF7F0', borderRadius: 16, overflow: 'hidden' }}>
                        <Image source={{ uri: item.foto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 15, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ width: '80%' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{item.nombre}</Text>
                            {item.medida && <Text style={{ fontSize: 13, color: '#F47321', fontWeight: '700', marginTop: 2 }}>Formato: {item.medida}</Text>}
                          </View>
                          <TouchableOpacity 
                            onPress={() => removeFromCart(item.firebaseId || item.ID_productos)}
                            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                          <View>
                            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>${(item.precio || 0).toLocaleString()} c/u</Text>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginTop: 2 }}>${(item.subtotal || 0).toLocaleString()}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 4 }}>
                            <TouchableOpacity 
                              onPress={() => updateQuantity(item.firebaseId || item.ID_productos, item.cantidad - 1)}
                              style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }}
                            >
                              <Minus size={14} color="#111827" strokeWidth={3} />
                            </TouchableOpacity>
                            <Text style={{ fontWeight: '900', fontSize: 15, width: 36, textAlign: 'center', color: '#111827' }}>{item.cantidad}</Text>
                            <TouchableOpacity 
                              onPress={() => updateQuantity(item.firebaseId || item.ID_productos, item.cantidad + 1)}
                              style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center', shadowColor: '#F47321', shadowOpacity: 0.2, shadowRadius: 5 }}
                            >
                              <Plus size={14} color="#FFFFFF" strokeWidth={3} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Ticket Widget & Footer */}
              {cart.length > 0 && (
                <View style={{ padding: 25, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' }}>
                  <TouchableOpacity 
                    onPress={() => { setIsCartOpen(false); router.push('/checkout' as any); }}
                    style={{ backgroundColor: '#22C55E', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                        <ShoppingCart size={22} color="white" strokeWidth={2.5} />
                      </View>
                      <View>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>IR AL CHECKOUT</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' }}>Proceso seguro y rápido</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                      <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>${cartTotal.toLocaleString()}</Text>
                      <ArrowRight size={24} color="white" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setIsCartOpen(false)} style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#9CA3AF' }}>Seguir comprando</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }

  // ── MOBILE HEADER ─────────
  return (
    <>
    <LinearGradient
      colors={['#FF8F40', '#F47321']} // Soft Lighter Orange (Top) to Saku Orange (Bottom)
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: 180,
        paddingHorizontal: 15,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 15 }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            ENTREGAR A
          </Text>
          <TouchableOpacity 
            onPress={() => setIsAddressPickerOpen(!isAddressPickerOpen)}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}
          >
            <MapPin size={16} color="white" strokeWidth={2.5} />
            <Text numberOfLines={1} style={{ color: 'white', fontWeight: '900', fontSize: 17, marginLeft: 6, marginRight: 4, flexShrink: 1 }}>
              {selectedLocation.main || 'Selecciona tu dirección'}
            </Text>
            <ChevronDown size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setIsNotificationsOpen(true)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              width: 44,
              height: 44,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={22} color="white" strokeWidth={2} />
          </TouchableOpacity>
          {/* Notification Badge */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#FF3B30',
              borderRadius: 11,
              minWidth: 22,
              height: 22,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#F47321',
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>3</Text>
          </View>
        </View>
      </View>

      {/* MOBILE ADDRESS PICKER DROPDOWN */}
      {isAddressPickerOpen && (
        <Modal transparent visible={isAddressPickerOpen} animationType="fade" onRequestClose={() => setIsAddressPickerOpen(false)}>
          <Pressable 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', paddingTop: insets.top + 70 }} 
            onPress={() => setIsAddressPickerOpen(false)}
          >
            <View style={{ 
              marginHorizontal: 15, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12,
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginLeft: 12, marginBottom: 12, letterSpacing: 0.5 }}>MIS DIRECCIONES</Text>
              
              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 8 }}>
                  {addresses.map((addr) => {
                    const isSelected = defaultAddrId === addr.id;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        onPress={() => handleSetDefault(addr)}
                        style={{ 
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
                          paddingVertical: 14, paddingHorizontal: 16, 
                          backgroundColor: isSelected ? '#FFF7ED' : '#FFFFFF', 
                          borderRadius: 18, borderWidth: 1, borderColor: isSelected ? '#F4732140' : '#F9FAFB'
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isSelected ? '#F47321' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                            <MapPin size={20} color={isSelected ? 'white' : '#9CA3AF'} strokeWidth={2} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{addr.category || 'Dirección'}</Text>
                            <Text numberOfLines={1} style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 1 }}>{addr.main}, {addr.sub}</Text>
                          </View>
                        </View>
                        {isSelected && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                            <Check size={16} color="white" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: 8 }} />

              <TouchableOpacity
                onPress={() => { setIsAddressPickerOpen(false); setIsMapModalOpen(true); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#F0FDF4', borderRadius: 18 }}
              >
                <Plus size={20} color="#10B981" strokeWidth={3} />
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#10B981' }}>Agregar nueva dirección</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </LinearGradient>

    {/* MAP ADDRESS MODAL (UNIVERSAL) */}
    <LocationMapModal
      isOpen={isMapModalOpen}
      onClose={() => setIsMapModalOpen(false)}
      onSave={handleSaveNewAddress}
    />

    {/* MOBILE NOTIFICATIONS DRAWER */}
    {renderNotificationsDrawer()}
    </>
  );
}
