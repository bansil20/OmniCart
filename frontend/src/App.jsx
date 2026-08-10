import React from 'react'
import { Routes, Route } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen.jsx";
import LayoutHF from "./layout/LayoutHF.jsx";
import CompareScreen from "./pages/CompareScreen.jsx";
import WishlistScreen from "./pages/WishlistScreen.jsx";
import CheckoutScreen from "./pages/CheckoutScreen.jsx";
import OrderHistoryScreen from "./pages/OrderHistoryScreen.jsx";
import Path from "./utils/const/Path.js";
import ShopScreen from "./pages/ShopScreen.jsx";
import ItemScreen from "./pages/ItemScreen.jsx";
import LoginScreen from "./pages/LoginScreen.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const App = () => {
    return (
        <div
            id="main-scroll"
            className='h-screen overflow-y-scroll no-scrollbar bg-blue-50'>
            <Routes>
                <Route element={<LayoutHF children={<HomeScreen />} />} path={Path.HOME_SCREEN} />
                <Route element={<LayoutHF screenName='Compare Screen' tagLine='Compare Smarter, Buy Faster' children={<CompareScreen />} />} path={Path.COMPARE_SCREEN} />
                <Route element={<LayoutHF screenName='Wishlist Screen' tagLine='Your Saved Favorites' children={<WishlistScreen />} />} path={Path.WISHLIST_SCREEN} />
                <Route element={<LayoutHF screenName='Checkout Screen' tagLine='Secure Checkout & Payment' children={<CheckoutScreen />} />} path={Path.CHECKOUT_SCREEN} />
                <Route element={<LayoutHF screenName='Order History' tagLine='Your Past Purchases & Invoices' children={<OrderHistoryScreen />} />} path={Path.ORDER_HISTORY} />
                <Route element={<LayoutHF screenName='Shop Screen' tagLine='All Categories. One Place.' children={<ShopScreen />} />} path={Path.SHOP_SCREEN} />
                <Route element={<LayoutHF screenName='Item Screen' tagLine='Everything About This Item' children={<ItemScreen />} />} path={Path.ITEM_DETAIL} />
                <Route
                    path={Path.LOGIN}
                    element={
                        <LayoutHF>
                            <LoginScreen />
                        </LayoutHF>
                    }
                />

                <Route
                    path={Path.REGISTER}
                    element={
                        <LayoutHF>
                            <LoginScreen />
                        </LayoutHF>
                    }
                />


                {/* Protected Dashboard Routes */}
                <Route
                    path={Path.ADMIN_DASHBOARD}
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <LayoutHF>
                                <AdminDashboard />
                            </LayoutHF>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={Path.SELLER_DASHBOARD}
                    element={
                        <ProtectedRoute allowedRoles={['seller', 'admin']}>
                            <LayoutHF>
                                <SellerDashboard />
                            </LayoutHF>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    )
}
export default App
