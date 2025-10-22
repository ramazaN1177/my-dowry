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
import categoryRoutes from './routes/category.route';
import bookRoutes from './routes/book.routes';
import { sendTestEmail } from './email/email.service';
import { getEmailConfig, sendEmailDirect } from './email/email.config';

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
app.use('/api/category', categoryRoutes);
app.use('/api/book', bookRoutes);

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

// Email configuration test endpoint
app.get('/test-email-config', (req: Request, res: Response) => {
  try {
    const config = getEmailConfig();
    res.json({
      HOST: config.HOST,
      PORT: config.PORT,
      SECURE: config.SECURE,
      USER: config.USER,
      FROM: config.FROM,
      PASS_SET: !!config.PASS,
      ALL_ENV_VARS: {
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_SECURE: process.env.EMAIL_SECURE,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT_SET',
        EMAIL_FROM: process.env.EMAIL_FROM
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Email test endpoint
app.get('/test-email', async (req: Request, res: Response) => {
  try {
    console.log('Starting email test...');
    const result = await sendTestEmail('test@example.com');
    res.json({ 
      success: result, 
      message: result ? 'Email sent successfully' : 'Email failed to send',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      stack: error.stack 
    });
  }
});

// Simple email test endpoint
app.get('/test-email-simple', async (req: Request, res: Response) => {
  try {
    console.log('Starting simple email test...');
    const result = await sendTestEmail('test@example.com');
    res.json({ 
      success: result, 
      message: result ? 'Email sent successfully' : 'Email failed to send',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Simple test email error:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      stack: error.stack 
    });
  }
});

// Direct email test endpoint (no verification)
app.get('/test-email-direct', async (req: Request, res: Response) => {
  try {
    console.log('Starting direct email test (no verification)...');
    const result = await sendEmailDirect('test@example.com', 'Direct Test Email', `
      <h1>Direct Email Test</h1>
      <p>This email was sent without verification step.</p>
      <p>Time: ${new Date().toISOString()}</p>
    `);
    res.json({ 
      success: result, 
      message: result ? 'Direct email sent successfully' : 'Direct email failed to send',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Direct test email error:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      stack: error.stack 
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
