import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/omnicart');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn('Note: If MongoDB is not running locally, please update MONGO_URI in backend/.env with your MongoDB Atlas or database URI.');
  }
};

export default connectDB;
