import { FaHeart, FaRegHeart, FaExchangeAlt, FaShoppingCart } from "react-icons/fa";
import { useState } from "react";
import { useCartContext } from "../context/CartContext.jsx";
import { useWishlistContext } from "../context/WishlistContext.jsx";

function EyeView({ open, item, onClose }) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCartContext();
  const { wishlist, toggleWishlist } = useWishlistContext();

  if (!open || !item) return null;

  const itemId = item._id || item.id;
  const isLiked = wishlist[itemId];

  const title = item.name || item.title || "OmniCart Product";
  const image = item.imageUrl || item.image || item.hover_image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";
  
  const originalPrice = Number(item.price || 0);
  const discountAmount = Number(item.discountPrice || 0);
  const hasDiscount = discountAmount > 0 && discountAmount < originalPrice;
  const finalPrice = hasDiscount ? (originalPrice - discountAmount) : originalPrice;

  const handleAddToCart = () => {
    addToCart(item, qty);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="
            bg-white rounded-3xl
            w-full
            max-w-4xl
            max-h-[90vh]
            relative
            overflow-y-auto no-scrollbar
            p-6 sm:p-8
            shadow-2xl border border-gray-100
            animate-fade-in
          "
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 cursor-pointer transition-colors text-lg"
          >
            ×
          </button>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* LEFT - Image */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-50 rounded-2xl flex justify-center items-center h-[280px] sm:h-[340px] w-full p-4 border border-gray-100">
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* RIGHT - Product Info */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.category || "General"}
                </span>

                <h2 className="text-2xl font-black text-blue-950 mt-2">
                  {title}
                </h2>

                <div className="flex items-center gap-3 mt-3">
                  <span className="text-2xl font-extrabold text-blue-900">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="line-through text-gray-400 font-medium text-sm">
                      ₹{originalPrice.toFixed(2)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {Math.round((discountAmount / originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>

                <div className="flex text-amber-400 mt-2 text-xs gap-1">
                  ★ ★ ★ ★ ★
                </div>

                <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                  {item.description || "High quality product available at OmniCart store. Fast shipping & original product guarantee."}
                </p>
              </div>

              {/* BOTTOM SECTION */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="flex border border-gray-200 rounded-xl bg-gray-50 overflow-hidden font-bold">
                    <button
                      className="px-3.5 py-2 hover:bg-gray-200 transition-colors"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <div className="px-4 py-2 text-sm">{qty}</div>
                    <button
                      className="px-3.5 py-2 hover:bg-gray-200 transition-colors"
                      onClick={() => setQty((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                  >
                    <FaShoppingCart />
                    <span>ADD TO CART</span>
                  </button>

                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={() => toggleWishlist(itemId)}
                    className="p-3 bg-gray-100 hover:bg-red-50 rounded-xl transition-colors text-lg"
                    title="Toggle Wishlist"
                  >
                    {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-600" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EyeView;
