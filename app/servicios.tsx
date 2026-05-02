import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, ActivityIndicator, Platform, StyleSheet, StatusBar, Alert } from 'react-native';
import { Search, X, Heart, ChevronRight, Star, Clock, MapPin, Phone, MessageSquare, ArrowLeft, Stethoscope, Scissors, Syringe, ClipboardList, AlertCircle, Calendar, Zap, ShieldCheck, Waves, Info, ChevronLeft } from 'lucide-react-native';
import Header from '../components/Header';
import { useFavorites } from '../context/FavoritesContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORY_ICONS: any = {
  'default': { icon: Stethoscope, color: '#63348C', bg: '#EEF2FF' },
  'urgencias': { icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
  'peluquería': { icon: Scissors, color: '#EC4899', bg: '#FDF2F8' },
  'vacunas': { icon: Syringe, color: '#63348C', bg: '#ECFDF5' },
  'consulta': { icon: ClipboardList, color: '#F59E0B', bg: '#FFFBEB' },
  'spa': { icon: Waves, color: '#06B6D4', bg: '#ECFEFF' },
};

const FALLBACK_THEMES = [
  { color: '#63348C', bg: '#EEF2FF', icon: Stethoscope },
  { color: '#63348C', bg: '#F5F3FF', icon: ClipboardList },
  { color: '#EC4899', bg: '#FDF2F8', icon: Heart },
  { color: '#63348C', bg: '#ECFDF5', icon: ShieldCheck },
];

export default function VeterinaryServicesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 1024;

  const { category: urlCategory } = useLocalSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [isBooking, setIsBooking] = useState<string | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (urlCategory) {
      setSelectedCat(urlCategory as string);
    }
  }, [urlCategory]);

  useEffect(() => {
    // Listen for services
    const q = query(collection(db, 'Servicios'), where('disponibilidad', '==', true));
    const unsubServices = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(list);
      setLoading(false);
    });

    // Listen for categories
    const qCat = query(collection(db, 'CategoriasServicios'));
    const unsubCats = onSnapshot(qCat, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(list);
    });

    return () => {
      unsubServices();
      unsubCats();
    };
  }, []);

  const handleReserve = (service: any) => {
    setIsBooking(service.id);

    // Pass service directly to checkout via params
    // This allows a "separate" checkout for this service only
    router.push({
      pathname: '/checkout-servicio',
      params: {
        serviceId: service.id,
        serviceData: JSON.stringify(service)
      }
    });

    setTimeout(() => setIsBooking(null), 1000);
  };

  const getCategoryTheme = (name: string, index: number) => {
    const n = name.toLowerCase();
    for (const key in CATEGORY_ICONS) {
      if (n.includes(key)) return CATEGORY_ICONS[key];
    }
    return FALLBACK_THEMES[index % FALLBACK_THEMES.length];
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (s.descripcion || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'Todas' || (s.categoriaIds && s.categoriaIds.includes(selectedCat));
    return matchesSearch && matchesCat;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle={isDesktop ? 'dark-content' : 'light-content'} />

      {/* 0. CONDITIONAL HEADER */}
      {isDesktop && <Header />}

      <ScrollView showsVerticalScrollIndicator={true}>
        {/* 1. HERO SECTION */}
        <View style={{ height: isDesktop ? 300 : 200, backgroundColor: '#63348C', overflow: 'hidden', marginBottom: -24 }}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1200' }}
            style={{ width: '100%', height: '100%', opacity: 0.6 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(99,52,140,0.8)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />

          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', paddingHorizontal: isDesktop ? '4%' : 20,
            paddingTop: isDesktop ? 0 : insets.top
          }}>
            <View style={{ maxWidth: 800 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 15 }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    width: isDesktop ? 56 : 44, 
                    height: isDesktop ? 56 : 44, 
                    borderRadius: isDesktop ? 28 : 22, 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginTop: isDesktop ? 8 : 4
                  }}
                >
                  <ChevronLeft size={isDesktop ? 32 : 28} color="#fff" strokeWidth={3} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: isDesktop ? 48 : 32, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: isDesktop ? 54 : 38 }}>
                    Cuidado <Text style={{ color: '#F97316' }}>Superior</Text>{'\n'}Para Tu Mascota
                  </Text>
                  <Text style={{ fontSize: isDesktop ? 18 : 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500', lineHeight: 22 }}>
                    Reserva servicios veterinarios de alta calidad en segundos.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. SEARCH & QUICK ACTIONS BAR (STICKY) */}
        <View style={{
          backgroundColor: '#FFFFFF',
          paddingTop: 20,
          paddingBottom: 12,
          paddingHorizontal: isDesktop ? '4%' : 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          zIndex: 100,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
            {/* Search Input */}
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              flex: 1,
            }}>
              <Search size={18} color="#94A3B8" />
              <TextInput
                placeholder="¿Qué servicio buscas hoy?"
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#1E293B', outlineStyle: 'none' } as any}
                value={search}
                onChangeText={setSearch}
              />
              {!!search && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#CBD5E1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                  }}
                >
                  <X size={14} color="#475569" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 3. CATEGORIES SECTION */}
        <View style={{ marginTop: 10, paddingHorizontal: isDesktop ? '4%' : 15 }}>
          {isDesktop ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 10 }}>
              <TouchableOpacity
                onPress={() => setSelectedCat('Todas')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: selectedCat === 'Todas' ? '#63348C' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: selectedCat === 'Todas' ? '#63348C' : '#E2E8F0',
                  gap: 12,
                  shadowColor: selectedCat === 'Todas' ? '#63348C' : 'transparent',
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: selectedCat === 'Todas' ? 4 : 0
                }}
              >
                <Zap size={20} color={selectedCat === 'Todas' ? '#fff' : '#64748B'} strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: '800', color: selectedCat === 'Todas' ? '#fff' : '#475569' }}>Todas</Text>
              </TouchableOpacity>

              {categories.map((cat, index) => {
                const theme = getCategoryTheme(cat.nombre, index);
                const Icon = theme.icon;
                const isActive = selectedCat === cat.id;
                if (cat.nombre.length < 3 && cat.nombre !== 'Todas') return null;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCat(cat.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: isActive ? '#63348C' : '#fff',
                      borderWidth: 1,
                      borderColor: isActive ? '#63348C' : '#E2E8F0',
                      gap: 12,
                      shadowColor: isActive ? '#63348C' : 'transparent',
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: isActive ? 3 : 0
                    }}
                  >
                    <Icon size={20} color={isActive ? '#fff' : theme.color} strokeWidth={2.5} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isActive ? '#fff' : '#475569' }}>{cat.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 15, paddingLeft: 5 }}>
              <TouchableOpacity
                onPress={() => setSelectedCat('Todas')}
                style={styles.categoryItem}
              >
                <View style={[styles.categoryCircle, selectedCat === 'Todas' ? styles.circleActive : { backgroundColor: '#F1F5F9' }]}>
                  <Zap size={26} color={selectedCat === 'Todas' ? '#fff' : '#64748B'} strokeWidth={2.5} />
                </View>
                <Text style={[styles.categoryLabel, selectedCat === 'Todas' && styles.labelActive]}>Todas</Text>
              </TouchableOpacity>

              {categories.map((cat, index) => {
                const theme = getCategoryTheme(cat.nombre, index);
                const Icon = theme.icon;
                const isActive = selectedCat === cat.id;
                if (cat.nombre.length < 3 && cat.nombre !== 'Todas') return null;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCat(cat.id)}
                    style={styles.categoryItem}
                  >
                    <View style={[styles.categoryCircle, isActive ? styles.circleActive : { backgroundColor: theme.bg }]}>
                      <Icon size={26} color={isActive ? '#fff' : theme.color} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.categoryLabel, isActive && styles.labelActive]} numberOfLines={1}>{cat.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 4. MAIN CATALOG AREA */}
        <View style={{ paddingHorizontal: isDesktop ? '4%' : 15, marginTop: 30, paddingBottom: 120 }}>

          {loading ? (
            <ActivityIndicator size="large" color="#63348C" style={{ marginTop: 50 }} />
          ) : (
            <>
              {/* Results Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: isDesktop ? 28 : 22, fontWeight: '900', color: '#1E293B' }}>
                    {selectedCat === 'Todas' ? 'Nuestros Servicios' : `${categories.find(c => c.id === selectedCat)?.nombre}`}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <ShieldCheck size={14} color="#63348C" />
                    <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 13 }}>Profesionales Saku</Text>
                  </View>
                </View>
              </View>

              {/* Service Grid */}
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 20 }}>
                {filteredServices.length > 0 ? (
                  filteredServices.map(s => {
                    // Price range helper
                    const getDisplayPrice = (svc: any): string => {
                      if (!svc?.weightRanges || svc.weightRanges.length === 0) {
                        return `$${(svc?.precio || 0).toLocaleString("de-DE")}`;
                      }
                      const prices = svc.weightRanges.map((r: any) => r.price).filter((p: number) => !isNaN(p));
                      if (prices.length === 0) return `$${(svc?.precio || 0).toLocaleString("de-DE")}`;
                      const min = Math.min(...prices);
                      const max = Math.max(...prices);
                      if (min === max) return `$${min.toLocaleString("de-DE")}`;
                      return `$${min.toLocaleString("de-DE")} - $${max.toLocaleString("de-DE")}`;
                    };
                    return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.serviceCard, { width: isDesktop ? '31.5%' : '100%' }]}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/servicio/${s.id}` as any)}
                    >
                      <View style={styles.serviceImageWrapper}>
                        <Image source={{ uri: s.foto1 || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500' }} style={{ width: '100%', height: isDesktop ? 220 : 180 }} />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />

                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite({
                              id: s.id,
                              name: s.nombre,
                              price: s.precio,
                              image: s.foto1 || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500',
                              description: s.descripcion,
                              duration: s.duracion || 'Consultar',
                              type: 'service'
                            });
                          }}
                          style={[styles.favoriteCircle, isFavorite(s.id) && { backgroundColor: '#FFFFFF' }]}
                        >
                          <Heart size={18} color={isFavorite(s.id) ? "#EF4444" : "#fff"} fill={isFavorite(s.id) ? "#EF4444" : "transparent"} />
                        </TouchableOpacity>

                        <View style={styles.priceTag}>
                          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{getDisplayPrice(s)}</Text>
                        </View>
                      </View>

                      <View style={{ padding: 15, flex: 1, justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 }}>{s.nombre}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' }}>
                                {s.categoriaIds && s.categoriaIds.length > 0 
                                  ? categories.find(c => c.id === s.categoriaIds[0])?.nombre || 'General'
                                  : 'Servicio'}
                              </Text>
                            </View>
                            <Text style={{ color: '#CBD5E1' }}>•</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <Clock size={12} color="#64748B" />
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>{s.duracion || 'Consultar'}</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 12, lineHeight: 18 }} numberOfLines={3}>
                            {s.descripcion || 'Servicio profesional para el bienestar de tu mascota.'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.actionButton, isBooking === s.id && { opacity: 0.7 }]}
                          onPress={() => handleReserve(s)}
                          disabled={isBooking !== null}
                        >
                          {isBooking === s.id ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Reservar</Text>
                              <ChevronRight size={18} color="#fff" strokeWidth={3} />
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                    )
                  })
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', paddingVertical: 60, width: '100%' }}>
                    <Stethoscope size={50} color="#CBD5E1" strokeWidth={1.5} />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 15 }}>Sin servicios</Text>
                    <TouchableOpacity onPress={() => { setSelectedCat('Todas'); setSearch(''); }} style={{ marginTop: 20 }}>
                      <Text style={{ color: '#63348C', fontWeight: '900' }}>Ver todo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#fff'
  },
  circleActive: {
    backgroundColor: '#63348C',
    borderColor: '#63348C',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    width: '100%'
  },
  labelActive: {
    color: '#63348C',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
    minHeight: 460
  },
  serviceImageWrapper: {
    position: 'relative',
    overflow: 'hidden'
  },
  favoriteCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#63348C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionButton: {
    backgroundColor: '#63348C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 15,
  }
});
