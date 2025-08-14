import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    console.log('🔍 Checking MONGO_URI...');
    console.log('MONGO_URI exists:', !!mongoURI);
    console.log('MONGO_URI length:', mongoURI?.length);
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error; // Re-throw the error so the server can handle it
  }
};

export default connectDB;
