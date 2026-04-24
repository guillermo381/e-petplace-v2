import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_emoji: string;
  tipo?: string;
  subtitulo?: string;
  metadata?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (p: Omit<CartItem, 'cantidad'>) => void;
  removeFromCart: (producto_id: string) => void;
  updateQuantity: (producto_id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  showRegisterPrompt: boolean;
  dismissRegisterPrompt: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY      = 'epetplace_cart';
const INTERACTIONS_KEY = 'epetplace_session_interactions';
const SHOWN_KEY        = 'register_prompt_shown';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((p: Omit<CartItem, 'cantidad'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.producto_id === p.producto_id);
      if (existing) {
        return prev.map(i =>
          i.producto_id === p.producto_id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...p, cantidad: 1 }];
    });

    if (sessionStorage.getItem(SHOWN_KEY)) return;
    const count = parseInt(sessionStorage.getItem(INTERACTIONS_KEY) ?? '0', 10) + 1;
    sessionStorage.setItem(INTERACTIONS_KEY, String(count));
    if (count >= 3) {
      sessionStorage.setItem(SHOWN_KEY, 'true');
      setShowRegisterPrompt(true);
    }
  }, []);

  const removeFromCart = useCallback((producto_id: string) => {
    setItems(prev => prev.filter(i => i.producto_id !== producto_id));
  }, []);

  const updateQuantity = useCallback((producto_id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.producto_id === producto_id ? { ...i, cantidad: qty } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const dismissRegisterPrompt = useCallback(() => {
    setShowRegisterPrompt(false);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const totalPrice = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice,
      showRegisterPrompt, dismissRegisterPrompt,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
