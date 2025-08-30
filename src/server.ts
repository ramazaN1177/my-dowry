import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import connectDB from './db/connectDB';
import authRoutes from './routes/auth.route';
import dowryRoutes from './routes/dowry.routes';
import imageRoutes from './routes/image.routes';

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyDowry API',
      description: 'MyDowry backend API for mobile application',
      version: '1.0.0',
      contact: {
        name: 'MyDowry Team'
      }
    },
    servers: [
      {
        url: 'https://api.mydowry.com/v1',
        description: 'Production server'
      },
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controller/*.ts'] // JSDoc yorumlarını içeren dosyalar
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// OpenAPI JSON endpoint
app.get('/v1/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dowry', dowryRoutes);
app.use('/api/image', imageRoutes);

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MyDowry Backend API is running!' });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await connectDB();
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger UI available at: http://localhost:${PORT}/api-docs`);
    console.log(`OpenAPI specification available at: http://localhost:${PORT}/v1/openapi.json`);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
});
