import React, { useEffect, useState, useRef } from 'react'
import { FaSearch, FaRegHeart, FaHeart, FaSignOutAlt, FaShieldAlt, FaStore, FaTag, FaTimes, FaShoppingBag } from "react-icons/fa";
import { MdOutlineCompareArrows } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { GrCart } from "react-icons/gr";
import AppString from '../utils/const/AppString.jsx';
import CartDrawer from "../components/CartDrawer.jsx";
import { useNavigate } from "react-router-dom";
import Path from "../utils/const/Path.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCartContext } from "../context/CartContext.jsx";
import { useWishlistContext } from "../context/WishlistContext.jsx";
import { useCompareContext } from "../context/CompareContext.jsx";

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [userDropdown, setUserDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Live Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef(null);

    const { user, token, isAuthenticated, logout } = useAuth();
    const { cartCount, toggleCart } = useCartContext();
    const { wishlist } = useWishlistContext();
    const { compareCount } = useCompareContext();
    const navigate = useNavigate();

    const wishlistCount = Object.keys(wishlist || {}).filter(k => wishlist[k]).length;
    const isManagementRole = user?.role === 'admin' || user?.role === 'seller';

    useEffect(() => {
        const scrollContainer = document.getElementById("main-scroll");
        if (!scrollContainer) return;

        const onScroll = () => {
            setScrolled(scrollContainer.scrollTop > 0);
        };

        scrollContainer.addEventListener("scroll", onScroll);

        return () => {
            scrollContainer.removeEventListener("scroll", onScroll);
        };
    }, []);

    // Live debounced search API call (restricted to seller's own products if logged in as seller)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            setShowSearchDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                let searchUrl = `http://localhost:5000/api/products?search=${encodeURIComponent(searchQuery.trim())}`;
                if (user?.role === 'seller') {
                    const sellerId = user._id || user.id;
                    if (sellerId) {
                        searchUrl += `&seller=${sellerId}`;
                    }
                }

                const headers = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(searchUrl, { headers });
                const data = await res.json();
                if (res.ok && data.products) {
                    setSearchResults(data.products);
                    setShowSearchDropdown(true);
                }
            } catch (err) {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, user, token]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setUserDropdown(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchDropdown(false);
            if (user?.role === 'seller') {
                navigate(Path.SELLER_DASHBOARD, { state: { searchQuery: searchQuery.trim() } });
            } else {
                navigate(Path.SHOP_SCREEN, { state: { searchQuery: searchQuery.trim() } });
            }
        }
    };

    const handleSelectProduct = (product) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        if (user?.role === 'seller') {
            navigate(Path.SELLER_DASHBOARD, { state: { searchQuery: product.name } });
        } else {
            navigate(`${Path.ITEM_SCREEN}/${product._id}`);
        }
    };

    return (
        <header
            className={`shadow-md 
        transition-all duration-300 ease-in-out sticky top-0 z-40
        ${scrolled ? "h-16" : "h-24 "}
      `}
        >
            <div
                className={`h-full bg-white flex justify-around items-center
                  transition-all duration-300 ease-in-out
                  ${scrolled ? "py-2" : "py-6"}`}
            >
                {/* Logo */}
                <div>
                    <h1
                        className={`font-bold text-blue-900 transition-all duration-300 cursor-pointer
                         ${scrolled ? "text-2xl" : "text-3xl"}`}
                        onClick={() => {
                            if (user?.role === 'admin') navigate(Path.ADMIN_DASHBOARD);
                            else if (user?.role === 'seller') navigate(Path.SELLER_DASHBOARD);
                            else navigate(Path.HOME_SCREEN);
                        }}
                    >
                        {AppString.APP_NAME}
                    </h1>
                </div>

                {/* Search bar with Live Autocomplete Dropdown */}
                <div className="relative mx-2 w-2/4" ref={searchRef}>
                    <form
                        onSubmit={handleSearchSubmit}
                        className="bg-blue-100/70 hover:bg-blue-100 focus-within:bg-white border border-transparent focus-within:border-blue-300 w-full rounded-2xl flex items-center px-4 shadow-sm font-medium transition-all duration-300"
                    >
                        <FaSearch className="text-gray-500 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchQuery.trim() && searchResults.length > 0) {
                                    setShowSearchDropdown(true);
                                }
                            }}
                            placeholder={user?.role === 'seller' ? "Search your store products..." : "Search by product name, category name, or seller..."}
                            className="w-full bg-transparent p-2 focus:outline-none text-sm text-blue-950"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setShowSearchDropdown(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                    </form>

                    {/* Instant Search Results Dropdown Overlay */}
                    {showSearchDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden z-50 animate-fade-in max-h-96 overflow-y-auto">
                            <div className="p-3 bg-blue-50/50 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                <span>{user?.role === 'seller' ? 'My Store Results' : 'Search Results'} ({searchResults.length})</span>
                                {isSearching && <span className="text-blue-600 animate-pulse">Searching...</span>}
                            </div>

                            {searchResults.length === 0 ? (
                                <div className="p-6 text-center text-xs text-gray-500">
                                    No products found matching "<span className="font-bold">{searchQuery}</span>"
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {searchResults.slice(0, 6).map((product) => {
                                        const orig = Number(product.price || 0);
                                        const disc = Number(product.discountPrice || 0);
                                        const finalPrice = disc > 0 && disc < orig ? orig - disc : orig;
                                        return (
                                            <div
                                                key={product._id}
                                                onClick={() => handleSelectProduct(product)}
                                                className="p-3 hover:bg-blue-50/60 transition-colors flex items-center gap-3 cursor-pointer"
                                            >
                                                <img
                                                    src={product.imageUrl || 'https://via.placeholder.com/50'}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-100 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-blue-950 truncate">{product.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                                                            <FaTag className="text-[8px]" />
                                                            <span>{product.category}</span>
                                                        </span>
                                                        {product.seller && (
                                                            <span className="truncate text-emerald-700 font-semibold">
                                                                By {product.seller.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="font-extrabold text-blue-900 text-sm">
                                                        ₹{finalPrice.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        onClick={handleSearchSubmit}
                                        className="w-full p-3 text-center text-xs font-bold text-blue-600 hover:bg-blue-100/50 transition-colors bg-blue-50/30"
                                    >
                                        {user?.role === 'seller' ? 'Filter Seller Console →' : 'View all matching products in Store Catalog →'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Icons */}
                <div className="flex items-center space-x-6 text-2xl text-blue-900">
                    {/* Customer-only Shopping Actions (Hidden for Admin & Seller) */}
                    {!isManagementRole && (
                        <>
                            {/* Compare Icon with Badge */}
                            <div className="relative cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(Path.COMPARE_SCREEN)} title="Compare Products">
                                <MdOutlineCompareArrows className="text-2xl" />
                                {compareCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                        {compareCount}
                                    </span>
                                )}
                            </div>
                            
                            {/* Wishlist Icon with Badge */}
                            <div className="relative cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(Path.WISHLIST_SCREEN)} title="Wishlist">
                                {wishlistCount > 0 ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                        {wishlistCount}
                                    </span>
                                )}
                            </div>

                            {/* Cart Icon with Badge */}
                            <div className="relative cursor-pointer hover:text-blue-600 transition-colors" onClick={toggleCart} title="Shopping Cart">
                                <GrCart />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                    
                    {/* User Profile / Auth Button */}
                    <div className="relative" ref={dropdownRef}>
                        {isAuthenticated ? (
                            <button
                                onClick={() => setUserDropdown(!userDropdown)}
                                className="flex items-center space-x-2 text-sm font-semibold bg-blue-50 text-blue-900 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                                    {user?.name ? user.name[0] : 'U'}
                                </div>
                                <span className="max-w-[100px] truncate">{user?.name?.split(' ')[0] || 'User'}</span>
                            </button>
                        ) : (
                            <CgProfile 
                                className="cursor-pointer hover:text-blue-600 transition-colors text-2xl" 
                                onClick={() => navigate(Path.LOGIN)}
                                title="Login / Register"
                            />
                        )}

                        {/* User Dropdown Menu */}
                        {isAuthenticated && userDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 border border-blue-100 z-50 text-sm animate-fade-in">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-blue-950 truncate">{user?.name}</p>
                                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                            user?.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                            user?.role === 'seller' ? 'bg-emerald-100 text-emerald-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {user?.role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                </div>

                                {/* Dashboard Links based on Role */}
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => {
                                            setUserDropdown(false);
                                            navigate(Path.ADMIN_DASHBOARD);
                                        }}
                                        className="w-full text-left px-4 py-2 text-blue-900 hover:bg-blue-50 flex items-center space-x-2 font-semibold transition-colors"
                                    >
                                        <FaShieldAlt className="text-amber-600" />
                                        <span>Admin Dashboard</span>
                                    </button>
                                )}

                                {user?.role === 'seller' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setUserDropdown(false);
                                                navigate(Path.SELLER_DASHBOARD, { state: { tab: 'products' } });
                                            }}
                                            className="w-full text-left px-4 py-2 text-blue-900 hover:bg-emerald-50 flex items-center space-x-2 font-semibold transition-colors"
                                        >
                                            <FaStore className="text-emerald-600" />
                                            <span>Seller Dashboard</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setUserDropdown(false);
                                                navigate(Path.SELLER_DASHBOARD, { state: { tab: 'orders' } });
                                            }}
                                            className="w-full text-left px-4 py-2 text-blue-900 hover:bg-emerald-50 flex items-center space-x-2 font-semibold transition-colors"
                                        >
                                            <FaShoppingBag className="text-blue-600" />
                                            <span>Order History (Sales)</span>
                                        </button>
                                    </>
                                )}

                                {!isManagementRole && (
                                    <button
                                        onClick={() => {
                                            setUserDropdown(false);
                                            navigate(Path.ORDER_HISTORY);
                                        }}
                                        className="w-full text-left px-4 py-2 text-blue-900 hover:bg-blue-50 flex items-center space-x-2 font-semibold transition-colors"
                                    >
                                        <FaShoppingBag className="text-blue-600" />
                                        <span>My Orders</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setUserDropdown(false);
                                        logout();
                                        navigate(Path.HOME_SCREEN);
                                    }}
                                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium transition-colors border-t border-gray-100 mt-1"
                                >
                                    <FaSignOutAlt />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {!isManagementRole && <CartDrawer />}
            </div>
        </header>
    );
}

export default Header;
