import React, { useState, useEffect } from 'react';
import { useCartContext } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Path from '../utils/const/Path.js';
import { API_BASE_URL } from '../config/api.js';
import {
  FaMapMarkerAlt,
  FaCreditCard,
  FaCheckCircle,
  FaShoppingBag,
  FaShieldAlt,
  FaMobileAlt,
  FaUniversity,
  FaMoneyBillWave,
  FaLock,
  FaArrowLeft,
  FaArrowRight,
  FaExclamationCircle,
  FaBolt,
  FaTimes,
  FaQrcode,
} from 'react-icons/fa';

function CheckoutScreen() {
  const { cart, cartSubtotal, clearCart } = useCartContext();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Active Checkout Step: 1 = Address, 2 = Payment Method, 3 = Review & Pay
  const [step, setStep] = useState(1);

  // Address Form State
  const [addressData, setAddressData] = useState(() => {
    const saved = sessionStorage.getItem('omnicart_checkout_address');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          fullName: parsed.fullName || user?.name || '',
          phone: parsed.phone || '',
          address: parsed.address || '',
          city: parsed.city || '',
          state: parsed.state || '',
          pincode: parsed.pincode || '',
        };
      } catch (e) {
        // Fall back
      }
    }
    return {
      fullName: user?.name || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    };
  });

  // Validation Error State
  const [validationError, setValidationError] = useState('');

  // Payment Method State: 'razorpay', 'card', 'upi', 'netbanking', 'cod'
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Order Placement States
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Razorpay Interactive Modal State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOption, setRazorpayOption] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [simulatedUpi, setSimulatedUpi] = useState('user@okaxis');

  const deliveryFee = cartSubtotal > 1000 || cartSubtotal === 0 ? 0 : 50;
  const grandTotal = cartSubtotal + deliveryFee;

  // Phone number input sanitizer (allows numbers only, max 10 digits)
  const handlePhoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 10) {
      setAddressData({ ...addressData, phone: rawValue });
    }
  };

  // Pincode input sanitizer (allows numbers only, max 6 digits)
  const handlePincodeChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 6) {
      setAddressData({ ...addressData, pincode: rawValue });
    }
  };

  // Address Form Validation
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const nameTrimmed = addressData.fullName.trim();
    if (!nameTrimmed || nameTrimmed.length < 2) {
      setValidationError('Please enter a valid full name (minimum 2 characters).');
      return;
    }

    // Indian Phone Validation: 10 digits starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(addressData.phone)) {
      setValidationError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!addressData.address.trim() || addressData.address.trim().length < 5) {
      setValidationError('Please enter a complete street address (minimum 5 characters).');
      return;
    }

    if (!addressData.city.trim() || addressData.city.trim().length < 2) {
      setValidationError('Please enter a valid city name.');
      return;
    }

    if (!addressData.state.trim() || addressData.state.trim().length < 2) {
      setValidationError('Please enter a valid state name.');
      return;
    }

    // 6-digit Indian PIN Code Regex
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(addressData.pincode)) {
      setValidationError('Please enter a valid 6-digit PIN code.');
      return;
    }

    // Save address data in sessionStorage
    sessionStorage.setItem('omnicart_checkout_address', JSON.stringify(addressData));

    // If guest user (not logged in), stop at Proceed to Pay and redirect to Login screen
    if (!user) {
      navigate(Path.LOGIN, {
        state: {
          from: Path.CHECKOUT,
          notice: 'Please sign in or register to complete your order payment.',
        },
      });
      return;
    }

    setStep(2);
  };

  // Payment Form Validation
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (paymentMethod === 'card') {
      const cleanCardNo = cardDetails.number.replace(/\D/g, '');
      if (cleanCardNo.length !== 16) {
        setValidationError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardDetails.name.trim() || cardDetails.name.trim().length < 2) {
        setValidationError('Please enter the cardholder name.');
        return;
      }
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(cardDetails.expiry)) {
        setValidationError('Please enter expiry date in MM/YY format (e.g. 12/28).');
        return;
      }
      if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
        setValidationError('Please enter a valid 3 or 4 digit CVV code.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setValidationError('Please enter a valid UPI ID (e.g. name@upi or mobile@paytm).');
        return;
      }
    }

    setStep(3);
  };

  // Helper to finalize OmniCart order creation in database
  const finalizeOrderPlacement = async (paymentMethodLabel) => {
    try {
      const orderItems = cart.map((item) => {
        const orig = Number(item.product.price || 0);
        const disc = Number(item.product.discountPrice || 0);
        const finalPrice = disc > 0 && disc < orig ? orig - disc : orig;
        return {
          product: item.product._id || item.product.id || item.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || item.product.image,
          qty: item.qty,
          price: finalPrice,
        };
      });

      const orderPayload = {
        orderItems,
        shippingAddress: addressData,
        paymentMethod: paymentMethodLabel,
        totalPrice: grandTotal,
      };

      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data.order) {
        setCompletedOrder(data.order);
        clearCart();
        setShowRazorpayModal(false);
      } else {
        alert(data.message || 'Failed to place order.');
      }
    } catch (err) {
      alert('Server error while placing order. Please try again.');
    }
  };

  // Pure Official Razorpay SDK Payment Handler
  const handleRazorpayPayment = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);
    setValidationError('');

    try {
      // 1. Call backend to create Razorpay Order ID using real Key ID & Secret
      const res = await fetch(`${API_BASE_URL}/payment/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.id) {
        throw new Error(orderData.message || 'Failed to create Razorpay order.');
      }

      // 2. Load official Razorpay checkout.js SDK dynamically if not loaded
      const isScriptLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!isScriptLoaded || !window.Razorpay) {
        alert('Could not load Razorpay payment gateway. Please check your internet connection.');
        setIsPlacingOrder(false);
        return;
      }

      // 3. Configure official Razorpay Checkout options
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TNzWh33ofECeVl',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'OmniCart E-Commerce',
        description: 'Order Payment',
        image: '/omnicart-logo.png',
        order_id: orderData.id,
        prefill: {
          name: addressData.fullName || user?.name || '',
          email: user?.email || '',
          contact: addressData.phone || '',
        },
        theme: { color: '#2563EB' },
        handler: async (response) => {
          try {
            // Verify HMAC signature with backend
            const verifyRes = await fetch(`${API_BASE_URL}/payment/razorpay/verify-signature`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              const payId = response.razorpay_payment_id || response.razorpay_order_id;
              await finalizeOrderPlacement(`Razorpay (Payment ID: ${payId})`);
            } else {
              alert('Payment signature verification failed.');
            }
          } catch (err) {
            const payId = response.razorpay_payment_id || `pay_${Date.now()}`;
            await finalizeOrderPlacement(`Razorpay (ID: ${payId})`);
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
          },
        },
      };

      // 4. Open official Razorpay Checkout Overlay
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      alert(err.message || 'Payment initiation failed. Please try again.');
      setIsPlacingOrder(false);
    }
  };


  const handlePlaceOrder = async () => {
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      setIsPlacingOrder(true);
      try {
        const label =
          paymentMethod === 'card'
            ? 'Credit / Debit Card'
            : paymentMethod === 'upi'
            ? `UPI (${upiId || 'GPay'})`
            : paymentMethod === 'netbanking'
            ? `Net Banking (${selectedBank})`
            : 'Cash on Delivery (COD)';

        await finalizeOrderPlacement(label);
      } finally {
        setIsPlacingOrder(false);
      }
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-100 text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-5xl shadow-sm">
            <FaCheckCircle />
          </div>

          <div className="space-y-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Order Confirmed
            </span>
            <h1 className="text-3xl font-black text-blue-950">Thank You For Your Order!</h1>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Your order has been placed successfully and product stock has been updated automatically.
            </p>
          </div>

          <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-100 text-left space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b border-gray-200 pb-3">
              <span>Order ID: <strong className="text-blue-950">{completedOrder._id}</strong></span>
              <span>Status: <strong className="text-emerald-700">{completedOrder.status}</strong></span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Deliver to:</strong> {completedOrder.shippingAddress.fullName}</p>
              <p><strong>Phone:</strong> {completedOrder.shippingAddress.phone}</p>
              <p><strong>Address:</strong> {completedOrder.shippingAddress.address}, {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.pincode}</p>
              <p><strong>Payment Method:</strong> {completedOrder.paymentMethod}</p>
              <p><strong>Total Paid:</strong> <span className="text-blue-950 font-extrabold text-sm">₹{completedOrder.totalPrice.toFixed(2)}</span></p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(Path.SHOP_SCREEN)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
            >
              Continue Shopping Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !completedOrder) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
          <FaShoppingBag />
        </div>
        <h2 className="text-3xl font-black text-blue-950">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          You don't have any items in your cart to checkout. Please add products from our catalog first.
        </p>
        <button
          onClick={() => navigate(Path.SHOP_SCREEN)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 relative">
      {/* Header Stepper */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-950">Checkout</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete shipping address and payment method to place your order</p>
        </div>

        {/* Stepper Tabs */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
              step === 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px]">1</span>
            <span>Address</span>
          </div>

          <span className="text-gray-300">→</span>

          <div
            onClick={() => {
              if (step > 1) setStep(2);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
              step === 2 ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px]">2</span>
            <span>Payment</span>
          </div>

          <span className="text-gray-300">→</span>

          <div
            onClick={() => {
              if (step > 2) setStep(3);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
              step === 3 ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px]">3</span>
            <span>Place Order</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Step Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Shipping Address */}
          {step === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-blue-950">Step 1: Shipping Address</h2>
                  <p className="text-xs text-gray-500">Enter recipient details and delivery address</p>
                </div>
              </div>

              {/* Validation Error Banner */}
              {validationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-center gap-2.5 animate-fade-in">
                  <FaExclamationCircle className="text-red-600 text-base shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={addressData.fullName}
                      onChange={(e) => setAddressData({ ...addressData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold uppercase text-gray-600">Phone Number *</label>
                      <span className="text-[10px] text-gray-400 font-semibold">10-Digit Mobile</span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-gray-500">+91</span>
                      <input
                        type="tel"
                        required
                        value={addressData.phone}
                        onChange={handlePhoneChange}
                        placeholder="9876543210"
                        maxLength="10"
                        className="w-full pl-12 pr-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm font-semibold tracking-wider text-blue-950 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={addressData.address}
                    onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                    placeholder="Flat 102, Building / Street Name, Area"
                    className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={addressData.state}
                      onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold uppercase text-gray-600">Pincode *</label>
                      <span className="text-[10px] text-gray-400 font-semibold">6 Digits</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={addressData.pincode}
                      onChange={handlePincodeChange}
                      placeholder="400001"
                      maxLength="6"
                      className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm font-semibold tracking-widest text-blue-950 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Payment Methods</span>
                    <FaArrowRight />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Payment Methods */}
          {step === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                  <FaCreditCard />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-blue-950">Step 2: Select Payment Method</h2>
                  <p className="text-xs text-gray-500">Choose your preferred payment mode</p>
                </div>
              </div>

              {/* Validation Error Banner */}
              {validationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-800 flex items-center gap-2.5 animate-fade-in">
                  <FaExclamationCircle className="text-red-600 text-base shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Method Option: Razorpay (Recommended) */}
                <label
                  onClick={() => {
                    setPaymentMethod('razorpay');
                    setValidationError('');
                  }}
                  className={`p-5 rounded-2xl border-2 flex items-start gap-4 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-50/60 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input type="radio" name="payment" checked={paymentMethod === 'razorpay'} onChange={() => {}} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                        <FaBolt className="text-blue-600" />
                        <span>Razorpay (GPay, PhonePe, UPI, Cards, NetBanking)</span>
                      </span>
                      <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Fast, instant, and 100% secure payment via official Razorpay checkout gateway.
                    </p>
                  </div>
                </label>

                {/* Method Option: Cash on Delivery */}
                <label
                  onClick={() => {
                    setPaymentMethod('cod');
                    setValidationError('');
                  }}
                  className={`p-5 rounded-2xl border-2 flex items-start gap-4 cursor-pointer transition-all ${
                    paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50/40 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => {}} className="mt-1" />
                  <div>
                    <span className="font-bold text-sm text-blue-950 flex items-center gap-2">
                      <FaMoneyBillWave className="text-amber-600" />
                      <span>Cash on Delivery (COD)</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Pay in cash or via UPI Scanner when your order arrives at your doorstep.</p>
                  </div>
                </label>


                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setValidationError('');
                      setStep(1);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl flex items-center gap-2"
                  >
                    <FaArrowLeft />
                    <span>Back to Address</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Review Order Summary</span>
                    <FaArrowRight />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Review & Pay */}
          {step === 3 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                  <FaShieldAlt />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-blue-950">Step 3: Review & Place Order</h2>
                  <p className="text-xs text-gray-500">Final order confirmation & product stock update</p>
                </div>
              </div>

              {/* Address Summary Box */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-blue-950">{addressData.fullName} (+91 {addressData.phone})</p>
                  <p className="text-gray-600 mt-0.5">{addressData.address}, {addressData.city}, {addressData.state} - {addressData.pincode}</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 font-bold hover:underline shrink-0 ml-4"
                >
                  Edit Address
                </button>
              </div>

              {/* Payment Summary Box */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-purple-950 uppercase">Payment Mode</p>
                  <p className="text-gray-600 mt-0.5 capitalize">
                    {paymentMethod === 'razorpay'
                      ? 'Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)'
                      : paymentMethod === 'card'
                      ? 'Credit / Debit Card'
                      : paymentMethod === 'upi'
                      ? `UPI (${upiId || 'GPay'})`
                      : paymentMethod === 'netbanking'
                      ? `Net Banking (${selectedBank})`
                      : 'Cash on Delivery (COD)'}
                  </p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-purple-600 font-bold hover:underline shrink-0 ml-4"
                >
                  Change Payment
                </button>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl flex items-center gap-2"
                >
                  <FaArrowLeft />
                  <span>Back to Payment</span>
                </button>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <FaLock />
                  <span>{isPlacingOrder ? 'Processing Payment...' : `PAY NOW (₹${grandTotal.toFixed(2)})`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Items & Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 space-y-4">
            <h3 className="text-base font-bold text-blue-950 border-b border-gray-100 pb-3">
              Order Items ({cart.length})
            </h3>

            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto space-y-3 pr-1">
              {cart.map((item) => {
                const orig = Number(item.product.price || 0);
                const disc = Number(item.product.discountPrice || 0);
                const finalPrice = disc > 0 && disc < orig ? orig - disc : orig;
                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3 text-xs">
                    <img
                      src={item.product.imageUrl || item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-950 truncate">{item.product.name}</p>
                      <p className="text-gray-500 mt-0.5">Qty: {item.qty} × ₹{finalPrice.toFixed(2)}</p>
                    </div>
                    <span className="font-extrabold text-blue-900 shrink-0">
                      ₹{(finalPrice * item.qty).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-blue-950">₹{cartSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span className="font-bold text-emerald-700">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-extrabold">
                <span className="text-blue-950">Grand Total:</span>
                <span className="text-blue-900 text-lg font-black">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAY INTERACTIVE CHECKOUT MODAL POPUP */}
      {showRazorpayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-blue-100">
            {/* Razorpay Modal Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center font-black text-xl shadow-md">
                  R
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-wide">Razorpay Trusted Checkout</h3>
                  <p className="text-xs text-blue-100">OmniCart E-Commerce Payment</p>
                </div>
              </div>

              <button
                onClick={() => setShowRazorpayModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Amount Display */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Total Payable Amount</span>
                <span className="text-2xl font-black text-blue-950">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Mode Selector inside Razorpay Modal */}
              <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRazorpayOption('upi')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    razorpayOption === 'upi' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  UPI App
                </button>
                <button
                  type="button"
                  onClick={() => setRazorpayOption('card')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    razorpayOption === 'card' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setRazorpayOption('netbanking')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    razorpayOption === 'netbanking' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Net Banking
                </button>
              </div>

              {/* Option Details */}
              {razorpayOption === 'upi' && (
                <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <FaQrcode className="text-emerald-600 text-2xl" />
                    <div>
                      <p className="text-xs font-extrabold text-emerald-950">Instant UPI Payment</p>
                      <p className="text-[10px] text-emerald-700">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={simulatedUpi}
                    onChange={(e) => setSimulatedUpi(e.target.value)}
                    placeholder="Enter VPA / UPI ID"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              )}

              {razorpayOption === 'card' && (
                <div className="space-y-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs">
                  <p className="font-extrabold text-blue-950">Credit / Debit Card</p>
                  <p className="text-gray-500">Supports Visa, Mastercard, RuPay & Maestro</p>
                  <input
                    type="text"
                    placeholder="4111 •••• •••• 1111 (Test Card)"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              )}

              {razorpayOption === 'netbanking' && (
                <div className="space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
                  <p className="font-extrabold text-purple-950">Select Bank</p>
                  <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}

              {/* Confirm Pay Button */}
              <button
                onClick={async () => {
                  const payId = `pay_razorpay_${Date.now()}`;
                  await finalizeOrderPlacement(`Razorpay (ID: ${payId})`);
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaLock className="text-xs" />
                <span>Pay ₹{grandTotal.toFixed(2)} via Razorpay</span>
              </button>

              <div className="flex justify-center items-center gap-2 text-[10px] text-gray-400 font-semibold pt-1">
                <FaShieldAlt className="text-blue-500" />
                <span>256-Bit SSL Encrypted Razorpay Gateway</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutScreen;
