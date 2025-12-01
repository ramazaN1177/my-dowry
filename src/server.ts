import express, { Application, Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import connectDB from './db/connectDB';
import authRoutes from './routes/auth.route';
import dowryRoutes from './routes/dowry.routes';
import imageRoutes from './routes/image.routes';
import categoryRoutes from './routes/category.route';
import bookRoutes from './routes/book.routes';

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
// Production'da tüm origin'lere izin ver (mobil uygulamalar için)
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: true,  // Tüm origin'lere izin ver
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
    }
  : {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://127.0.0.1:3000',
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/
      ],
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
    };

app.use(cors(corsOptions));

// Preflight requests için
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // JSON size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Function to get server URL dynamically
const getServerUrl = (req?: Request): string => {
  // Check for environment variable first
  if (process.env.SERVER_URL) {
    return process.env.SERVER_URL;
  }
  
  // If request is available, use it to determine URL
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers.host || req.headers['x-forwarded-host'];
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  
  // Fallback based on NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.mydowry.ramazancavus.com.tr';
  }
  
  return `http://localhost:${PORT}`;
};

// Swagger configuration - will be generated dynamically per request
const getSwaggerOptions = (req?: Request) => ({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyDowry API',
      description: 'MyDowry backend API for mobile application',
      version: '1.0.0'
    },
    servers: [
      {
        url: getServerUrl(req),
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
  // Use compiled JS files in production/Docker/Coolify, TS files in development
  // Check if source files exist - if not, we're in a production build (Docker/Coolify)
  apis: (() => {
    const sourceRoutesPath = path.join(process.cwd(), 'src', 'routes');
    const sourceExists = fs.existsSync(sourceRoutesPath);
    
    // If source doesn't exist (production build), use compiled JS files
    if (!sourceExists) {
      return ['./dist/routes/*.js', './dist/controller/*.js'];
    }
    // Otherwise use TypeScript source files (development)
    return ['./src/routes/*.ts', './src/controller/*.ts'];
  })() // JSDoc yorumlarını içeren dosyalar
});

// Swagger UI - dinamik olarak oluşturuluyor
app.use('/api-docs', swaggerUi.serve, (req: Request, res: Response, next: any) => {
  const swaggerOptions = getSwaggerOptions(req);
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  const swaggerUiHandler = swaggerUi.setup(swaggerSpec, {
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
  });
  
  swaggerUiHandler(req, res, next);
});

// JSON Schema endpoint - dinamik olarak oluşturuluyor
app.get('/api-docs.json', (req: Request, res: Response) => {
  const swaggerOptions = getSwaggerOptions(req);
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
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
app.use('/api/category', categoryRoutes);
app.use('/api/book', bookRoutes);

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MyDowry Backend API is running!' });
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
  
  // CORS errors should not reach here, but handle them just in case
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
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

// Start server with timeout settings
const server = http.createServer(app);

// Set timeout to prevent 504 Gateway Timeout errors
server.timeout = 120000; // 2 minutes - max request processing time
server.keepAliveTimeout = 65000; // 65 seconds - keep connections alive
server.headersTimeout = 66000; // 66 seconds - should be > keepAliveTimeout

server.listen(PORT, '0.0.0.0', async () => {
  try {
    await connectDB();
    console.log(`Server running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Swagger UI available at: http://localhost:${PORT}/api-docs`);
      console.log(`OpenAPI specification available at: http://localhost:${PORT}/v1/openapi.json`);
    }
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
});
