import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cripto-Conversor API',
      version: '0.1.0',
    },
    servers: [{ url: 'http://localhost:3333' }],
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
