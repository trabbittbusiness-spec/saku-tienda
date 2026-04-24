import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ShoppingBag, Tablet, LayoutGrid, Coffee, Dog, Cross, Star, Bone } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const categories = [
  { name: 'Todo', icon: LayoutGrid, isActive: true, slug: '' },
  { name: 'Farmacia 24/7', icon: Cross, slug: 'Medicamentos' },
  { name: 'Alimentos', icon: Coffee, slug: 'Alimento' },
  { name: 'Higiene', icon: Tablet, slug: 'Cuidado e higiene' },
  { name: 'Juguetes', icon: Dog, slug: 'Juguetes' },
  { name: 'Collares', icon: Star, slug: 'Accesorios' }, 
  { name: 'Snacks', icon: Bone, slug: 'Snacks' },
];

export default function CategoryBar() {
  const router = useRouter();

  return (
    <View style={{ backgroundColor: '#1A1A2E', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ 
          paddingHorizontal: 40, 
          paddingVertical: 20, 
          flexDirection: 'row', 
          gap: 40,
          alignItems: 'center'
        }}
      >
        {categories.map((cat, i) => (
          <TouchableOpacity 
            key={i} 
            onPress={() => router.push(cat.slug ? `/search?category=${cat.slug}` : '/search')}
            style={{ alignItems: 'center', position: 'relative' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <cat.icon size={18} color={cat.isActive ? '#F47321' : '#A0A0B0'} strokeWidth={cat.isActive ? 3 : 2} />
              <Text style={{ 
                color: cat.isActive ? '#FFFFFF' : '#A0A0B0', 
                fontSize: 14, 
                fontWeight: cat.isActive ? '800' : '600',
                letterSpacing: 0.2
              }}>
                {cat.name}
              </Text>
            </View>
            {/* Active Indicator Line */}
            {cat.isActive && (
              <View style={{ 
                position: 'absolute', 
                bottom: -20, 
                left: 0, 
                right: 0, 
                height: 4, 
                backgroundColor: '#F47321', 
                borderTopLeftRadius: 4, 
                borderTopRightRadius: 4 
              }} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
