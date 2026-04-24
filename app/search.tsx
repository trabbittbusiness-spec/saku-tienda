import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, ActivityIndicator, Modal } from 'react-native';
import { Search, Heart, ShoppingBag, ArrowUpDown, Check, X, ChevronDown, ChevronUp, Filter } from 'lucide-react-native';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/* 1. Datos simulados de respaldo */
const MOCK_PRODUCTS = [
  { id: 1, category: 'PERRO O GATO', name: 'BRIT CARE GRAIN FREE SENIOR & LIGHT SALMON ...', unit: '1 unidad', price: 'CLP $74.990', numericPrice: 74990, image: 'https://images.unsplash.com/photo-1589924691106-073b19f55de7?q=80&w=500' },
  { id: 2, category: 'PERRO O GATO', name: 'ROYAL CANIN XSMALL PUPPY 2,5 KG', unit: '1 unidad', price: 'CLP $32.990', numericPrice: 32990, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500' },
  { id: 3, category: 'PERRO O GATO', name: 'Petever Forte 150 Ml', unit: '1 unidad', price: 'CLP $19.200', numericPrice: 19200, image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=500' },
  { id: 4, category: 'PERRO O GATO', name: 'Revolution plus gato 2,5 a 5 kg desparasitante pipeta ...', unit: '1 unidad', price: 'CLP $16.500', numericPrice: 16500, promo: true, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500' },
  { id: 5, category: 'PERRO O GATO', name: 'Salmón small breeds 7 kg', unit: '1 unidad', price: 'CLP $45.000', numericPrice: 45000, image: 'https://images.unsplash.com/photo-1589924691106-073b19f55de7?q=80&w=500' },
  { id: 6, category: 'EXOTICOS', name: 'Tenebrios snack natural', unit: '1 unidad', price: 'CLP $8.500', numericPrice: 8500, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500' },
  { id: 7, category: 'PERRO O GATO', name: 'FIT FORMULA ADULTO RAZA PEQUEÑA 10 KG', unit: '1 unidad', price: 'CLP $29.990', numericPrice: 29990, image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=500' },
  { id: 8, category: 'PERRO O GATO', name: 'Pro Plan sachet adulto pollo', unit: '1 unidad', price: 'CLP $1.200', numericPrice: 1200, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500' },
];

const CATEGORIES = [
  'Alimento', 'Cuidado e higiene', 'Medicamentos', 'Juguetes', 
  'Sustratos', 'Accesorios', 'Novedades', 'Aperitivos', 
  'Arenas y areneros', 'Snacks', 'Saku'
];




const FilterAccordion = ({ title, options, selected, onToggle, isExpanded, onToggleExpand }: any) => {
  return (
    <View style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 }}>
      <TouchableOpacity onPress={onToggleExpand} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
        {isExpanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
      </TouchableOpacity>
      {isExpanded && (
        <View style={{ paddingTop: 8, paddingBottom: 8 }}>
          {options.map((opt: string, idx: number) => {
            const isSelected = typeof selected === 'string' ? selected === opt : selected.includes(opt);
            return (
              <TouchableOpacity key={idx} onPress={() => onToggle(opt)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {typeof selected === 'string' ? (
                  <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: isSelected ? '#F47321' : '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                     {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F47321' }} />}
                  </View>
                ) : (
                  <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: isSelected ? '#F47321' : '#D1D5DB', backgroundColor: isSelected ? '#F47321' : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                )}
                <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '500' }}>{opt}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
};

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { filter, animal, category, tipo, marca } = useLocalSearchParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isDesktop = width >= 1024;
  
  // Cálculos dinámicos para una grilla perfecta sin espacios
  const mobileGridWidth = width - 30; // paddingHorizontal: 15x2
  const mobileCols = width > 600 ? 3 : 2;
  const mobileCardWidth = (mobileGridWidth - (mobileCols - 1) * 15) / mobileCols;

  // Descontamos 25px para dar margen a la barra de scroll del navegador
  const desktopMaxWidth = Math.min(width, 1600) - 25;
  const desktopGridWidth = desktopMaxWidth - 280 - 60; // sidebar: 280, paddingHorizontal: 30x2
  const idealCardWidth = 220; // Ancho mínimo ideal para que quepan más productos
  const desktopCols = Math.max(2, Math.floor((desktopGridWidth + 20) / (idealCardWidth + 20)));
  const desktopCardWidth = ((desktopGridWidth - (desktopCols - 1) * 20) / desktopCols) - 0.1; // -0.1 para evitar saltos por decimales

  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<string>('Todos');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    animal: true, marca: false, categoria: false, tipo: false, promo: false
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const toggleSection = (sec: string) => setExpandedSections((prev: any) => ({ ...prev, [sec]: !prev[sec] }));
  const toggleFilter = (setter: any, val: string) => {
    setter((prev: string[]) => prev.includes(val) ? prev.filter((x: string) => x !== val) : [...prev, val]);
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [products, setProducts] = useState<any[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const availableAnimals = Array.from(new Set(products.map(p => p.animal).filter(Boolean)));
  const availableMarcas = Array.from(new Set(products.map(p => p.marca).filter(Boolean)));
  const availableCategorias = Array.from(new Set(products.map(p => p.categoriaReal).filter(Boolean)));
  const availableTipos = Array.from(new Set(products.map(p => p.tipo).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAnimal = selectedAnimals.length === 0 || selectedAnimals.includes(p.animal);
    const matchesMarca = selectedMarcas.length === 0 || selectedMarcas.includes(p.marca);
    const matchesCategoria = selectedCategorias.length === 0 || selectedCategorias.includes(p.categoriaReal);
    const matchesTipo = selectedTipos.length === 0 || selectedTipos.includes(p.tipo);
    const matchesPromo = selectedPromo === 'Todos' ? true : (selectedPromo === 'Sí' ? p.promo : !p.promo);

    return matchesSearch && matchesAnimal && matchesMarca && matchesCategoria && matchesTipo && matchesPromo;
  }).sort((a, b) => {
    if (sortOrder === 'asc') return a.numericPrice - b.numericPrice;
    if (sortOrder === 'desc') return b.numericPrice - a.numericPrice;
    return 0;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAnimals, selectedMarcas, selectedCategorias, selectedTipos, selectedPromo]);

  useEffect(() => {
    if (filter === 'promo') {
      setSelectedPromo('Sí');
    }
    
    if (animal) {
      setSelectedAnimals([animal as string]);
    }
    if (category) {
      setSelectedCategorias([category as string]);
    }
    if (tipo) {
      setSelectedTipos([tipo as string]);
    }
    if (marca) {
      setSelectedMarcas([marca as string]);
    }
  }, [filter, animal, category, tipo, marca]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Products'));
        const productsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.ID_productos || doc.id,
            category: data.categoria || data.Tipo || data.animal || 'GENERAL',
            name: data.nombre || 'Producto sin nombre',
            unit: data.medida || '1 unidad',
            price: 'CLP $' + (data.precio || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
            numericPrice: data.precio || 0,
            promo: data.estadoPromocion || false,
            image: data.foto1 || 'https://via.placeholder.com/500',
            animal: data.animal || '',
            marca: data.marca || '',
            categoriaReal: data.categoria || '',
            tipo: data.Tipo || '',
          };
        });
        setProducts(productsList.length > 0 ? productsList : MOCK_PRODUCTS);
      } catch (error) {
        console.error("Error fetching products from Firebase: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('none');
  };
  
  // MOBILE VIEW
  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ height: 60, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Buscar</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Search Bar & Brand Filter */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, gap: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 15, height: 54, borderWidth: 1, borderColor: isSearchFocused ? '#3B1E54' : 'transparent' }}>
              <Search size={20} color={isSearchFocused ? '#3B1E54' : '#9CA3AF'} />
              <TextInput 
                placeholder="Buscar productos, marcas..." 
                style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', outlineStyle: 'none' } as any}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                onPress={() => setIsFilterModalOpen(true)}
                style={{ 
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: (selectedAnimals.length + selectedMarcas.length + selectedCategorias.length) > 0 ? '#F47321' : '#F9FAFB', 
                  borderRadius: 14, height: 48, gap: 8, borderWidth: 1, borderColor: (selectedAnimals.length + selectedMarcas.length + selectedCategorias.length) > 0 ? '#F47321' : '#F3F4F6'
                }}
              >
                <Filter size={18} color={(selectedAnimals.length + selectedMarcas.length + selectedCategorias.length) > 0 ? 'white' : '#111827'} strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: (selectedAnimals.length + selectedMarcas.length + selectedCategorias.length) > 0 ? 'white' : '#111827' }}>
                  Filtros {(selectedAnimals.length + selectedMarcas.length + selectedCategorias.length) > 0 ? `(${selectedAnimals.length + selectedMarcas.length + selectedCategorias.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleSort}
                style={{ 
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: sortOrder !== 'none' ? '#3B1E54' : '#F9FAFB', 
                  borderRadius: 14, height: 48, gap: 8, borderWidth: 1, borderColor: sortOrder !== 'none' ? '#3B1E54' : '#F3F4F6'
                }}
              >
                <ArrowUpDown size={18} color={sortOrder !== 'none' ? 'white' : '#111827'} strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: sortOrder !== 'none' ? 'white' : '#111827' }}>
                  {sortOrder === 'none' ? 'Ordenar' : sortOrder === 'asc' ? 'Baratos' : 'Caros'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 15 }}
          >
            {['Perro', 'Gato', 'Erizo', 'Hámster', 'Aves', 'Tortugas'].map((animal) => {
              const isSelected = selectedAnimals.includes(animal);
              return (
                <TouchableOpacity 
                  key={animal}
                  onPress={() => toggleFilter(setSelectedAnimals, animal)}
                  style={{ 
                    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, 
                    backgroundColor: isSelected ? '#3B1E54' : '#FFFFFF',
                    borderWidth: 1.5, borderColor: isSelected ? '#3B1E54' : '#F3F4F6',
                    shadowColor: '#000', shadowOpacity: isSelected ? 0.1 : 0.02, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? 'white' : '#6B7280' }}>{animal}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>


          {/* Product Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 15, paddingBottom: 100 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#3B1E54" style={{ marginTop: 50 }} />
            ) : filteredProducts.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 50, fontSize: 16, color: '#9CA3AF', width: '100%' }}>No se encontraron productos.</Text>
            ) : (
              paginatedProducts.map((prod) => (
              <TouchableOpacity 
                key={prod.id} 
                onPress={() => router.push(`/product/${prod.id}`)}
                style={{ 
                  width: mobileCardWidth, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, 
                  borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, 
                  shadowRadius: 10, overflow: 'hidden' 
                }}
              >
                {prod.promo && (
                  <View style={{ 
                    position: 'absolute', top: 12, left: -22, backgroundColor: '#22C55E', 
                    width: 90, height: 24, transform: [{ rotate: '-45deg' }], 
                    justifyContent: 'center', alignItems: 'center', zIndex: 20,
                    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
                  }}>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 }}>PROMO</Text>
                  </View>
                )}
                <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                  <TouchableOpacity onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); toggleFavorite(prod); }}>
                    <Heart size={20} color={isFavorite(prod.id) ? '#EF4444' : '#9CA3AF'} fill={isFavorite(prod.id) ? '#EF4444' : 'transparent'} />
                  </TouchableOpacity>
                </View>



                <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                  <Image source={{ uri: prod.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>

                <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' }}>{prod.category}</Text>
                <Text 
                  style={{ fontSize: 13, fontWeight: '800', color: '#111827', lineHeight: 18, height: 36, textTransform: 'uppercase', overflow: 'hidden' }} 
                  numberOfLines={2} 
                  ellipsizeMode="tail"
                >
                  {prod.name}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginTop: 8 }}>{prod.price}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 8 }}>
                    <TouchableOpacity onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); setQuantities(prev => ({...prev, [prod.id]: Math.max(1, (prev[prod.id] || 1) - 1)})) }} style={{ padding: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#4B5563' }}>-</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 14, fontWeight: '800', marginHorizontal: 4 }}>{quantities[prod.id] || 1}</Text>
                    <TouchableOpacity onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); setQuantities(prev => ({...prev, [prod.id]: (prev[prod.id] || 1) + 1})) }} style={{ padding: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#4B5563' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    onPress={(e) => {
                      if (e?.stopPropagation) e.stopPropagation();
                      const priceNum = parseInt(prod.price.replace(/[$.]/g, ''));
                      addToCart({
                        id: prod.id,
                        name: prod.name,
                        price: priceNum,
                        image: prod.image,
                        quantity: quantities[prod.id] || 1
                      });
                      setQuantities(prev => ({...prev, [prod.id]: 1}));
                    }}
                    style={{ flex: 1, backgroundColor: '#F47321', borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>+ Agregar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )))}

            {/* Paginación Móvil */}
            {totalPages > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, width: '100%', marginTop: 20, paddingBottom: 40 }}>
                <TouchableOpacity 
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: 10, opacity: currentPage === 1 ? 0.3 : 1 }}
                >
                  <Text style={{ fontWeight: '800', color: '#3B1E54', fontSize: 14 }}>Anterior</Text>
                </TouchableOpacity>
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{currentPage} de {totalPages}</Text>
                </View>
                <TouchableOpacity 
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: 10, opacity: currentPage === totalPages ? 0.3 : 1 }}
                >
                  <Text style={{ fontWeight: '800', color: '#3B1E54', fontSize: 14 }}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Filter Modal */}
        <Modal
          visible={isFilterModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsFilterModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, height: '92%', paddingBottom: 30 }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>Filtros</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>Personaliza tu búsqueda</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsFilterModalOpen(false)} 
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' }}
                >
                  <X size={20} color="#111827" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 25 }} showsVerticalScrollIndicator={false}>
                <FilterAccordion title="Animal" options={['Perro', 'Gato', 'Erizo', 'Guinea', 'Aves', 'Conejo', 'Hámster', 'Tortugas', 'Hurón']} selected={selectedAnimals} onToggle={(v: string) => toggleFilter(setSelectedAnimals, v)} isExpanded={expandedSections.animal} onToggleExpand={() => toggleSection('animal')} />
                <FilterAccordion title="Marca" options={['Royal Canin', 'Pro Plan', 'Brit', 'Fit Formula', 'Bravery', 'Acana', 'Orijen']} selected={selectedMarcas} onToggle={(v: string) => toggleFilter(setSelectedMarcas, v)} isExpanded={expandedSections.marca} onToggleExpand={() => toggleSection('marca')} />
                <FilterAccordion title="Categoría" options={CATEGORIES} selected={selectedCategorias} onToggle={(v: string) => toggleFilter(setSelectedCategorias, v)} isExpanded={expandedSections.categoria} onToggleExpand={() => toggleSection('categoria')} />
                <FilterAccordion title="Especialidad / Tipo" options={['Cachorro', 'Adulto', 'Senior', 'Light', 'Esterilizado']} selected={selectedTipos} onToggle={(v: string) => toggleFilter(setSelectedTipos, v)} isExpanded={expandedSections.tipo} onToggleExpand={() => toggleSection('tipo')} />
                <FilterAccordion title="Promoción" options={['Todos', 'Sí', 'No']} selected={selectedPromo} onToggle={setSelectedPromo} isExpanded={expandedSections.promo} onToggleExpand={() => toggleSection('promo')} />
                
                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Modal Footer */}
              <View style={{ padding: 25, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', gap: 15, backgroundColor: '#FFFFFF' }}>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedAnimals([]);
                    setSelectedMarcas([]);
                    setSelectedCategorias([]);
                    setSelectedTipos([]);
                    setSelectedPromo('Todos');
                  }}
                  style={{ flex: 1, height: 60, borderRadius: 18, borderHorizontal: 1, borderColor: '#E5E7EB', borderWidth: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#6B7280' }}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setIsFilterModalOpen(false)}
                  style={{ 
                    flex: 2, height: 60, borderRadius: 18, backgroundColor: '#F47321', 
                    justifyContent: 'center', alignItems: 'center', gap: 10, flexDirection: 'row',
                    shadowColor: '#F47321', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } 
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '900', color: 'white' }}>Ver resultados</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
             {availableAnimals.length > 0 && (
               <FilterAccordion 
                 title="Animal" 
                 options={availableAnimals} 
                 selected={selectedAnimals} 
                 onToggle={(val: string) => toggleFilter(setSelectedAnimals, val)}
                 isExpanded={expandedSections.animal}
                 onToggleExpand={() => toggleSection('animal')}
               />
             )}

             {availableMarcas.length > 0 && (
               <FilterAccordion 
                 title="Marca" 
                 options={availableMarcas} 
                 selected={selectedMarcas} 
                 onToggle={(val: string) => toggleFilter(setSelectedMarcas, val)}
                 isExpanded={expandedSections.marca}
                 onToggleExpand={() => toggleSection('marca')}
               />
             )}

             {availableCategorias.length > 0 && (
               <FilterAccordion 
                 title="Categoría" 
                 options={availableCategorias} 
                 selected={selectedCategorias} 
                 onToggle={(val: string) => toggleFilter(setSelectedCategorias, val)}
                 isExpanded={expandedSections.categoria}
                 onToggleExpand={() => toggleSection('categoria')}
               />
             )}

             {availableTipos.length > 0 && (
               <FilterAccordion 
                 title="Especialidad / Tipo" 
                 options={availableTipos} 
                 selected={selectedTipos} 
                 onToggle={(val: string) => toggleFilter(setSelectedTipos, val)}
                 isExpanded={expandedSections.tipo}
                 onToggleExpand={() => toggleSection('tipo')}
               />
             )}

             <FilterAccordion 
               title="Promoción" 
               options={['Todos', 'Sí', 'No']} 
               selected={selectedPromo} 
               onToggle={(val: string) => setSelectedPromo(val)}
               isExpanded={expandedSections.promo}
               onToggleExpand={() => toggleSection('promo')}
             />
          </ScrollView>
        </View>

        {/* 4. CONTENIDO PRINCIPAL (Barra de búsqueda, píldoras y Grid de Productos) */}
        <View style={{ flex: 1, padding: 30 }}>
          {/* Navegación y Tab Bar superior hiper-estable */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, gap: 20 }}>
            
            {/* Input Buscar productos... controlado anti-desbordamiento */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 12, flex: 1, maxWidth: 400, overflow: 'hidden', borderWidth: 1, borderColor: isSearchFocused ? '#3B1E54' : 'transparent' }}>
              <Search size={18} color={isSearchFocused ? '#3B1E54' : '#9CA3AF'} />
              <TextInput 
                placeholder="Buscar productos..." 
                style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', minWidth: 0, outlineStyle: 'none' } as any}
                placeholderTextColor="#9CA3AF"
                numberOfLines={1}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>


            <View style={{ flex: 1 }} />

            {/* Total productos y Botón Ordenar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
               <Text style={{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' }}>{filteredProducts.length} productos</Text>
               <TouchableOpacity 
                  onPress={toggleSort}
                  style={{ 
                    flexDirection: 'row', alignItems: 'center', gap: 8, 
                    backgroundColor: sortOrder !== 'none' ? '#F47321' : '#F3F4F6', 
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 
                  }}
                >
                   <ArrowUpDown size={16} color={sortOrder !== 'none' ? 'white' : '#4B5563'} />
                   <Text style={{ fontSize: 14, fontWeight: '700', color: sortOrder !== 'none' ? 'white' : '#4B5563' }}>
                     {sortOrder === 'none' ? 'Ordenar' : sortOrder === 'asc' ? 'Más Baratos' : 'Más Caros'}
                   </Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* Grilla de Catálogo */}
          <ScrollView showsVerticalScrollIndicator={false}>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, paddingBottom: 50 }}>
                {loading ? (
                  <ActivityIndicator size="large" color="#3B1E54" style={{ marginTop: 50, marginLeft: 'auto', marginRight: 'auto' }} />
                ) : filteredProducts.length === 0 ? (
                  <Text style={{ textAlign: 'center', marginTop: 50, fontSize: 18, color: '#9CA3AF', width: '100%' }}>No se encontraron productos para tu búsqueda.</Text>
                ) : (
                  paginatedProducts.map((prod) => (
                  <TouchableOpacity 
                    key={prod.id} 
                    onPress={() => router.push(`/product/${prod.id}`)}
                    style={{ 
                      width: desktopCardWidth, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
                      borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden'
                    }}
                  >
                     {prod.promo && (
                        <View style={{ 
                          position: 'absolute', top: 14, left: -28, backgroundColor: '#22C55E', 
                          width: 110, height: 28, transform: [{ rotate: '-45deg' }], 
                          justifyContent: 'center', alignItems: 'center', zIndex: 20,
                          shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
                        }}>
                          <Text style={{ color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>PROMO</Text>
                        </View>
                     )}
                     {/* Top Row: Heart Icon (Tag removed) */}
                     <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 15, zIndex: 10 }}>

                        
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
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12 }}>
                          <TouchableOpacity onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); setQuantities(prev => ({...prev, [prod.id]: Math.max(1, (prev[prod.id] || 1) - 1)})) }} style={{ padding: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#4B5563' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 16, fontWeight: '800', marginHorizontal: 8 }}>{quantities[prod.id] || 1}</Text>
                          <TouchableOpacity onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); setQuantities(prev => ({...prev, [prod.id]: (prev[prod.id] || 1) + 1})) }} style={{ padding: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#4B5563' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                          onPress={(e) => {
                            if (e?.stopPropagation) e.stopPropagation();
                            const priceNum = parseInt(prod.price.replace(/[$.]/g, ''));
                            addToCart({
                              id: prod.id,
                              name: prod.name,
                              price: priceNum,
                              image: prod.image,
                              quantity: quantities[prod.id] || 1
                            });
                            setQuantities(prev => ({...prev, [prod.id]: 1}));
                          }}
                          style={{ 
                            flex: 1, backgroundColor: '#F47321', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
                            shadowColor: '#F47321', shadowOpacity: 0.2, shadowRadius: 8
                          }}
                        >
                           <Text style={{ color: 'white', fontWeight: '600', fontSize: 14, letterSpacing: -0.3 }}>+ Agregar</Text>
                        </TouchableOpacity>
                      </View>
                  </TouchableOpacity>
                )))}

                {/* Paginación Escritorio */}
                {totalPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, width: '100%', marginTop: 30 }}>
                    <TouchableOpacity 
                      disabled={currentPage === 1}
                      onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      style={{ backgroundColor: currentPage === 1 ? '#F3F4F6' : '#E5E7EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                    >
                      <Text style={{ fontWeight: '800', color: currentPage === 1 ? '#9CA3AF' : '#3B1E54', fontSize: 15 }}>Anterior</Text>
                    </TouchableOpacity>
                    <View style={{ paddingHorizontal: 20 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Página {currentPage} de {totalPages}</Text>
                    </View>
                    <TouchableOpacity 
                      disabled={currentPage === totalPages}
                      onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      style={{ backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#E5E7EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                    >
                      <Text style={{ fontWeight: '800', color: currentPage === totalPages ? '#9CA3AF' : '#3B1E54', fontSize: 15 }}>Siguiente</Text>
                    </TouchableOpacity>
                  </View>
                )}
             </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
