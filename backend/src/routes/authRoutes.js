import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPasswordOtp,
  resetPasswordWithOtp,
  googleAuthLogin,
  getMe,
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
} from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPasswordOtp);
router.post('/reset-password', resetPasswordWithOtp);
router.post('/google', googleAuthLogin);

// Protected routes
router.get('/me', protect, getMe);

// Admin-only routes
router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.post('/users', protect, authorizeRoles('admin'), createUserByAdmin);
router.put('/users/:id/role', protect, authorizeRoles('admin'), updateUserRole);

export default router;
