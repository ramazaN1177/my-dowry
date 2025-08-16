import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB bağlantısı kuruldu');
  } catch (error) {
    throw error; // Re-throw the error so the server can handle it
  }
};

export default connectDB;
