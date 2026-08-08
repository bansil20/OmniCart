import express from 'express';
import {
  getSellerProducts,
  getSellerCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes for customer storefront
router.get('/', getAllProducts);

// Seller-isolated protected routes (MUST be defined before wildcard /:id)
router.get('/seller', protect, authorizeRoles('seller', 'admin'), getSellerProducts);
router.get('/seller/categories', protect, authorizeRoles('seller', 'admin'), getSellerCategories);

// Specific product by ID (wildcard route)
router.get('/:id', getProductById);

router.post('/', protect, authorizeRoles('seller', 'admin'), createProduct);
router.put('/:id', protect, authorizeRoles('seller', 'admin'), updateProduct);
router.delete('/:id', protect, authorizeRoles('seller', 'admin'), deleteProduct);

export default router;
