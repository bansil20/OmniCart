import React from "react";


//LIKE TO USE THIS BUTTON
/*
 <FillBtn disabled={!item.inStock}>
  {item.inStock ? "ADD TO CART" : "OUT OF STOCK"}
</FillBtn>
*/


function FillBtn({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        relative overflow-hidden
        px-6 sm:px-10 py-3
        font-medium rounded-xl
        w-full sm:w-auto

        transition-all duration-300 ease-in-out

        ${
          disabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed animate-pulse"
            : "bg-gray-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
        }

        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2

        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default FillBtn;
