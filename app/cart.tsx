import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';

export default function Cart() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F5F5F7] px-6">
      <View className="bg-brand-100 p-8 rounded-full mb-6">
        <ShoppingBag size={48} color="#0ea5e9" />
      </View>
      <Text className="text-3xl font-bold text-premium-black">Tu Carrito</Text>
      <Text className="text-zinc-500 text-center mt-2 mb-10">Tu carrito está esperando por piezas exclusivas.</Text>
      <TouchableOpacity className="bg-brand-500 w-full py-4 rounded-3xl items-center">
        <Text className="text-white font-bold text-lg">Explorar Tienda</Text>
      </TouchableOpacity>
    </View>
  );
}
