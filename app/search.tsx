import { View, Text } from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';

export default function Search() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F5F5F7] px-6">
      <SearchIcon size={64} color="#0ea5e9" strokeWidth={1} />
      <Text className="text-3xl font-bold text-premium-black mt-6">Búsqueda</Text>
      <Text className="text-zinc-500 text-center mt-2">Encuentra tus productos favoritos con un toque de elegancia.</Text>
    </View>
  );
}
