import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  MapPin,
  Phone,
  MessageCircle,
  MoreVertical,
  Search
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Header from '../components/Header';

export default function AgendaScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [activeTab, setActiveTab] = useState('Pendientes');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Fetch real bookings from 'Agendas' collection
    const q = query(
      collection(db, 'Agendas'),
      where('usuarioId', '==', auth.currentUser.uid),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to formatted string/date
        const dateObj = data.fecha?.toDate() || new Date();
        return { 
          id: doc.id, 
          ...data,
          serviceName: data.servicioNombre || data.servicio || 'Servicio',
          petName: data.animal || 'Mascota',
          date: dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
          time: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          status: data.estado || 'Pendientes', // Use the DB value directly (Pendientes / Completadas)
          price: data.precio || 0,
          image: data.image || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200&auto=format&fit=crop'
        };
      });
      setBookings(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching bookings:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'Todas') return true;
    return b.status === activeTab;
  });

  const renderTab = (name: string) => (
    <TouchableOpacity 
      onPress={() => setActiveTab(name)}
      style={{ 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 12,
        backgroundColor: activeTab === name ? '#1A1A2E' : 'transparent',
        borderWidth: 1,
        borderColor: activeTab === name ? '#1A1A2E' : '#E5E7EB'
      }}
    >
      <Text style={{ 
        fontSize: 14, 
        fontWeight: '800', 
        color: activeTab === name ? '#FFFFFF' : '#6B7280' 
      }}>
        {name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {isDesktop ? <Header /> : (
        <View style={{ 
          backgroundColor: '#FFFFFF', paddingVertical: 20,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
          paddingTop: 60
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 20, bottom: 20, width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Mis Servicios</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>{bookings.length} servicios • {bookings.filter(b => b.status === 'Pendientes').length} pendientes</Text>
          </View>
        </View>
      )}
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ 
          maxWidth: '100%', 
          alignSelf: 'center', 
          width: '100%',
          paddingHorizontal: 40,
          marginTop: isDesktop ? 40 : 20
        }}>
          
          {/* Page Header (Desktop only or for button) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
             {isDesktop && (
               <View>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#1A1A2E' }}>Mis Servicios</Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Gestiona las citas y servicios de tus mascotas</Text>
               </View>
             )}
             {isDesktop && (
               <TouchableOpacity 
                 onPress={() => router.push('/servicios')}
                 style={{ backgroundColor: '#F47321', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}
               >
                 <CalendarIcon size={20} color="white" />
                 <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Agendar Nuevo</Text>
               </TouchableOpacity>
             )}
          </View>

          {/* Tabs Filter */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {renderTab('Todas')}
            {renderTab('Pendientes')}
            {renderTab('Completadas')}
          </View>

          {loading ? (
            <View style={{ paddingVertical: 100, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#F47321" />
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={{ paddingVertical: 80, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 32, borderWidth: 1, borderColor: '#F1F5F9' }}>
               <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                  <CalendarIcon size={40} color="#D1D5DB" />
               </View>
               <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>No hay servicios {activeTab.toLowerCase()}</Text>
               <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 8 }}>Tus citas aparecerán aquí una vez agendadas.</Text>
            </View>
          ) : (
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              gap: 20,
              justifyContent: 'flex-start'
            }}>
              {filteredBookings.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  activeOpacity={0.9}
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: 24, 
                    padding: isDesktop ? 24 : 16,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    flexDirection: 'column',
                    gap: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.02,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 10 },
                    width: isDesktop ? 'calc(50% - 10px)' : '100%',
                  }}
                >
                  {/* Info */}
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A2E' }}>{item.serviceName}</Text>
                            <View style={{ backgroundColor: item.status === 'Pendientes' ? '#F47321' : '#10B981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{item.status}</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>{item.petName}</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>• {item.vetName || 'Saku Vet'}</Text>
                          </View>
                       </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 }} />

                    <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 15, alignItems: isDesktop ? 'center' : 'flex-start' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                         <CalendarIcon size={16} color="#6B7280" />
                         <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>{item.date}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                         <Clock size={16} color="#6B7280" />
                         <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>{item.time}</Text>
                      </View>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1A1A2E' }}>Ver detalles</Text>
                        <ChevronRight size={14} color="#1A1A2E" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
