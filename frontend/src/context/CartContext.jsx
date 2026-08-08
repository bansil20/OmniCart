import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || 'guest';
  const storageKey = `omnicart_cart_${userId}`;

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Reload cart whenever logged in user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setCart(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCart([]);
    }
  }, [userId]);

  // Persist cart items for active user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (e) {
      // Storage error handling
    }
  }, [cart, storageKey]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const productId = product._id || product.id;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => (item.product._id || item.product.id) === productId
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].qty += quantity;
        return updated;
      } else {
        return [...prevCart, { id: productId, product, qty: quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  const cartSubtotal = cart.reduce((total, item) => {
    const orig = Number(item.product.price || 0);
    const disc = Number(item.product.discountPrice || 0);
    const finalPrice = disc > 0 && disc < orig ? orig - disc : orig;
    return total + finalPrice * item.qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
