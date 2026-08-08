import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Path from '../../utils/const/Path.js';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShoppingBag,
  FaArrowRight,
  FaKey,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, googleLogin, setDirectAuthData, authError, setAuthError } = useAuth();

  // Tab state: 'login' or 'register'
  const isRegisterPage = location.pathname === Path.REGISTER;
  const [activeTab, setActiveTab] = useState(isRegisterPage ? 'register' : 'login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localValidation, setLocalValidation] = useState('');

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState('');

  // Google Modal / Prompt State
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  const switchTab = (tab) => {
    setActiveTab(tab);
    setLocalValidation('');
    setAuthError(null);
    if (tab === 'register') {
      navigate(Path.REGISTER, { replace: true });
    } else {
      navigate(Path.LOGIN, { replace: true });
    }
  };

  // Helper to handle role-based redirection on successful authentication
  const redirectBasedOnRole = (role) => {
    if (role === 'admin') {
      navigate(Path.ADMIN_DASHBOARD);
    } else if (role === 'seller') {
      navigate(Path.SELLER_DASHBOARD);
    } else {
      const fromPath = location.state?.from || Path.HOME_SCREEN;
      navigate(fromPath);
    }
  };

  // Regular Form Submit (Login / Register)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalValidation('');
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setLocalValidation('Please fill in all required fields.');
      return;
    }

    if (activeTab === 'register' && !name.trim()) {
      setLocalValidation('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setLocalValidation('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (activeTab === 'login') {
        result = await login(email, password);
      } else {
        result = await register(name, email, password);
      }

      if (result.success) {
        redirectBasedOnRole(result.user?.role);
      }
    } catch (err) {
      // Auth submit error handled via context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Send OTP to Gmail
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setSimulatedOtpNotice('');

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotSuccess(data.message || `Verification OTP sent to ${forgotEmail}`);
        if (data.otp) {
          setSimulatedOtpNotice(data.otp);
        }
        setForgotStep(2);
      } else {
        setForgotError(data.message || 'Failed to send OTP to email.');
      }
    } catch (err) {
      setForgotError('Server connection error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setForgotError('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setDirectAuthData(data.token, data.user);
        setForgotSuccess('Password reset successfully! Logging you in...');
        setTimeout(() => {
          setShowForgotModal(false);
          redirectBasedOnRole(data.user?.role);
        }, 1200);
      } else {
        setForgotError(data.message || 'Invalid OTP code or request expired.');
      }
    } catch (err) {
      setForgotError('Server connection error while resetting password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Direct Google Sign-In Trigger
  const handleGoogleAuth = async (selectedEmail, selectedName) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const gEmail = selectedEmail || email || 'customer.google@gmail.com';
      const gName = selectedName || name || gEmail.split('@')[0];
      const gId = `google_${Date.now()}`;
      const gAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${gEmail}`;

      const result = await googleLogin({
        name: gName,
        email: gEmail,
        googleId: gId,
        avatar: gAvatar,
      });

      if (result.success) {
        setShowGooglePrompt(false);
        redirectBasedOnRole(result.user?.role);
      }
    } catch (err) {
      // Google auth error handled via context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-blue-100 transition-all duration-300 relative">
        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner mb-3 p-2 border border-blue-100">
            <img src="/omnicart-logo.png" alt="OmniCart Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-blue-950 tracking-tight">
            {activeTab === 'login' ? 'Welcome Back!' : 'Create Customer Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {activeTab === 'login'
              ? 'Sign in with your email and password to access your account'
              : 'Join OmniCart to enjoy seamless shopping and exclusive deals'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-blue-50 p-1.5 rounded-2xl border border-blue-100">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-blue-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-blue-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Redirect Notice Banner */}
        {location.state?.notice && !authError && !localValidation && (
          <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
            <FaLock className="text-amber-600 text-sm shrink-0" />
            <span>{location.state.notice}</span>
          </div>
        )}

        {/* Alert Error Messages */}
        {(localValidation || authError) && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm animate-fade-in flex items-center justify-between">
            <span>{localValidation || authError}</span>
          </div>
        )}

        {/* Auth Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaUser />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-4 py-3 bg-blue-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Email Address
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-10 pr-4 py-3 bg-blue-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-3 bg-blue-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Forgot Password Link */}
            {activeTab === 'login' && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStep(1);
                    setForgotEmail(email);
                    setForgotError('');
                    setForgotSuccess('');
                    setSimulatedOtpNotice('');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Google Direct Sign-In / Register Button */}
        <button
          type="button"
          onClick={() => {
            if (email && email.includes('@')) {
              handleGoogleAuth(email, name);
            } else {
              setShowGooglePrompt(true);
            }
          }}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-xl shadow-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all text-sm cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer switch prompt */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            {activeTab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Modal: Forgot Password Gmail OTP */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative border border-blue-100 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg"
            >
              <FaTimes />
            </button>

            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner mb-2">
                <FaKey />
              </div>
              <h3 className="text-2xl font-extrabold text-blue-950">Reset Password</h3>
              <p className="text-xs text-gray-500">
                {forgotStep === 1
                  ? 'Enter your registered Gmail address to receive a 6-digit OTP code'
                  : 'Enter the 6-digit OTP code sent to your email and set your new password'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <FaExclamationTriangle className="shrink-0 text-red-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <FaCheckCircle className="shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {simulatedOtpNotice && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-950 text-xs rounded-xl space-y-1">
                <p className="font-extrabold flex items-center justify-between">
                  <span>🔑 OTP Security Code:</span>
                  <span className="text-lg font-black text-blue-600 tracking-widest">{simulatedOtpNotice}</span>
                </p>
                <p className="text-[10px] text-gray-500">
                  (Note: Set EMAIL_USER & EMAIL_PASS in backend .env to send real Gmail emails)
                </p>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Gmail Address *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending OTP...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">6-Digit OTP Code *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-center text-lg font-black tracking-widest text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-blue-50/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    ← Back / Resend OTP
                  </button>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Google Quick Auth Dialog */}
      {showGooglePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 relative border border-gray-200 text-center animate-fade-in">
            <button
              type="button"
              onClick={() => setShowGooglePrompt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>

            <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>

            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Sign in with Google</h3>
              <p className="text-xs text-gray-500 mt-1">Enter your Google account details to proceed instantly</p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Google Email</label>
                <input
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Account Name (Optional)</label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (googleEmailInput && googleEmailInput.includes('@')) {
                    handleGoogleAuth(googleEmailInput, googleName);
                  } else {
                    alert('Please enter a valid Google email address.');
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Authorize & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
