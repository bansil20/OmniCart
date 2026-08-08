import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaRegHeart, FaStore, FaShieldAlt, FaArrowLeft, FaTag, FaCheckCircle } from 'react-icons/fa';
import { useWishlistContext } from '../context/WishlistContext.jsx';
import { useCartContext } from '../context/CartContext.jsx';
import Path from '../utils/const/Path.js';

function ItemScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { wishlist, toggleWishlist } = useWishlistContext();
    const { addToCart } = useCartContext();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`http://localhost:5000/api/products/${id}`);
                const data = await res.json();
                if (res.ok && data.product) {
                    setProduct(data.product);
                } else {
                    setError(data.message || 'Product not found');
                }
            } catch (err) {
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const isLiked = wishlist[id];

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
                <p className="text-sm text-gray-500">{error || 'The requested product could not be located.'}</p>
                <button
                    onClick={() => navigate(Path.HOME_SCREEN)}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                >
                    Back to Store
                </button>
            </div>
        );
    }

    const originalPrice = Number(product.price || 0);
    const discountAmount = Number(product.discountPrice || 0);
    const hasDiscount = discountAmount > 0 && discountAmount < originalPrice;
    const finalPrice = hasDiscount ? (originalPrice - discountAmount) : originalPrice;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-900 hover:text-blue-600 transition-colors"
            >
                <FaArrowLeft />
                <span>Back to Store</span>
            </button>

            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Image Section */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center min-h-[350px]">
                    <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'}
                        alt={product.name}
                        className="w-full h-full object-contain max-h-[450px] p-4"
                    />
                    <button
                        onClick={() => toggleWishlist(id)}
                        className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full text-lg shadow-md text-red-500 hover:scale-110 transition-all"
                    >
                        {isLiked ? <FaHeart /> : <FaRegHeart />}
                    </button>
                </div>

                {/* Details Section */}
                <div className="space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <FaTag className="text-[10px]" />
                                <span>{product.category}</span>
                            </span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of Stock'}
                            </span>
                        </div>

                        <h1 className="text-3xl font-black text-blue-950 tracking-tight">{product.name}</h1>

                        {/* Seller Attribution */}
                        {product.seller && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/80 w-fit">
                                <FaStore className="text-blue-600" />
                                <span>Sold by: <strong className="text-blue-950">{product.seller.name}</strong></span>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="flex items-baseline gap-3 pt-2">
                            <span className="text-3xl font-extrabold text-blue-900">
                                ₹{finalPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                                <span className="text-lg text-gray-400 line-through font-medium">
                                    ₹{originalPrice.toFixed(2)}
                                </span>
                            )}
                            {hasDiscount && (
                                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                    Save ₹{discountAmount.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="pt-2 border-t border-gray-100">
                                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">Product Description</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                        <button
                            disabled={product.stock === 0}
                            onClick={() => addToCart(product, 1)}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <FaShoppingCart />
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ItemScreen;