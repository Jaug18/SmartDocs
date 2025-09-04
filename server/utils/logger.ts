import { createLogger, format, transports } from 'winston';

// Definir niveles de log y colores
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Determinar el nivel en función del entorno
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Formato para los logs
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuraciones para desarrollo y producción
const developmentTransports = [
  new transports.Console(),
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new transports.File({ filename: 'logs/all.log' }),
];

const productionTransports = [
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new transports.File({ filename: 'logs/all.log' }),
];

// Crear el logger
export const logger = createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: process.env.NODE_ENV === 'production'
    ? productionTransports
    : developmentTransports
});

// Si estamos en desarrollo, imprimir también en la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Exportar una instancia global del logger
export default logger;