import Category from '../models/Category.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// @desc    Get categories (Seller-specific if authenticated, or active store categories for customers)
// @route   GET /api/categories
// @access  Public / Private
export const getCategories = async (req, res) => {
  try {
    if (req.user && req.user.role === 'seller') {
      // Fetch categories strictly created by this seller or used in this seller's products
      const sellerProductCategories = await Product.distinct('category', { seller: req.user._id });
      const sellerCategories = await Category.find({
        $or: [
          { seller: req.user._id },
          { name: { $in: sellerProductCategories } }
        ],
      }).sort({ name: 1 });

      // Deduplicate categories by lowercase name to ensure no duplicate cards appear
      const uniqueMap = new Map();
      sellerCategories.forEach((cat) => {
        const key = cat.name.toLowerCase().trim();
        if (!uniqueMap.has(key) || (cat.seller && cat.seller.toString() === req.user._id.toString())) {
          uniqueMap.set(key, cat);
        }
      });

      return res.json({ categories: Array.from(uniqueMap.values()) });
    }

    // For customers or public view, fetch categories created by sellers or active in products
    const activeCategories = await Product.distinct('category');
    const categories = await Category.find({
      $or: [
        { name: { $in: activeCategories } },
        { seller: { $exists: true } }
      ]
    }).sort({ name: 1 });

    const uniqueMap = new Map();
    categories.forEach((cat) => {
      const key = cat.name.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, cat);
      }
    });

    res.json({ categories: Array.from(uniqueMap.values()) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch categories' });
  }
};

// @desc    Create category manually by the logged-in seller
// @route   POST /api/categories
// @access  Private (Seller/Admin)
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category already exists for this seller
    let category = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      seller: req.user._id,
    });

    if (category) {
      return res.status(200).json({ category, message: 'Category ready for your store' });
    }

    // Check if an unassigned category exists and claim it for seller
    const unassigned = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      seller: { $exists: false },
    });

    if (unassigned) {
      unassigned.seller = req.user._id;
      if (description) unassigned.description = description;
      await unassigned.save();
      return res.status(200).json({ category: unassigned, message: 'Category added to your store' });
    }

    // Create new category for seller
    category = await Category.create({
      name: trimmedName,
      slug: trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description || '',
      seller: req.user._id,
    });

    res.status(201).json({ category, message: 'Store category created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      try {
        const fallback = await Category.findOne({
          name: { $regex: new RegExp(`^${req.body.name.trim()}$`, 'i') },
        });
        if (fallback) {
          fallback.seller = req.user._id;
          await fallback.save();
          return res.status(200).json({ category: fallback, message: 'Category added to your store' });
        }
      } catch (e) {
        // Ignore fallback error
      }
      return res.status(400).json({ message: 'Category with this name already exists in your store' });
    }
    res.status(500).json({ message: error.message || 'Server error creating category' });
  }
};

// @desc    Update a seller category name
// @route   PUT /api/categories/:id
// @access  Private (Seller/Admin)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.seller && category.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this category' });
    }

    const oldName = category.name;
    const newName = name.trim();

    category.name = newName;
    category.slug = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await category.save();

    // Synchronize seller products category string if updated
    if (oldName !== newName) {
      await Product.updateMany(
        { seller: req.user._id, category: oldName },
        { category: newName }
      );
    }

    res.json({ category, message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update category' });
  }
};

// @desc    Delete a seller category
// @route   DELETE /api/categories/:id
// @access  Private (Seller/Admin)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.seller && category.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this category' });
    }

    // Delete any other duplicate category documents with the same name for this seller
    await Category.deleteMany({
      seller: req.user._id,
      name: { $regex: new RegExp(`^${category.name.trim()}$`, 'i') }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete category' });
  }
};
