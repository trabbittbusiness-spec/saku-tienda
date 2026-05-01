import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChevronRight, Store, CreditCard, Banknote, HelpCircle, CheckCircle2, MapPin, Copy, Check, Wifi, RefreshCcw, Truck, Home } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { db } from '../../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [copied, setCopied] = React.useState(false);
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    setLoading(true);
    const orderRef = doc(db, 'Orden', id as string);
    
    // Listen for real-time changes
    const unsubscribe = onSnapshot(orderRef, (orderSnap) => {
      if (orderSnap.exists()) {
        const data = orderSnap.data();
        const rawStatus = (data.estado || 'pendiente').toLowerCase();
        
        // Map to local order object
        setOrder({
          id: orderSnap.id,
          status: rawStatus,
          statusStep: rawStatus === 'entregado' ? 2 : rawStatus === 'enviado' ? 1 : 0,
          type: data.tipoEntrega === 'home' ? 'Entrega a Domicilio' : 'Retiro en Sucursal',
          date: data.fechaCreacion || 'Fecha no disponible',
          items: (data.items || []).map((item: any) => ({
            name: item.nombre || item.name || 'Producto',
            image: item.foto || item.image || 'https://via.placeholder.com/150',
            qty: item.cantidad || 1,
            price: item.precio || 0
          })),
          branch: {
            name: data.tipoEntrega === 'home' ? 'Entrega Personal' : 'Saku Vet Central',
            address: data.tipoEntrega === 'home' ? (data.direccion?.texto || `${data.direccion?.main}, ${data.direccion?.sub}`) : 'Av. Providencia 1234, Local 5'
          },
          payment: data.metodoPago === 'cash' ? 'Efectivo / Transfer' : 'Tarjeta Bancaria',
          subtotal: data.subtotal || data.total || 0,
          shipping: data.envio === 0 ? 'Gratis' : `$${data.envio}`,
          total: data.total || 0,
          codigoRetiro: data.codigoRetiro || orderSnap.id
        });
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to order:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { label: 'Pendiente', icon: CheckCircle2 },
    { label: 'Enviado', icon: Truck },
    { label: 'Entregado', icon: Home }
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800' }}>Orden no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#63348C', fontWeight: '900' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top Nav */}
      <View style={{ 
        paddingHorizontal: isDesktop ? 40 : 20, paddingVertical: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}
        >
          <ArrowLeft size={18} color="#111827" />
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>Ayuda con esta orden</Text>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#6B7280' }}>?</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: isDesktop ? 40 : 20, 
          paddingTop: 10,
          paddingBottom: isDesktop ? 60 : 140, 
          width: '100%' 
        }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Main Status Header Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: isDesktop ? 20 : 15, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', gap: isDesktop ? 30 : 20 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', gap: isDesktop ? 15 : 10 }}>
                <TouchableOpacity 
                  onPress={() => copyToClipboard(order.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Text style={{ fontSize: isDesktop ? 28 : 20, fontWeight: '900', color: '#111827' }} numberOfLines={1}>{order.id}</Text>
                  {copied ? <Check size={16} color="#63348C" /> : <Copy size={16} color="#9CA3AF" />}
                </TouchableOpacity>
                <View style={{ backgroundColor: order.status === 'entregado' ? '#F0FDF4' : order.status === 'enviado' ? '#EFF6FF' : '#FFFBEB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: order.status === 'entregado' ? '#10B981' : order.status === 'enviado' ? '#3B82F6' : '#D97706' }} />
                  <Text style={{ fontSize: 11, fontWeight: '900', color: order.status === 'entregado' ? '#10B981' : order.status === 'enviado' ? '#3B82F6' : '#D97706' }}>{order.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ fontSize: isDesktop ? 14 : 12, color: '#9CA3AF', fontWeight: '600', marginTop: 8 }}>{order.type} • {order.date}</Text>
            </View>

            {/* Status Steps Tracker */}
            <View style={{ flex: 1.5, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <View style={{ position: 'absolute', left: '5%', right: '5%', top: 16, height: 2, backgroundColor: '#F3F4F6', zIndex: -1 }} />
                <View style={{ position: 'absolute', left: '5%', width: `${(order.statusStep / 2) * 90}%`, top: 16, height: 2, backgroundColor: '#111827', zIndex: -1 }} />

                {steps.map((step, idx) => {
                  const isActive = idx <= order.statusStep;
                  const isCurrent = idx === order.statusStep;
                  return (
                    <View key={idx} style={{ alignItems: 'center', gap: 8 }}>
                      <View style={{ 
                        width: 32, height: 32, borderRadius: 16, backgroundColor: isActive ? '#111827' : '#FFFFFF', 
                        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: isActive ? '#111827' : '#F3F4F6'
                      }}>
                        {isCurrent ? (
                           <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                        ) : (
                           <step.icon size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} strokeWidth={3} />
                        )}
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: isActive ? '800' : '600', color: isActive ? '#111827' : '#9CA3AF' }}>{step.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24 }}>
          {/* Left Column: QR Card / Delivery Status */}
          <View style={{ flex: isDesktop ? 1.1 : undefined }}>
            <View style={{ 
              backgroundColor: '#111827', borderRadius: 32, overflow: 'hidden',
              shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }
            }}>
              {/* Card Header with Gradient */}
              <View style={{ padding: isDesktop ? 20 : 15, alignItems: 'center', backgroundColor: '#1F2937' }}>
                <Text style={{ color: '#FFFFFF', fontSize: isDesktop ? 20 : 16, fontWeight: '900' }}>Código de Retiro</Text>
              </View>

              <View style={{ padding: isDesktop ? 25 : 20, alignItems: 'center', marginTop: isDesktop ? -10 : 0 }}>
                <View style={{ 
                  backgroundColor: '#FFFFFF', padding: isDesktop ? 20 : 15, borderRadius: 24, 
                  shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20,
                  width: '100%', maxWidth: isDesktop ? 240 : 200
                }}>
                  <Image 
                    source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + order.id }} 
                    style={{ width: isDesktop ? 180 : 150, height: isDesktop ? 180 : 150, alignSelf: 'center' }} 
                    resizeMode="contain"
                  />
                  
                  <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: isDesktop ? 15 : 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E5E7EB' }} />
                  
                  <TouchableOpacity 
                    onPress={() => copyToClipboard(order.codigoRetiro || order.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <Text style={{ fontSize: isDesktop ? 18 : 14, fontWeight: '900', color: '#111827', textAlign: 'center', letterSpacing: isDesktop ? 2 : 1 }}>
                      {order.codigoRetiro || order.id}
                    </Text>
                    <Copy size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: isDesktop ? 20 : 15, gap: 6, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={{ color: '#FFFFFF', fontSize: isDesktop ? 13 : 11, fontWeight: '700' }}>Listo para entrega</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: isDesktop ? 11 : 10, fontWeight: '500', textAlign: 'center', lineHeight: isDesktop ? 16 : 14 }}>
                    Muestra este código al personal en sucursal.
                  </Text>
                </View>
              </View>

              {/* Card Footer Decoration */}
              <View style={{ height: 8, backgroundColor: '#111827' }} />
            </View>
          </View>

          {/* Middle Column: Products */}
          <View style={{ flex: isDesktop ? 1.2 : undefined }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: isDesktop ? 20 : 15, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: isDesktop ? 16 : 14, fontWeight: '900', color: '#111827' }}>Tus Productos</Text>
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                   <Text style={{ fontSize: 10, fontWeight: '800', color: '#6B7280' }}>{order.items.length} ítems</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12 }}>
                    <Image source={{ uri: item.image }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: isDesktop ? 13 : 12, fontWeight: '800', color: '#111827' }} numberOfLines={1}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 1 }}>x{item.qty} • ${item.price.toLocaleString("de-DE")} CLP</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column: Branch & Payment & Totals */}
          <View style={{ flex: isDesktop ? 1 : undefined }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: isDesktop ? 20 : 15, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ gap: isDesktop ? 15 : 20 }}>
                {/* Branch / Delivery Address */}
                <View>
                    <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                      {order.type.includes('Retiro') ? 'Sucursal de Retiro' : 'Dirección de Entrega'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                       <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                          {order.type.includes('Retiro') ? <Store size={14} color="#F47321" /> : <MapPin size={14} color="#F47321" />}
                       </View>
                       <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{order.branch.name}</Text>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 1 }} numberOfLines={1}>{order.branch.address}</Text>
                       </View>
                    </View>
                </View>

                {/* Payment */}
                <View>
                   <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Método de Pago</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
                         <Banknote size={14} color="#10B981" />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{order.payment}</Text>
                   </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

                {/* Totals Summary */}
                <View style={{ gap: 8 }}>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>Subtotal</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>${order.subtotal.toLocaleString("de-DE")} CLP</Text>
                   </View>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>Envío</Text>
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#10B981' }}>{order.shipping}</Text>
                   </View>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, alignItems: 'center' }}>
                   <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase' }}>Total Pagado</Text>
                   <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>${order.total.toLocaleString("de-DE")} CLP</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
