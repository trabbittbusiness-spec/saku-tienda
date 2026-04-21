import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput } from 'react-native';
import { Bell, ChevronDown, MapPin, Search, ShoppingBag, Heart, Home, Truck, Dog as DogIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

const BREAKPOINT = 768;

export default function Header() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= BREAKPOINT;

  if (isDesktop) {
    // ── DESKTOP HEADER (Reference Perfect) ──────────────────────────────────
    return (
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 24,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
          borderTopWidth: 4,
          borderTopColor: '#1E40AF', // Blue top line from image
        }}
      >
        {/* Left Side: Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <View style={{
            backgroundColor: '#F47321',
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <DogIcon color="white" size={24} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1A2E', letterSpacing: -1 }}>
            SAKU<Text style={{ color: '#F47321' }}>.</Text>
          </Text>
        </View>

        {/* Center: Unified Address & Search Bar */}
        <View style={{ 
          flex: 1, 
          flexShrink: 1,
          flexDirection: 'row', 
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 30,
          borderWidth: 1.5,
          borderColor: '#F0F0F0',
          marginHorizontal: 15,
          padding: 4,
          maxWidth: 800,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}>
          {/* Address Part */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFF7F0',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 25,
              gap: 8,
              flexShrink: 1,
            }}
          >
            <MapPin size={18} color="#F47321" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <Text 
              numberOfLines={1}
              style={{ fontSize: 15, color: '#1A1A2E', fontWeight: '800', flexShrink: 1 }}
            >
              Selecciona tu dirección
            </Text>
            <ChevronDown size={14} color="#555" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <View style={{ width: 1.5, height: 30, backgroundColor: '#F0F0F0', marginHorizontal: 8, flexShrink: 0 }} />

          {/* Search Part */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
            <Search size={20} color="#BFBFBF" strokeWidth={2} style={{ flexShrink: 0 }} />
            <TextInput
              placeholder="Medicamentos, alimentos, accesorios..."
              placeholderTextColor="#BFBFBF"
              style={{
                flex: 1,
                paddingHorizontal: 12,
                fontSize: 15,
                fontWeight: '500',
              }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#F47321',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Search size={18} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Side: Status & Icons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Active Order Capsule */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E8FAF4',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: '#6EE7B7',
              gap: 8,
            }}
          >
            <Truck size={18} color="#059669" />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 15, color: '#065F46', fontWeight: '800' }}>
              1 Orden Activa
            </Text>
            <ChevronDown size={14} color="#059669" />
          </TouchableOpacity>

          {/* Icon Set */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginHorizontal: 10 }}>
            <TouchableOpacity><Home size={24} color="#F47321" fill="#F47321" /></TouchableOpacity>
            
            <TouchableOpacity style={{ position: 'relative' }}>
              <ShoppingBag size={24} color="#555" />
              <View style={{
                position: 'absolute', top: -5, right: -8, backgroundColor: '#F47321',
                borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#FFFFFF'
              }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity><Heart size={24} color="#555" /></TouchableOpacity>

            <TouchableOpacity style={{ position: 'relative' }}>
              <Bell size={24} color="#555" />
              <View style={{
                position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444',
                borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#FFFFFF'
              }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* User Menu */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: '#EFEFEF',
              borderRadius: 30,
              padding: 5,
              paddingHorizontal: 12,
              gap: 10,
            }}
          >
            <View style={{ gap: 4 }}>
              <View style={{ width: 18, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
              <View style={{ width: 18, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
              <View style={{ width: 18, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
            </View>
            <View style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A2E',
              justifyContent: 'center', alignItems: 'center'
            }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>U</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── MOBILE HEADER ─────────
  return (
    <LinearGradient
      colors={['#FF8F40', '#F47321']} // Soft Lighter Orange (Top) to Saku Orange (Bottom)
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: 180,
        paddingHorizontal: 15,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            ENTREGAR A
          </Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <MapPin size={16} color="white" strokeWidth={2.5} />
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 17, marginLeft: 6, marginRight: 4 }}>
              Selecciona tu dirección
            </Text>
            <ChevronDown size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              width: 44,
              height: 44,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={22} color="white" strokeWidth={2} />
          </TouchableOpacity>
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#FF3B30',
              borderRadius: 11,
              minWidth: 22,
              height: 22,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#F47321',
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>3</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
