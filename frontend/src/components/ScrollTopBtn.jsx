import { useEffect, useState } from "react";

export default function ScrollTopBtn() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll");
    if (!scrollContainer) return;

    const toggleVisibility = () => {
      setVisible(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener("scroll", toggleVisibility);

    return () =>
      scrollContainer.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById("main-scroll");
    if (!scrollContainer) return;

    scrollContainer.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <div
      onClick={scrollToTop}
      className="group fixed bottom-14 right-10 z-50 cursor-pointer
                 rounded-full bg-blue-600 p-3 text-white shadow-lg
                 transition-all duration-300 hover:bg-blue-700"
    >
      <div className="relative h-7 w-7 overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 group-hover:animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </div>
    </div>
  );
}
