import express from 'express';
import { createOrder, getUserOrders, getSellerOrders, getOrderById } from '../controllers/orderController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getUserOrders);
router.get('/seller', protect, getSellerOrders);
router.get('/:id', getOrderById);

export default router;
