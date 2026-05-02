import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Image, Platform } from 'react-native';

interface Product {
  id: string;
  category: string;
  name: string;
  unit: string;
  price: string;
  numericPrice: number;
  promo: boolean;
  image: string;
  animal: string;
  marca: string;
  categoriaReal: string;
  tipo: string;
  variants: any[];
}

interface Banner {
  id: string;
  imageUrl: string;
  type: 'mobile' | 'desktop';
  [key: string]: any;
}

interface ProductsContextType {
  products: Product[];
  loadingProducts: boolean;
  mobileBanners: Banner[];
  desktopBanners: Banner[];
  portadasData: any[];
  refreshData: () => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [mobileBanners, setMobileBanners] = useState<Banner[]>([]);
  const [desktopBanners, setDesktopBanners] = useState<Banner[]>([]);
  const [portadasData, setPortadasData] = useState<any[]>([]);

  useEffect(() => {
    // 1. Escuchar Productos
    const unsubProducts = onSnapshot(collection(db, 'Products'), (snapshot) => {
      const productsList = snapshot.docs.map(doc => {
        const data = doc.data();
        const imageUrl = data.foto1 || 'https://via.placeholder.com/500';
        
        // Prefetch images for smoother experience ONLY ON WEB to prevent mobile freezing
        if (Platform.OS === 'web') {
          Image.prefetch(imageUrl);
        }

        return {
          id: data.ID_productos || doc.id,
          category: data.categoria || data.Tipo || data.animal || 'GENERAL',
          name: data.nombre || 'Producto sin nombre',
          unit: data.medida || '1 unidad',
          price: 'CLP $' + (data.precio || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
          numericPrice: data.precio || 0,
          promo: data.estadoPromocion === true,
          image: imageUrl,
          animal: data.animal || '',
          marca: data.marca || '',
          categoriaReal: data.categoria || '',
          tipo: data.Tipo || '',
          variants: data.variants || []
        };
      });
      setProducts(productsList);
      setLoadingProducts(false);
    });

    // 2. Escuchar Publicidad (Banners)
    const unsubBanners = onSnapshot(collection(db, 'publicidad'), (snapshot) => {
      const allBanners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
      setMobileBanners(allBanners.filter(b => (b.type || b.tipo) === 'mobile'));
      setDesktopBanners(allBanners.filter(b => (b.type || b.tipo) === 'desktop'));
    });

    // 3. Escuchar Portadas (Banners Grid)
    const unsubPortadas = onSnapshot(collection(db, 'portadas'), (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPortadasData(pList);
    });

    return () => {
      unsubProducts();
      unsubBanners();
      unsubPortadas();
    };
  }, []);

  const refreshData = () => {
    // onSnapshot already handles updates, but we can add a manual trigger if needed
  };

  const value = React.useMemo(() => ({
    products,
    loadingProducts,
    mobileBanners,
    desktopBanners,
    portadasData,
    refreshData
  }), [products, loadingProducts, mobileBanners, desktopBanners, portadasData]);

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
