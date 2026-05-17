import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useWindowDimensions, ActivityIndicator, Image, Platform } from 'react-native';
import { ArrowLeft, Camera, User, Mail, Phone, CreditCard, CheckCircle, Clock, PawPrint, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db, storage } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rut, setRut] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setEmail(currentUser.email || '');
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const fullName = [data.display_name, data.apellido].filter(Boolean).join(' ');
            setName(fullName || currentUser.displayName || 'Usuario');
            setPhone(data.phone_number || '');
            setPhotoUrl(data.photo_url || '');
            setRut(data.rut || '');
          } else {
            setName(currentUser.displayName || 'Usuario');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setName(currentUser.displayName || 'Usuario');
        }
      } else {
        router.replace('/?logout=true');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/?logout=true');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
      });

      if (!result.canceled && result.assets[0]) {
        setSaving(true);
        const { uri } = result.assets[0];
        
        const response = await fetch(uri);
        const blob = await response.blob();

        const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadBytes(storageRef, blob);
        
        const downloadUrl = await getDownloadURL(storageRef);
        
        await updateDoc(doc(db, 'users', user.uid), {
          photo_url: downloadUrl
        });

        setPhotoUrl(downloadUrl);
        showNotification('Foto de perfil actualizada exitosamente');
      }
    } catch (error) {
      console.error("Error al subir imagen: ", error);
      showNotification('Error al subir la imagen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const parts = name.trim().split(' ');
      const display_name = parts[0] || '';
      const apellido = parts.slice(1).join(' ') || '';

      await updateDoc(doc(db, 'users', user.uid), {
        display_name,
        apellido,
        phone_number: phone,
        rut
      });
      showNotification('Datos guardados correctamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      showNotification('Error guardando los datos', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';
  
  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {notification && (
          <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={{ position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: notification.type === 'success' ? '#63348C' : '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: notification.type === 'success' ? '#63348C' : '#EF4444', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, zIndex: 100 }}>
            <CheckCircle size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>{notification.message}</Text>
          </Animated.View>
        )}

        {/* Header */}
        <View style={{ 
          paddingTop: Platform.OS === 'web' ? 18 : insets.top + 18,
          paddingBottom: 18,
          backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ 
              position: 'absolute', 
              left: 20, 
              top: Platform.OS === 'web' ? 18 : insets.top + 18, 
              width: 44, 
              height: 44, 
              backgroundColor: '#F3F4F6', 
              borderRadius: 12, 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', height: 44, lineHeight: 44 }}>Mi Cuenta</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25 }}>
          {/* Profile Section */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 }}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={{ width: 120, height: 120, borderRadius: 60 }} />
              ) : (
                <Text style={{ fontSize: 48, fontWeight: '900', color: '#111827' }}>{firstLetter}</Text>
              )}
              <TouchableOpacity onPress={handlePickImage} style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}>
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 20 }}>{name}</Text>
            <Text style={{ fontSize: 15, color: '#9CA3AF', fontWeight: '600', marginTop: 4 }}>{email}</Text>
          </View>

          {/* Form Fields */}
          <View style={{ gap: 25 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>NOMBRE COMPLETO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderWeight: 1, borderColor: '#F3F4F6', paddingHorizontal: 16, height: 56, gap: 12 }}>
                <User size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', outlineStyle: 'none' }} value={name} onChangeText={setName} />
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
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#9CA3AF', outlineStyle: 'none' }} value={email} editable={false} />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>TELÉFONO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                <Phone size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', outlineStyle: 'none' }} value={phone} onChangeText={setPhone} placeholder="Ingresa tu teléfono" placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#4B5563', letterSpacing: 1, marginBottom: 10 }}>RUT / DOCUMENTO DE IDENTIDAD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 }}>
                <CreditCard size={18} color="#9CA3AF" />
                <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#111827', outlineStyle: 'none' }} value={rut} onChangeText={setRut} placeholder="Ej: 18.123.456-7" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: '#10B981', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 40, shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 15, opacity: saving ? 0.7 : 1 }}>
            {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>Guardar cambios</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 8 }}>
            <LogOut size={16} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {notification && (
        <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={{ position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: notification.type === 'success' ? '#63348C' : '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: notification.type === 'success' ? '#63348C' : '#EF4444', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, zIndex: 100 }}>
          <CheckCircle size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>{notification.message}</Text>
        </Animated.View>
      )}
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
                   {photoUrl ? (
                     <Image source={{ uri: photoUrl }} style={{ width: 102, height: 102, borderRadius: 51 }} />
                   ) : (
                     <Text style={{ fontSize: 40, fontWeight: '900', color: '#111827' }}>{firstLetter}</Text>
                   )}
                   <TouchableOpacity onPress={handlePickImage} style={{ position: 'absolute', bottom: 5, right: 5, width: 30, height: 30, borderRadius: 15, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                      <Camera size={14} color="white" />
                   </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 15 }}>{name}</Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginTop: 2 }}>{email}</Text>
             </View>

             <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 25 }} />

             <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 15 }}>TU CUENTA</Text>
             
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <CheckCircle size={18} color="#10B981" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#4B5563' }}>Cuenta verificada</Text>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Clock size={18} color="#3B82F6" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#4B5563' }}>Miembro activo</Text>
             </View>

             <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, gap: 12 }}>
                <LogOut size={18} color="#EF4444" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>Cerrar sesión</Text>
             </TouchableOpacity>
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
                        value={name}
                        onChangeText={setName}
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
                        value={email}
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
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Ingresa tu teléfono"
                        placeholderTextColor="#9CA3AF"
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
                        value={rut}
                        onChangeText={setRut}
                        placeholder="Ej: 18.123.456-7"
                        placeholderTextColor="#9CA3AF"
                      />
                   </View>
                </View>
             </View>

             {/* Action Button */}
             <View style={{ alignItems: 'flex-end', marginTop: 40 }}>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 12, shadowColor: '#10B981', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, opacity: saving ? 0.7 : 1 }}>
                   {saving ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Guardar cambios</Text>}
                </TouchableOpacity>
             </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
