import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { MdOutlineCompareArrows } from "react-icons/md";
import { useWishlistContext } from "../../context/WishlistContext.jsx";
import { useCartContext } from "../../context/CartContext.jsx";
import { useCompareContext } from "../../context/CompareContext.jsx";
import { useNavigate } from "react-router-dom";
import Path from "../../utils/const/Path.js";

function ItemCard({ item }) {
    const { wishlist, toggleWishlist } = useWishlistContext();
    const { addToCart } = useCartContext();
    const { toggleCompare, isInCompare } = useCompareContext();
    const navigate = useNavigate();

    const itemId = item._id || item.id;
    const liked = wishlist[itemId];
    const inCompare = isInCompare(itemId);

    const title = item.name || item.title || "OmniCart Item";
    const image = item.imageUrl || item.prev_image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";
    const hoverImage = item.imageUrl || item.hover_image || image;

    const originalPrice = Number(item.price || 0);
    const discountAmount = Number(item.discountPrice || 0);
    const hasDiscount = discountAmount > 0 && discountAmount < originalPrice;
    const finalPrice = hasDiscount ? (originalPrice - discountAmount) : originalPrice;
    const discountPercent = hasDiscount ? Math.round((discountAmount / originalPrice) * 100) : 0;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(item, 1);
    };

    const handleToggleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlist(itemId);
    };

    const handleToggleCompare = (e) => {
        e.stopPropagation();
        toggleCompare(item);
    };

    return (
        <div 
            className="w-full sm:w-72 bg-white rounded-2xl overflow-hidden shadow-md group border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer" 
            onClick={() => navigate(`${Path.ITEM_SCREEN}/${itemId}`)}
        >
            {/* IMAGE CONTAINER */}
            <div className="relative overflow-hidden bg-gray-50 h-64 sm:h-72 md:h-80">
                {/* DEFAULT IMAGE */}
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-105"
                />

                {/* HOVER IMAGE */}
                <img
                    src={hoverImage}
                    alt={`${title} hover`}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 scale-110 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100"
                />

                {/* BADGES */}
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

                {/* STAGGERED ANIMATED ACTION BAR */}
                <div
                    className="absolute bottom-0 left-0 w-full h-12 flex overflow-hidden z-20 pointer-events-none group-hover:pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 1. WISHLIST BUTTON (First delay: 0ms) */}
                    <div className="w-14 h-full bg-blue-600 border-r border-blue-500/50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 delay-0 flex items-center justify-center">
                        <button
                            type="button"
                            className="w-full h-full flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-colors"
                            onClick={handleToggleWishlist}
                            title="Add to Wishlist"
                        >
                            {liked ? <FaHeart className="text-red-400" /> : <FaRegHeart />}
                        </button>
                    </div>

                    {/* 2. ADD TO CART BUTTON (Second delay: 100ms) */}
                    <div className="flex-1 h-full bg-blue-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 delay-100 flex items-center justify-center">
                        <button 
                            type="button"
                            onClick={handleAddToCart}
                            className="w-full h-full text-white font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-blue-600 transition-colors"
                        >
                            Add to Cart
                        </button>
                    </div>

                    {/* 3. COMPARE BUTTON (Third delay: 200ms) */}
                    <div className="w-14 h-full bg-blue-600 border-l border-blue-500/50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 delay-200 flex items-center justify-center">
                        <button
                            type="button"
                            className="w-full h-full flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-colors"
                            onClick={handleToggleCompare}
                            title={inCompare ? "Remove from Compare" : "Add to Compare"}
                        >
                            <MdOutlineCompareArrows className={`text-2xl transition-all ${
                                inCompare ? 'text-yellow-300 scale-125 drop-shadow-md' : 'text-white'
                            }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-4 text-center">
                <h3 className="text-base font-bold text-blue-950 truncate">{title}</h3>

                {/* RATING */}
                <div className="flex justify-center gap-1 text-amber-400 text-xs my-1.5">
                    ★ ★ ★ ★ ★
                </div>

                {/* PRICE */}
                <div className="text-sm flex items-center justify-center gap-2">
                    <span className="font-extrabold text-blue-900">
                        ₹{finalPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                        <span className="line-through text-gray-400 text-xs font-medium">
                            ₹{originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ItemCard;
