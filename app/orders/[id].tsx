import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { ArrowLeft, ChevronRight, Store, CreditCard, Banknote, HelpCircle, CheckCircle2, MapPin, Copy, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const order = {
    id: id || '4SO37PDSNQV',
    status: 'PENDIENTE',
    statusStep: 2, // 0: Pagado, 1: Preparando, 2: Listo, 3: Entregado
    type: 'Retiro en Sucursal',
    date: '20 abr 2026, 06:33 p. m.',
    items: [
      { name: 'Orijen Cat & Kitten 1.8kg', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=200', qty: 1, price: 38000 },
      { name: 'BRIT CARE GRAIN FREE SENIOR &...', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=200', qty: 1, price: 74990 }
    ],
    branch: {
      name: 'Saku Vet Central',
      address: 'Av. Providencia 1234, Local 5'
    },
    payment: 'Efectivo',
    subtotal: 112990,
    shipping: 'Gratis',
    total: 112990
  };

  const steps = [
    { label: 'Pagado', icon: CheckCircle2 },
    { label: 'Preparando', icon: CheckCircle2 },
    { label: 'Listo', icon: CheckCircle2 },
    { label: 'Entregado', icon: Store }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Top Nav */}
      <View style={{ 
        paddingHorizontal: isDesktop ? 40 : 20, paddingVertical: 20,
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: isDesktop ? 40 : 20, paddingBottom: 60, width: '100%' }}>
        
        {/* Main Status Header Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 25 }}>
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', gap: 30 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <TouchableOpacity 
                  onPress={() => copyToClipboard(order.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>{order.id}</Text>
                  {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#9CA3AF" />}
                </TouchableOpacity>
                <View style={{ backgroundColor: '#10B98120', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#10B981' }}>{order.status}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 8 }}>{order.type} • {order.date}</Text>
            </View>

            {/* Status Steps Tracker */}
            <View style={{ flex: 1.5, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <View style={{ position: 'absolute', left: '5%', right: '5%', top: 16, height: 2, backgroundColor: '#F3F4F6', zIndex: -1 }} />
                <View style={{ position: 'absolute', left: '5%', width: `${(order.statusStep / 3) * 90}%`, top: 16, height: 2, backgroundColor: '#111827', zIndex: -1 }} />

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
                           <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
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

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 30 }}>
          {/* Left Column: QR Card */}
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#0A1931', borderRadius: 32, padding: 30, alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>PASE DE RETIRO DIGITAL</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>Código de Retiro</Text>
              </View>

              <View style={{ backgroundColor: '#FFFFFF', padding: 25, borderRadius: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, width: '100%', maxWidth: 220, alignSelf: 'center' }}>
                <Image 
                  source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + order.id }} 
                  style={{ width: 160, height: 160, alignSelf: 'center' }} 
                  resizeMode="contain"
                />
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 15, borderStyle: 'dashed' }} />
                <TouchableOpacity 
                  onPress={() => copyToClipboard(order.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', textAlign: 'center', letterSpacing: 2 }}>{order.id}</Text>
                  <Copy size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 20, lineHeight: 18 }}>
                Presenta este código en sucursal{"\n"}para retirar tu pedido.
              </Text>
            </View>
          </View>

          {/* Middle Column: Products */}
          <View style={{ flex: 1.2 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Tus Productos</Text>
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: '#6B7280' }}>{order.items.length} ítems</Text>
                </View>
              </View>

              <View style={{ gap: 15 }}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16 }}>
                    <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>x{item.qty} • ${item.price.toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column: Branch & Payment & Totals */}
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ gap: 25 }}>
                {/* Branch */}
                <View>
                   <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Sucursal de Retiro</Text>
                   <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                         <Store size={16} color="#111827" />
                      </View>
                      <View>
                         <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{order.branch.name}</Text>
                         <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 1 }}>{order.branch.address}</Text>
                      </View>
                   </View>
                </View>

                {/* Payment */}
                <View>
                   <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Método de Pago</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                         <Banknote size={16} color="#111827" />
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{order.payment}</Text>
                   </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

                {/* Totals Summary */}
                <View style={{ gap: 10 }}>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Subtotal</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>${order.subtotal.toLocaleString()}</Text>
                   </View>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Envío</Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981' }}>{order.shipping}</Text>
                   </View>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', padding: 20, borderRadius: 24, alignItems: 'center' }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Total Pagado</Text>
                   <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>${order.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
