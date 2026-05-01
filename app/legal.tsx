import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { FileText, Shield, Scale, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function LegalScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const LegalSection = ({ title, content }: any) => (
    <View style={{ marginBottom: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 15 }}>{title}</Text>
      <Text style={{ fontSize: 15, color: '#4B5563', lineHeight: 24, fontWeight: '500' }}>{content}</Text>
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
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Información Legal</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Términos, Privacidad y Bases Legales</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 100 }}>
        <View style={{ maxWidth: 1400, alignSelf: 'center', width: '100%' }}>
          
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 40 }}>
            {[
              { label: 'Términos', icon: FileText, color: '#63348C' },
              { label: 'Privacidad', icon: Shield, color: '#63348C' },
              { label: 'Bases', icon: Scale, color: '#63348C' }
            ].map((item, idx) => (
              <View key={idx} style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 15, alignItems: 'center' }}>
                <item.icon size={24} color={item.color} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#4B5563', marginTop: 8 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          <LegalSection 
            title="Términos de Servicio" 
            content="Al utilizar los servicios de Saku Ecommerce, aceptas cumplir con nuestros términos y condiciones. Nos reservamos el derecho de actualizar estos términos en cualquier momento para reflejar cambios en nuestras operaciones o regulaciones legales. Los precios y disponibilidad de productos están sujetos a cambios sin previo aviso."
          />

          <LegalSection 
            title="Políticas de Privacidad" 
            content="Tu privacidad es nuestra prioridad. Recopilamos datos mínimos necesarios para procesar tus pedidos y mejorar tu experiencia de compra. Nunca compartiremos tu información personal con terceros sin tu consentimiento explícito, excepto cuando sea requerido por ley para el procesamiento de pagos o despacho."
          />

          <LegalSection 
            title="Bases Legales de Promociones" 
            content="Todas nuestras promociones (Ofertas Flash, Cupones, etc.) tienen una vigencia limitada y están sujetas a stock disponible. Los descuentos no son acumulables a menos que se indique lo contrario. Para eventos especiales como CyberDay, las bases específicas serán publicadas con 48 horas de antelación."
          />

          <LegalSection 
            title="Política de Cookies" 
            content="Utilizamos cookies para personalizar el contenido, analizar el tráfico y recordar tus preferencias (como tu dirección de despacho). Puedes configurar el uso de cookies desde los ajustes de tu navegador o nuestra herramienta de configuración de cookies en el pie de página."
          />

        </View>
      </ScrollView>
    </View>
  );
}
