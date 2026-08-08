import React from 'react'

function WordBtn({
                     children,
                     type = "button",
                     className = "",
                     onClick,
                     ...props
                 }) {
    return (
        <button
            type={type}
            onClick={onClick}
            {...props}
            className={`font-medium text-xl text-gray-700 hover:text-black transition-all duration-150 h-fit w-fit cursor-pointer  ${className}`}

        >
            {children}

        </button>
    )
}

export default WordBtn

