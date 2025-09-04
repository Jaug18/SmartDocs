import app from './app';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { Server } from 'http';

// Puerto predeterminado con opciones de respaldo
const getAvailablePort = async (initialPort: number): Promise<number> => {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    // Intentar con el puerto inicial
    server.listen(initialPort, () => {
      server.close(() => {
        resolve(initialPort);
      });
    });
    
    // Si el puerto está ocupado, probar con el siguiente
    server.on('error', () => {
      logger.warn(`Puerto ${initialPort} en uso, intentando con puerto ${initialPort + 1}`);
      resolve(getAvailablePort(initialPort + 1));
    });
  });
};

// Función principal para iniciar el servidor
const startServer = async () => {
  try {
    
    const preferredPort = Number(process.env.PORT) || 8002; // Puerto del backend según vite.config.ts
    const port = await getAvailablePort(preferredPort);

    // Iniciar servidor
    const server = app.listen(port, () => {
      logger.info(`🚀 Servidor ejecutándose en http://localhost:${port}`);
      logger.info(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM recibido. Cerrando servidor...');
      await gracefulShutdown(server);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT recibido. Cerrando servidor...');
      await gracefulShutdown(server);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};
async function gracefulShutdown(server: Server) {
  try {
    await server.close();
    logger.info('Servidor HTTP cerrado.');
    logger.info('Servidor HTTP cerrado.');
    
    await prisma.$disconnect();
    logger.info('Conexión a base de datos cerrada.');
    
    process.exit(0);
  } catch (err) {
    logger.error('Error durante el cierre:', err);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
