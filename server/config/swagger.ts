import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SmartDocs API',
    version: '1.0.0',
    description: 'API REST para la aplicación SmartDocs - Editor de documentos con IA integrada',
    contact: {
      name: 'SmartDocs Team',
      email: 'support@smartdocs.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:8002',
      description: 'Servidor de desarrollo'
    },
    {
      url: 'https://api.smartdocs.com',
      description: 'Servidor de producción'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT para autenticación'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único del usuario'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email del usuario'
          },
          firstName: {
            type: 'string',
            description: 'Nombre del usuario'
          },
          lastName: {
            type: 'string',
            description: 'Apellido del usuario'
          },
          username: {
            type: 'string',
            description: 'Nombre de usuario único'
          },
          imageUrl: {
            type: 'string',
            description: 'URL de la imagen de perfil'
          },
          emailVerified: {
            type: 'boolean',
            description: 'Si el email está verificado'
          },
          role: {
            type: 'string',
            enum: ['USER', 'ADMIN'],
            description: 'Rol del usuario'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización'
          }
        }
      },
      Document: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único del documento'
          },
          title: {
            type: 'string',
            description: 'Título del documento'
          },
          content: {
            type: 'string',
            description: 'Contenido del documento en formato HTML'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización'
          },
          userId: {
            type: 'string',
            description: 'ID del usuario propietario'
          },
          categoryId: {
            type: 'string',
            description: 'ID de la categoría'
          },
          isDeleted: {
            type: 'boolean',
            description: 'Si el documento está eliminado'
          }
        }
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único de la categoría'
          },
          name: {
            type: 'string',
            description: 'Nombre de la categoría'
          },
          description: {
            type: 'string',
            description: 'Descripción de la categoría'
          },
          color: {
            type: 'string',
            description: 'Color de la categoría'
          },
          userId: {
            type: 'string',
            description: 'ID del usuario propietario'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error'
          },
          code: {
            type: 'string',
            description: 'Código de error'
          },
          details: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Detalles adicionales del error'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email o nombre de usuario'
          },
          password: {
            type: 'string',
            description: 'Contraseña del usuario'
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'username'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email del usuario'
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Contraseña (mínimo 8 caracteres)'
          },
          firstName: {
            type: 'string',
            description: 'Nombre del usuario'
          },
          lastName: {
            type: 'string',
            description: 'Apellido del usuario'
          },
          username: {
            type: 'string',
            minLength: 3,
            description: 'Nombre de usuario único (mínimo 3 caracteres)'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Mensaje de respuesta'
          },
          user: {
            $ref: '#/components/schemas/User'
          },
          token: {
            type: 'string',
            description: 'Token JWT de acceso'
          },
          refreshToken: {
            type: 'string',
            description: 'Token de renovación'
          },
          requiresEmailVerification: {
            type: 'boolean',
            description: 'Si se requiere verificación de email'
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
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.ts',
    './controllers/*.ts',
    './app.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
