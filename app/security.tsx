import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, useWindowDimensions } from 'react-native';
import { ArrowLeft, Lock, EyeOff, Eye, CheckCircle, Fingerprint } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SecurityScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 768;
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

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
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Seguridad</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {/* Password Section */}
          <View style={{ marginBottom: 35 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Restablecer contraseña</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 4, lineHeight: 20 }}>Asegúrate de usar una contraseña larga y segura para proteger tu cuenta.</Text>
          </View>

          <View style={{ 
            backgroundColor: '#FFFFFF', borderRadius: 32, padding: 25, borderWidth: 1, borderColor: '#F3F4F6',
            shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 15, marginBottom: 40
          }}>
            <View style={{ gap: 20 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>CONTRASEÑA ACTUAL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput 
                    style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} 
                    placeholder="Ingresa tu contraseña actual" 
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>NUEVA CONTRASEÑA</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput 
                    style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} 
                    placeholder="Mínimo 8 caracteres" 
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    {showNew ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>CONFIRMAR NUEVA CONTRASEÑA</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput 
                    style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }} 
                    placeholder="Repite tu nueva contraseña" 
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={{ backgroundColor: '#10B981', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15 }}>
                <CheckCircle size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Actualizar contraseña</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Biometric Section */}
          <View style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Acceso Biométrico</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 4, lineHeight: 20 }}>Usa tu huella digital o reconocimiento facial para iniciar sesión más rápido.</Text>
          </View>

          <View style={{ 
            backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#F3F4F6',
            shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 15,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                <Fingerprint size={24} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Desbloqueo con Huella/FaceID</Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 4, lineHeight: 18 }}>Inicia sesión de forma segura sin tener que escribir tu contraseña.</Text>
              </View>
            </View>
            <Switch 
              value={biometricEnabled} 
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={biometricEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
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
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Seguridad</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>Contraseña y Accesos</Text>
          </View>
          <View style={{ width: 140 }} />
        </View>

        <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 40 }} />

        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 }}>Restablecer contraseña</Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginBottom: 35 }}>Asegúrate de usar una contraseña larga y segura para proteger tu cuenta.</Text>

          <View style={{
            borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 24, padding: 35
          }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 12 }}>CONTRASEÑA ACTUAL</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12, marginBottom: 28 }}>
              <Lock size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showCurrent}
                style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 12 }}>NUEVA CONTRASEÑA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12, marginBottom: 28 }}>
              <Lock size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNew}
                style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                {showNew ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 12 }}>CONFIRMAR NUEVA CONTRASEÑA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 55, gap: 12, marginBottom: 35 }}>
              <Lock size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Repite tu nueva contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirm}
                style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981',
                paddingHorizontal: 30, paddingVertical: 16, borderRadius: 14, gap: 10,
                shadowColor: '#10B981', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15
              }}>
                <CheckCircle size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Actualizar contraseña</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
