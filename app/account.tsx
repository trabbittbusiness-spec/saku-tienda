import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { ArrowLeft, Camera, User, Mail, Phone, CreditCard, CheckCircle, Clock, PawPrint } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 1024;
  
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
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Mi Cuenta</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25 }}>
          {/* Profile Section */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 }}>
              <Text style={{ fontSize: 48, fontWeight: '900', color: '#111827' }}>U</Text>
              <TouchableOpacity style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}>
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 20 }}>Usuario Saku</Text>
            <Text style={{ fontSize: 15, color: '#9CA3AF', fontWeight: '600', marginTop: 4 }}>usuario@saku.cl</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 20, gap: 8 }}>
              <PawPrint size={16} color="#10B981" />
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#10B981' }}>240 puntos Saku</Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={{ gap: 25 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>NOMBRE COMPLETO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderWeight: 1, borderColor: '#F3F4F6', paddingHorizontal: 16, height: 56, gap: 12 }}>
                <User size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} value="Usuario Saku" />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1 }}>CORREO ELECTRÓNICO</Text>
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#9CA3AF' }}>NO EDITABLE</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                <Mail size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#9CA3AF' }} value="usuario@saku.cl" editable={false} />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>TELÉFONO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                <Phone size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} value="+56 9 1234 5678" />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>RUT / DOCUMENTO DE IDENTIDAD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                <CreditCard size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} value="18.123.456-7" />
              </View>
            </View>
          </View>

          <TouchableOpacity style={{ backgroundColor: '#10B981', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 40, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Guardar cambios</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 40, width: '100%', maxWidth: 1400, alignSelf: 'center', flexGrow: 1 }}>
        
        {/* Superior Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 }}
          >
            <ArrowLeft size={16} color="#111827" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Volver al inicio</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', position: 'absolute', left: 0, right: 0, zIndex: -1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Mi cuenta</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>Gestión de perfil</Text>
          </View>

          <View style={{ width: 140 }} />
        </View>

        {/* Dashboard 2 Column Grid */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 30 }}>
            
          {/* Left Sidebar Profile Card */}
          <View style={{ 
            width: 320, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30,
            borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.02, shadowRadius: 20
          }}>
             <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }}>
                   <Text style={{ fontSize: 40, fontWeight: '900', color: '#111827' }}>U</Text>
                   <TouchableOpacity style={{ position: 'absolute', bottom: 5, right: 5, width: 30, height: 30, borderRadius: 15, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                      <Camera size={14} color="white" />
                   </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 15 }}>Usuario Saku</Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>usuario@saku.cl</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16, gap: 6 }}>
                   <PawPrint size={14} color="#10B981" />
                   <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>240 puntos Saku</Text>
                </View>
             </View>

             <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 25 }} />

             <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 15 }}>TU CUENTA</Text>
             
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <CheckCircle size={18} color="#10B981" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#4B5563' }}>Cuenta verificada</Text>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Clock size={18} color="#6366F1" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#4B5563' }}>Miembro desde 2024</Text>
             </View>
          </View>

          {/* Right Main Content Card */}
          <View style={{ 
            flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40,
            borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.02, shadowRadius: 20
          }}>
             <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Datos personales</Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>Actualiza tu información para una mejor experiencia de compra.</Text>
             </View>

             <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 30 }} />

             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 30 }}>
                {/* Field 1 */}
                <View style={{ flex: 1, minWidth: 300 }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>NOMBRE COMPLETO</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12 }}>
                      <User size={18} color="#9CA3AF" />
                      <TextInput 
                        style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', outlineStyle: 'none' }}
                        defaultValue="Usuario Saku"
                      />
                   </View>
                </View>

                {/* Field 2 */}
                <View style={{ flex: 1, minWidth: 300 }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#4B5563', letterSpacing: 1 }}>CORREO ELECTRÓNICO</Text>
                      <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                         <Text style={{ fontSize: 9, fontWeight: '900', color: '#6B7280' }}>NO EDITABLE</Text>
                      </View>
                   </View>
                   <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12 }}>
                      <Mail size={18} color="#9CA3AF" />
                      <TextInput 
                        style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#9CA3AF', outlineStyle: 'none' }}
                        defaultValue="usuario@saku.cl"
                        editable={false}
                      />
                   </View>
                </View>

                {/* Field 3 */}
                <View style={{ flex: 1, minWidth: 300 }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>TELÉFONO</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12 }}>
                      <Phone size={18} color="#9CA3AF" />
                      <TextInput 
                        style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', outlineStyle: 'none' }}
                        defaultValue="+56 9 1234 5678"
                      />
                   </View>
                </View>

                {/* Field 4 */}
                <View style={{ flex: 1, minWidth: 300 }}>
                   <Text style={{ fontSize: 11, fontWeight: '800', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>RUT / DOCUMENTO DE IDENTIDAD</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12 }}>
                      <CreditCard size={18} color="#9CA3AF" />
                      <TextInput 
                        style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', outlineStyle: 'none' }}
                        defaultValue="18.123.456-7"
                      />
                   </View>
                </View>
             </View>

             {/* Action Button */}
             <View style={{ alignItems: 'flex-end', marginTop: 40 }}>
                <TouchableOpacity style={{ backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 12, shadowColor: '#10B981', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15 }}>
                   <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Guardar cambios</Text>
                </TouchableOpacity>
             </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
