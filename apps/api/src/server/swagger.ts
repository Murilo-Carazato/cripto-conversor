import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cripto-Conversor API',
      version: '0.1.0',
    },
    servers: [{ url: '/' }],
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
        Crypto: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'bitcoin' },
            name: { type: 'string', example: 'Bitcoin' },
            symbol: { type: 'string', nullable: true, example: 'BTC' },
          },
          required: ['id', 'name'],
        },
        Favorite: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'fav_123' },
            userId: { type: 'string', example: 'user_123' },
            cryptoId: { type: 'string', example: 'bitcoin' },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'userId', 'cryptoId', 'createdAt'],
        },
        Conversion: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'conv_123' },
            userId: { type: 'string', example: 'user_123' },
            cryptoId: { type: 'string', example: 'bitcoin' },
            amount: { type: 'number', example: 1 },
            brlRate: { type: 'number', example: 250000 },
            brlResult: { type: 'number', example: 250000 },
            usdRate: { type: 'number', example: 50000 },
            usdResult: { type: 'number', example: 50000 },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'userId', 'cryptoId', 'amount', 'brlRate', 'brlResult', 'usdRate', 'usdResult', 'createdAt'],
        },
        FavoriteCreateBody: {
          type: 'object',
          properties: {
            cryptoId: { type: 'string', example: 'bitcoin' },
          },
          required: ['cryptoId'],
        },
        ErrorMessage: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Mensagem de erro' },
          },
          required: ['message'],
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } },
        },
        InternalError: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Auth'],
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
            '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login',
          tags: ['Auth'],
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
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/me': {
        get: {
          summary: 'Get authenticated user',
          tags: ['Auth'],
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
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/convert': {
        get: {
          summary: 'Convert crypto amount using CoinGecko',
          tags: ['Conversion'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string', example: 'bitcoin' } },
            { name: 'to', in: 'query', required: true, schema: { type: 'string', example: 'brl' } },
            { name: 'amount', in: 'query', required: false, schema: { type: 'number', example: 1 } }
          ],
          responses: {
            '200': {
              description: 'Conversion result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      from: { type: 'string' },
                      to: { type: 'string' },
                      amount: { type: 'number' },
                      rate: { type: 'number' },
                      result: { type: 'number' }
                    },
                    required: ['from', 'to', 'amount', 'rate', 'result'],
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '502': { description: 'CoinGecko failure' },
          },
        },
      },
      '/cryptos': {
        get: {
          summary: 'Listar criptomoedas do catálogo local',
          tags: ['Cryptos'],
          parameters: [
            { name: 'q', in: 'query', required: false, schema: { type: 'string', example: 'bit' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer', example: 100, minimum: 1, maximum: 500 } },
          ],
          responses: {
            '200': {
              description: 'Lista de criptomoedas',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Crypto' } },
                },
              },
            },
            '500': { description: 'Erro ao listar criptomoedas' },
          },
        },
      },
      '/cryptos/sync': {
        post: {
          summary: 'Sincronizar criptomoedas a partir da CoinGecko para o catálogo local',
          tags: ['Cryptos'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    limit: { type: 'integer', example: 200, minimum: 1, maximum: 1000, description: 'Quantidade a sincronizar (default 200, máx 1000)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Sincronização concluída',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Sincronização concluída' },
                      synced: { type: 'integer', example: 200 },
                      total: { type: 'integer', example: 1245 },
                    },
                    required: ['message', 'synced', 'total'],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '502': { description: 'Falha ao buscar dados na CoinGecko' },
            '500': { $ref: '#/components/responses/InternalError' },
          },
        },
      },
      '/favorites': {
        get: {
          summary: 'Listar favoritos do usuário autenticado',
          tags: ['Favorites'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Lista de favoritos',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Favorite' } },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' },
          },
        },
        post: {
          summary: 'Adicionar um favorito',
          tags: ['Favorites'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/FavoriteCreateBody' } } },
          },
          responses: {
            '201': { description: 'Favorito criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Favorite' } } } },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' },
          },
        },
      },
      '/favorites/{cryptoId}': {
        delete: {
          summary: 'Remover favorito por cryptoId',
          tags: ['Favorites'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'cryptoId', in: 'path', required: true, schema: { type: 'string', example: 'bitcoin' } },
          ],
          responses: {
            '204': { description: 'Removido' },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' },
          },
        },
      },
      '/history': {
        get: {
          summary: 'Histórico de conversões do usuário',
          tags: ['History'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'take', in: 'query', required: false, schema: { type: 'integer', example: 20, minimum: 1, maximum: 100 } },
          ],
          responses: {
            '200': { description: 'Lista de conversões', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Conversion' } } } } },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalError' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
