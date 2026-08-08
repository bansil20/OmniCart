import React, { useState, useEffect } from 'react';
import { useWishlistContext } from '../context/WishlistContext.jsx';
import { useCartContext } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import Path from '../utils/const/Path.js';
import ItemCard from '../components/Card/ItemCard.jsx';
import { FaHeart, FaShoppingCart, FaTrash, FaTag, FaArrowRight } from 'react-icons/fa';

function WishlistScreen() {
  const { wishlist, toggleWishlist } = useWishlistContext();
  const { addToCart } = useCartContext();
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        if (res.ok && data.products) {
          setAllProducts(data.products);
        }
      } catch (err) {
        // Wishlist fetch error handling
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products to only those liked by active user
  const wishlistProducts = allProducts.filter(
    (item) => wishlist[item._id || item.id] === true
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
          <FaHeart />
        </div>
        <h2 className="text-3xl font-black text-blue-950">Your Wishlist is Empty</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          You haven't added any favorite products to your wishlist yet. Explore our store catalog and click the heart icon on products you love to save them here!
        </p>
        <button
          onClick={() => navigate(Path.SHOP_SCREEN)}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Explore Store Catalog</span>
          <FaArrowRight />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-red-500">
            <FaHeart className="text-2xl" />
            <h1 className="text-3xl font-extrabold text-blue-950">My Wishlist</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Your saved favorite items. Quick add them to cart or remove anytime.
          </p>
        </div>
        <span className="text-xs font-extrabold bg-red-100 text-red-700 px-4 py-2 rounded-full">
          {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Saved Product' : 'Saved Products'}
        </span>
      </div>

      {/* Wishlist Grid Format */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {wishlistProducts.map((item) => {
          const itemId = item._id || item.id;
          const orig = Number(item.price || 0);
          const disc = Number(item.discountPrice || 0);
          const hasDiscount = disc > 0 && disc < orig;
          const finalPrice = hasDiscount ? orig - disc : orig;
          const discountPercent = hasDiscount ? Math.round((disc / orig) * 100) : 0;

          return (
            <div
              key={itemId}
              className="w-full bg-white rounded-3xl overflow-hidden shadow-md group border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gray-50 h-64 sm:h-72 p-4 flex items-center justify-center">
                <img
                  src={item.imageUrl || item.image || 'https://via.placeholder.com/200'}
                  alt={item.name}
                  className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 z-10 items-end">
                  {hasDiscount && (
                    <span className="bg-pink-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      {discountPercent}% OFF
                    </span>
                  )}
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm capitalize">
                    {item.category || "Featured"}
                  </span>
                </div>

                {/* Remove Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(itemId)}
                  className="absolute top-3 left-3 p-2.5 bg-white/90 backdrop-blur-md text-red-500 hover:text-red-700 rounded-full shadow-md transition-all hover:scale-110 cursor-pointer z-10"
                  title="Remove from Wishlist"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>

              {/* Product Content with Description */}
              <div className="p-5 text-center bg-white space-y-2 border-t border-gray-50 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => navigate(`${Path.ITEM_SCREEN}/${itemId}`)}
                    className="text-base font-extrabold text-blue-950 truncate cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {item.name}
                  </h3>

                  {/* Rating Stars */}
                  <div className="flex justify-center gap-1 text-amber-400 text-xs my-1">
                    ★ ★ ★ ★ ★
                  </div>

                  {/* Short Description */}
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 my-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {/* Price */}
                  <div className="text-sm flex items-center justify-center gap-2">
                    <span className="font-extrabold text-blue-900 text-base">
                      ₹{finalPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="line-through text-gray-400 text-xs font-medium">
                        ₹{orig.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(item, 1)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <FaShoppingCart />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WishlistScreen;
