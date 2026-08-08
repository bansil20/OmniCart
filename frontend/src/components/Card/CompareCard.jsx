import React from "react";
import { AiTwotoneDelete } from "react-icons/ai";
import { useCompareContext } from "../../context/CompareContext.jsx";
import { useCartContext } from "../../context/CartContext.jsx";

function CompareCard({ item }) {
  const { removeFromCompare } = useCompareContext();
  const { addToCart } = useCartContext();

  if (!item) return null;

  const itemId = item._id || item.id;
  const title = item.name || item.title || "Product";
  const image = item.imageUrl || item.image || item.prev_image || "https://via.placeholder.com/200";

  return (
    <td className="p-6 text-center align-top border border-gray-200 bg-white">
      {/* Remove Button */}
      <div 
        onClick={() => removeFromCompare(itemId)}
        className="w-fit mx-auto mb-3 cursor-pointer hover:bg-red-50 p-2 rounded-full text-gray-500 hover:text-red-600 transition-colors"
        title="Remove from comparison"
      >
        <AiTwotoneDelete className="text-2xl" />
      </div>

      {/* Image */}
      <div className="h-64 sm:h-72 flex items-center justify-center p-2 bg-gray-50 rounded-2xl mb-4 border border-gray-100">
        <img
          src={image}
          className="h-full w-full object-contain rounded-xl"
          alt={title}
        />
      </div>

      {/* Title */}
      <h3 className="font-bold text-blue-950 text-base line-clamp-2 min-h-[48px]">{title}</h3>

      {/* Add to Cart / Select Option Button */}
      <button 
        onClick={() => addToCart(item, 1)}
        className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md transition-all cursor-pointer"
      >
        Add to Cart
      </button>
    </td>
  );
}

export default CompareCard;
