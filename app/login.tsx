import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

export default function Login() {
  return (
    <View className="flex-1 bg-white">
      {/* Top half: Mascot and Branding */}
      <View className="h-1/2 bg-brand-navy items-center justify-center rounded-b-[60px]">
        <Animated.View entering={FadeInUp.duration(1000)}>
          <View className="w-40 h-40 bg-white/10 rounded-full items-center justify-center border-4 border-white/20">
             <Text className="text-8xl">🐶</Text>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(500)} className="items-center mt-6">
          <Text className="text-4xl font-black text-white italic">SAKU<Text className="text-brand-orange">.</Text></Text>
          <Text className="text-white/60 font-bold tracking-widest mt-1">BIENVENIDO DE VUELTA</Text>
        </Animated.View>
      </View>

      {/* Bottom half: Login Form */}
      <Animated.View 
        entering={FadeInLeft.delay(800)}
        className="flex-1 px-8 pt-10"
      >
        <Text className="text-2xl font-black text-brand-navy mb-2">Ingresar</Text>
        <Text className="text-gray-400 mb-8 font-medium">Por favor inicia sesión para continuar.</Text>

        <View className="space-y-4">
          <View className="bg-gray-100 rounded-3xl px-6 py-4 border border-gray-200">
            <TextInput 
              placeholder="Email" 
              className="text-brand-navy font-bold h-10"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View className="bg-gray-100 rounded-3xl px-6 py-4 border border-gray-200 mt-4">
            <TextInput 
              placeholder="Contraseña" 
              secureTextEntry
              className="text-brand-navy font-bold h-10"
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>

        <TouchableOpacity className="mt-4"><Text className="text-brand-orange font-bold text-right">¿Olvidaste tu contraseña?</Text></TouchableOpacity>

        <TouchableOpacity className="bg-brand-orange mt-10 py-5 rounded-[30px] shadow-lg shadow-orange-300">
          <Text className="text-white text-center font-black text-lg">ENTRAR</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-400 font-medium">¿No tienes cuenta? </Text>
          <TouchableOpacity><Text className="text-brand-orange font-black">Regístrate</Text></TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
