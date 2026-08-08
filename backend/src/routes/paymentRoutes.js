import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify-signature', verifyRazorpayPayment);

export default router;
