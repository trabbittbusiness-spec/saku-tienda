import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
  Calendar
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 1024;
  const [userName, setUserName] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('');

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

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ 
          height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20
        }}>
          <TouchableOpacity 
            onPress={() => router.push('/')}
            style={{ position: 'absolute', left: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}
          >
            <ChevronLeft size={24} color="#111827" strokeWidth={3} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>Mi cuenta</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
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
              isLast
            />
          </View>

          {/* Logout Button */}
          <View style={{ margin: 20, marginTop: 30 }}>
            <TouchableOpacity style={{ 
              backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
              borderWidth: 1, borderColor: '#FEE2E2'
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#EF4444' }}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
                onPress={() => {}}
                isDesktop
                isLast
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
