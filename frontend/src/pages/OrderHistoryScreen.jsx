import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Path from '../utils/const/Path.js';
import { downloadOrderInvoicePDF } from '../utils/pdfInvoiceGenerator.js';
import { API_BASE_URL } from '../config/api.js';
import {
  FaShoppingBag,
  FaFileDownload,
  FaCalendarAlt,
  FaCheckCircle,
  FaBoxOpen,
  FaTruck,
  FaArrowRight
} from 'react-icons/fa';

function OrderHistoryScreen() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.orders) {
          setOrders(data.orders);
        }
      } catch (err) {
        // Order history fetch error handling
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
          <FaShoppingBag />
        </div>
        <h2 className="text-3xl font-black text-blue-950">No Orders Found</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          You haven't placed any orders yet. Explore our store catalog and buy your favorite products!
        </p>
        <button
          onClick={() => navigate(Path.SHOP_SCREEN)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Explore Store Catalog</span>
          <FaArrowRight />
        </button>
      </div>
    );
  }

  const lastOrder = orders[0];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-900">
            <FaShoppingBag className="text-2xl" />
            <h1 className="text-3xl font-extrabold text-blue-950">My Order History</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Track past orders, view item details, and download PDF tax invoices.
          </p>
        </div>
        <span className="text-xs font-extrabold bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
          {orders.length} {orders.length === 1 ? 'Order Placed' : 'Orders Placed'}
        </span>
      </div>

      {/* HIGHLIGHT: Last Purchase Box */}
      {lastOrder && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4 border border-blue-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-800/80 pb-4">
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Recent Purchase
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">Order #{lastOrder._id}</h2>
              <p className="text-xs text-blue-200 mt-0.5 flex items-center gap-2">
                <FaCalendarAlt />
                <span>{new Date(lastOrder.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>

            <button
              onClick={() => downloadOrderInvoicePDF(lastOrder, false)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <FaFileDownload />
              <span>Download Bill PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <p className="text-blue-300 font-semibold">Delivery Address:</p>
              <p className="text-white mt-1 font-medium">
                {lastOrder.shippingAddress?.fullName} ({lastOrder.shippingAddress?.phone})<br />
                {lastOrder.shippingAddress?.address}, {lastOrder.shippingAddress?.city}, {lastOrder.shippingAddress?.state} - {lastOrder.shippingAddress?.pincode}
              </p>
            </div>
            <div>
              <p className="text-blue-300 font-semibold">Payment Details:</p>
              <p className="text-white mt-1 font-medium">
                Method: {lastOrder.paymentMethod}<br />
                Status: <span className="text-emerald-400 font-bold">Paid & Confirmed</span>
              </p>
            </div>
            <div>
              <p className="text-blue-300 font-semibold">Total Amount Paid:</p>
              <p className="text-2xl font-black text-white mt-1">₹{Number(lastOrder.totalPrice).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Past Orders List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-blue-950">All Past Orders</h3>

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-950 text-base">Order #{order._id}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      {order.status || 'Confirmed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-blue-900 text-lg">
                    ₹{Number(order.totalPrice).toFixed(2)}
                  </span>
                  <button
                    onClick={() => downloadOrderInvoicePDF(order, false)}
                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors border border-blue-200 cursor-pointer"
                    title="Download Bill Invoice PDF"
                  >
                    <FaFileDownload className="text-blue-600" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-gray-50">
                {order.orderItems?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl || item.product?.imageUrl || 'https://via.placeholder.com/40'}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-contain bg-gray-50 border border-gray-100 shrink-0"
                      />
                      <span className="font-bold text-blue-950 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-gray-500 font-medium">Qty: {item.qty} × ₹{Number(item.price).toFixed(2)}</span>
                      <p className="font-extrabold text-blue-900">₹{(Number(item.price) * Number(item.qty)).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderHistoryScreen;
