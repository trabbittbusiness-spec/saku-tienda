import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { ArrowLeft, MapPin, Plus, Check, Trash2, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import LocationMapModal from '../components/LocationMapModal';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export default function AddressesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 1024;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [defaultAddrId, setDefaultAddrId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'Direcciones'), where('userId', '==', auth.currentUser.uid));
    const unsubAddresses = onSnapshot(q, (snapshot) => {
      const addrList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAddresses(addrList);
      setLoading(false);
    });

    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setDefaultAddrId(docSnap.data().direccionDefault?.id || null);
      }
    });

    return () => {
      unsubAddresses();
      unsubUser();
    };
  }, []);

  const handleSetDefault = async (addr: any) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        direccionDefault: addr
      });
    } catch (e) {
      console.error("Error setting default address:", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'Direcciones', id));
    } catch (e) {
      console.error("Error deleting address:", e);
    }
  };

  const handleSaveNewAddress = async (location: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'Direcciones'), {
        ...location,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error saving address:", e);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Sleek Minimalist Header */}
      <View style={{ 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: isDesktop ? 60 : 20, paddingVertical: 25,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 25 }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: isDesktop ? 26 : 20, fontWeight: '900', color: '#111827' }}>Mis Direcciones</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>{addresses.length} ubicaciones guardadas</Text>
          </View>
        </View>

        {/* THE ONLY ADD BUTTON (HEADER) */}
        <TouchableOpacity 
          onPress={() => setIsModalOpen(true)}
          style={{ 
            backgroundColor: '#10B981', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
            flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#10B981', shadowOpacity: 0.15, shadowRadius: 15
          }}
        >
          <Plus size={20} color="white" strokeWidth={3} />
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Nueva Dirección</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: isDesktop ? 60 : 20, paddingTop: 40 }}>
          
          {addresses.length > 0 ? (
            <View style={{ gap: 16 }}>
              {addresses.map((addr) => {
                const isDefault = defaultAddrId === addr.id;
                return (
                  <TouchableOpacity 
                    key={addr.id}
                    onPress={() => handleSetDefault(addr)}
                    activeOpacity={0.8}
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', padding: isDesktop ? 24 : 18,
                      backgroundColor: isDefault ? '#FFF7F0' : '#FFFFFF', 
                      borderRadius: 24, borderWidth: 1, borderColor: isDefault ? '#F47321' : '#F3F4F6',
                    }}
                  >
                    {/* Icon Column */}
                    <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: isDefault ? '#F47321' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                      <MapPin size={26} color={isDefault ? 'white' : '#9CA3AF'} />
                    </View>

                    {/* Content Column */}
                    <View style={{ flex: 1, marginHorizontal: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>{addr.category || 'Dirección'}</Text>
                        {isDefault && (
                          <View style={{ backgroundColor: '#F4732115', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#F47321' }}>PRINCIPAL</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>{addr.main}, {addr.sub}</Text>
                    </View>

                    {/* Actions Column */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity 
                        onPress={() => handleDelete(addr.id)}
                        style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <ChevronRight size={20} color="#D1D5DB" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
                <MapPin size={40} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 }}>Sin direcciones aún</Text>
              <Text style={{ fontSize: 15, color: '#9CA3AF', fontWeight: '500', textAlign: 'center', maxWidth: 300, lineHeight: 22 }}>
                Tus direcciones guardadas aparecerán aquí. Agrega una para agilizar tus pedidos.
              </Text>
            </View>
          )}

        </View>
      </ScrollView>

      <LocationMapModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveNewAddress}
      />
    </View>
  );
}
