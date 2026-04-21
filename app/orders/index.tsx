import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { ArrowLeft, ChevronRight, Store, Clock, Package, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [filter, setFilter] = useState('Todas');

  const orders = [
    {
      id: '4SO37PDSNQV',
      status: 'Pendiente',
      total: 112990,
      date: '20 abr 2026, 06:33 p. m.',
      items: [
        { name: 'Orijen Cat & Kitten 1.8kg', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200' },
        { name: 'Brit Care Grain Free Senior...', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=200' }
      ],
      type: 'Retiro'
    }
  ];

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
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>1 pedidos • 0 activos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: isDesktop ? 40 : 20, paddingVertical: 30, width: '100%' }}>
        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
          {['Todas', 'Pendiente', 'Enviado', 'Entregado'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setFilter(tab)}
              style={{ 
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
                backgroundColor: filter === tab ? '#111827' : '#FFFFFF',
                borderWidth: 1, borderColor: filter === tab ? '#111827' : '#F3F4F6'
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: filter === tab ? '#FFFFFF' : '#6B7280' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600', alignSelf: 'center' }}>1 resultados</Text>
        </View>

        {/* Orders List */}
        <View style={{ gap: 20 }}>
          {orders.map((order) => (
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
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{order.items[0].name}</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>y {order.items.length - 1} producto más</Text>
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
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Ver detalles</Text>
                    <ChevronRight size={16} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
