import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/errors';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, areaId: true, isLeader: true }
      });

      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción' });
      }

      // Verificar que req.user existe antes de asignar propiedades
      if (req.user) {
        req.user.role = user.role;
        req.user.areaId = user.areaId;
        req.user.isLeader = user.isLeader;
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userPermissions: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Superuser y admin tienen todos los permisos
      if (['superuser', 'admin'].includes(user.role)) {
        return next();
      }

      // Verificar si el usuario normal tiene el permiso específico
      const hasPermission = user.userPermissions.some(p => p.permission === permission);
      if (!hasPermission) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};
