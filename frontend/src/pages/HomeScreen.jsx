import React, { useState, useEffect } from "react";
import WordBtn from "../components/Button/WordBtn.jsx";
import ItemCard from "../components/Card/ItemCard.jsx";
import SlideShow from "../layout/SlideShow.jsx";
import EyeView from "../layout/EyeView.jsx";
import { useNavigate } from "react-router-dom";
import Path from "../utils/const/Path.js";
import { useAuth } from "../context/AuthContext.jsx";

function HomeScreen() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    
    const [eyeOpen, setEyeOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [realProducts, setRealProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Automatic role-based redirect guard
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'admin') {
                navigate(Path.ADMIN_DASHBOARD, { replace: true });
            } else if (user.role === 'seller') {
                navigate(Path.SELLER_DASHBOARD, { replace: true });
            }
        }
    }, [user, authLoading, navigate]);

    // Fetch real products added by Sellers from backend API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products');
                const data = await res.json();
                if (res.ok && data.products) {
                    setRealProducts(data.products);
                }
            } catch (err) {
                // Fallback to static items
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    // Fallback static items if backend is empty
    const staticItems = [
        {
            id: 'demo-1',
            name: "Modern Ergonomic Chair",
            category: "Furniture",
            price: 189.99,
            discountPrice: 249.99,
            imageUrl: "https://images.unsplash.com/photo-1580481072645-022f9a6d127a?w=500&auto=format&fit=crop&q=60",
        },
        {
            id: 'demo-2',
            name: "Smart Ambient Lamp",
            category: "Lighting",
            price: 79.50,
            imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60",
        },
        {
            id: 'demo-3',
            name: "Minimalist Sofa",
            category: "Furniture",
            price: 499.00,
            discountPrice: 650.00,
            imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60",
        },
    ];

    const displayProducts = realProducts.length > 0 ? realProducts : staticItems;
    const MAX_CARDS = 8;
    const [activeTab, setActiveTab] = useState("all");

    const filteredItems = displayProducts.filter(item => {
        if (activeTab === "all") return true;
        return item.category?.toLowerCase() === activeTab.toLowerCase();
    }).slice(0, MAX_CARDS);

    if (authLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <SlideShow />
            <div>
                <div className='justify-center text-4xl font-medium text-center p-8 flex gap-4 items-center'>
                    <div className='h-1 w-16 bg-blue-600 rounded'/>
                    <h1 className='text-3xl font-extrabold text-blue-950 tracking-tight'>
                        Daily Deals & Store Catalog
                    </h1>
                    <div className='h-1 w-16 bg-blue-600 rounded'/>
                </div>

                <div className='flex gap-4 p-1 justify-center flex-wrap'>
                    <WordBtn children="All Items" onClick={() => setActiveTab("all")} />
                    <WordBtn children="Furniture" onClick={() => setActiveTab("furniture")} />
                    <WordBtn children="Electronics" onClick={() => setActiveTab("electronics")} />
                    <WordBtn children="Lighting" onClick={() => setActiveTab("lighting")} />
                </div>

                {/* Cards Grid */}
                <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center max-w-7xl mx-auto px-4">
                    {loadingProducts ? (
                        <div className="col-span-full py-12 text-gray-500 flex items-center gap-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading seller products...</span>
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <ItemCard 
                                key={item._id || item.id} 
                                item={item} 
                                onEyeClick={() => {
                                    setSelectedItem(item);
                                    setEyeOpen(true);
                                }}
                            />
                        ))
                    )}
                </div>

                <EyeView open={eyeOpen} item={selectedItem} onClose={() => setEyeOpen(false)} />

                <div className='flex justify-center mt-10 mb-10'>
                    <WordBtn 
                        children="VIEW MORE PRODUCTS" 
                        className='underline text-sm font-bold tracking-wider text-blue-700 hover:text-blue-900' 
                        onClick={() => navigate(Path.SHOP_SCREEN, { state: { items: displayProducts } })}
                    />
                </div>
            </div>
        </>
    );
}

export default HomeScreen;
