import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, optionalProtect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getCategories);
router.post('/', protect, authorizeRoles('seller', 'admin'), createCategory);
router.put('/:id', protect, authorizeRoles('seller', 'admin'), updateCategory);
router.delete('/:id', protect, authorizeRoles('seller', 'admin'), deleteCategory);

export default router;
