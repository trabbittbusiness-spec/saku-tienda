import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, useWindowDimensions, ActivityIndicator } from 'react-native';
import { ArrowLeft, Lock, EyeOff, Eye, CheckCircle, AlertCircle, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { auth } from '../lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

// Define PasswordInput OUTSIDE to prevent focus loss on re-render
const PasswordInput = ({ label, placeholder, value, onChangeText, show, onToggleShow, isDesktop }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: isDesktop ? 28 : 20 }}>
      <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>{label}</Text>
      <View style={{ 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', 
        borderWidth: 2, 
        borderColor: isFocused ? '#111827' : '#E5E7EB', // Dark blue/purple on focus
        borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12,
        shadowColor: isFocused ? '#111827' : 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isFocused ? 0.1 : 0,
        shadowRadius: 10,
        elevation: isFocused ? 2 : 0
      }}>
        <Lock size={18} color={isFocused ? '#111827' : '#9CA3AF'} />
        <TextInput 
          style={[{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' }, { outlineStyle: 'none' } as any]} 
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!show}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <TouchableOpacity onPress={onToggleShow}>
          {show ? <Eye size={20} color={isFocused ? '#111827' : '#9CA3AF'} /> : <EyeOff size={20} color={isFocused ? '#111827' : '#9CA3AF'} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function SecurityScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 768;
  
  // State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  
  // UI State
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Snackbar State
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });
  const snackbarY = useSharedValue(100);

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ visible: true, message, type });
    snackbarY.value = withTiming(0, { duration: 300 });
    
    // Auto hide
    setTimeout(() => {
      snackbarY.value = withTiming(100, { duration: 300 }, () => {
        // setSnackbar({ ...snackbar, visible: false });
      });
    }, 4000);
  };

  const animatedSnackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: snackbarY.value }],
    opacity: snackbarY.value === 100 ? 0 : 1
  }));

  const handleUpdatePassword = async () => {
    if (!auth.currentUser) return;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showSnackbar('Por favor completa todos los campos', 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      showSnackbar('La nueva contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showSnackbar('Las nuevas contraseñas no coinciden', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // 2. Update Password
      await updatePassword(auth.currentUser, newPassword);
      
      showSnackbar('¡Contraseña actualizada con éxito!', 'success');
      
      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showSnackbar('La contraseña actual es incorrecta', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showSnackbar('Demasiados intentos. Intenta más tarde.', 'error');
      } else {
        showSnackbar('Error al actualizar la contraseña. Intenta de nuevo.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: isDesktop ? 40 : 20, width: '100%', maxWidth: 1400, alignSelf: 'center', flexGrow: 1 }}>
        
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, paddingTop: isDesktop ? 0 : 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 }}
          >
            <ArrowLeft size={16} color="#111827" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{isDesktop ? 'Volver al inicio' : 'Atrás'}</Text>
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center', position: 'absolute', left: 0, right: 0, zIndex: -1 }}>
            <Text style={{ fontSize: isDesktop ? 24 : 18, fontWeight: '900', color: '#111827' }}>Seguridad</Text>
            {isDesktop && <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4 }}>Contraseña y Accesos</Text>}
          </View>
          <View style={{ width: isDesktop ? 140 : 44 }} />
        </View>

        {isDesktop && <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 40 }} />}

        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>
          {/* Password Section */}
          <View style={{ marginBottom: 35 }}>
            <Text style={{ fontSize: isDesktop ? 22 : 20, fontWeight: '900', color: '#111827' }}>Restablecer contraseña</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 4, lineHeight: 20 }}>Asegúrate de usar una contraseña larga y segura para proteger tu cuenta.</Text>
          </View>

          <View style={{ 
            backgroundColor: '#FFFFFF', borderRadius: 32, padding: isDesktop ? 35 : 25, 
            borderWidth: 1, borderColor: '#F3F4F6',
            shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 15, marginBottom: 40
          }}>
            <PasswordInput 
              label="CONTRASEÑA ACTUAL" 
              placeholder="Ingresa tu contraseña actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              show={showCurrent}
              onToggleShow={() => setShowCurrent(!showCurrent)}
              isDesktop={isDesktop}
            />
            
            <PasswordInput 
              label="NUEVA CONTRASEÑA" 
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChangeText={setNewPassword}
              show={showNew}
              onToggleShow={() => setShowNew(!showNew)}
              isDesktop={isDesktop}
            />
            
            <PasswordInput 
              label="CONFIRMAR NUEVA CONTRASEÑA" 
              placeholder="Repite tu nueva contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirm}
              onToggleShow={() => setShowConfirm(!showConfirm)}
              isDesktop={isDesktop}
            />

            <View style={{ alignItems: isDesktop ? 'center' : 'stretch', marginTop: 10 }}>
              <TouchableOpacity 
                onPress={handleUpdatePassword}
                disabled={loading}
                style={{ 
                  backgroundColor: '#111827', height: 56, paddingHorizontal: 40, borderRadius: 16, 
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, 
                  shadowColor: '#111827', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <CheckCircle size={20} color="white" />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Actualizar contraseña</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>


        </View>
      </ScrollView>

      {/* CUSTOM SNACKBAR */}
      <Animated.View style={[{
        position: 'absolute', bottom: 40, alignSelf: 'center',
        paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20,
        backgroundColor: snackbar.type === 'success' ? '#10B981' : '#EF4444',
        flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
        zIndex: 9999
      }, animatedSnackStyle]}>
        {snackbar.type === 'success' ? (
          <CheckCircle size={20} color="white" />
        ) : (
          <AlertCircle size={20} color="white" />
        )}
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>{snackbar.message}</Text>
        <TouchableOpacity onPress={() => snackbarY.value = withTiming(100)} style={{ marginLeft: 10 }}>
          <X size={18} color="white" />
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}
