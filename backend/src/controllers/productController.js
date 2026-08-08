import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get products belonging strictly to the logged-in seller
// @route   GET /api/products/seller
// @access  Private (Seller/Admin)
export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch seller products' });
  }
};

// @desc    Get categories used by the seller's products
// @route   GET /api/products/seller/categories
// @access  Private (Seller/Admin)
export const getSellerCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { seller: req.user._id });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch seller categories' });
  }
};

// @desc    Create a product for the logged-in seller
// @route   POST /api/products
// @access  Private (Seller/Admin)
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, discountPrice, stock, imageUrl, description } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Please fill in product name, category, price, and stock' });
    }

    const product = new Product({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      stock: Number(stock),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      description: description || '',
      seller: req.user._id,
    });

    const savedProduct = await product.save();
    res.status(201).json({ product: savedProduct, message: 'Product added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating product' });
  }
};

// @desc    Update a seller product
// @route   PUT /api/products/:id
// @access  Private (Seller/Admin)
export const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure logged-in user is the product seller or an admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }

    const { name, category, price, discountPrice, stock, imageUrl, description } = req.body;

    if (name) {
      product.name = name;
      product.slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
    if (stock !== undefined) product.stock = Number(stock);
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (description !== undefined) product.description = description;

    const updatedProduct = await product.save();
    res.json({ product: updatedProduct, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating product' });
  }
};

// @desc    Delete a seller product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Admin)
export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure logged-in user is the product seller or an admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

// @desc    Get all public products (or strictly locked to seller if logged in as seller)
// @route   GET /api/products
// @access  Public / Seller Restricted
export const getAllProducts = async (req, res) => {
  try {
    const { category, search, seller } = req.query;
    let query = {};
    let targetSellerId = null;

    // Auto-detect logged in seller from Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'omnicart_secret_key_jwt_2026_secure');
        const authUser = await User.findById(decoded.id).select('role');
        if (authUser && authUser.role === 'seller') {
          targetSellerId = authUser._id;
        }
      } catch (e) {
        // Token invalid or public request
      }
    }

    if (!targetSellerId && seller && mongoose.Types.ObjectId.isValid(seller)) {
      targetSellerId = new mongoose.Types.ObjectId(seller);
    }

    if (targetSellerId) {
      query.seller = targetSellerId;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');

      const searchConditions = [
        { name: regex },
        { category: regex },
        { description: regex }
      ];

      // If seller is NOT restricted, also allow searching seller names
      if (!targetSellerId) {
        const matchingSellers = await User.find({
          $or: [{ name: regex }, { email: regex }]
        }).select('_id');
        const sellerIds = matchingSellers.map((s) => s._id);
        searchConditions.push({ seller: { $in: sellerIds } });
      }

      if (targetSellerId) {
        query.$and = [
          { seller: targetSellerId },
          { $or: searchConditions }
        ];
        delete query.seller;
      } else {
        query.$or = searchConditions;
      }
    }

    const products = await Product.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product details' });
  }
};
