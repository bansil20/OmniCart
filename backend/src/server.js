import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import User from './models/User.js';
import Category from './models/Category.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB, seed/update Admin password to '123456', and sync Category indexes
connectDB().then(async () => {
  try {
    let adminUser = await User.findOne({ email: 'admin@omnicart.com' });
    if (adminUser) {
      adminUser.password = '123456';
      adminUser.role = 'admin';
      await adminUser.save();
    } else {
      await User.create({
        name: 'System Admin',
        email: 'admin@omnicart.com',
        password: '123456',
        role: 'admin',
      });
      console.log('✅ Default Admin account ready.');
    }

    // Drop legacy indexes on Category collection to allow multiple sellers to create their own categories
    try {
      await Category.collection.dropIndexes();
    } catch (e) {
      // Ignore if index doesn't exist
    }
    await Category.syncIndexes();

    // Remove legacy unassigned global categories so categories are 100% seller-created
    await Category.deleteMany({ seller: { $exists: false } });
  } catch (err) {
    console.error('Error during database initialization:', err.message);
  }
});

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      (process.env.CLIENT_URL && origin.includes(process.env.CLIENT_URL))
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'OmniCart API is live & operational!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OmniCart API Server is running smoothly!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// 404 Route Not Found Handler
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Comprehensive Global Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId Cast Error (e.g. /api/products/invalid-id)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found / Invalid ID format';
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field} already exists. Duplicate values are not allowed.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle JWT Verification Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  // Handle JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  console.error(`[Backend Error ${statusCode}]: ${message}`);

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 OmniCart Backend Server running on port ${PORT}`);
});
