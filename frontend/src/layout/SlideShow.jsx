import React, { useState, useEffect } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import slides from "../utils/const/slide.js";
import AppString from "../utils/const/AppString.jsx";
import AnimatedBtn from "../components/Button/AnimatedBtn.jsx";
import Path from "../utils/const/Path.js";
import { API_BASE_URL } from "../config/api.js";

function SlideShow() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch newly added products from backend API (sorted newest first)
  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const data = await res.json();
        if (res.ok && data.products && data.products.length > 0) {
          // Take top 5 newly added products
          setLatestProducts(data.products.slice(0, 5));
        }
      } catch (err) {
        // Fallback to static slides
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  // Format slides list: use newly added products if available, else static slides
  const activeSlides =
    latestProducts.length > 0
      ? latestProducts.map((prod) => {
          const originalPrice = Number(prod.price || 0);
          const discVal = Number(prod.discountPrice || 0);
          const hasDiscount = discVal > 0 && discVal < originalPrice;
          
          // Calculate final selling price (MRP - discount amount if small discount value, else direct discount price)
          let finalPrice = originalPrice;
          if (hasDiscount) {
            if (discVal < (originalPrice / 2)) {
              finalPrice = originalPrice - discVal; // e.g., 799 - 49 = 750
            } else {
              finalPrice = discVal; // e.g., 750 directly
            }
          }

          return {
            id: prod._id,
            tag: `Smart Products`,
            title1: prod.name,
            finalPrice,
            originalPrice,
            hasDiscount,
            image: prod.imageUrl,
            isRealProduct: true,
            product: prod,
          };
        })
      : slides;

  // Auto slide every 3 seconds (3000ms)
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const currentSlide = activeSlides[current] || activeSlides[0];

  const handleShopNow = () => {
    if (currentSlide.isRealProduct && currentSlide.id) {
      navigate(`${Path.ITEM_SCREEN}/${currentSlide.id}`);
    } else {
      navigate(Path.SHOP_SCREEN);
    }
  };

  return (
    <section className="w-full h-[40vh] lg:h-[50vh] bg-[#dffefe] relative overflow-hidden">
      {/* Inline styles for keyframe animations on slide transition */}
      <style>{`
        @keyframes slideInText {
          0% {
            opacity: 0;
            transform: translateX(-40px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInImage {
          0% {
            opacity: 0;
            transform: scale(0.85) translateX(40px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
        }
        .animate-slide-text {
          animation: slideInText 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-image {
          animation: slideInImage 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        {/* LEFT TEXT */}
        <div key={`text-${current}`} className="max-w-[55%] animate-slide-text">
          <p className="text-sm md:text-lg mb-2 md:mb-4 text-gray-800 font-medium">
            {currentSlide.tag}
          </p>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-black line-clamp-2">
            {currentSlide.title1}
          </h1>

          {/* PRICE DISPLAY WITH STRIKETHROUGH */}
          {currentSlide.finalPrice !== undefined ? (
            <div className="text-2xl md:text-4xl flex items-center gap-3 font-bold mt-3">
              <span className="text-[#004bb5] font-black tracking-tight">
                ₹{Number(currentSlide.finalPrice).toFixed(2)}
              </span>
              {currentSlide.hasDiscount && (
                <span className="line-through text-gray-400 text-lg md:text-2xl font-medium ml-1">
                  ₹{Number(currentSlide.originalPrice).toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-lg md:text-2xl font-bold text-blue-900 mt-2">
              {currentSlide.title2}
            </p>
          )}

          <AnimatedBtn className="mt-4" onClick={handleShopNow}>
            {AppString.SHOP_NOW}
          </AnimatedBtn>
        </div>

        {/* RIGHT IMAGE */}
        <div key={`image-${current}`} className="relative flex items-center justify-center pointer-events-none animate-slide-image">
          {/* Circle */}
          <div className="absolute w-[220px] h-[220px] md:w-[320px] md:h-[320px] lg:w-[360px] lg:h-[360px] bg-[#b9f5f2] rounded-full z-0" />

          {/* Image */}
          <img
            src={currentSlide.image}
            alt={currentSlide.title1}
            className="relative z-10 w-[180px] md:w-[320px] lg:w-[420px] object-contain max-h-[350px]"
          />
        </div>
      </div>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {activeSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === idx ? "w-7 bg-blue-900" : "w-2 bg-gray-400 hover:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* LEFT ARROW */}
      <button
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-3xl md:text-4xl text-gray-600 hover:text-black z-50 cursor-pointer"
        onClick={() =>
          setCurrent((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1))
        }
      >
        <MdKeyboardArrowLeft />
      </button>

      {/* RIGHT ARROW */}
      <button
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-3xl md:text-4xl text-gray-600 hover:text-black z-50 cursor-pointer"
        onClick={() =>
          setCurrent((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1))
        }
      >
        <MdKeyboardArrowRight />
      </button>
    </section>
  );
}

export default SlideShow;
