import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom";
import {WishlistProvider} from "./context/WishlistContext.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import {CartProvider} from "./context/CartContext.jsx";
import {CompareProvider} from "./context/CompareContext.jsx";

// Disable automatic scroll restoration behavior
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    <CompareProvider>
                        <App/>
                    </CompareProvider>
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    </BrowserRouter>
)
