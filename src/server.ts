import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './db/connectDB';
import authRoutes from './routes/auth.route';
import dowryRoutes from './routes/dowry.routes';

// Load environment variables
dotenv.config();

// Set default NODE_ENV to development if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

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



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dowry', dowryRoutes);

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MyDowry Backend API is running!' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await connectDB();
  } catch (error) {
    process.exit(1);
  }
});
