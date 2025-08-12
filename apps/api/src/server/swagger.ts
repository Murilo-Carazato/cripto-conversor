import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cripto-Conversor API',
      version: '0.1.0',
    },
    servers: [{ url: 'http://localhost:3001' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'name', 'createdAt'],
        },
        AuthRegisterBody: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'murilo@gmail.com' },
            name: { type: 'string', example: 'Murilo' },
            password: { type: 'string', example: '123456' },
          },
          required: ['email', 'name', 'password'],
        },
        AuthLoginBody: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'murilo@gmail.com' },
            password: { type: 'string', example: '123456' },
          },
          required: ['email', 'password'],
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' },
          },
          required: ['user', 'token'],
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthRegisterBody' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '409': { description: 'Email already exists' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLoginBody' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/me': {
        get: {
          summary: 'Get authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Current user',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { user: { $ref: '#/components/schemas/User' } },
                    required: ['user'],
                  },
                },
              },
            },
            '401': { description: 'Unauthorized' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
