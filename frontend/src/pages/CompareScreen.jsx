import React from "react";
import CompareCard from "../components/Card/CompareCard.jsx";
import { useCompareContext } from "../context/CompareContext.jsx";
import { useNavigate } from "react-router-dom";
import Path from "../utils/const/Path.js";
import { MdOutlineCompareArrows } from "react-icons/md";
import { FaTrash } from "react-icons/fa";

function CompareScreen() {
  const { compareList, clearCompare } = useCompareContext();
  const navigate = useNavigate();

  if (compareList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          <MdOutlineCompareArrows />
        </div>
        <h2 className="text-2xl font-extrabold text-blue-950">No Products Selected for Comparison</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Click the Compare icon (<MdOutlineCompareArrows className="inline text-purple-600" />) on any product card in the store to add items here and compare their specs, pricing, and ratings side-by-side.
        </p>
        <button
          onClick={() => navigate(Path.SHOP_SCREEN)}
          className="px-6 py-3 bg-purple-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md hover:bg-purple-700 transition-all cursor-pointer"
        >
          Explore Store Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-12 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950 flex items-center gap-2">
            <MdOutlineCompareArrows className="text-purple-600" />
            <span>Product Comparison</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Comparing {compareList.length} selected items side-by-side</p>
        </div>
        <button
          onClick={clearCompare}
          className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors w-fit"
        >
          <FaTrash />
          <span>Clear Comparison</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-sm bg-white">
        <table className="w-full table-auto min-w-[700px]">
          <tbody>
            {/* PRODUCT INFO */}
            <tr>
              <th className="bg-gray-100/80 p-6 text-left font-bold text-blue-950 w-[240px] border-b border-r border-gray-200">
                Product Info
              </th>
              {compareList.map((item) => (
                <CompareCard key={item._id || item.id} item={item} />
              ))}
            </tr>

            {/* PRICE */}
            <tr>
              <th className="bg-gray-100/80 p-6 text-left font-bold text-blue-950 border-b border-r border-gray-200">
                Price
              </th>
              {compareList.map((item) => {
                const orig = Number(item.price || 0);
                const disc = Number(item.discountPrice || 0);
                const hasDisc = disc > 0 && disc < orig;
                const final = hasDisc ? orig - disc : orig;
                return (
                  <td key={item._id || item.id} className="p-6 border border-gray-200 text-center font-medium">
                    {hasDisc && (
                      <span className="line-through text-gray-400 mr-2 text-xs">
                        ₹{orig.toFixed(2)}
                      </span>
                    )}
                    <span className="font-extrabold text-blue-950 text-base">₹{final.toFixed(2)}</span>
                  </td>
                );
              })}
            </tr>

            {/* DESCRIPTION */}
            <tr>
              <th className="bg-gray-100/80 p-6 text-left font-bold text-blue-950 border-b border-r border-gray-200">
                Description
              </th>
              {compareList.map((item) => (
                <td key={item._id || item.id} className="p-6 text-xs text-gray-600 leading-relaxed border border-gray-200 text-center">
                  {item.description || "High quality product available on OmniCart."}
                </td>
              ))}
            </tr>

            {/* RATING */}
            <tr>
              <th className="bg-gray-100/80 p-6 text-left font-bold text-blue-950 border-r border-gray-200">
                Rating
              </th>
              {compareList.map((item) => (
                <td key={item._id || item.id} className="p-6 text-amber-400 border border-gray-200 text-center">
                  ★ ★ ★ ★ ★
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompareScreen;
