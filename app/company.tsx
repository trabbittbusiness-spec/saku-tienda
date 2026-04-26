import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Heart, Shield, Leaf, Users, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CompanyScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const Feature = ({ icon: Icon, title, desc }: any) => (
    <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <Icon size={32} color="#F47321" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 10, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, fontWeight: '500' }}>{desc}</Text>
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
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Nuestra Compañía</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Historia, Misión y Sustentabilidad</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View style={{ height: isDesktop ? 500 : 300, position: 'relative' }}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200' }} 
            style={{ width: '100%', height: '100%' }} 
            resizeMode="cover"
          />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: isDesktop ? 56 : 32, fontWeight: '900', color: 'white', textAlign: 'center', letterSpacing: -1 }}>Amor por las mascotas,{'\n'}compromiso con el planeta.</Text>
          </View>
        </View>

        <View style={{ maxWidth: 1400, alignSelf: 'center', width: '100%', padding: 20 }}>
          
          {/* History Section */}
          <View style={{ marginTop: 40, marginBottom: 60 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#3B1E54', marginBottom: 20, textAlign: 'center' }}>Nuestra Historia</Text>
            <Text style={{ fontSize: 18, color: '#4B5563', lineHeight: 30, textAlign: 'center', fontWeight: '500' }}>
              Fundada en 2024, Saku nació de una idea simple: las mascotas merecen lo mejor. Comenzamos como una pequeña tienda local y hoy nos convertimos en el ecosistema líder en bienestar animal en Chile, integrando productos premium con servicios veterinarios de alta calidad.
            </Text>
          </View>

          {/* Pillars */}
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 20, marginBottom: 60 }}>
            <Feature 
              icon={Heart} 
              title="Bienestar Animal" 
              desc="Cada producto y servicio es seleccionado bajo estrictos estándares de calidad para asegurar la salud de tu mascota."
            />
            <Feature 
              icon={Shield} 
              title="Calidad Premium" 
              desc="Trabajamos solo con las mejores marcas globales y profesionales veterinarios certificados."
            />
            <Feature 
              icon={Leaf} 
              title="Sustentabilidad" 
              desc="Reducimos nuestra huella de carbono mediante empaques eco-amigables y procesos logísticos optimizados."
            />
          </View>

          {/* Sustainability Deep Dive */}
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 32, padding: 40, flexDirection: isDesktop ? 'row' : 'column', alignItems: 'center', gap: 40 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#166534', marginBottom: 15 }}>Sustentabilidad Saku</Text>
              <Text style={{ fontSize: 16, color: '#166534', lineHeight: 26, fontWeight: '600' }}>
                Creemos en un futuro donde el cuidado animal convive en armonía con el medio ambiente. {'\n\n'}
                • Programas de reciclaje de envases de alimento.{'\n'}
                • Despachos en vehículos eléctricos en zonas urbanas.{'\n'}
                • Apoyo a refugios de animales locales.
              </Text>
            </View>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1542601906970-d4d18ecf0d01?q=80&w=800' }} 
              style={{ width: isDesktop ? 300 : '100%', height: 200, borderRadius: 24 }} 
              resizeMode="cover"
            />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
