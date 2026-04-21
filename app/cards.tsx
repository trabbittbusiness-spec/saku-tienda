import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CardsScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 1024;
  const [showAddForm, setShowAddForm] = React.useState(false);

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
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Mis tarjetas</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {/* Default Card Visual */}
          <View style={{
            width: '100%', height: 210, borderRadius: 24, padding: 25,
            backgroundColor: '#0F1B2D', marginBottom: 15,
            justifyContent: 'space-between', overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }
          }}>
            {/* Top row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <CreditCard size={24} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', fontStyle: 'italic' }}>mastercard</Text>
            </View>

            {/* Card number */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>••••</Text>
              <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>••••</Text>
              <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>••••</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>4242</Text>
            </View>

            {/* Bottom row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>TITULAR</Text>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 }}>USUARIO SAKU</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>EXP</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>12/25</Text>
              </View>
            </View>

            {/* Decorative patterns */}
            <View style={{ position: 'absolute', top: -30, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.03)' }} />
          </View>

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 30 }}>
            <Text style={{ fontSize: 18 }}>🗑️</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>Eliminar predeterminada</Text>
          </TouchableOpacity>

          {/* Form Toggle Button */}
          {!showAddForm ? (
            <TouchableOpacity 
              onPress={() => setShowAddForm(true)}
              style={{
                height: 60, borderWidth: 2, borderColor: '#111827', borderRadius: 16,
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 30
              }}
            >
              <Plus size={20} color="#111827" strokeWidth={3} />
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }}>Agregar nueva tarjeta</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowAddForm(false)}
              style={{
                height: 60, backgroundColor: '#F3F4F6', borderRadius: 16,
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 30
              }}
            >
              <Text style={{ fontSize: 20 }}>✕</Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#6B7280' }}>Cancelar</Text>
            </TouchableOpacity>
          )}

          {showAddForm ? (
            <View style={{ gap: 25, marginBottom: 40 }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Nueva tarjeta</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                   <Text style={{ fontSize: 14 }}>🔒</Text>
                   <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>Conexión cifrada y segura</Text>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>NÚMERO DE TARJETA</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                  <CreditCard size={18} color="#9CA3AF" />
                  <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} placeholder="0000 0000 0000 0000" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>EXPIRACIÓN</Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, justifyContent: 'center' }}>
                    <TextInput style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} placeholder="MM/YY" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>CVV</Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, justifyContent: 'center' }}>
                    <TextInput style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} placeholder="123" />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setShowAddForm(false)}
                style={{ backgroundColor: '#10B981', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Guardar tarjeta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Other Cards List */
            <View style={{ gap: 15 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F3F4F6',
                shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
                    <CreditCard size={20} color="#9CA3AF" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }}>Visa terminada en 1234</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>Expira el 09/24</Text>
                  </View>
                </View>
                <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 40, width: '100%', maxWidth: 1400, alignSelf: 'center', flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 }}
          >
            <ArrowLeft size={16} color="#111827" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Volver al inicio</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', position: 'absolute', left: 0, right: 0, zIndex: -1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Mis tarjetas</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>Billetera digital</Text>
          </View>
          <View style={{ width: 140 }} />
        </View>

        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 40 }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 30 }}>

          {/* Left Column - Default Card */}
          <View style={{
            width: 360, borderRadius: 24, padding: 30,
            borderWidth: 1, borderColor: '#F3F4F6'
          }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginBottom: 4 }}>TARJETA PREDETERMINADA</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 25 }}>Esta tarjeta se usará para tus futuras compras.</Text>

            {/* Credit Card Visual */}
            <View style={{
              width: '100%', height: 200, borderRadius: 20, padding: 25,
              backgroundColor: '#0F1B2D',
              justifyContent: 'space-between', overflow: 'hidden'
            }}>
              {/* Top row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ width: 40, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                  <CreditCard size={18} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}>mastercard</Text>
              </View>

              {/* Card number */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 15 }}>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}>••••</Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}>••••</Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}>••••</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 }}>4242</Text>
              </View>

              {/* Bottom row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15 }}>
                <View>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>TITULAR</Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>USUARIO SAKU</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>EXP</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>12/25</Text>
                </View>
              </View>

              {/* Decorative circles */}
              <View style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.03)' }} />
              <View style={{ position: 'absolute', bottom: -50, left: -20, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.02)' }} />
            </View>

            {/* Delete default */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              <Trash2 size={14} color="#EF4444" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Eliminar predeterminada</Text>
            </TouchableOpacity>

            {/* Add new card button */}
            <TouchableOpacity style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14,
              marginTop: 20, gap: 8
            }}>
              <Plus size={16} color="#111827" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Agregar nueva tarjeta</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column - Other Saved Cards */}
          <View style={{
            flex: 1, borderRadius: 24, padding: 30,
            borderWidth: 1, borderColor: '#F3F4F6'
          }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 4 }}>Otras tarjetas guardadas</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 25 }}>Haz clic en una tarjeta para establecerla como predeterminada.</Text>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 20 }} />

            {/* Card list item */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#F9FAFB', borderRadius: 16, padding: 18
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                  <CreditCard size={20} color="#6366F1" />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Visa terminada en 1234</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>Expira el 09/24</Text>
                </View>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
