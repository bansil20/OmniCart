import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || 'guest';
  const storageKey = `omnicart_wishlist_${userId}`;

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Reload wishlist whenever user changes (login, logout, account switch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setWishlist(saved ? JSON.parse(saved) : {});
    } catch (e) {
      setWishlist({});
    }
  }, [userId]);

  // Persist wishlist whenever state updates for active user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    } catch (e) {
      // Storage error handling
    }
  }, [wishlist, storageKey]);

  const toggleWishlist = (id) => {
    if (!id) return;
    setWishlist(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => useContext(WishlistContext);
