import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is not defined');
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Set connection options optimized for production
    const options = {
      maxPoolSize: isProduction ? 50 : 10, // More connections in production
      minPoolSize: isProduction ? 5 : 1, // Maintain minimum connections in production
      serverSelectionTimeoutMS: isProduction ? 30000 : 5000, // Longer timeout in production (30s)
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: isProduction ? 30000 : 10000, // Connection timeout
      heartbeatFrequencyMS: 10000, // How often to check connection health
      retryWrites: true, // Retry write operations on network errors
      retryReads: true, // Retry read operations on network errors
      // Enable buffering in production to handle temporary connection issues
      bufferCommands: isProduction ? true : false,
      bufferMaxEntries: isProduction ? 0 : 0, // 0 = unlimited buffering
    };

    // Set up connection event handlers for better monitoring and reconnection
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });

    await mongoose.connect(mongoURI, options);
    console.log('MongoDB connection established');
    
    // Log connection state
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    console.log(`MongoDB pool size: max=${options.maxPoolSize}, min=${options.minPoolSize}`);
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    // More detailed error logging for production debugging
    if (error instanceof Error) {
      if (error.message.includes('no available server')) {
        console.error('❌ MongoDB Error: No available server');
        console.error('This usually means:');
        console.error('1. MongoDB server is unreachable');
        console.error('2. Network connectivity issues');
        console.error('3. Server selection timeout is too short');
        console.error('4. MongoDB connection string is incorrect');
        console.error(`Current serverSelectionTimeoutMS: ${process.env.NODE_ENV === 'production' ? 30000 : 5000}ms`);
      }
    }
    
    throw error; // Re-throw the error so the server can handle it
  }
};

export default connectDB;
