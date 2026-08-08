import React from "react";
import CartCard from "./Card/CartCard.jsx";
import AnimatedBtn from "./Button/AnimatedBtn.jsx";
import AppString from "../utils/const/AppString.jsx";
import { useCartContext } from "../context/CartContext.jsx";
import { FaShoppingCart, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Path from "../utils/const/Path.js";

function CartDrawer({ open: openProp, onClose: onCloseProp }) {
  const { cart, cartCount, cartSubtotal, isCartOpen, closeCart, clearCart } = useCartContext();
  const navigate = useNavigate();

  const isOpen = openProp !== undefined ? openProp : isCartOpen;
  const handleClose = onCloseProp || closeCart;

  const handleCheckoutClick = () => {
    handleClose();
    navigate(Path.CHECKOUT_SCREEN);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-20 right-0 z-50
          w-[92vw] sm:w-[380px]
          max-h-[82vh]
          bg-white rounded-3xl shadow-2xl border border-gray-100
          overflow-hidden
          transform transition-all duration-300 ease-out
          origin-top-right
          ${isOpen ? "scale-100 opacity-100 mr-4 sm:mr-6 md:mr-10" : "scale-95 opacity-0 pointer-events-none mr-0"}
        `}
      >
        <div className="flex flex-col max-h-[82vh]">
          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <FaShoppingCart className="text-blue-600 text-lg" />
              <h2 className="text-base font-bold text-blue-950">Your Cart ({cartCount})</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-700 text-sm rounded-full hover:bg-gray-200/50 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* SCROLLABLE ITEMS AREA */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-3">
                <FaShoppingCart className="text-4xl text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-600 text-sm">Your cart is currently empty</p>
                <p className="text-xs text-gray-400">Add products to your cart to see them here.</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartCard key={item.id} cartItem={item} />
              ))
            )}
          </div>

          {/* FOOTER */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-5 space-y-3 shrink-0 bg-gray-50/30">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-blue-950 text-lg font-extrabold">₹{cartSubtotal.toFixed(2)}</span>
              </div>

              <AnimatedBtn
                onClick={handleCheckoutClick}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700"
              >
                {AppString.CHECKOUT || 'PROCEED TO CHECKOUT'}
              </AnimatedBtn>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors pt-1"
              >
                Clear All Items
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CartDrawer;
