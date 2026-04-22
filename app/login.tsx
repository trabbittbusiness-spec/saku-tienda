import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, useWindowDimensions, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, EyeOff, Eye, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import LocationMapModal from '../components/LocationMapModal';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [registerStep, setRegisterStep] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    main: '',
    sub: ''
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/');
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert('Error', 'Credenciales incorrectas o problema de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (activeTab === 'login') return 'Bienvenido';
    if (registerStep === 1) return 'Únete a nuestra familia';
    return 'Completa tu perfil';
  };

  const getSubtitle = () => {
    if (activeTab === 'register' && registerStep === 2) {
      return 'Queremos conocerte mejor a ti y a tu mascota para ofrecerte una experiencia hecha a la medida.';
    }
    return 'Tu tienda veterinaria de confianza para el bienestar de tus mascotas.';
  };

  const renderForm = () => {
    const isRegisterMobile = !isDesktop && activeTab === 'register';
    
    return (
      <Animated.View 
        key={`${activeTab}-${registerStep}`}
        entering={FadeIn.duration(600)}
        style={{ 
          width: '100%', 
          maxWidth: isDesktop ? 450 : '100%', 
          alignItems: 'center',
        }}
      >
        {/* Tabs & Logo - Always on background for mobile login/register step 1 */}
        {!(activeTab === 'register' && registerStep === 2) && (
          <View style={{ width: '100%', alignItems: 'center' }}>
             {/* Logo */}
             <View style={{ 
                width: 100, 
                height: 100, 
                backgroundColor: isDesktop ? '#1E1B4B' : 'transparent', 
                borderRadius: 24, 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginBottom: 12 
              }}>
                 <Image source={require('../assets/images/logo_saku_cl.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
              </View>

              {!isDesktop && (
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 40, opacity: 0.9 }}>
                  FROM VET ANIMAL WELFARE
                </Text>
              )}

              <View style={{ flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: isDesktop ? '#F3F4F6' : 'rgba(255,255,255,0.2)', marginBottom: 40 }}>
                <TouchableOpacity 
                  onPress={() => setActiveTab('login')}
                  style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeTab === 'login' ? (isDesktop ? '#4C1D95' : 'white') : 'transparent' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: activeTab === 'login' ? (isDesktop ? '#1E1B4B' : 'white') : (isDesktop ? '#9CA3AF' : 'rgba(255,255,255,0.5)') }}>Inicia sesión</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setActiveTab('register'); setRegisterStep(1); }}
                  style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeTab === 'register' ? (isDesktop ? '#4C1D95' : 'white') : 'transparent' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: activeTab === 'register' ? (isDesktop ? '#1E1B4B' : 'white') : (isDesktop ? '#9CA3AF' : 'rgba(255,255,255,0.5)') }}>Registrarse</Text>
                </TouchableOpacity>
              </View>
          </View>
        )}

        {/* Mobile Back Button (Register Step 2) */}
        {!isDesktop && activeTab === 'register' && registerStep === 2 && (
          <TouchableOpacity 
            onPress={() => setRegisterStep(1)}
            style={{ position: 'absolute', top: 20, left: 20, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <ArrowLeft size={18} color="#1E1B4B" />
            <Text style={{ color: '#1E1B4B', fontWeight: '700', fontSize: 14 }}>Atrás</Text>
          </TouchableOpacity>
        )}

        {/* Inputs Container */}
        <View style={{ 
          width: '100%',
          backgroundColor: (isRegisterMobile && registerStep === 2) ? 'white' : 'transparent',
          borderRadius: (isRegisterMobile && registerStep === 2) ? 32 : 0,
          padding: (isRegisterMobile && registerStep === 2) ? 25 : 0,
          paddingTop: (isRegisterMobile && registerStep === 2) ? 60 : 0,
          shadowColor: (isRegisterMobile && registerStep === 2) ? '#000' : 'transparent',
          shadowOpacity: 0.1,
          shadowRadius: 20,
          alignItems: 'center'
        }}>
            {isDesktop && (
              <>
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#1E1B4B', marginBottom: 8, textAlign: 'center' }}>
                  {getTitle()}
                </Text>
                <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '500', textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
                  {getSubtitle()}
                </Text>
              </>
            )}

            <View style={{ width: '100%', gap: 16 }}>
              {activeTab === 'login' && (
                <>
                  <View style={{ backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 20, height: 64, justifyContent: 'center' }}>
                    <TextInput 
                      placeholder="Correo electrónico" 
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{ fontSize: 16, fontWeight: '600', color: '#1E1B4B', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                  </View>
                  <View style={{ backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 20, height: 64, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput 
                      placeholder="Contraseña" 
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword} 
                      style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1B4B', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {activeTab === 'register' && registerStep === 1 && (
                <View style={{ gap: 16, width: '100%' }}>
                  <View style={{ backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 20, height: 64, justifyContent: 'center' }}>
                    <TextInput placeholder="trabbitt.business5@gmail.com" style={{ fontSize: 16, fontWeight: '600', color: '#1E1B4B' }} placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={{ backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 20, height: 64, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput placeholder="123456." secureTextEntry={!showPassword} style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1B4B' }} placeholderTextColor="#9CA3AF" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                  <View style={{ backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 20, height: 64, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput placeholder="123456." secureTextEntry={!showPassword} style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1B4B' }} placeholderTextColor="#9CA3AF" />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: 'white', textAlign: 'center', fontWeight: '500' }}>
                      Al continuar, aceptas nuestras{' '}
                      <Text onPress={() => Linking.openURL('https://sites.google.com/view/sakucl/t%C3%A9rminos-y-condiciones')} style={{ fontWeight: '800', color: '#F47321' }}>Políticas de privacidad</Text>
                      {' '}y{' '}
                      <Text onPress={() => Linking.openURL('https://sites.google.com/view/sakucl/t%C3%A9rminos-y-condiciones')} style={{ fontWeight: '800', color: '#F47321' }}>Términos de servicio</Text>
                    </Text>
                  </View>
                </View>
              )}

              {activeTab === 'register' && registerStep === 2 && (
                <View style={{ gap: 16, width: '100%', alignItems: 'center' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={{ width: 30, height: 30, opacity: 0.3 }} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 20 }}>Sube tu foto</Text>

                  <View style={{ width: '100%', backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 20, height: 64, justifyContent: 'center' }}>
                    <TextInput placeholder="Nombre completo" style={{ fontSize: 16, fontWeight: '600', color: '#1E1B4B' }} placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={{ width: '100%', backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 20, height: 64, justifyContent: 'center' }}>
                    <TextInput placeholder="+56" keyboardType="phone-pad" style={{ fontSize: 16, fontWeight: '600', color: '#1E1B4B' }} placeholderTextColor="#9CA3AF" />
                  </View>
                  <TouchableOpacity 
                    onPress={() => setIsMapModalOpen(true)}
                    style={{ width: '100%', backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 20, height: 64, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <MapPin size={20} color="#F47321" />
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: selectedLocation.main ? '#1E1B4B' : '#9CA3AF' }}>
                      {selectedLocation.main || "Ubicación o dirección de entrega"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity 
              disabled={loading}
              onPress={() => {
                if (activeTab === 'login') {
                  handleLogin();
                } else if (activeTab === 'register' && registerStep === 1) {
                  setRegisterStep(2);
                } else {
                  router.replace('/');
                }
              }}
              style={{ 
                width: '100%', 
                backgroundColor: (activeTab === 'register' && registerStep === 2) ? '#10B981' : '#1E1B4B', 
                height: 64, borderRadius: 16, 
                justifyContent: 'center', alignItems: 'center', 
                marginTop: 20,
                shadowColor: '#1E1B4B', shadowOpacity: 0.2, shadowRadius: 15, elevation: 5,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>
                  {activeTab === 'login' ? 'Iniciar sesión' : (registerStep === 1 ? 'Continuar' : 'Crear cuenta')}
                </Text>
              )}
            </TouchableOpacity>

            {activeTab === 'login' && (
              <TouchableOpacity style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 14, color: isDesktop ? '#6B7280' : 'white', fontWeight: '700' }}>¿Has olvidado tu contraseña?</Text>
              </TouchableOpacity>
            )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? '#FFFFFF' : '#4C1D95' }}>
      
      {isDesktop ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* LEFT SIDE: MASCOT & PATTERN */}
          <View style={{ width: '42%', backgroundColor: '#4C1D95', position: 'relative', overflow: 'hidden' }}>
            <TouchableOpacity 
              onPress={() => {
                if (activeTab === 'register' && registerStep === 2) {
                  setRegisterStep(1);
                } else {
                  router.back();
                }
              }}
              style={{ 
                position: 'absolute', top: 40, left: 40, zIndex: 10,
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 20
              }}
            >
              <ArrowLeft size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                {activeTab === 'register' && registerStep === 2 ? 'Atrás' : 'Volver'}
              </Text>
            </TouchableOpacity>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0 }}>
              <Image 
                source={require('../assets/images/Orang_and_Blue_Pet_Shop_Adopt_Instagram_Story.png')} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover" 
              />
            </View>
          </View>

          {/* RIGHT SIDE: FORM */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 60 }}>
            {renderForm()}
          </View>
        </View>
      ) : (
        /* MOBILE VIEW */
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
           {/* Background Mascot */}
           <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Image 
                source={require('../assets/images/Orang_and_Blue_Pet_Shop_Adopt_Instagram_Story.png')} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover" 
              />
           </View>

           {/* Back Button Mobile */}
           <TouchableOpacity 
              onPress={() => {
                if (activeTab === 'register' && registerStep === 2) {
                  setRegisterStep(1);
                } else {
                  router.back();
                }
              }}
              style={{ 
                position: 'absolute', top: 50, left: 20, zIndex: 10,
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 15
              }}
            >
              <ArrowLeft size={16} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
                {activeTab === 'register' && registerStep === 2 ? 'Atrás' : 'Volver'}
              </Text>
            </TouchableOpacity>

           {/* Content */}
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 }}>
              {renderForm()}
           </View>
        </ScrollView>
      )}

      <LocationMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSave={(location) => {
          setSelectedLocation(location);
          setIsMapModalOpen(false);
        }}
      />
    </View>
  );
}
