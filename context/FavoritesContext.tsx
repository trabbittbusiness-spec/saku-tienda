import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string | number;
  name: string;
  price: string | number;
  image: string;
  category?: string;
  brand?: string;
  rating?: number;
  type?: 'product' | 'service';
  description?: string;
  duration?: string;
}

interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string | number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isFavorite = (productId: string | number) => {
    return favorites.some((p) => p.id === productId);
  };

  const value = React.useMemo(() => ({
    favorites,
    toggleFavorite,
    isFavorite
  }), [favorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
