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
          <TouchableOpacity key={i} style={{ alignItems: 'center', position: 'relative' }}>
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
