import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './db/connectDB';
import authRoutes from './routes/auth.route';
import { setupSwagger } from './config/swagger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Middleware
// CORS configuration for mobile apps
app.use(cors({
  origin: true, // Mobil uygulamalar için tüm origin'lere izin ver
  credentials: true, // Cookie ve authorization header'ları için
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Preflight requests için
app.options('*', cors());

app.use(express.json({ limit: '10mb' })); // JSON size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'LingoVault Backend API is running!' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log(`🚀 Server is running on port: ${PORT}`);
    console.log(`📱 Mobile access: http://YOUR_IP_ADDRESS:${PORT}`);
    console.log(`🌐 Local access: http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
});
