import React, {useState} from 'react'
import AppString from "../utils/const/AppString.jsx";

function Footer() {

    const [subscribe, setSubscribe] = useState('')

    return (
        <footer className="bg-blue-100 ">

            <div className='max-w-7xl mx-auto px-6 py-16'>
                <div className=' grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10'>
                    <div>
                        <h2 className='text-3xl font-bold text-blue-900'>{AppString.APP_NAME}</h2>
                        <p className='mt-4 text-sm text-gray-600 font-medium'>&copy; {new Date().getFullYear()} {AppString.APP_NAME}<br/> All rights reserved.</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">{AppString.ABOUT_US}</h3>
                        <ul className="space-y-3 text-sm text-gray-600 font-medium ">
                            <li className="w-fit hover:text-blue-500 cursor-pointer ">{AppString.ABOUT_US}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.STORE_LOCATION}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.CONTACT}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.ORDER_TRACKING}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">{AppString.USEFUL_LINKS}</h3>
                         <ul className="space-y-3 text-sm text-gray-600 font-medium ">
                            <li className="w-fit hover:text-blue-500 cursor-pointer ">{AppString.RETURNS}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.SUPPORT_POLICY}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.FAQS}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">{AppString.FOLLOW_US}</h3>
                         <ul className="space-y-3 text-sm text-gray-600 font-medium ">
                            <li className="w-fit hover:text-blue-500 cursor-pointer ">{AppString.FACEBOOK}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.TWITTER}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.INSTAGRAM}</li>
                            <li className="w-fit hover:text-blue-500 cursor-pointer">{AppString.YOUTUBE}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">{AppString.SUBSCRIBE}</h3>
                        <p className="text-sm text-gray-600 mb-4 font-medium">
                            {AppString.SUBSCRIBE_INFO}
                        </p>
                        <input
                            type="email"
                            value={subscribe}
                            onChange={(e) => setSubscribe(e.target.value)}
                            placeholder="Enter your email address..."
                            className="w-full border-b text-gray-600 border-gray-500 focus:outline-none focus:border-black py-2 text-sm font-medium"
                        />
                        <button className="p-1 mt-4 bg-gray-300  text-sm text-gray-600 font-medium border-2 rounded cursor-pointer" onClick={()=>{
                            setSubscribe('')
                        }}>
                            SUBSCRIBE
                        </button>
                    </div>


                </div>
            </div>


        </footer>
    )
}

export default Footer
