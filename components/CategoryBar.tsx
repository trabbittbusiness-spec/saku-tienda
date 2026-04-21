import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ShoppingBag, Tablet, LayoutGrid, Coffee, Dog, Cross, Star, Bone } from 'lucide-react-native';

const categories = [
  { name: 'Todo', icon: LayoutGrid, isActive: true },
  { name: 'Farmacia 24/7', icon: Cross },
  { name: 'Alimentos', icon: Coffee },
  { name: 'Higiene', icon: Tablet },
  { name: 'Juguetes', icon: Dog },
  { name: 'Collares', icon: Star }, // Aproximación, no veo icono claro de collar
  { name: 'Snacks', icon: Bone }, // Aproximación
];

export default function CategoryBar() {
  return (
    <View style={{ backgroundColor: '#1A1A2E' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', gap: 32 }}>
        {categories.map((cat, i) => (
          <TouchableOpacity key={i} style={{ alignItems: 'center', position: 'relative' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <cat.icon size={16} color={cat.isActive ? '#F47321' : '#A0A0B0'} />
              <Text style={{ color: cat.isActive ? '#FFFFFF' : '#A0A0B0', fontSize: 13, fontWeight: cat.isActive ? '800' : '600' }}>
                {cat.name}
              </Text>
            </View>
            {/* Active Indicator Line */}
            {cat.isActive && (
              <View style={{ position: 'absolute', bottom: -16, left: 0, right: 0, height: 3, backgroundColor: '#F47321', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
