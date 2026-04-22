import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface CartItem {
  ID_productos: string;
  nombre: string;
  precio: number;
  foto: string;
  cantidad: number;
  medida: string;
  subtotal: number;
  creator?: any;
  fechaCreacion?: any;
  firebaseId?: string; // ID of the document in Firestore
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string | number) => void;
  updateQuantity: (itemId: string | number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const q = query(collection(db, 'productosseleccionados'), where('creator', '==', userRef));
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const items: CartItem[] = snapshot.docs.map(doc => ({
            ...(doc.data() as any),
            firebaseId: doc.id
          }));
          setCart(items);
        });

        return () => unsubscribeSnapshot();
      } else {
        setCart([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addToCart = (item: CartItem) => {
    // Note: We don't manually update state here anymore. 
    // The handleAddToCart in the product page calls addDoc to Firestore,
    // and our onSnapshot listener above will automatically update the local state.
    // This ensures consistency across refreshes and devices.
  };

  const removeFromCart = async (itemId: string) => {
    // If we have a firebaseId, delete from Firestore
    const itemToDelete = cart.find(i => i.ID_productos === itemId || i.firebaseId === itemId);
    if (itemToDelete?.firebaseId) {
      try {
        await deleteDoc(doc(db, 'productosseleccionados', itemToDelete.firebaseId));
      } catch (e) {
        console.error("Error removing from cart:", e);
      }
    } else {
      setCart((prev) => prev.filter((i) => i.ID_productos !== itemId));
    }
  };

  const updateQuantity = async (itemId: string, cantidad: number) => {
    const itemToUpdate = cart.find(i => i.ID_productos === itemId || i.firebaseId === itemId);
    const newQuantity = Math.max(1, cantidad);
    
    if (itemToUpdate?.firebaseId) {
      try {
        await updateDoc(doc(db, 'productosseleccionados', itemToUpdate.firebaseId), {
          cantidad: newQuantity,
          subtotal: newQuantity * itemToUpdate.precio
        });
      } catch (e) {
        console.error("Error updating quantity:", e);
      }
    } else {
      setCart((prev) =>
        prev.map((i) => (i.ID_productos === itemId ? { ...i, cantidad: newQuantity, subtotal: newQuantity * i.precio } : i))
      );
    }
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + (item.subtotal || 0), 0);
  const cartCount = cart.reduce((count, item) => count + (item.cantidad || 0), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
