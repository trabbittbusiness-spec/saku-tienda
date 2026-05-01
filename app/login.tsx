import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, useWindowDimensions, ScrollView, Linking, ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';
import { ArrowLeft, EyeOff, Eye, MapPin, AlertCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Animated, { FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import LocationMapModal from '../components/LocationMapModal';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { registerForPushNotificationsAsync } from '../lib/notifications';




export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [showPassword, setShowPassword] = useState(false);
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(params.tab === 'register' ? 'register' : 'login');
  const [registerStep, setRegisterStep] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    main: '',
    sub: ''
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [modalTimer, setModalTimer] = useState<NodeJS.Timeout | null>(null);

  const showError = (msg: string) => {
    if (modalTimer) clearTimeout(modalTimer);
    setModalMsg(msg);
    setModalVisible(true);
    const timer = setTimeout(() => setModalVisible(false), 2500);
    setModalTimer(timer);
  };


  // Registration States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registeredUid, setRegisteredUid] = useState<string | null>(null);

  const handleRegister = async () => {

    if (!fullName || !phoneNumber) {
      showError('Por favor completa tu nombre y teléfono');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const uid = user?.uid || registeredUid;
      const emailToSave = user?.email || regEmail.trim();

      if (!uid) {
        showError('Sesión expirada. Por favor intenta de nuevo.');
        setRegisterStep(1);
        return;
      }

      // 1. Aquí iría la subida de imagen real a Storage...
      let photoURL = profileImage || '';

      // 2. Prepare location object for Direcciones collection
      const addressData = {
        ...selectedLocation,
        userId: uid,
        category: 'CASA', // Default category for registration
        creadoEn: serverTimestamp()
      };

      // 3. Save/Update in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: emailToSave,
        display_name: fullName,
        phone_number: phoneNumber,
        photo_url: photoURL,
        Ubicacion: selectedLocation.lat ? [selectedLocation.lat, selectedLocation.lng] : null,
        comuna: selectedLocation.main.split(',')[1]?.trim() || '',
        direccionDefault: {
          ...selectedLocation,
          category: 'CASA'
        },
        IsAdmin: false,
        created_time: serverTimestamp(),
      });

      // 4. Also save to Direcciones collection so it appears in the list
      if (selectedLocation.main) {
        await addDoc(collection(db, 'Direcciones'), addressData);
      }

      // Registrar para notificaciones Push
      try {
        await registerForPushNotificationsAsync(uid);
      } catch (pushErr) {
        console.log('Error registering push:', pushErr);
      }

      router.replace('/');

    } catch (error: any) {
      console.error("Registration finalization error:", error);
      showError('Hubo un problema al guardar tu perfil.');
    } finally {
      setLoading(false);
    }
  };


  const pickImage = async () => {

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };


  const handleLogin = async () => {

    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;

      // Registrar para notificaciones Push (la función ya verifica si el token existe)
      try {
        await registerForPushNotificationsAsync(user.uid);
      } catch (pushErr) {
        console.log('Error registering push on login:', pushErr);
      }

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
          maxWidth: isDesktop ? 500 : '100%', 
          alignItems: 'center',
          paddingVertical: isDesktop ? 40 : 0
        }}
      >
        {/* Tabs & Logo - Always on background for mobile login/register step 1 */}
        {!(activeTab === 'register' && registerStep === 2) && (
          <View style={{ width: '100%', alignItems: 'center' }}>
             {/* Logo */}
              <View style={{ 
                width: 120, 
                height: 120, 
                backgroundColor: isDesktop ? '#63348C' : 'transparent', 
                borderRadius: 28, 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginBottom: 24,
                shadowColor: '#63348C',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDesktop ? 0.2 : 0,
                shadowRadius: 20,
              }}>
                 <Image source={require('../assets/images/logo_saku_cl.png')} style={{ width: 90, height: 90 }} resizeMode="contain" />
              </View>

              {!isDesktop && (
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 40, opacity: 0.9 }}>
                  FROM VET ANIMAL WELFARE
                </Text>
              )}

              <View style={{ flexDirection: 'row', width: '100%', borderBottomWidth: 1, borderBottomColor: isDesktop ? '#F3F4F6' : 'rgba(255,255,255,0.2)', marginBottom: 40 }}>
                <TouchableOpacity 
                  onPress={() => setActiveTab('login')}
                  style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeTab === 'login' ? (isDesktop ? '#63348C' : 'white') : 'transparent' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: activeTab === 'login' ? (isDesktop ? '#63348C' : 'white') : (isDesktop ? '#9CA3AF' : 'rgba(255,255,255,0.5)') }}>Inicia sesión</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setActiveTab('register'); setRegisterStep(1); }}
                  style={{ flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: activeTab === 'register' ? (isDesktop ? '#63348C' : 'white') : 'transparent' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: activeTab === 'register' ? (isDesktop ? '#63348C' : 'white') : (isDesktop ? '#9CA3AF' : 'rgba(255,255,255,0.5)') }}>Registrarse</Text>
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
            <ArrowLeft size={18} color="#63348C" />
            <Text style={{ color: '#63348C', fontWeight: '700', fontSize: 14 }}>Atrás</Text>
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
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#63348C', marginBottom: 8, textAlign: 'center' }}>
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
                  <View style={{ 
                    backgroundColor: '#F1F5F9', 
                    borderRadius: 16, 
                    paddingHorizontal: 20, 
                    height: 64, 
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: focusedField === 'login-email' ? '#63348C' : 'transparent'
                  }}>
                    <TextInput 
                      placeholder="Correo electrónico" 
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('login-email')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{ fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                  </View>
                  <View style={{ 
                    backgroundColor: '#F1F5F9', 
                    borderRadius: 16, 
                    paddingHorizontal: 20, 
                    height: 64, 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: focusedField === 'login-password' ? '#63348C' : 'transparent'
                  }}>
                    <TextInput 
                      placeholder="Contraseña" 
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('login-password')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword} 
                      style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
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
                  <View style={{ 
                    backgroundColor: '#F1F5F9', 
                    borderRadius: 16, 
                    paddingHorizontal: 20, 
                    height: 64, 
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: focusedField === 'reg-email' ? '#63348C' : 'transparent'
                  }}>
                    <TextInput 
                      placeholder="trabbitt.business5@gmail.com" 
                      value={regEmail}
                      onChangeText={setRegEmail}
                      onFocus={() => setFocusedField('reg-email')}
                      onBlur={() => setFocusedField(null)}
                      style={{ fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                  </View>
                  <View style={{ 
                    backgroundColor: '#F1F5F9', 
                    borderRadius: 16, 
                    paddingHorizontal: 20, 
                    height: 64, 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: focusedField === 'reg-pass' ? '#63348C' : 'transparent'
                  }}>
                    <TextInput 
                      placeholder="Contraseña" 
                      value={regPassword}
                      onChangeText={setRegPassword}
                      onFocus={() => setFocusedField('reg-pass')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword} 
                      style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                  <View style={{ 
                    backgroundColor: '#F1F5F9', 
                    borderRadius: 16, 
                    paddingHorizontal: 20, 
                    height: 64, 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: focusedField === 'reg-confirm' ? '#63348C' : 'transparent'
                  }}>
                    <TextInput 
                      placeholder="Confirmar contraseña" 
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                      onFocus={() => setFocusedField('reg-confirm')}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword} 
                      style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 24, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: isDesktop ? '#6B7280' : 'white', textAlign: 'center', fontWeight: '500', lineHeight: 18 }}>
                      Al continuar, aceptas nuestras{' '}
                      <Text onPress={() => Linking.openURL('https://sites.google.com/view/sakucl/t%C3%A9rminos-y-condiciones')} style={{ fontWeight: '800', color: isDesktop ? '#63348C' : 'white', textDecorationLine: 'underline' }}>Políticas de privacidad</Text>
                      {' '}y{' '}
                      <Text onPress={() => Linking.openURL('https://sites.google.com/view/sakucl/t%C3%A9rminos-y-condiciones')} style={{ fontWeight: '800', color: isDesktop ? '#63348C' : 'white', textDecorationLine: 'underline' }}>Términos de servicio</Text>
                    </Text>
                  </View>
                </View>
              )}

              {activeTab === 'register' && registerStep === 2 && (
                <View style={{ gap: 16, width: '100%', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={pickImage}
                    style={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: 50, 
                      backgroundColor: '#F3F4F6', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      marginBottom: 8, 
                      borderWidth: 1, 
                      borderColor: '#E5E7EB',
                      overflow: 'hidden'
                    }}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={{ width: 30, height: 30, opacity: 0.3 }} />
                    )}
                  </TouchableOpacity>
                  <Text onPress={pickImage} style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 20 }}>
                    {profileImage ? 'Cambiar foto' : 'Sube tu foto'}
                  </Text>


                  <View style={{ 
                    width: '100%', 
                    backgroundColor: '#F9FAFB', 
                    borderRadius: 16, 
                    borderWidth: 2, 
                    borderColor: focusedField === 'full-name' ? '#63348C' : '#F3F4F6', 
                    paddingHorizontal: 20, 
                    height: 64, 
                    justifyContent: 'center' 
                  }}>
                    <TextInput 
                      placeholder="Nombre completo" 
                      value={fullName}
                      onChangeText={setFullName}
                      onFocus={() => setFocusedField('full-name')}
                      onBlur={() => setFocusedField(null)}
                      style={{ fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                  </View>
                  <View style={{ 
                    width: '100%', 
                    backgroundColor: '#F9FAFB', 
                    borderRadius: 16, 
                    borderWidth: 2, 
                    borderColor: focusedField === 'phone' ? '#63348C' : '#F3F4F6', 
                    paddingHorizontal: 20, 
                    height: 64, 
                    justifyContent: 'center' 
                  }}>
                    <TextInput 
                      placeholder="+56" 
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="phone-pad" 
                      style={{ fontSize: 16, fontWeight: '600', color: '#63348C', outlineStyle: 'none' }} 
                      placeholderTextColor="#9CA3AF" 
                    />
                  </View>
                  <TouchableOpacity 
                    onPress={() => setIsMapModalOpen(true)}
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#F9FAFB', 
                      borderRadius: 16, 
                      borderWidth: 2, 
                      borderColor: '#F3F4F6', 
                      paddingHorizontal: 20, 
                      height: 64, 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      gap: 12 
                    }}
                  >
                    <MapPin size={20} color="#63348C" />
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: selectedLocation.main ? '#63348C' : '#9CA3AF' }}>
                      {selectedLocation.main || "Ubicación o dirección de entrega"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>

            <TouchableOpacity 
              disabled={loading}
              onPress={async () => {
                if (activeTab === 'login') {
                  handleLogin();
                } else if (activeTab === 'register' && registerStep === 1) {
                  if (!regEmail || !regPassword || !regConfirmPassword) {
                    showError('Por favor completa todos los campos');
                    return;
                  }
                  if (regPassword !== regConfirmPassword) {
                    showError('Las contraseñas no coinciden');
                    return;
                  }
                  
                  setLoading(true);
                  try {
                    // Intentamos crear el usuario de una vez.
                    // Si el correo ya existe, Firebase lanzará 'auth/email-already-in-use'.
                    const userCred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
                    // Si llegamos aquí, el usuario se creó con éxito y ya está logueado.
                    setRegisteredUid(userCred.user.uid);
                    setRegisterStep(2);
                  } catch (err: any) {

                    console.log('Reg Step 1 error:', err.code);
                    if (err.code === 'auth/email-already-in-use') {
                      showError('Este correo ya está registrado.');
                    } else if (err.code === 'auth/invalid-email') {
                      showError('El correo electrónico no es válido.');
                    } else if (err.code === 'auth/weak-password') {
                      showError('La contraseña debe tener al menos 6 caracteres.');
                    } else {
                      showError('Error al validar cuenta. Intenta de nuevo.');
                    }
                  } finally {
                    setLoading(false);
                  }
                } else {
                  handleRegister();
                }
              }}


              style={{ 
                width: '100%', 
                backgroundColor: (activeTab === 'register' && registerStep === 2) ? '#63348C' : '#63348C', 
                height: 64, borderRadius: 16, 
                justifyContent: 'center', alignItems: 'center', 
                marginTop: 20,
                shadowColor: '#63348C', shadowOpacity: 0.2, shadowRadius: 15, elevation: 5,
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
    <View style={{ flex: 1, backgroundColor: isDesktop ? '#FFFFFF' : '#63348C' }}>
      
      {isDesktop ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* LEFT SIDE: MASCOT & PATTERN */}
          <View style={{ width: '40%', backgroundColor: '#63348C', position: 'relative', overflow: 'hidden' }}>
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
          <View style={{ flex: 1, backgroundColor: 'white' }}>
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: isDesktop ? 60 : 25 }}
              showsVerticalScrollIndicator={false}
            >
              {renderForm()}
            </ScrollView>
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

      {/* Custom Toast Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertCircle size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>¡Atención!</Text>

            <Text style={styles.modalMsg}>{modalMsg}</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#63348C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalMsg: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
});

