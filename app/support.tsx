import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ChevronDown, ChevronUp, Mail, Phone, MessageCircle, MapPin, Truck, RefreshCcw, HelpCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const FAQ_DATA = [
  {
    question: '¿Cómo puedo rastrear mi pedido?',
    answer: 'Una vez que tu pedido sea despachado, recibirás un número de seguimiento por correo electrónico. También puedes verlo en la sección "Mis Órdenes" de tu perfil.'
  },
  {
    question: '¿Cuáles son los plazos de entrega?',
    answer: 'Para la Región Metropolitana, el plazo es de 24 a 48 horas hábiles. Para otras regiones, el tiempo estimado es de 3 a 5 días hábiles dependiendo de la localidad.'
  },
  {
    question: '¿Qué hago si mi producto llegó dañado?',
    answer: 'Lamentamos el inconveniente. Por favor contáctanos de inmediato a través de nuestro WhatsApp de soporte o envía un correo a contacto@saku.cl con fotos del producto y el empaque.'
  },
  {
    question: '¿Tienen tiendas físicas?',
    answer: 'Sí, contamos con tiendas físicas en Providencia y Las Condes. Puedes revisar las direcciones exactas en la sección "Tiendas Físicas" de nuestro sitio.'
  }
];

export default function SupportScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const SectionHeader = ({ title, icon: Icon }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 30 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
        <Icon size={20} color="#63348C" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>{title}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ 
        paddingTop: isDesktop ? 40 : 60, paddingBottom: 20, paddingHorizontal: 20, 
        flexDirection: 'row', alignItems: 'center', gap: 15,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}
        >
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Centro de Ayuda</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Soporte y Preguntas Frecuentes</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={{ maxWidth: 1400, alignSelf: 'center', width: '100%' }}>
          
          <SectionHeader title="Preguntas Frecuentes" icon={HelpCircle} />
          <View style={{ gap: 12 }}>
            {FAQ_DATA.map((faq, idx) => (
              <TouchableOpacity 
                key={idx}
                onPress={() => setOpenIndex(openIndex === idx ? null : idx)}
                style={{ 
                  backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, 
                  borderWidth: 1, borderColor: '#F3F4F6',
                  shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#1F2937', flex: 1 }}>{faq.question}</Text>
                  {openIndex === idx ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />}
                </View>
                {openIndex === idx && (
                  <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 22, fontWeight: '500' }}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <SectionHeader title="Cambios y Devoluciones" icon={RefreshCcw} />
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 24, padding: 25 }}>
            <Text style={{ fontSize: 15, color: '#4B5563', lineHeight: 24, fontWeight: '500' }}>
              Tienes hasta 30 días para realizar cambios o devoluciones. El producto debe estar en su empaque original y sin uso. {'\n\n'}
              Para iniciar el proceso, puedes acudir a cualquiera de nuestras tiendas físicas o solicitar un retiro a domicilio (con costo adicional) a través de nuestro centro de atención.
            </Text>
          </View>

          <SectionHeader title="Contacto Directo" icon={MessageCircle} />
          <View style={{ gap: 12 }}>
            {[
              { label: 'WhatsApp Soporte', value: '+56 9 1234 5678', icon: MessageCircle, color: '#25D366', bg: '#DCFCE7' },
              { label: 'Correo Electrónico', value: 'contacto@saku.cl', icon: Mail, color: '#63348C', bg: '#EEF2FF' },
              { label: 'Llámanos', value: '2 2345 6789', icon: Phone, color: '#63348C', bg: '#FFF7ED' }
            ].map((contact, idx) => (
              <TouchableOpacity 
                key={idx}
                style={{ 
                  flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, 
                  backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' 
                }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: contact.bg, justifyContent: 'center', alignItems: 'center' }}>
                  <contact.icon size={22} color={contact.color} />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#9CA3AF' }}>{contact.label}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>{contact.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
