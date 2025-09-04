import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';
import { prisma } from '../config/database'; // <-- Asegúrate de importar prisma

export const adminController = {
  // SUPERUSER: Crear área
  async createArea(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const area = await adminService.createArea(name, description);
      return res.status(201).json(area);
    } catch (error) {
      logger.error('Error en createArea:', error);
      return ApiError.handleError(error, res);
    }
  },

  // SUPERUSER/ADMIN: Listar áreas
  async getAreas(req: Request, res: Response) {
    try {
      const areas = await adminService.getAreas();
      return res.json(areas);
    } catch (error) {
      logger.error('Error en getAreas:', error);
      return ApiError.handleError(error, res);
    }
  },

  // SUPERUSER/ADMIN: Asignar rol y área a usuario (admin solo puede quitar usuario de su área)
  async assignUserRole(req: Request, res: Response) {
    try {
      const { userEmail, areaId, role, isLeader } = req.body;
      const currentRole = req.user!.role;

      console.log('=== ASSIGN USER ROLE ===');
      console.log('Request body:', { userEmail, areaId, role, isLeader });
      console.log('Current user role:', currentRole);

      // Solo aplicar restricciones para admin, no para superuser
      if (currentRole === 'admin') {
        const adminAreaId = req.user!.areaId;

        // Para administradores, verificar permisos
        if (areaId === null || areaId === undefined) {
          const targetUser = await prisma.user.findUnique({
            where: { email: userEmail }
          });
          if (!targetUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
          }
          if (targetUser.areaId !== adminAreaId) {
            return res.status(403).json({ error: 'Solo puedes quitar usuarios de tu propia área' });
          }
        } else if (areaId !== adminAreaId) {
          return res.status(403).json({ error: 'Solo puedes asignar usuarios a tu propia área' });
        }

        // Restricción para admin: solo asignar como normal
        if (role !== 'normal') {
          return res.status(403).json({ error: 'Solo puedes asignar usuarios como normales' });
        }
      }

      // Si es superuser, no hay restricciones
      const user = await adminService.assignUserToAreaByEmail(userEmail, areaId, role, isLeader);
      console.log('Usuario actualizado:', {
        email: user.email,
        role: user.role,
        areaId: user.areaId
      });
      
      return res.json(user);
    } catch (error) {
      logger.error('Error en assignUserRole:', error);
      return ApiError.handleError(error, res);
    }
  },

  // SUPERUSER/ADMIN: Listar usuarios
  async getUsers(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar que el rol existe
      if (!userRole) {
        return res.status(400).json({ error: 'Rol de usuario no encontrado' });
      }

      const users = await adminService.getUsers(userId, userRole);
      return res.json(users);
    } catch (error) {
      logger.error('Error en getUsers:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN: Agregar usuario a área
  async addUserToArea(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { userEmail } = req.body;
      const user = await adminService.addUserToArea(adminId, userEmail);
      return res.json(user);
    } catch (error) {
      logger.error('Error en addUserToArea:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN: Dar permisos a usuario
  async grantPermission(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { userId, permission } = req.body;
      const result = await adminService.grantPermission(adminId, userId, permission);
      return res.json(result);
    } catch (error) {
      logger.error('Error en grantPermission:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN: Obtener usuarios de mi área
  async getAreaUsers(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const users = await adminService.getAreaUsers(adminId);
      return res.json(users);
    } catch (error) {
      logger.error('Error en getAreaUsers:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN: Revocar permiso
  async revokePermission(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { userId, permission } = req.body;
      await adminService.revokePermission(adminId, userId, permission);
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error en revokePermission:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN: Compartir documento con área
  async shareDocumentWithArea(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { documentId, areaId, permission } = req.body;
      const result = await adminService.shareDocumentWithArea(adminId, documentId, areaId, permission);
      return res.json(result);
    } catch (error) {
      logger.error('Error en shareDocumentWithArea:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN/SUPERUSER: Compartir carpeta (categoría) con áreas (masivo, recursivo)
  async shareCategoryWithArea(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { categoryId, areaIds, permission } = req.body;
      
      console.log('=== COMPARTIR CARPETA CONTROLADOR ===');
      console.log('Admin ID:', adminId);
      console.log('Category ID:', categoryId);
      console.log('Area IDs recibidos:', areaIds);
      console.log('Permission:', permission);
      console.log('Tipo de areaIds:', typeof areaIds);
      console.log('Es array:', Array.isArray(areaIds));
      
      // Validar entrada
      if (!categoryId) {
        return res.status(400).json({ error: 'categoryId es requerido' });
      }
      
      if (!permission || !['view', 'edit'].includes(permission)) {
        return res.status(400).json({ error: 'permission debe ser "view" o "edit"' });
      }
      
      // areaIds puede ser null (todas las áreas) o array de ids
      const result = await adminService.shareCategoryWithArea(adminId, categoryId, areaIds, permission);
      
      return res.json(result);
    } catch (error) {
      logger.error('Error en shareCategoryWithArea:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN/SUPERUSER: Compartir documento con varios usuarios
  async shareDocumentWithUsers(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { documentId, emails, permission } = req.body;
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: 'Debes proporcionar una lista de correos electrónicos' });
      }
      const result = await adminService.shareDocumentWithUsers(adminId, documentId, emails, permission);
      return res.json(result);
    } catch (error) {
      logger.error('Error en shareDocumentWithUsers:', error);
      return ApiError.handleError(error, res);
    }
  },

  // ADMIN/SUPERUSER: Compartir carpeta con varios usuarios
  async shareCategoryWithUsers(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const { categoryId, emails, permission } = req.body;
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: 'Debes proporcionar una lista de correos electrónicos' });
      }
      const result = await adminService.shareCategoryWithUsers(adminId, categoryId, emails, permission);
      return res.json(result);
    } catch (error) {
      logger.error('Error en shareCategoryWithUsers:', error);
      return ApiError.handleError(error, res);
    }
  },

  // SUPERUSER/ADMIN: Editar área (nombre/desc)
  async updateArea(req: Request, res: Response) {
    try {
      const areaId = req.params.id;
      const { name, description } = req.body;
      const currentRole = req.user!.role;
      const currentAreaId = req.user!.areaId;

      // Admin solo puede editar su propia área
      if (currentRole === 'admin' && currentAreaId !== areaId) {
        return res.status(403).json({ error: 'Solo puedes editar tu propia área' });
      }

      const updated = await adminService.updateArea(areaId, name, description);
      return res.json(updated);
    } catch (error) {
      logger.error('Error en updateArea:', error);
      return ApiError.handleError(error, res);
    }
  },

  // SUPERUSER: Eliminar área
  async deleteArea(req: Request, res: Response) {
    try {
      const areaId = req.params.id;
      await adminService.deleteArea(areaId);
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error en deleteArea:', error);
      return ApiError.handleError(error, res);
    }
  },

  // SUPERUSER: Eliminar usuario
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      // Opcional: evitar que el superuser se elimine a sí mismo
      if (req.user!.id === userId) {
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
      }
      await prisma.user.delete({ where: { id: userId } });
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error en deleteUser:', error);
      return ApiError.handleError(error, res);
    }
  },
};
