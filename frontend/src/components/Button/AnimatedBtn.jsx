import React from "react";

function AnimatedBtn({
  children,
  onClick,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        relative overflow-hidden
        border-2 border-blue-900
        font-bold
        px-6 md:px-10 py-2.5 md:py-4
        text-xs md:text-sm tracking-widest
        text-blue-900
        transition-all duration-300 ease-in-out
        group cursor-pointer rounded-xl shadow-sm

        before:absolute before:inset-0
        before:bg-blue-900
        before:scale-x-0
        before:origin-right
        before:transition-transform before:duration-500

        hover:before:scale-x-100
        hover:before:origin-left
        hover:shadow-md

        ${className}
      `}
    >
      <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
        {children}
      </span>
    </button>
  );
}

export default AnimatedBtn;
