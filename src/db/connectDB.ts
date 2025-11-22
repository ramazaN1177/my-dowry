import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is not defined');
    }

    // Set connection options for better reliability
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // bufferMaxEntries is deprecated, using bufferCommands instead
      bufferCommands: false, // Disable mongoose buffering
    };

    await mongoose.connect(mongoURI, options);
    console.log('MongoDB connection established');
    
    // Log connection state
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
  } catch (error) {
    console.error('Database connection error:', error);
    throw error; // Re-throw the error so the server can handle it
  }
};

export default connectDB;
