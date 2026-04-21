import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ArrowLeft, MapPin, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import LocationMapModal from '../components/LocationMapModal';

export default function AddressesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 768;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ 
          height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 20, width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Mis Direcciones</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>1 dirección guardada</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          <View style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Tus direcciones</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 4 }}>La dirección principal se usará por defecto en tus pedidos</Text>
          </View>

          {/* Address Card - Orange Style */}
          <TouchableOpacity style={{ 
            borderWidth: 2, borderColor: '#F47321', borderRadius: 24, padding: 16, backgroundColor: '#FFFFFF',
            flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 15
          }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
              <MapPin size={22} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Dirección</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Nueva Providencia 1515, Providencia</Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#F47321', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '900' }}>✓</Text>
            </View>
          </TouchableOpacity>

          {/* Add New Address - Orange Style */}
          <TouchableOpacity 
            onPress={() => setIsModalOpen(true)}
            style={{ 
              height: 60, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 20,
              flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 30
            }}
          >
            <Plus size={18} color="#F47321" strokeWidth={3} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#F47321' }}>Agregar nueva dirección</Text>
          </TouchableOpacity>
        </ScrollView>

        <LocationMapModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(location) => {
            setIsModalOpen(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 40, width: '100%', flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 }}
          >
            <ArrowLeft size={16} color="#111827" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Volver</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', position: 'absolute', left: 0, right: 0, zIndex: -1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Mis Direcciones</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>0 direcciones guardadas</Text>
          </View>
          <View style={{ width: 100 }} />
        </View>

        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 30 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
          <View>
             <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Tus direcciones</Text>
             <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>La dirección principal se usará por defecto en tus pedidos</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsModalOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, gap: 8 }}
          >
             <Plus size={16} color="white" />
             <Text style={{ fontSize: 14, fontWeight: '800', color: 'white' }}>Agregar dirección</Text>
          </TouchableOpacity>
        </View>


        <View style={{ alignItems: 'center', flex: 1, marginTop: 40, paddingBottom: 50 }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
             <MapPin size={28} color="#9CA3AF" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 }}>Sin direcciones aún</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>Agrega tu primera dirección para agilizar tus compras</Text>
        </View>
      </ScrollView>

      <LocationMapModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(location) => {
          console.log('Location saved:', location);
          setIsModalOpen(false);
        }}
      />
    </View>
  );
}
