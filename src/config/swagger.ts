import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI configuration.
 * 
 * Generates API documentation from JSDoc annotations in route files.
 * Served at /api-docs when the server is running.
 */

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: `
## Finance Data Processing and Access Control Backend

A RESTful API for managing financial records with role-based access control.

### Authentication
All protected endpoints require a JWT Bearer token in the Authorization header:
\`Authorization: Bearer <your-access-token>\`

### Roles
| Role | Permissions |
|------|------------|
| **VIEWER** | View dashboard overview and recent activity |
| **ANALYST** | Everything Viewer can do + view records, detailed analytics |
| **ADMIN** | Full access — manage users, records, and all analytics |
      `,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        CreateUser: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'], default: 'VIEWER' },
          },
        },
        UpdateUser: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
