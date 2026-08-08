import React from 'react'
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import ScrollTopBtn from "../components/ScrollTopBtn.jsx";
import {useLocation} from "react-router-dom";

function LayoutHF({ children, screenName, tagLine }) {

    const location = useLocation()

    return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-100">
        <Header />
      </header>

        {
            location.pathname !== "/" &&  <div className='py-8 text-2xl text-gray-700 bg-blue-100 font-semibold text-center'>
                {screenName}
            <p className='text-center text-xl'>{tagLine}</p>
        </div>
        }


      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-10">
        <Footer />
      </footer>

      <ScrollTopBtn />
    </div>
  );
}

export default LayoutHF;
