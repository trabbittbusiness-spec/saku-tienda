import React, { useState, useEffect } from 'react'; // Refreshed for Expo Router
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Image, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Linking, Alert, Switch, Platform } from 'react-native';
import { 
  ShoppingBag, 
  MapPin, 
  User, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Settings,
  Calendar,
  Bell,
  Trash2,
  AlertTriangle
} from 'lucide-react-native';
import { deleteUser } from 'firebase/auth';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dynamic import to avoid crashes in Expo Go Android
const getNotifications = () => {
  if (Platform.OS === 'android' && require('expo-constants').default.appOwnership === 'expo') {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};


export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDesktop = width >= 768;
  const [userName, setUserName] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    const Notifications = getNotifications();
    if (!Notifications) {
      setPushEnabled(false);
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    setPushEnabled(status === 'granted');
  };

  const togglePushNotifications = async (value: boolean) => {
    const Notifications = getNotifications();
    if (!Notifications) {
      Alert.alert('No soportado', 'Las notificaciones no están disponibles en este entorno.');
      setPushEnabled(false);
      return;
    }

    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Para recibir notificaciones, por favor habilítalas en la Configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        setPushEnabled(false);
      } else {
        setPushEnabled(true);
        // Opcional: Registrar de nuevo el token
        if (auth.currentUser) {
          const { registerForPushNotificationsAsync } = require('../../lib/notifications');
          registerForPushNotificationsAsync(auth.currentUser.uid);
        }
      }
    } else {
      // iOS doesn't let you programmatically disable push permissions after granting.
      // We'd have to direct them to settings as well, or just show an alert.
      Alert.alert(
        'Desactivar Notificaciones',
        'Para desactivar las notificaciones por completo, debes hacerlo desde la Configuración de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Configuración', onPress: () => Linking.openSettings() }
        ]
      );
      // Revert switch visually
      setPushEnabled(true);
    }
  };

  useEffect(() => {
    let unsubUser: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || '');
        unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const fullName = [data.display_name, data.apellido].filter(Boolean).join(' ');
            setUserName(fullName || user.displayName || 'Usuario');
          } else {
            setUserName(user.displayName || 'Usuario');
          }
        });
      } else {
        setUserName('Usuario');
        setUserEmail('');
        if (unsubUser) unsubUser();
      }
    });
    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  const performDeletion = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsDeleting(true);
    try {
      // 1. Delete Addresses
      const qAddr = query(collection(db, 'Direcciones'), where('userId', '==', user.uid));
      const snapAddr = await getDocs(qAddr);
      for (const d of snapAddr.docs) {
        await deleteDoc(d.ref);
      }
      // 2. Delete Orders
      const qOrders = query(collection(db, 'Orden'), where('creador', '==', doc(db, 'users', user.uid)));
      const snapOrders = await getDocs(qOrders);
      for (const d of snapOrders.docs) {
        await deleteDoc(d.ref);
      }
      // 3. Delete Firestore user document
      await deleteDoc(doc(db, 'users', user.uid));
      // 4. Delete Auth account
      await deleteUser(user);
      
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      
      if (Platform.OS === 'web') {
        window.alert('Tu cuenta y todos tus datos asociados han sido eliminados exitosamente.');
      } else {
        Alert.alert('Cuenta eliminada', 'Tu cuenta y todos tus datos asociados han sido eliminados exitosamente.');
      }
      router.replace('/login');
    } catch (error: any) {
      setIsDeleting(false);
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        const msg = 'Por seguridad, debes haber iniciado sesión recientemente para eliminar tu cuenta. Por favor, cierra sesión y vuelve a entrar.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Acción sensible', msg);
      } else {
        const msg = 'No se pudo completar la eliminación: ' + error.message;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
      }
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalVisible(true);
  };

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header Optimizado para Notch */}
        <View style={{ 
          paddingTop: insets.top,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
          zIndex: 100
        }}>
          <View style={{ 
            height: 64,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20
          }}>
            <TouchableOpacity 
              onPress={() => router.push('/')}
              style={{ 
                position: 'absolute', 
                left: 15, 
                width: 44, 
                height: 44, 
                borderRadius: 22, 
                backgroundColor: '#F9FAFB', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#F3F4F6'
              }}
            >
              <ChevronLeft size={24} color="#111827" strokeWidth={3} />
            </TouchableOpacity>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Mi cuenta</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ 
            paddingBottom: 150,
            maxWidth: 600,
            alignSelf: 'center',
            width: '100%'
          }}
        >
          {/* Profile Card */}
          <View style={{ margin: 20, padding: 24, backgroundColor: '#FFFFFF', borderRadius: 32, borderBottomWidth: 4, borderBottomColor: '#63348C', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>{userName}</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>{userEmail}</Text>
              </View>
            </View>
          </View>

          {/* Section Title */}
          <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 }}>CONFIGURACIÓN DE CUENTA</Text>
          </View>

          {/* Menu Items Group */}
          <View style={{ marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 32, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
            <ProfileItem 
              icon={<ShoppingBag size={20} color="#E91E63" />} 
              iconBg="#FCE4EC" 
              title="Mis órdenes" 
              subtitle="Historial y seguimiento"
              onPress={() => router.push('/orders')}
            />
            <ProfileItem 
              icon={<MapPin size={20} color="#63348C" />} 
              iconBg="#FFF7ED" 
              title="Mis direcciones" 
              subtitle="Direcciones guardadas"
              onPress={() => router.push('/addresses')}
            />
            <ProfileItem 
              icon={<User size={20} color="#63348C" />} 
              iconBg="#E6FFFA" 
              title="Mi cuenta" 
              subtitle="Datos personales y perfil"
              onPress={() => router.push('/account')}
            />
            <ProfileItem 
              icon={<Calendar size={20} color="#63348C" />} 
              iconBg="#EEF2FF" 
              title="Mis Servicios" 
              subtitle="Agenda y citas veterinarias"
              onPress={() => router.push('/agenda')}
            />
            <ProfileItem 
              icon={<ShieldCheck size={20} color="#D97706" />} 
              iconBg="#FFFBEB" 
              title="Seguridad" 
              subtitle="Contraseña y 2FA"
              onPress={() => router.push('/security')}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }}>
                <Bell size={20} color="#63348C" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }}>Notificaciones Push</Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>Activar o desactivar alertas</Text>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={togglePushNotifications} 
                trackColor={{ false: '#D1D5DB', true: '#63348C' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          {/* Logout Button */}
          <View style={{ margin: 20, marginTop: 30 }}>
            <TouchableOpacity 
              onPress={handleLogout}
              style={{ 
                backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
                borderWidth: 1, borderColor: '#FEE2E2'
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#EF4444' }}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Account Button */}
          <View style={{ margin: 20, marginTop: 0 }}>
            <TouchableOpacity 
              onPress={handleDeleteAccount}
              style={{ 
                backgroundColor: '#FFF1F1', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
                borderWidth: 1, borderColor: '#FEE2E2'
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                <Trash2 size={20} color="white" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#B91C1C' }}>Eliminar mi cuenta</Text>
                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>Esta acción no se puede deshacer</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL DE ELIMINACIÓN GENIAL (Móvil) */}
        <Modal
          visible={isDeleteModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDeleteModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: 32, 
              padding: 32, 
              width: '100%', 
              maxWidth: 400,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 30
            }}>
              <View style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 40, 
                backgroundColor: '#FFF1F1', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 24
              }}>
                <AlertTriangle size={40} color="#EF4444" />
              </View>

              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 12 }}>
                ¿Eliminar cuenta?
              </Text>
              <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32, fontWeight: '500' }}>
                Esta acción es permanente. Se borrarán tus <Text style={{fontWeight: '800', color: '#1E293B'}}>direcciones, historial de órdenes</Text> y perfil. No podrás recuperarlos.
              </Text>

              <View style={{ width: '100%', gap: 12 }}>
                <TouchableOpacity
                  onPress={performDeletion}
                  disabled={isDeleting}
                  style={{ 
                    backgroundColor: '#EF4444', 
                    height: 60, 
                    borderRadius: 18, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    shadowColor: '#EF4444',
                    shadowOpacity: 0.2,
                    shadowRadius: 10
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Sí, eliminar todo</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsDeleteModalVisible(false)}
                  disabled={isDeleting}
                  style={{ 
                    backgroundColor: '#F1F5F9', 
                    height: 60, 
                    borderRadius: 18, 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '900' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // DESKTOP VIEW
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ 
        height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 60
      }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#1E293B' }}>Perfil de Usuario</Text>
        <TouchableOpacity style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12 }}>
          <Settings size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 60 }}>
        <View style={{ maxWidth: 1000, alignSelf: 'center', width: '100%', flexDirection: 'row', gap: 40 }}>
          {/* Left Column: Profile Info */}
          <View style={{ flex: 1, gap: 32 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20 }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#63348C', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ color: 'white', fontSize: 48, fontWeight: '900' }}>{userName ? userName.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#1E293B' }}>{userName}</Text>
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '600', marginTop: 4 }}>{userEmail}</Text>
              
              <TouchableOpacity style={{ backgroundColor: '#63348C', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 32 }}>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '900' }}>Editar Perfil</Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 24 }}>Estadísticas</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#63348C' }}>12</Text>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700' }}>Órdenes</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#63348C' }}>4</Text>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700' }}>Favoritos</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#63348C' }}>2</Text>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700' }}>Tarjetas</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column: Menu */}
          <View style={{ flex: 1.5 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20 }}>
               <ProfileItem 
                icon={<ShoppingBag size={20} color="#E91E63" />} 
                iconBg="#FCE4EC" 
                title="Mis órdenes" 
                subtitle="Historial y seguimiento completo de tus compras"
                onPress={() => router.push('/orders')}
                isDesktop
              />
              <ProfileItem 
                icon={<MapPin size={20} color="#63348C" />} 
                iconBg="#FFF7ED" 
                title="Mis direcciones" 
                subtitle="Gestiona tus lugares de entrega frecuentes"
                onPress={() => router.push('/addresses')}
                isDesktop
              />
              <ProfileItem 
                icon={<Calendar size={20} color="#63348C" />} 
                iconBg="#EEF2FF" 
                title="Mis Servicios" 
                subtitle="Agenda y citas veterinarias"
                onPress={() => router.push('/agenda')}
                isDesktop
              />
              <ProfileItem 
                icon={<ShieldCheck size={20} color="#D97706" />} 
                iconBg="#FFFBEB" 
                title="Seguridad" 
                subtitle="Cambiar contraseña y seguridad de la cuenta"
                onPress={() => router.push('/security')}
                isDesktop
              />
              <ProfileItem 
                icon={<LogOut size={20} color="#EF4444" />} 
                iconBg="#FEE2E2" 
                title="Cerrar sesión" 
                subtitle="Salir de tu cuenta de forma segura"
                onPress={handleLogout}
                isDesktop
              />
              <ProfileItem 
                icon={<Trash2 size={20} color="#B91C1C" />} 
                iconBg="#FFF1F1" 
                title="Eliminar cuenta" 
                subtitle="Borrar permanentemente tus datos"
                onPress={handleDeleteAccount}
                isDesktop
                isLast
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE ELIMINACIÓN GENIAL */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 32, 
            padding: 32, 
            width: '100%', 
            maxWidth: 400,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 30
          }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: '#FFF1F1', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 24
            }}>
              <AlertTriangle size={40} color="#EF4444" />
            </View>

            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 12 }}>
              ¿Eliminar cuenta?
            </Text>
            <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32, fontWeight: '500' }}>
              Esta acción es permanente. Se borrarán tus <Text style={{fontWeight: '800', color: '#1E293B'}}>direcciones, historial de órdenes</Text> y perfil. No podrás recuperarlos.
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity
                onPress={performDeletion}
                disabled={isDeleting}
                style={{ 
                  backgroundColor: '#EF4444', 
                  height: 60, 
                  borderRadius: 18, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  shadowColor: '#EF4444',
                  shadowOpacity: 0.2,
                  shadowRadius: 10
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Sí, eliminar todo</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isDeleting}
                style={{ 
                  backgroundColor: '#F1F5F9', 
                  height: 60, 
                  borderRadius: 18, 
                  justifyContent: 'center', 
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '900' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ProfileItem = React.memo(({ icon, iconBg, title, subtitle, onPress, isLast = false, isDesktop = false }: any) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{ 
        flexDirection: 'row', alignItems: 'center', padding: isDesktop ? 24 : 16,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F3F4F6'
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ fontSize: isDesktop ? 16 : 15, fontWeight: '900', color: '#111827' }}>{title}</Text>
        <Text style={{ fontSize: isDesktop ? 14 : 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );
});

