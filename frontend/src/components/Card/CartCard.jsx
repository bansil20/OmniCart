import React from 'react';
import { useCartContext } from '../../context/CartContext.jsx';
import { FaTrash, FaPlus, FaMinus } from 'react-icons/fa';

function CartCard({ cartItem }) {
  const { removeFromCart, updateQty } = useCartContext();

  if (!cartItem || !cartItem.product) return null;

  const { id, product, qty } = cartItem;
  const title = product.name || product.title || 'Product';
  const image = product.imageUrl || product.image || 'https://via.placeholder.com/60';

  const origPrice = Number(product.price || 0);
  const discAmount = Number(product.discountPrice || 0);
  const unitPrice = discAmount > 0 && discAmount < origPrice ? (origPrice - discAmount) : origPrice;

  return (
    <div className="flex gap-4 border-b border-gray-100 pb-4 items-center">
      <img
        className="w-16 h-16 bg-gray-50 rounded-xl object-contain border border-gray-100 shrink-0"
        src={image}
        alt={title}
      />

      <div className="flex-1 space-y-1">
        <p className="font-bold text-sm text-blue-950 line-clamp-1">{title}</p>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg text-xs">
            <button
              onClick={() => updateQty(id, qty - 1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
            >
              <FaMinus className="text-[10px]" />
            </button>
            <span className="px-2.5 font-bold text-gray-800">{qty}</span>
            <button
              onClick={() => updateQty(id, qty + 1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
            >
              <FaPlus className="text-[10px]" />
            </button>
          </div>

          <span className="text-xs font-semibold text-gray-400">
            × ₹{unitPrice.toFixed(2)}
          </span>
        </div>

        <p className="font-extrabold text-sm text-blue-900">
          ₹{(unitPrice * qty).toFixed(2)}
        </p>
      </div>

      <button
        onClick={() => removeFromCart(id)}
        className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
        title="Remove item"
      >
        <FaTrash className="text-sm" />
      </button>
    </div>
  );
}

export default CartCard;
