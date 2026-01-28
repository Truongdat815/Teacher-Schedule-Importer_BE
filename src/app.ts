import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { sanitize } from './middleware/sanitize';
import env from './config/env';

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
        connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      },
    },
  })
);
app.use(cors({
  origin: process.env.FRONTEND_URL, // Use specific frontend URL
  credentials: true, // Allow credentials (cookies)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

// Rate limiting (apply to all routes)
app.use('/api', apiLimiter);

// Input sanitization
app.use(sanitize);

// Serve test HTML files from root directory (for development only)
if (process.env.NODE_ENV === 'development') {
  const rootDir = path.resolve(__dirname, '..');
  app.use(express.static(rootDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    }
  }));
}

// Routes
app.use('/api', routes);

// Favicon route (prevent 404)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/', (req, res) => {
  res.send('Teacher Schedule Importer API is running...');
});

// 404 Handler (must be after all routes)
app.use(notFoundHandler);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;
