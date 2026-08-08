import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || 'guest';
  const storageKey = `omnicart_compare_${userId}`;

  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Reload compare list whenever user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setCompareList(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCompareList([]);
    }
  }, [userId]);

  // Persist compare items for active user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(compareList));
    } catch (e) {
      // Storage error handling
    }
  }, [compareList, storageKey]);

  const toggleCompare = (product) => {
    if (!product) return;
    const productId = product._id || product.id;

    setCompareList((prev) => {
      const exists = prev.some((p) => (p._id || p.id) === productId);
      if (exists) {
        return prev.filter((p) => (p._id || p.id) !== productId);
      } else {
        // Allow up to 4 products to compare
        if (prev.length >= 4) {
          alert('You can compare a maximum of 4 products at a time.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const removeFromCompare = (productId) => {
    setCompareList((prev) => prev.filter((p) => (p._id || p.id) !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (productId) => {
    return compareList.some((p) => (p._id || p.id) === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        compareCount: compareList.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompareContext = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompareContext must be used within a CompareProvider');
  }
  return context;
};
