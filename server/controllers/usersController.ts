import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';
import multer from 'multer';

export const usersController = {
  // Obtener el perfil del usuario actual
  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await userService.getProfile(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      return res.json(user);
    } catch (error) {
      logger.error('Error en getUserProfile:', error);
      return ApiError.handleError(error, res);
    }
  },
  

  // Obtener estadísticas del usuario
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const stats = await userService.getStats(userId);
      return res.json(stats);
    } catch (error) {
      logger.error('Error en getUserStats:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Actualizar el perfil del usuario
  async updateUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userData = req.body;
      
      const updatedUser = await userService.updateProfile(userId, userData);
      return res.json(updatedUser);
    } catch (error) {
      logger.error('Error en updateUserProfile:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Subir imagen de perfil
  async uploadProfileImage(req: Request & { file?: Express.Multer.File }, res: Response) {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
      }

      const imageUrl = await userService.uploadProfileImage(userId, req.file);
      return res.json({ imageUrl });
    } catch (error) {
      logger.error('Error en uploadProfileImage:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Obtener información del área por ID (endpoint público)
  async getAreaById(req: Request, res: Response) {
    try {
      const areaId = req.params.id;
      const area = await userService.getAreaById(areaId);
      
      if (!area) {
        return res.status(404).json({ error: 'Área no encontrada' });
      }
      
      return res.json(area);
    } catch (error) {
      logger.error('Error en getAreaById:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Obtener documentos del usuario autenticado
  async getUserDocuments(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documents = await userService.getDocumentsByUser(userId);
      return res.json(documents);
    } catch (error) {
      logger.error('Error en getUserDocuments:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Crear documento para el usuario autenticado
  async createUserDocument(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const docData = req.body;
      const document = await userService.createDocumentForUser(userId, docData);
      return res.status(201).json(document);
    } catch (error) {
      logger.error('Error en createUserDocument:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Actualizar documento del usuario autenticado
  async updateUserDocument(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const docData = req.body;

      // La validación de permisos ahora se hace dentro del servicio
      const updatedDocument = await userService.updateDocumentForUser(userId, documentId, docData);
      
      return res.json(updatedDocument);
    } catch (error) {
      logger.error('Error en updateUserDocument:', error);
      return ApiError.handleError(error, res);
    }
  },
  

  // Eliminar documento del usuario autenticado (borrado lógico)
  async deleteUserDocument(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const { deletionReason } = req.body;
      
      if (!deletionReason || deletionReason.trim() === '') {
        return res.status(400).json({ error: 'El motivo de eliminación es requerido' });
      }

      const result = await userService.deleteDocumentForUser(userId, documentId, deletionReason, userId);
      return res.json(result);
    } catch (error) {
      logger.error('Error en deleteUserDocument:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Añadir un nuevo método para obtener un documento específico con contenido completo
  async getUserDocument(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;

      // Validar permiso
      const permission = await userService.getUserDocumentPermission(userId, documentId);
      if (!permission) return res.status(403).json({ error: 'No autorizado' });

      const document = await userService.getDocumentById(userId, documentId);
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }
      return res.json({ ...document, permission });
    } catch (error) {
      logger.error('Error en getUserDocument:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Obtener categorías del usuario
  async getCategories(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const categories = await userService.getCategories(userId);
      return res.json(categories);
    } catch (error) {
      logger.error('Error en getCategories:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Crear categoría para el usuario autenticado
  async createUserCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const catData = req.body;
      const category = await userService.createCategoryForUser(userId, catData);
      return res.status(201).json(category);
    } catch (error) {
      logger.error('Error en createUserCategory:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Actualizar categoría del usuario autenticado
  async updateUserCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const categoryId = req.params.id;
      const catData = req.body;
      const updatedCategory = await userService.updateCategoryForUser(userId, categoryId, catData);
      if (!updatedCategory) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      return res.json(updatedCategory);
    } catch (error) {
      logger.error('Error en updateUserCategory:', error);
      return ApiError.handleError(error, res);
    }
  },  // Eliminar categoría del usuario autenticado (borrado lógico)
  async deleteUserCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const categoryId = req.params.id;
      const { deletionReason } = req.body;
      
      if (!deletionReason || deletionReason.trim() === '') {
        return res.status(400).json({ error: 'El motivo de eliminación es requerido' });
      }

      const result = await userService.deleteCategoryForUser(userId, categoryId, deletionReason, userId);
      return res.json(result);
    } catch (error) {
      logger.error('Error en deleteUserCategory:', error);
      return ApiError.handleError(error, res);
    }
  },

// Compartir documento
async shareDocument(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const { email, permission } = req.body;
      const share = await userService.shareDocument(userId, documentId, email, permission);
      return res.status(200).json(share);
    } catch (error) {
      logger.error('Error en shareDocument:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Listar compartidos
  async getDocumentShares(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const shares = await userService.getDocumentShares(userId, documentId);
      return res.json(shares);
    } catch (error) {
      logger.error('Error en getDocumentShares:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Actualizar permiso de compartido
  async updateDocumentShare(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const { sharedWith, permission } = req.body;
      const updated = await userService.updateDocumentShare(userId, documentId, sharedWith, permission);
      return res.json(updated);
    } catch (error) {
      logger.error('Error en updateDocumentShare:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Revocar acceso
  async revokeDocumentShare(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const sharedWith = req.params.userId;
      await userService.revokeDocumentShare(userId, documentId, sharedWith);
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error en revokeDocumentShare:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Restaurar documento eliminado (solo admin/superuser)
  async restoreDocument(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const userRole = req.user!.role || 'normal';
      
      if (!['admin', 'superuser'].includes(userRole)) {
        return res.status(403).json({ error: 'No tienes permisos para restaurar documentos' });
      }

      const result = await userService.restoreDocument(documentId, userId);
      return res.json(result);
    } catch (error) {
      logger.error('Error en restoreDocument:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Restaurar categoría eliminada (solo admin/superuser)
  async restoreCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const categoryId = req.params.id;
      const userRole = req.user!.role || 'normal';
      
      if (!['admin', 'superuser'].includes(userRole)) {
        return res.status(403).json({ error: 'No tienes permisos para restaurar categorías' });
      }

      const result = await userService.restoreCategory(categoryId, userId);
      return res.json(result);
    } catch (error) {
      logger.error('Error en restoreCategory:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Obtener todas las versiones de un documento
  async getDocumentVersions(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      
      const versions = await userService.getDocumentVersions(userId, documentId);
      return res.json(versions);
    } catch (error) {
      logger.error('Error en getDocumentVersions:', error);
      return ApiError.handleError(error, res);
    }
  },

  // Obtener una versión específica de un documento
  async getDocumentVersion(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const version = parseInt(req.params.version);
      
      if (isNaN(version)) {
        return res.status(400).json({ error: 'Número de versión inválido' });
      }
      
      const documentVersion = await userService.getDocumentVersion(userId, documentId, version);
      return res.json(documentVersion);
    } catch (error) {
      logger.error('Error en getDocumentVersion:', error);
      return ApiError.handleError(error, res);
    }
  },

  async updateVersionNote(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const versionId = req.params.versionId;
    const { changeNote } = req.body;

    if (!changeNote || changeNote.trim() === "") {
      return res.status(400).json({ error: "La descripción de la versión es requerida" });
    }

    const updatedVersion = await userService.updateVersionNote(versionId, changeNote);
    return res.json(updatedVersion);
  } catch (error) {
    logger.error("Error en updateVersionNote:", error);
    return ApiError.handleError(error, res);
  }
},

  // Restaurar un documento a una versión específica
  async restoreDocumentToVersion(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const documentId = req.params.id;
      const version = parseInt(req.params.version);
      
      if (isNaN(version)) {
        return res.status(400).json({ error: 'Número de versión inválido' });
      }
      
      const restoredDocument = await userService.restoreDocumentToVersion(userId, documentId, version);
      return res.json(restoredDocument);
    } catch (error) {
      logger.error('Error en restoreDocumentToVersion:', error);
      return ApiError.handleError(error, res);
    }
  },
};
