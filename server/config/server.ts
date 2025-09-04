import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno según el entorno
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  clerkConfig: {
    publishableKey: string;
    secretKey: string;
    jwksUrl: string;
    issuer: string;
    audience: string;
  };
  databaseUrl: string;
}

// Configuración del servidor con valores por defecto
const serverConfig: ServerConfig = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  clerkConfig: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
    jwksUrl: process.env.CLERK_JWKS_URL || 'https://wired-bedbug-11.clerk.accounts.dev/.well-known/jwks.json',
    issuer: process.env.CLERK_ISSUER || 'https://wired-bedbug-11.clerk.accounts.dev',
    audience: process.env.CLERK_AUDIENCE || 'text-code-spark-app'
  },
  databaseUrl: process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/textcodespark'
};

export default serverConfig;
