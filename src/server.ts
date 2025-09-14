import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
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
// CORS configuration for mobile apps and Swagger UI
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://mydowry-backend.onrender.com',  // Render backend URL
      'https://your-frontend-domain.com',      // Frontend domain'inizi buraya yazın
      // Mobil uygulamalar için tüm origin'lere izin ver
      true
    ]
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Content-Length',
    'Cache-Control'
  ],
  exposedHeaders: [
    'Content-Disposition',
    'Content-Type',
    'Content-Length'
  ]
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
      version: '1.0.0'
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://my-dowry.onrender.com'  // Render URL'nizi buraya yazın
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Unauthorized'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controller/*.ts'] // JSDoc yorumlarını içeren dosyalar
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI - sadece JSON linki için
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: `/api-docs.json`,
        name: 'MyDowry API v1.0.0'
      }
    ],
    validatorUrl: null, // Swagger validator'ı devre dışı bırak
    docExpansion: 'list', // Dokümantasyon genişletme seviyesi
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
}));

// JSON Schema endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.send(swaggerSpec);
});

// Additional CORS middleware for file uploads
app.use('/api/image/upload', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dowry', dowryRoutes);
app.use('/api/image', imageRoutes);

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MyDowry Backend API is running!' });
});

// Health check route with upload system status
app.get('/health', (req: Request, res: Response) => {
  const { isStorageReady } = require('./middleware/upload');
  res.json({ 
    message: 'MyDowry Backend API is running!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uploadSystem: 'simple-storage (GridFS disabled)',
    status: 'ready'
  });
});

// Manual storage initialization endpoint (for debugging)
app.post('/api/debug/init-storage', (req: Request, res: Response) => {
  try {
    const { isStorageReady } = require('./middleware/upload');
    if (isStorageReady()) {
      res.json({ 
        success: true,
        message: 'Storage already initialized'
      });
    } else {
      // Force re-initialization
      const uploadModule = require('./middleware/upload');
      if (uploadModule.initializeStorage) {
        uploadModule.initializeStorage();
        res.json({ 
          success: true,
          message: 'Storage initialization triggered'
        });
      } else {
        res.status(500).json({ 
          success: false,
          message: 'Storage initialization function not available'
        });
      }
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to initialize storage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
