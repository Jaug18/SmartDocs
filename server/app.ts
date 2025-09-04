import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { requireAuth } from './middleware/auth/authMiddleware';

// Rutas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
// import webhookRoutes from './routes/webhookRoutes'; // Temporalmente deshabilitado
import aiRoutes from './routes/AIGPT41Nano';

// Crear aplicación Express
const app = express();

// Configurar CORS - Configuración específica para credentials
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:8001',
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://smartdocs1.netlify.app'
  ];

  // Si el origin está en la lista, permitirlo explícitamente
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Type,Authorization');

  // Responder immediatamente a preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Middleware para webhooks (debe ir ANTES del express.json())
// app.use('/api/webhooks', express.raw({ type: 'application/json' })); // Temporalmente deshabilitado

// Configurar express.json() para el resto de rutas con límite aumentado
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar middlewares globales con excepciones para Swagger
app.use(helmet({
  contentSecurityPolicy: false, // Desactivamos CSP global para evitar conflictos con Swagger
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware específico para uploads con CORS más permisivo
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Servir archivos estáticos para las imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Configurar headers CORS para archivos estáticos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Configurar cache para imágenes
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 año
    }
  }
}));

// Ruta raíz - Añadida para evitar el error 404
app.get('/', (req, res) => {
  res.json({
    app: 'SmartDocs API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      api: '/api',
      health: '/health',
      docs: '/api/users/documents',
      categories: '/api/users/categories',
      users: '/api/users',
      swagger: '/api-docs'
    }
  });
});

// Documentación Swagger con configuración local
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', (req, res) => {
  res.send(
    swaggerUi.generateHTML(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .download-url-wrapper { display: none }
      `,
      customSiteTitle: 'SmartDocs API Documentation',
      swaggerOptions: {
        url: '/swagger.json',
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true
      }
    })
  );
});

// Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
// app.use('/api/webhooks', webhookRoutes); // Temporalmente deshabilitado
app.use('/api/AIGPT41Nano', aiRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message 
  });
});

export default app;
