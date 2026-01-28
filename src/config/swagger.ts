import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teacher Schedule Importer API',
      version: '1.0.0',
      description: 'API for importing teacher schedules from Google Sheets to Google Calendar',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Security is defined per endpoint, not globally
  },
  apis: [
    path.join(__dirname, '../routes.ts'),
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
