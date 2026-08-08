import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ItemCard from "../components/Card/ItemCard.jsx";
import EyeView from "../layout/EyeView.jsx";
import { FaSearch, FaTag, FaStore, FaTimes } from "react-icons/fa";

function ShopScreen() {
  const { state } = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState(state?.searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [eyeOpen, setEyeOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Sync state searchQuery if navigated with search
  useEffect(() => {
    if (state?.searchQuery !== undefined) {
      setSearchFilter(state.searchQuery);
    }
  }, [state?.searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/products';
      const params = new URLSearchParams();

      if (searchFilter.trim()) {
        params.append('search', searchFilter.trim());
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      // Products fetch error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchFilter, selectedCategory]);

  // Unique categories list from products
  const availableCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950">Store Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search and explore products uploaded by authorized sellers on OmniCart
          </p>
        </div>
        <span className="text-xs font-extrabold bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
          {products.length} {products.length === 1 ? 'Product' : 'Products'} Found
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter catalog by product title, seller name, or category..."
            className="w-full pl-10 pr-10 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>

        {/* Category Select */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <FaTag className="text-gray-400 text-xs" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Search Filter Badge */}
      {searchFilter && (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
          <span>Search query: <strong className="text-blue-950">"{searchFilter}"</strong></span>
          <button
            onClick={() => setSearchFilter('')}
            className="text-blue-600 hover:text-blue-800 font-bold ml-1"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Product Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 flex items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-semibold text-sm">Searching store catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-gray-500 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-xs">
          <FaSearch className="text-4xl text-gray-300 mx-auto" />
          <p className="font-bold text-gray-700 text-base">No matching products found</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try searching by seller name (e.g., store owner), category name, or different product keywords.
          </p>
          <button
            onClick={() => {
              setSearchFilter('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {products.map((item) => (
            <ItemCard
              key={item._id || item.id}
              item={item}
              onEyeClick={(e, itemData) => {
                setSelectedItem(itemData || item);
                setEyeOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <EyeView open={eyeOpen} item={selectedItem} onClose={() => setEyeOpen(false)} />
    </div>
  );
}

export default ShopScreen;
