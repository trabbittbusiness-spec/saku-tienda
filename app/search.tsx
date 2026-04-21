import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions } from 'react-native';
import { Search, Heart, ShoppingBag, ArrowUpDown, Check } from 'lucide-react-native';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

/* 1. Datos simulados en base al diseño */
const MOCK_PRODUCTS = [
  { id: 1, category: 'PERRO O GATO', name: 'BRIT CARE GRAIN FREE SENIOR & LIGHT SALMON ...', unit: '1 unidad', price: '$74.990', image: 'https://images.unsplash.com/photo-1589924691106-073b19f55de7?q=80&w=500' },
  { id: 2, category: 'PERRO O GATO', name: 'ROYAL CANIN XSMALL PUPPY 2,5 KG', unit: '1 unidad', price: '$32.990', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500' },
  { id: 3, category: 'PERRO O GATO', name: 'Petever Forte 150 Ml', unit: '1 unidad', price: '$19.200', image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=500' },
  { id: 4, category: 'PERRO O GATO', name: 'Revolution plus gato 2,5 a 5 kg desparasitante pipeta ...', unit: '1 unidad', price: '$16.500', promo: true, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500' },
  { id: 5, category: 'PERRO O GATO', name: 'Salmón small breeds 7 kg', unit: '1 unidad', price: '$45.000', image: 'https://images.unsplash.com/photo-1589924691106-073b19f55de7?q=80&w=500' },
  { id: 6, category: 'EXOTICOS', name: 'Tenebrios snack natural', unit: '1 unidad', price: '$8.500', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500' },
  { id: 7, category: 'PERRO O GATO', name: 'FIT FORMULA ADULTO RAZA PEQUEÑA 10 KG', unit: '1 unidad', price: '$29.990', image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=500' },
  { id: 8, category: 'PERRO O GATO', name: 'Pro Plan sachet adulto pollo', unit: '1 unidad', price: '$1.200', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500' },
];

const CATEGORIES = [
  'Alimento', 'Cuidado e higiene', 'Medicamentos', 'Juguetes', 
  'Sustratos', 'Accesorios', 'Novedades', 'Aperitivos', 
  'Arenas y areneros', 'Snacks', 'Saku'
];

const PRICES = [
  'Menos de $10.000', '$10.000 - $30.000', '$30.000 - $60.000', 'Más de $60.000'
];

const TOP_TABS = ['Todo', 'Alimento', 'Snacks', 'Medicamentos', 'Juguetes'];

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isDesktop = width >= 1024;
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  
  // MOBILE VIEW
  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ height: 60, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Buscar</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Search Bar & Brand Filter */}
          <View style={{ flexDirection: 'row', padding: 20, gap: 12 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 50 }}>
              <Search size={20} color="#9CA3AF" />
              <TextInput 
                placeholder="Buscar productos, marcas..." 
                style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' }}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Marca</Text>
              <ArrowUpDown size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 25 }}>
            {TOP_TABS.map((tab, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={{ 
                  backgroundColor: idx === 0 ? '#1E1B4B' : '#FFFFFF', 
                  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15,
                  borderWidth: 1, borderColor: idx === 0 ? '#1E1B4B' : '#F3F4F6'
                }}
              >
                <Text style={{ color: idx === 0 ? 'white' : '#4B5563', fontWeight: '800', fontSize: 14 }}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 15, paddingBottom: 100 }}>
            {MOCK_PRODUCTS.map((prod) => (
              <TouchableOpacity 
                key={prod.id} 
                onPress={() => router.push('/product/1')}
                style={{ width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 }}
              >
                <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                  <TouchableOpacity onPress={() => toggleFavorite(prod)}>
                    <Heart size={20} color={isFavorite(prod.id) ? '#EF4444' : '#9CA3AF'} fill={isFavorite(prod.id) ? '#EF4444' : 'transparent'} />
                  </TouchableOpacity>
                </View>

                <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  <Image source={{ uri: prod.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>

                <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' }}>{prod.category}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', height: 40 }} numberOfLines={2}>{prod.name}</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginTop: 8 }}>{prod.price}</Text>

                <TouchableOpacity 
                  onPress={() => {
                    const priceNum = parseInt(prod.price.replace(/[$.]/g, ''));
                    addToCart({
                      id: prod.id,
                      name: prod.name,
                      price: priceNum,
                      image: prod.image,
                      quantity: 1
                    });
                  }}
                  style={{ 
                    backgroundColor: '#F47321', borderRadius: 12, paddingVertical: 10, marginTop: 12,
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 
                  }}
                >
                  <ShoppingBag size={14} color="white" strokeWidth={3} />
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Agregar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* 2. Incorporar el mismo Header navegable */}
      <Header />
      
      {/* Divider debajo del header */}
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />

      <View style={{ flex: 1, flexDirection: 'row', maxWidth: 1600, alignSelf: 'center', width: '100%' }}>
        
        {/* 3. BARRA LATERAL IZQUIERDA (Filtros) */}
        <View style={{ width: 280, backgroundColor: '#FFFFFF', paddingVertical: 30, paddingHorizontal: 24, borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 30 }}>Filtros</Text>

          {/* Filtro MARCA */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 }}>MARCA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 20 }}>
            <Search size={16} color="#9CA3AF" />
            <TextInput 
              placeholder="Buscar marca..." 
              style={{ flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '500', outlineStyle: 'none' }}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
             {CATEGORIES.map((cat, idx) => {
               const isSelected = selectedCats.includes(cat);
               return (
                 <TouchableOpacity key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={() => {
                   if (isSelected) setSelectedCats(selectedCats.filter(c => c !== cat));
                   else setSelectedCats([...selectedCats, cat]);
                 }}>
                   <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: isSelected ? '#F47321' : '#D1D5DB', backgroundColor: isSelected ? '#F47321' : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                   </View>
                   <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '500' }}>{cat}</Text>
                 </TouchableOpacity>
               )
             })}

             <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 }} />

             {/* Filtro PRECIO */}
             <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 16 }}>PRECIO</Text>
             {PRICES.map((price, idx) => {
               const isSelected = selectedPrice === price;
               return (
                 <TouchableOpacity key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} onPress={() => setSelectedPrice(price)}>
                   <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: isSelected ? '#F47321' : '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F47321' }} />}
                   </View>
                   <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '500' }}>{price}</Text>
                 </TouchableOpacity>
               )
             })}
          </ScrollView>
        </View>

        {/* 4. CONTENIDO PRINCIPAL (Barra de búsqueda, píldoras y Grid de Productos) */}
        <View style={{ flex: 1, padding: 30 }}>
          {/* Navegación y Tab Bar superior hiper-estable */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, gap: 20 }}>
            
            {/* Input Buscar productos... controlado anti-desbordamiento */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 12, flex: 1, maxWidth: 400, overflow: 'hidden' }}>
              <Search size={18} color="#9CA3AF" />
              <TextInput 
                placeholder="Buscar productos..." 
                style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', minWidth: 0 }}
                placeholderTextColor="#9CA3AF"
                numberOfLines={1}
              />
            </View>

            {/* Píldoras de TABS desplazables para evitar empuje */}
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
                {TOP_TABS.map((tab, idx) => (
                  <TouchableOpacity key={idx} style={{ backgroundColor: idx === 0 ? '#F47321' : '#F3F4F6', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 }}>
                     <Text style={{ color: idx === 0 ? 'white' : '#4B5563', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flex: 1 }} />

            {/* Total productos y Botón Ordenar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
               <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>488 productos</Text>
               <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}>
                  <ArrowUpDown size={16} color="#4B5563" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#4B5563' }}>Ordenar</Text>
               </TouchableOpacity>
            </View>
          </View>

          {/* Grilla de Catálogo */}
          <ScrollView showsVerticalScrollIndicator={false}>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingBottom: 50 }}>
                {MOCK_PRODUCTS.map((prod) => (
                  <TouchableOpacity 
                    key={prod.id} 
                    onPress={() => router.push('/product/1')}
                    style={{ 
                      width: '23%', minWidth: 240, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
                      borderWidth: 1, borderColor: '#F0F0F0'
                    }}
                  >
                     {/* Top Row: Tag (Red Discount) & Heart Icon */}
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, zIndex: 10 }}>
                        {prod.promo ? (
                          <View style={{ backgroundColor: '#CD1A3B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                             <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>-25%</Text>
                          </View>
                        ) : <View />}
                        
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite({
                              id: prod.id,
                              name: prod.name,
                              price: prod.price,
                              image: prod.image,
                              category: prod.category
                            });
                          }}
                          style={{ padding: 4 }}
                        >
                           <Heart size={22} color={isFavorite(prod.id) ? '#EF4444' : '#C4C4C4'} fill={isFavorite(prod.id) ? '#EF4444' : 'transparent'} />
                        </TouchableOpacity>
                     </View>

                     {/* Image */}
                     <View style={{ width: '100%', height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        <Image source={{ uri: prod.image }} style={{ width: '90%', height: '90%' }} resizeMode="contain" />
                     </View>

                     {/* Details */}
                     <Text style={{ fontSize: 16, fontWeight: '700', color: '#13132B', lineHeight: 22, height: 44, marginTop: 10 }} numberOfLines={2}>
                        {prod.name}
                     </Text>
                     
                     <Text style={{ fontSize: 20, fontWeight: '900', color: '#CD1A3B', marginTop: 15 }}>
                        {prod.price} {prod.promo ? '- $ 74.243' : ''}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 4, marginBottom: 20 }}>
                        desde ($ 9.281 x kg)
                      </Text>
                      
                      <TouchableOpacity 
                        onPress={() => router.push('/product/1')}
                        style={{ backgroundColor: '#092415', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                      >
                         <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: -0.3 }}>Ver detalles</Text>
                      </TouchableOpacity>
                  </TouchableOpacity>
                ))}
             </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
