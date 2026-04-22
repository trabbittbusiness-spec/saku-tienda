import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChevronRight, Store, Clock, Package, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, doc, getDocs, getDoc, onSnapshot } from 'firebase/firestore';

let cachedOrders: any[] | null = null;

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [filter, setFilter] = useState('Todas');
  const [orders, setOrders] = useState<any[]>(cachedOrders || []);
  const [loading, setLoading] = useState(!cachedOrders);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const q = query(
          collection(db, 'Orden'),
          where('creador', '==', userRef)
        );
        
        unsubscribeSnapshot = onSnapshot(q, async (querySnapshot) => {
          try {
            const ordersData = [];

            for (const docSnapshot of querySnapshot.docs) {
              const data = docSnapshot.data();
              
              // Format date
              let dateStr = 'Fecha desconocida';
              if (data.fechaCreacion && data.fechaCreacion.toDate) {
                dateStr = data.fechaCreacion.toDate().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
              } else if (typeof data.fechaCreacion === 'string') {
                dateStr = data.fechaCreacion;
              }

              // Process items from snapshot if directly available
              const items = [];
              if (data.items && Array.isArray(data.items)) {
                for (const item of data.items) {
                  items.push({
                    name: item.nombre || item.name || 'Producto',
                    image: item.foto || item.image || 'https://via.placeholder.com/150'
                  });
                }
              } else if (data.ID_productos && Array.isArray(data.ID_productos)) {
                // Fallback to legacy reference-based system
                for (const prodRef of data.ID_productos) {
                  try {
                    const prodSnap = await getDoc(prodRef);
                    if (prodSnap.exists()) {
                      const prodData = prodSnap.data();
                      items.push({ 
                        name: prodData.nombre || prodData.name || 'Producto', 
                        image: prodData.foto1 || prodData.image || 'https://via.placeholder.com/150' 
                      });
                    }
                  } catch(e) {
                    console.error("Error fetching product details for order", e);
                  }
                }
              }

              ordersData.push({
                id: data.ID_orden || docSnapshot.id,
                status: data.estado || 'Pendiente',
                total: data.total || data.amount || 0,
                date: dateStr,
                items: items.length > 0 ? items : [{ name: 'Sin productos', image: 'https://via.placeholder.com/150' }],
                type: (data.tipoEntrega || data.tipodeentrega) === 'store' ? 'Retiro' : 'Delivery',
                rawDate: data.fechaCreacion && data.fechaCreacion.toDate ? data.fechaCreacion.toDate().getTime() : 0
              });
            }

            // Sort descending by date
            ordersData.sort((a, b) => b.rawDate - a.rawDate);
            
            cachedOrders = ordersData;
            setOrders(ordersData);
          } catch (error) {
            console.error('Error in orders snapshot:', error);
          } finally {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
      unsubscribeAuth();
    };
  }, []);

  const filteredOrders = orders.filter(o => filter === 'Todas' || o.status === filter);
  
  const ITEMS_PER_PAGE = 7;
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: '#FFFFFF', paddingVertical: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
      }}>
        {!isDesktop && (
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 20, width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
        )}

        {isDesktop && (
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 40, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
          >
            <ArrowLeft size={18} color="#111827" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Volver</Text>
          </TouchableOpacity>
        )}

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Mis Órdenes</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>{orders.length} pedidos • {orders.filter(o => o.status === 'Pendiente').length} activos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: isDesktop ? 40 : 20, paddingVertical: 30, width: '100%' }}>
        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
          {['Todas', 'Pendiente', 'Enviado', 'Entregado'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => {
                setFilter(tab);
                setCurrentPage(1);
              }}
              style={{ 
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
                backgroundColor: filter === tab ? '#111827' : '#FFFFFF',
                borderWidth: 1, borderColor: filter === tab ? '#111827' : '#F3F4F6'
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: filter === tab ? '#FFFFFF' : '#6B7280' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders List */}
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : paginatedOrders.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Package size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 15 }}>No hay órdenes en esta categoría</Text>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            {paginatedOrders.map((order) => (
            <View key={order.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 }}>
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', alignItems: isDesktop ? 'center' : 'flex-start', gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>#{order.id}</Text>
                  <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' }} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>{order.status}</Text>
                  </View>
                </View>

                <View style={{ alignItems: isDesktop ? 'flex-end' : 'flex-start' }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>${order.total.toLocaleString()}</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 4 }}>{order.date}</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#F9FAFB', marginVertical: 25 }} />

              <View style={{ flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', alignItems: isDesktop ? 'center' : 'flex-start', gap: 25 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={{ 
                        width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#FFFFFF',
                        marginLeft: idx === 0 ? 0 : -15, overflow: 'hidden'
                      }}>
                        <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} />
                      </View>
                    ))}
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{order.items[0]?.name}</Text>
                    {order.items.length > 1 && (
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>y {order.items.length - 1} producto{order.items.length - 1 !== 1 ? 's' : ''} más</Text>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Store size={16} color="#6B7280" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#6B7280' }}>{order.type}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => router.push(`/orders/${order.id}` as any)}
                    style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#3B1E54' }}>Ver detalles</Text>
                    <ChevronRight size={16} color="#3B1E54" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 40 }}>
            <TouchableOpacity 
              disabled={currentPage === 1}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: currentPage === 1 ? '#F9FAFB' : '#111827', justifyContent: 'center', alignItems: 'center', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ArrowLeft size={20} color={currentPage === 1 ? '#9CA3AF' : '#FFFFFF'} />
            </TouchableOpacity>
            
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Página {currentPage} de {totalPages}</Text>

            <TouchableOpacity 
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: currentPage === totalPages ? '#F9FAFB' : '#111827', justifyContent: 'center', alignItems: 'center', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              <ChevronRight size={20} color={currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
