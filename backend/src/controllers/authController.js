import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/emailService.js';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'omnicart_secret_key_jwt_2026_secure',
    { expiresIn: '30d' }
  );
};

// @desc    Register new customer (Public registration)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Public registration always assigns 'customer' role
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'customer',
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: 'Registration successful',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: 'Login successful',
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Generate Forgot Password OTP & Send to Email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide registered email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordOtp = otpCode;
    user.resetPasswordOtpExpires = otpExpiry;
    await user.save();

    // Send email using Nodemailer helper
    const mailResult = await sendOtpEmail(user.email, otpCode, user.name);

    res.json({
      message: mailResult.simulated
        ? `Verification OTP code generated for ${user.email}`
        : `Verification OTP code sent to your Gmail inbox (${user.email})!`,
      otp: mailResult.simulated ? otpCode : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating password reset OTP' });
  }
};

// @desc    Reset Password using 6-Digit OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please fill in email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetPasswordOtp +resetPasswordOtpExpires');

    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid or incorrect OTP code' });
    }

    if (!user.resetPasswordOtpExpires || new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Password reset successfully! Logged in.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// @desc    Google One-Tap / OAuth Direct Login & Auto-Register
// @route   POST /api/auth/google
// @access  Public
export const googleAuthLogin = async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Google Authentication failed: missing email' });
    }

    const cleanEmail = email.toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'customer',
        googleId: googleId || `google_${Date.now()}`,
        avatar: avatar || '',
      });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      message: 'Google Sign-In successful!',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Google Authentication failed' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users list' });
  }
};

// @desc    Create User with specific role (Admin only, e.g. Add Seller)
// @route   POST /api/auth/users
// @access  Private/Admin
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    if (!['admin', 'seller', 'customer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    res.status(201).json({
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      message: `Account created successfully with role '${role}'`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating user' });
  }
};

// @desc    Update User role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'seller', 'customer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: `User role updated to '${role}'`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role' });
  }
};
