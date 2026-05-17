import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, useWindowDimensions, ActivityIndicator, Modal, FlatList, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Search, Heart, ShoppingBag, ShoppingCart, ArrowUpDown, Check, X, ChevronDown, ChevronUp, Filter, ChevronLeft, ArrowUp } from 'lucide-react-native';
import Header from '../../components/Header';
import AuthModal from '../../components/AuthModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

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
                  <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: isSelected ? '#10B981' : '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                     {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' }} />}
                  </View>
                ) : (
                  <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: isSelected ? '#10B981' : '#D1D5DB', backgroundColor: isSelected ? '#10B981' : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
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

const SearchProductCardBody = React.memo(({ prod, isDesktop, isFavorite, toggleFavorite, addToCart, setShowAuthModal, cartQty }: any) => {
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  
  const currentVariant = prod.variants && prod.variants.length > 0 ? prod.variants[selectedVarIndex] : null;
  const displayPrice = currentVariant 
    ? 'CLP $' + Math.round(currentVariant.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : prod.price;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
      {prod.promo && (
        <View style={{ 
          position: 'absolute', top: 0, left: 0, backgroundColor: '#22C55E', 
          paddingHorizontal: isDesktop ? 16 : 12, paddingVertical: isDesktop ? 8 : 6, 
          borderBottomRightRadius: isDesktop ? 16 : 12, zIndex: 20,
        }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: isDesktop ? 11 : 10, letterSpacing: 0.5 }}>OFERTA</Text>
        </View>
      )}
      <View style={{ position: 'absolute', top: isDesktop ? 20 : 10, right: isDesktop ? 20 : 10, zIndex: 10 }}>
        <TouchableOpacity onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); toggleFavorite(prod); }}>
          <Heart size={isDesktop ? 24 : 20} color={isFavorite ? '#EF4444' : (isDesktop ? '#D1D5DB' : '#9CA3AF')} fill={isFavorite ? '#EF4444' : 'transparent'} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: isDesktop ? 20 : 16, overflow: 'hidden', marginBottom: isDesktop ? 20 : 12 }}>
        <Image 
          source={{ uri: prod.image }} 
          style={{ width: '100%', height: '100%' }} 
          contentFit="contain" 
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>

      <Text style={{ fontSize: isDesktop ? 11 : 10, fontWeight: '800', color: '#9CA3AF', marginBottom: isDesktop ? 6 : 4, textTransform: 'uppercase', letterSpacing: isDesktop ? 1 : 0 }}>{prod.category}</Text>
      <Text 
        style={{ fontSize: isDesktop ? 17 : 13, fontWeight: '800', color: '#111827', lineHeight: isDesktop ? 22 : 18, height: isDesktop ? 44 : 36, textTransform: 'uppercase' }} 
        numberOfLines={2}
      >
        {prod.name}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 }}>
        {prod.variants && prod.variants.length > 0 ? (
          prod.variants.map((v: any, i: number) => (
            <TouchableOpacity 
              key={i}
              onPress={(e) => { e.stopPropagation(); setSelectedVarIndex(i); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: '#FFFFFF',
                borderWidth: selectedVarIndex === i ? 2 : 1,
                borderColor: selectedVarIndex === i ? '#63348C' : '#D1D5DB'
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: selectedVarIndex === i ? '#63348C' : '#9CA3AF', textTransform: 'uppercase' }}>{v.label}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#63348C' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#63348C', textTransform: 'uppercase' }}>UNIDAD</Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: isDesktop ? 24 : 18, fontWeight: '900', color: '#111827', marginTop: isDesktop ? 5 : 8 }}>{displayPrice}</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: isDesktop ? 20 : 12 }}>
        {!auth.currentUser ? (
          <TouchableOpacity 
            onPress={(e) => { if (e?.stopPropagation) e.stopPropagation(); router.push('/login'); }}
            style={{ 
              flex: 1, backgroundColor: '#10B981', borderRadius: 12, paddingVertical: isDesktop ? 14 : 12, alignItems: 'center', justifyContent: 'center',
              shadowColor: '#10B981', shadowOpacity: 0.2, shadowRadius: 8
            }}
          >
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>Iniciar Sesión</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              onPress={(e) => {
                if (e?.stopPropagation) e.stopPropagation();
                if (!auth.currentUser) {
                  setShowAuthModal(true);
                  return;
                }
                const finalPrice = currentVariant ? currentVariant.price : (prod.numericPrice || 0);
                addToCart({
                  id: prod.id,
                  name: prod.name + (currentVariant ? ` (${currentVariant.label})` : ''),
                  price: finalPrice,
                  image: prod.image,
                  quantity: quantity
                });
                setQuantity(1);
              }}
              style={{ 
                flex: 1,
                backgroundColor: '#63348C',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                shadowColor: '#63348C',
                shadowOpacity: 0.25,
                shadowRadius: 8
              }}
            >
              <ShoppingCart size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>
                {cartQty > 0 ? `Agregar (${cartQty})` : 'Agregar'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Animated.View>
  );
});

const SearchInput = React.memo(({ value, onChange, isFocused, onFocus, onBlur }: any) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(text);
    }, 400);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 15, height: 54, borderWidth: 1, borderColor: isFocused ? '#10B981' : 'transparent' }}>
      <Search size={20} color={isFocused ? '#10B981' : '#9CA3AF'} />
      <TextInput 
        placeholder="Buscar productos, marcas..." 
        style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', outlineStyle: 'none' } as any}
        placeholderTextColor="#9CA3AF"
        value={localValue}
        onChangeText={handleChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
});

import Skeleton from '../../components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SearchScreen = React.memo(function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { filter, animal, category, tipo, marca } = useLocalSearchParams();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addToCart } = useCart();
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isDesktop = width >= 768;
  
  // Cálculos dinámicos para una grilla perfecta sin espacios
  const mobileGridWidth = width - 30; // paddingHorizontal: 15x2
  const mobileCols = width > 600 ? 3 : 2;
  const mobileCardWidth = (mobileGridWidth - (mobileCols - 1) * 15) / mobileCols;

  // Descontamos 25px para dar margen a la barra de scroll del navegador
  const desktopMaxWidth = Math.min(width, 1600) - 25;
  const desktopGridWidth = desktopMaxWidth - 190 - 40; // sidebar: 190, padding: 20x2
  const idealCardWidth = 220; // Ancho mínimo ideal para que quepan más productos
  const desktopCols = Math.max(2, Math.floor((desktopGridWidth + 16) / (idealCardWidth + 16)));
  const desktopCardWidth = ((desktopGridWidth - (desktopCols - 1) * 16) / desktopCols) - 0.1; // -0.1 para evitar saltos por decimales

  const { products, loadingProducts: loading } = useProducts();
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<string>('Todos');

  // Admin collections: categories and brands with their animal assignments
  const [adminCategorias, setAdminCategorias] = useState<any[]>([]);
  const [adminMarcas, setAdminMarcas] = useState<any[]>([]);

  useEffect(() => {
    const unsubCats = onSnapshot(
      query(collection(db, 'Categorias_name'), orderBy('creadoEn', 'desc')),
      (snap) => setAdminCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubBrands = onSnapshot(
      query(collection(db, 'Marca_name')),
      (snap) => setAdminMarcas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubCats(); unsubBrands(); };
  }, []);

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
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Defer heavy rendering — show shell first, load content after paint
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const cartMap = React.useMemo(() => {
    if (!isReady) return {};
    const map: Record<string, number> = {};
    (cart || []).forEach((item: any) => {
      const id = String(item.ID_productos);
      map[id] = (map[id] || 0) + (item.cantidad || 0);
    });
    return map;
  }, [cart, isReady]);

  /* Debounce handled in SearchInput */

  const availableAnimals = React.useMemo(() => {
    if (!isReady) return [];
    const set = new Set((products || []).map(p => String(p.animal || '').trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [products, isReady]);

  const productsForFilters = React.useMemo(() => {
    if (!isReady) return [];
    if (selectedAnimals.length === 0) return products || [];
    return (products || []).filter(p => {
      if (!p) return false;
      const cleanPAnimal = String(p.animal || '').trim().toLowerCase();
      return selectedAnimals.includes('Exoticos') 
        ? (cleanPAnimal !== 'perro' && cleanPAnimal !== 'gato') 
        : selectedAnimals.some(sa => cleanPAnimal.includes(sa.toLowerCase()));
    });
  }, [products, isReady, selectedAnimals]);

  // ── Categories from Admin (Categorias_name), filtered by selected animal
  const availableCategorias = React.useMemo(() => {
    if (!isReady) return [];
    let cats = adminCategorias.filter(c => c.disponibilidad !== false);
    if (selectedAnimals.length > 0) {
      cats = cats.filter(c => {
        const catAnimals: string[] = c.animales || (c.animal ? [c.animal] : []);
        if (selectedAnimals.includes('Exoticos')) {
          // For exotics: include categories that are NOT exclusively for Perro or Gato
          const hasPerroOnly = catAnimals.every((a: string) => a.toLowerCase() === 'perro');
          const hasGatoOnly = catAnimals.every((a: string) => a.toLowerCase() === 'gato');
          return !hasPerroOnly && !hasGatoOnly;
        }
        return catAnimals.some((a: string) =>
          selectedAnimals.some(sa => a.toLowerCase().includes(sa.toLowerCase()))
        );
      });
    }
    const names = cats.map(c => String(c.nombre || '').trim()).filter(Boolean);

    // Order defined by user: Alimento - snack - juguetes - medicamentos - accesorios - novedades - cuidados e higiene
    const orderMap: Record<string, number> = {
      'alimento': 0,
      'snack': 1,
      'snacks': 1,
      'juguetes': 2,
      'medicamentos': 3,
      'accesorios': 4,
      'novedades': 5,
      'cuidados e higiene': 6,
      'cuidado e higiene': 6
    };

    // Filter to only include categories that belong to the list or match closely, and normalize names
    const filteredAndNormalized = names.reduce((acc: string[], name) => {
      const lower = name.toLowerCase();
      // Find matching key
      const key = Object.keys(orderMap).find(k => lower.includes(k) || k.includes(lower));
      if (key !== undefined) {
        // Let's normalize display name according to user specification
        let normalizedName = name;
        if (lower === 'alimento') normalizedName = 'Alimento';
        else if (lower === 'snack' || lower === 'snacks') normalizedName = 'Snack';
        else if (lower === 'juguetes') normalizedName = 'Juguetes';
        else if (lower === 'medicamentos') normalizedName = 'Medicamentos';
        else if (lower === 'accesorios') normalizedName = 'Accesorios';
        else if (lower === 'novedades') normalizedName = 'Novedades';
        else if (lower === 'cuidados e higiene' || lower === 'cuidado e higiene') normalizedName = 'Cuidados e higiene';
        
        if (!acc.includes(normalizedName)) {
          acc.push(normalizedName);
        }
      }
      return acc;
    }, []);

    // Sort according to our orderMap
    return filteredAndNormalized.sort((a, b) => {
      const idxA = orderMap[a.toLowerCase()] !== undefined ? orderMap[a.toLowerCase()] : 99;
      const idxB = orderMap[b.toLowerCase()] !== undefined ? orderMap[b.toLowerCase()] : 99;
      return idxA - idxB;
    });
  }, [adminCategorias, selectedAnimals, isReady]);

  // ── Brands from Admin (Marca_name), filtered by selected animal
  const availableMarcas = React.useMemo(() => {
    if (!isReady) return [];
    let brands = adminMarcas.filter(b => b.disponibilidad !== false);
    if (selectedAnimals.length > 0) {
      brands = brands.filter(b => {
        const brandAnimals: string[] = b.animales || (b.Tipo_animal ? [b.Tipo_animal] : []);
        if (brandAnimals.length === 0) return true; // no restriction = show always
        if (selectedAnimals.includes('Exoticos')) {
          const hasPerroOnly = brandAnimals.every((a: string) => a.toLowerCase() === 'perro');
          const hasGatoOnly = brandAnimals.every((a: string) => a.toLowerCase() === 'gato');
          return !hasPerroOnly && !hasGatoOnly;
        }
        return brandAnimals.some((a: string) =>
          selectedAnimals.some(sa => a.toLowerCase().includes(sa.toLowerCase()))
        );
      });
    }
    return brands.map(b => String(b.nombre || b.name || '').trim()).filter(Boolean).sort();
  }, [adminMarcas, selectedAnimals, isReady]);

  const availableTipos = React.useMemo(() => {
    if (!isReady) return [];
    const set = new Set(productsForFilters.map(p => String(p.tipo || '').trim()).filter(Boolean));
    const base = Array.from(set);
    if (selectedTipos.includes('Exoticos') && !base.includes('Exoticos')) {
      return ['Exoticos', ...base].sort();
    }
    return base.sort();
  }, [productsForFilters, isReady, selectedTipos]);

  const filteredProducts = React.useMemo(() => {
    if (!isReady) return [];
    return (products || []).filter(p => {
      if (!p) return false;
      const name = String(p.name || '');
      const categoryName = String(p.category || '');
      const pAnimal = String(p.animal || '');
      const pMarca = String(p.marca || '');
      const pCategoriaReal = String(p.categoriaReal || '');
      const pTipo = String(p.tipo || '');

      const matchesSearch = name.toLowerCase().includes(String(searchQuery || '').toLowerCase()) || 
                           categoryName.toLowerCase().includes(String(searchQuery || '').toLowerCase());
      
      const cleanPAnimal = pAnimal.trim();
      const cleanPMarca = pMarca.trim();
      const cleanPCategoriaReal = pCategoriaReal.trim();
      const cleanPTipo = pTipo.trim();

      const matchesAnimal = selectedAnimals.length === 0 || 
                           (selectedAnimals.includes('Exoticos') 
                            ? (cleanPAnimal.toLowerCase() !== 'perro' && cleanPAnimal.toLowerCase() !== 'gato') 
                            : selectedAnimals.some(sa => cleanPAnimal.toLowerCase().includes(sa.toLowerCase())));

      const matchesMarca = selectedMarcas.length === 0 || 
                          selectedMarcas.some(sm => sm.toLowerCase() === cleanPMarca.toLowerCase());

      const matchesCategoria = selectedCategorias.length === 0 || 
                              selectedCategorias.some(sc => {
                                const scL = sc.toLowerCase().trim();
                                const pL = cleanPCategoriaReal.toLowerCase().trim();
                                if (scL === pL) return true;
                                // Handle plurals/singulars like snack/snacks, cuidado/cuidados
                                const scClean = scL.replace(/s$/g, ''); 
                                const pClean = pL.replace(/s$/g, '');
                                if (scClean === pClean) return true;
                                // Handle special case like "cuidados e higiene" vs "cuidado e higiene"
                                if (scL.includes('cuidado') && pL.includes('cuidado')) return true;
                                return false;
                              });

      const realSelectedTipos = selectedTipos.filter(t => t !== 'Exoticos');
      const matchesTipo = realSelectedTipos.length === 0 || 
                         realSelectedTipos.some(st => st.toLowerCase() === cleanPTipo.toLowerCase());
      const matchesPromo = selectedPromo === 'Todos' ? true : (selectedPromo === 'Sí' ? !!p.promo : !p.promo);

      return matchesSearch && matchesAnimal && matchesMarca && matchesCategoria && matchesTipo && matchesPromo;
    }).sort((a, b) => {
      const priceA = a.numericPrice || 0;
      const priceB = b.numericPrice || 0;
      if (sortOrder === 'asc') return priceA - priceB;
      if (sortOrder === 'desc') return priceB - priceA;
      return String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' });
    });
  }, [products, searchQuery, selectedAnimals, selectedMarcas, selectedCategorias, selectedTipos, selectedPromo, sortOrder, isReady]);

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(8);
  const PRODUCTS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
    setMobileVisibleCount(8);
  }, [searchQuery, selectedAnimals, selectedMarcas, selectedCategorias, selectedTipos, selectedPromo, sortOrder]);

  const handleLoadMoreMobile = () => {
    if (mobileVisibleCount < filteredProducts.length) {
      setMobileVisibleCount(prev => prev + 8);
    }
  };

  useEffect(() => {
    // Resetear TODOS los filtros primero para que no se acumulen entre navegaciones
    setSelectedPromo('Todos');
    setSelectedAnimals([]);
    setSelectedCategorias([]);
    setSelectedTipos([]);
    setSelectedMarcas([]);
    setExpandedSections({ animal: true, marca: false, categoria: false, tipo: false, promo: false });

    // Luego aplicar solo el filtro que corresponde a esta navegación
    if (filter === 'promo') {
      setSelectedPromo('Sí');
      setExpandedSections(prev => ({ ...prev, promo: true }));
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



  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('none');
  };
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 300) {
      if (!showScrollTop) setShowScrollTop(true);
    } else {
      if (showScrollTop) setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // MOBILE VIEW
  if (!isDesktop) {
    // Show lightweight shell immediately, defer heavy product grid
    if (!isReady) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ 
            paddingTop: insets.top,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
            zIndex: 100
          }}>
            <View style={{ 
              height: 64,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 15
            }}>
              <TouchableOpacity 
                onPress={() => router.push('/')}
                style={{ 
                  position: 'absolute', 
                  left: 15, 
                  width: 44, 
                  height: 44, 
                  borderRadius: 22, 
                  backgroundColor: '#F9FAFB', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#F3F4F6'
                }}
              >
                <ChevronLeft size={24} color="#111827" strokeWidth={3} />
              </TouchableOpacity>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Buscar</Text>
            </View>
          </View>
          {/* Search bar placeholder */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 15, height: 54 }}>
              <Search size={20} color="#9CA3AF" />
              <Text style={{ marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#9CA3AF' }}>Buscar productos, marcas...</Text>
            </View>
          </View>
          {/* Skeleton list */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20 }}>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                   <View key={i} style={{ width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 15 }}>
                      <Skeleton width="100%" height={150} borderRadius={16} style={{ marginBottom: 15 }} />
                      <Skeleton width="40%" height={10} style={{ marginBottom: 8 }} />
                      <Skeleton width="90%" height={15} style={{ marginBottom: 10 }} />
                      <Skeleton width="60%" height={20} />
                   </View>
                ))}
             </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header Optimizado para Notch */}
        <View style={{ 
          paddingTop: insets.top,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
          zIndex: 100
        }}>
          <View style={{ 
            height: 64,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 15
          }}>
            <TouchableOpacity 
              onPress={() => router.push('/')}
              style={{ 
                position: 'absolute', 
                left: 15, 
                width: 44, 
                height: 44, 
                borderRadius: 22, 
                backgroundColor: '#F9FAFB', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#F3F4F6'
              }}
            >
              <ChevronLeft size={24} color="#111827" strokeWidth={3} />
            </TouchableOpacity>
            <Text style={{ fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Buscar</Text>
          </View>
        </View>

        <FlatList
          data={filteredProducts.slice(0, mobileVisibleCount)}
          keyExtractor={(item) => item.id.toString()}
          numColumns={mobileCols}
          key={`mobile-grid-${mobileCols}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          columnWrapperStyle={{ paddingHorizontal: 15, gap: 15 }}
          onEndReached={handleLoadMoreMobile}
          onEndReachedThreshold={0.5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View>
              {/* Search Bar & Brand Filter */}
              <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, gap: 15 }}>
                <SearchInput 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  isFocused={isSearchFocused}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                    onPress={() => setIsFilterModalOpen(true)}
                    style={{ 
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: (selectedAnimals.length + selectedMarcas.length + selectedCategorias.length + (selectedPromo !== 'Todos' ? 1 : 0)) > 0 ? '#10B981' : '#F9FAFB', 
                      borderRadius: 14, height: 48, gap: 8, borderWidth: 1, borderColor: (selectedAnimals.length + selectedMarcas.length + selectedCategorias.length + (selectedPromo !== 'Todos' ? 1 : 0)) > 0 ? '#10B981' : '#F3F4F6'
                    }}
                  >
                    <Filter size={18} color={(selectedAnimals.length + selectedMarcas.length + selectedCategorias.length + (selectedPromo !== 'Todos' ? 1 : 0)) > 0 ? 'white' : '#111827'} strokeWidth={2.5} />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: (selectedAnimals.length + selectedMarcas.length + selectedCategorias.length + (selectedPromo !== 'Todos' ? 1 : 0)) > 0 ? 'white' : '#111827' }}>
                      Filtros {(selectedAnimals.length + selectedMarcas.length + selectedCategorias.length + (selectedPromo !== 'Todos' ? 1 : 0)) > 0 ? `(${selectedAnimals.length + selectedMarcas.length + selectedCategorias.length + (selectedPromo !== 'Todos' ? 1 : 0)})` : ''}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={toggleSort}
                    style={{ 
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: sortOrder !== 'none' ? '#10B981' : '#F9FAFB', 
                      borderRadius: 14, height: 48, gap: 8, borderWidth: 1, borderColor: sortOrder !== 'none' ? '#10B981' : '#F3F4F6'
                    }}
                  >
                    <ArrowUpDown size={18} color={sortOrder !== 'none' ? 'white' : '#111827'} strokeWidth={2.5} />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: sortOrder !== 'none' ? 'white' : '#111827' }}>
                      {sortOrder === 'none' ? 'Ordenar' : sortOrder === 'asc' ? 'Baratos' : 'Caros'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Categorías Relacionadas como Choice Chips */}
                {selectedAnimals.length > 0 && availableCategorias.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 5 }}>
                    {availableCategorias.map((cat, idx) => {
                      const isSelected = selectedCategorias.includes(cat);
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => toggleFilter(setSelectedCategorias, cat)}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                            backgroundColor: isSelected ? '#10B981' : '#F9FAFB',
                            borderWidth: 1, borderColor: isSelected ? '#10B981' : '#E5E7EB'
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? '#FFFFFF' : '#4B5563' }}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingHorizontal: 15, paddingTop: 20 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <View key={i} style={{ width: mobileCardWidth, height: 280, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#F0F0F0' }}>
                      <Skeleton width="100%" height={140} borderRadius={12} style={{ marginBottom: 15 }} />
                      <Skeleton width="40%" height={10} style={{ marginBottom: 8 }} />
                      <Skeleton width="90%" height={15} style={{ marginBottom: 10 }} />
                      <Skeleton width="60%" height={20} />
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
                <View style={{ 
                  width: 120, height: 120, backgroundColor: '#F9FAFB', borderRadius: 40,
                  justifyContent: 'center', alignItems: 'center', marginBottom: 25,
                  borderWidth: 1, borderColor: '#F3F4F6'
                }}>
                  <Search size={50} color="#D1D5DB" strokeWidth={1.5} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 10 }}>
                  No hay resultados
                </Text>
                <Text style={{ fontSize: 15, color: '#9CA3AF', fontWeight: '600', textAlign: 'center', lineHeight: 22 }}>
                  No pudimos encontrar lo que buscas. Intenta con otros términos o filtros.
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedAnimals([]);
                    setSelectedMarcas([]);
                    setSelectedCategorias([]);
                    setSearchQuery('');
                  }}
                  style={{ marginTop: 30, backgroundColor: '#F3F4F6', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 }}
                >
                  <Text style={{ color: '#6B7280', fontWeight: '800', fontSize: 14 }}>Limpiar filtros</Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item: prod }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/product/${prod.id}`)}
              style={{ 
                width: mobileCardWidth, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, 
                borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, 
                shadowRadius: 10, overflow: 'hidden', marginBottom: 15
              }}
            >
              <SearchProductCardBody 
                prod={prod} 
                isDesktop={false} 
                isFavorite={isFavorite(prod.id)} 
                toggleFavorite={toggleFavorite} 
                addToCart={addToCart} 
                setShowAuthModal={setShowAuthModal} 
                cartQty={cartMap[String(prod.id)] || 0} 
              />
            </TouchableOpacity>
          )}
          ListFooterComponent={
            mobileVisibleCount < filteredProducts.length ? (
              <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} />
            ) : null
          }
          maxToRenderPerBatch={4}
          windowSize={5}
          initialNumToRender={4}
          updateCellsBatchingPeriod={100}
        />

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
                {selectedAnimals.length === 0 && <FilterAccordion title="Animal" options={availableAnimals} selected={selectedAnimals} onToggle={(v: string) => toggleFilter(setSelectedAnimals, v)} isExpanded={expandedSections.animal} onToggleExpand={() => toggleSection('animal')} />}
                {availableMarcas.length > 0 && <FilterAccordion title="Marca" options={availableMarcas} selected={selectedMarcas} onToggle={(v: string) => toggleFilter(setSelectedMarcas, v)} isExpanded={expandedSections.marca} onToggleExpand={() => toggleSection('marca')} />}
                {availableCategorias.length > 0 && <FilterAccordion title="Categoría" options={availableCategorias} selected={selectedCategorias} onToggle={(v: string) => toggleFilter(setSelectedCategorias, v)} isExpanded={expandedSections.categoria} onToggleExpand={() => toggleSection('categoria')} />}
                {availableTipos.length > 0 && <FilterAccordion title="Especialidad / Tipo" options={availableTipos} selected={selectedTipos} onToggle={(v: string) => toggleFilter(setSelectedTipos, v)} isExpanded={expandedSections.tipo} onToggleExpand={() => toggleSection('tipo')} />}
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
                    flex: 2, height: 60, borderRadius: 18, backgroundColor: '#10B981', 
                    justifyContent: 'center', alignItems: 'center', gap: 10, flexDirection: 'row',
                    shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } 
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
        <View style={{ width: 190, backgroundColor: '#FFFFFF', paddingVertical: 30, paddingLeft: 10, paddingRight: 16, borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 20 }}>Filtros</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
             {availableAnimals.length > 0 && selectedAnimals.length === 0 && (
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
        <View style={{ flex: 1, padding: 20 }}>

          {/* Grilla de Catálogo + Barra de búsqueda todo dentro del mismo ScrollView */}
          <ScrollView showsVerticalScrollIndicator={true} ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}>
            {/* Navegación y Tab Bar superior */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
              
              {/* Input Buscar productos... optimizado */}
              <View style={{ flex: 1, maxWidth: 400 }}>
                <SearchInput 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  isFocused={isSearchFocused}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                
                {/* Categorías Relacionadas como Choice Chips */}
                {selectedAnimals.length > 0 && availableCategorias.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 12 }}>
                    {availableCategorias.map((cat, idx) => {
                      const isSelected = selectedCategorias.includes(cat);
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => toggleFilter(setSelectedCategorias, cat)}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                            backgroundColor: isSelected ? '#10B981' : '#F9FAFB',
                            borderWidth: 1, borderColor: isSelected ? '#10B981' : '#E5E7EB'
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? '#FFFFFF' : '#4B5563' }}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
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
                    backgroundColor: sortOrder !== 'none' ? '#10B981' : '#F3F4F6', 
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

            {/* Grid de productos */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingBottom: 30 }}>
               {loading ? (
                 <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50, marginLeft: 'auto', marginRight: 'auto' }} />
               ) : filteredProducts.length === 0 ? (
                 <Text style={{ textAlign: 'center', marginTop: 50, fontSize: 18, color: '#9CA3AF', width: '100%' }}>No se encontraron productos para tu búsqueda.</Text>
               ) : (
                 paginatedProducts.map((prod) => (
                 <TouchableOpacity 
                   key={prod.id} 
                   onPress={() => router.push(`/product/${prod.id}`)}
                   style={{ 
                     width: desktopCardWidth, backgroundColor: 'white', borderRadius: 28, padding: 20, 
                     borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.02, 
                     shadowRadius: 15, position: 'relative'
                   }}
                 >
                   <SearchProductCardBody 
                      prod={prod} 
                      isDesktop={true} 
                      isFavorite={isFavorite(prod.id)} 
                      toggleFavorite={toggleFavorite} 
                      addToCart={addToCart} 
                      setShowAuthModal={setShowAuthModal} 
                      cartQty={cartMap[String(prod.id)] || 0} 
                    />
                 </TouchableOpacity>
                 ))
               )}

               {/* Paginación Escritorio */}
               {totalPages > 1 && (
                 <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, width: '100%', marginTop: 30 }}>
                   <TouchableOpacity 
                     disabled={currentPage === 1}
                     onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     style={{ backgroundColor: currentPage === 1 ? '#F3F4F6' : '#E5E7EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                   >
                     <Text style={{ fontWeight: '800', color: currentPage === 1 ? '#9CA3AF' : '#10B981', fontSize: 15 }}>Anterior</Text>
                   </TouchableOpacity>
                   <View style={{ paddingHorizontal: 20 }}>
                     <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Página {currentPage} de {totalPages}</Text>
                   </View>
                   <TouchableOpacity 
                     disabled={currentPage === totalPages}
                     onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     style={{ backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#E5E7EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                   >
                     <Text style={{ fontWeight: '800', color: currentPage === totalPages ? '#9CA3AF' : '#10B981', fontSize: 15 }}>Siguiente</Text>
                   </TouchableOpacity>
                 </View>
               )}
            </View>
          </ScrollView>

          {/* Botón flotante para subir al principio */}
          {showScrollTop && (
            <TouchableOpacity
              onPress={() => {
                try {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({ y: 0, animated: true });
                    // Fallback explícito para Web
                    const node = scrollRef.current as any;
                    if (node.getScrollableNode) {
                      node.getScrollableNode().scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                } catch (e) {
                  console.log('Scroll error', e);
                }
              }}
              style={[{
                position: 'absolute',
                bottom: 30,
                right: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 5,
                zIndex: 1000,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.9)',
              }, { backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' } as any]}
            >
              <ArrowUp size={20} color="#63348C" strokeWidth={3} />
            </TouchableOpacity>
          )}

        </View>
      </View>
      <AuthModal 
        isVisible={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </View>
  );
});
export default SearchScreen;
