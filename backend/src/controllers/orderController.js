import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Create new order & decrement stock for purchased products
// @route   POST /api/orders
// @access  Public / User
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({ message: 'Please provide full shipping address details' });
    }

    // 1. Create order object
    const order = new Order({
      user: req.user ? req.user._id : null,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Card',
      totalPrice: Number(totalPrice || 0),
      isPaid: true,
      paidAt: Date.now(),
      status: 'Confirmed',
    });

    const createdOrder = await order.save();

    // 2. Decrement product stock for each purchased item
    for (const item of orderItems) {
      const productId = item.product || item.id || item._id;
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        const product = await Product.findById(productId);
        if (product) {
          product.stock = Math.max(0, product.stock - Number(item.qty || 1));
          
          // Update status based on stock level
          if (product.stock === 0) {
            product.status = 'Out of Stock';
          } else if (product.stock <= 5) {
            product.status = 'Low Stock';
          } else {
            product.status = 'Active';
          }
          await product.save();
        }
      }
    }

    res.status(201).json({
      order: createdOrder,
      message: 'Order placed successfully! Product stock updated.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating order' });
  }
};

// @desc    Get logged in user orders (Customer History)
// @route   GET /api/orders/my-orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order history' });
  }
};

// @desc    Get seller sales orders
// @route   GET /api/orders/seller
// @access  Private (Seller/Admin)
export const getSellerOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find all products owned by seller
    const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
    const sellerProductIds = sellerProducts.map((p) => p._id);

    // Find all orders containing any of seller's products
    const orders = await Order.find({
      'orderItems.product': { $in: sellerProductIds },
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch seller orders' });
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Public / User
export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findById(req.params.id).populate('orderItems.product').populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order details' });
  }
};
