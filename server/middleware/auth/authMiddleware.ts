import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';

interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      username?: string;
      role?: string;
      areaId?: string | null;
      isLeader?: boolean;
      sessionId?: string;
    };
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autorización requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    try {
      // Verificar el token JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      
      // Verificar que la sesión existe y está activa
      const session = await prisma.authSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.userId,
          token,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              username: true,
              imageUrl: true,
              role: true,
              areaId: true,
              isLeader: true,
              isActive: true,
              emailVerified: true
            }
          }
        }
      });

      if (!session) {
        return res.status(401).json({ 
          error: 'Sesión inválida o expirada',
          code: 'INVALID_SESSION'
        });
      }

      if (!session.user.isActive) {
        return res.status(401).json({ 
          error: 'Cuenta desactivada',
          code: 'ACCOUNT_DISABLED'
        });
      }

      if (!session.user.emailVerified) {
        return res.status(401).json({ 
          error: 'Email no verificado',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      // Actualizar última actividad de la sesión
      await prisma.authSession.update({
        where: { id: session.id },
        data: { 
          lastUsedAt: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }
      });

      // Actualizar último login del usuario
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastLoginAt: new Date() }
      });

      // Adjuntar información del usuario a la request
      req.user = {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName || undefined,
        lastName: session.user.lastName || undefined,
        imageUrl: session.user.imageUrl || undefined,
        username: session.user.username || undefined,
        role: session.user.role,
        areaId: session.user.areaId,
        isLeader: session.user.isLeader,
        sessionId: session.id
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware opcional para autenticación (no bloquea si no hay token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    await requireAuth(req, res, next);
  } catch (error) {
    // Si hay error en la autenticación opcional, continuamos sin usuario
    next();
  }
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role || '')) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Middleware para verificar que el usuario sea admin o superuser
export const requireAdmin = requireRole(['admin', 'superuser']);

// Middleware para verificar que el usuario sea superuser
export const requireSuperuser = requireRole(['superuser']);
