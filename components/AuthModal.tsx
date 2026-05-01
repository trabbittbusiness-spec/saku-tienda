import React from 'react';
import { View, Text, TouchableOpacity, Modal, useWindowDimensions, Pressable } from 'react-native';
import { User, X, LogIn, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AuthModal({ isVisible, onClose }: AuthModalProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType={isDesktop ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: isDesktop ? 'center' : 'flex-end',
        alignItems: isDesktop ? 'center' : 'stretch',
        padding: isDesktop ? 20 : 0
      }}>
        {/* Click outside to close (Desktop only) */}
        {isDesktop && (
          <Pressable 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            onPress={onClose} 
          />
        )}

        <View style={{ 
          backgroundColor: 'white', 
          width: isDesktop ? 480 : '100%',
          borderTopLeftRadius: isDesktop ? 28 : 32, 
          borderTopRightRadius: isDesktop ? 28 : 32, 
          borderBottomLeftRadius: isDesktop ? 28 : 0,
          borderBottomRightRadius: isDesktop ? 28 : 0,
          padding: isDesktop ? 40 : 30, 
          paddingBottom: isDesktop ? 40 : 50, 
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.15,
          shadowRadius: 30,
          elevation: 20
        }}>
          {/* Mobile Handle Bar */}
          {!isDesktop && <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 25 }} />}
          
          {/* Desktop Close Button */}
          {isDesktop && (
            <TouchableOpacity 
              onPress={onClose} 
              style={{ position: 'absolute', top: 24, right: 24, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}
            >
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          <View style={{ 
            width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F3FF', 
            justifyContent: 'center', alignItems: 'center', marginBottom: 24 
          }}>
            <User size={40} color="#63348C" />
          </View>

          <Text style={{ fontSize: isDesktop ? 28 : 22, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' }}>
            {isDesktop ? 'Bienvenido a Saku Store' : 'Inicia Sesión'}
          </Text>
          
          <Text style={{ 
            fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 35, 
            lineHeight: 24, paddingHorizontal: isDesktop ? 0 : 10 
          }}>
            {isDesktop 
              ? 'Únete a nuestra comunidad para guardar tus favoritos, gestionar tus pedidos y disfrutar de una experiencia de compra personalizada.'
              : 'Para agregar productos al carrito y disfrutar de una experiencia completa, necesitas una cuenta.'}
          </Text>

          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => {
                onClose();
                router.push('/login?tab=login');
              }}
              style={{ 
                backgroundColor: '#63348C', height: 60, borderRadius: 16, 
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
                shadowColor: '#63348C', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
              }}
            >
              <LogIn size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 17 }}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                onClose();
                router.push('/login?tab=register');
              }}
              style={{ 
                backgroundColor: '#FFFFFF', height: 60, borderRadius: 16, 
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
                borderWidth: 2, borderColor: '#63348C'
              }}
            >
              <UserPlus size={20} color="#63348C" />
              <Text style={{ color: '#63348C', fontWeight: '900', fontSize: 17 }}>Crear cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose}
              style={{ height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}
            >
              <Text style={{ color: '#9CA3AF', fontWeight: '700', fontSize: 15 }}>Seguir navegando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
