import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';
import { promises as fs } from 'fs';
import path from 'path';

interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
}

export const userService = {
  // Obtener perfil del usuario
  async getProfile(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
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
          createdAt: true,
          area: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              documents: true,
              categories: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error en getProfile:', error);
      throw new ApiError('Error al obtener perfil de usuario', 500);
    }
  },

  // Obtener estadísticas del usuario
  async getStats(userId: string) {
    try {
      const stats = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              documents: true,
              categories: true
            }
          }
        }
      });

      return {
        totalDocuments: stats?._count.documents || 0,
        totalCategories: stats?._count.categories || 0,
        recentDocuments: await prisma.document.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
            }
          }
        })
      };
    } catch (error) {
      logger.error('Error en getStats:', error);
      throw new ApiError('Error al obtener estadísticas', 500);
    }
  },

  // Actualizar perfil del usuario
  async updateProfile(userId: string, data: UpdateUserDto) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
          updatedAt: true
        }
      });
    } catch (error) {
      logger.error('Error en updateProfile:', error);
      throw new ApiError('Error al actualizar perfil', 500);
    }
  },

  // Subir imagen de perfil
  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      const filename = `profile_${userId}_${timestamp}.${extension}`;
      
      // Ruta donde guardar el archivo - usar la misma ruta que el middleware de archivos estáticos
      // En desarrollo: __dirname = /Users/.../server/services
      // En producción: __dirname = /opt/render/project/src/server/dist
      const uploadDir = path.resolve(__dirname, '..', 'uploads', 'profiles');
      const filePath = path.join(uploadDir, filename);
      
      // Debug logging
      logger.info(`📁 Upload debug: __dirname=${__dirname}`);
      logger.info(`📁 Upload debug: uploadDir=${uploadDir}`);
      logger.info(`📁 Upload debug: filePath=${filePath}`);
      
      // Asegurar que el directorio existe
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Guardar el archivo
      await fs.writeFile(filePath, file.buffer);
      
      // URL relativa para acceder al archivo
      const imageUrl = `/uploads/profiles/${filename}`;
      
      // Actualizar la URL de la imagen en la base de datos
      await prisma.user.update({
        where: { id: userId },
        data: { imageUrl }
      });
      
      logger.info(`Imagen de perfil subida para usuario ${userId}: ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      logger.error('Error en uploadProfileImage:', error);
      throw new ApiError('Error al subir imagen de perfil', 500);
    }
  },

  // Obtener información del área por ID
  async getAreaById(areaId: string) {
    try {
      return await prisma.area.findUnique({
        where: { id: areaId },
        select: {
          id: true,
          name: true,
          description: true
        }
      });
    } catch (error) {
      logger.error('Error en getAreaById:', error);
      throw new ApiError('Error al obtener información del área', 500);
    }
  },

  // Obtener documentos por usuario (propios y compartidos) - solo no eliminados
  async getDocumentsByUser(userId: string) {
    try {
      // Documentos propios no eliminados
      const ownDocuments = await prisma.document.findMany({
        where: { 
          userId,
          isDeleted: false // Solo documentos no eliminados
        },
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Documentos compartidos con el usuario (también no eliminados)
      const sharedDocs = await prisma.documentShare.findMany({
        where: { sharedWith: userId },
        include: {
          document: {
            include: {
              category: { select: { id: true, name: true } },
              user: { select: { id: true, email: true, firstName: true, lastName: true } }
            }
          }
        }
      });

      // Filtrar documentos compartidos válidos (por si alguno fue eliminado)
      const validSharedDocs = sharedDocs.filter(share => share.document && !share.document.isDeleted);

      // Mapear documentos compartidos para tener formato similar
      const sharedDocuments = validSharedDocs.map(share => ({
        ...share.document,
        sharedPermission: share.permission,
        owner: share.document.user
      }));

      // Unir y retornar
      return [...ownDocuments, ...sharedDocuments];
    } catch (error) {
      logger.error('Error en getDocumentsByUser:', error);
      throw new ApiError('Error al obtener documentos', 500);
    }
  },

  // Obtener un documento específico por ID (propio o compartido)
  async getDocumentById(userId: string, documentId: string) {
    try {
      // Buscar documento propio
      const ownDoc = await prisma.document.findFirst({
        where: { id: documentId, userId }
      });
      if (ownDoc) return ownDoc;

      // Buscar documento compartido directamente
      const shared = await prisma.documentShare.findUnique({
        where: { documentId_sharedWith: { documentId, sharedWith: userId } },
        include: { document: true }
      });
      if (shared) return shared.document;

      // Buscar documento compartido por área
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { areaId: true }
      });

      if (user?.areaId) {
        const areaShare = await prisma.areaDocumentShare.findFirst({
          where: {
            documentId,
            OR: [
              { areaId: user.areaId },
              { areaId: null } // Compartido con todas las áreas
            ]
          }
        });
        
        if (areaShare) {
          const doc = await prisma.document.findUnique({
            where: { id: documentId }
          });
          return doc;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error en getDocumentById:', error);
      throw new ApiError('Error al obtener el documento', 500);
    }
  },

  // Crear documento para usuario
  async createDocumentForUser(userId: string, docData: any) {
    try {
      // Verificar permisos del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userPermissions: true }
      });

      if (!user) throw new ApiError('Usuario no encontrado', 404);

      // Solo superuser, admin o usuarios con permiso pueden crear documentos
      if (!['superuser', 'admin'].includes(user.role)) {
        const hasCreatePermission = user.userPermissions.some(p => p.permission === 'create_documents');
        if (!hasCreatePermission) {
          throw new ApiError('No tienes permisos para crear documentos', 403);
        }
      }

      // Validar que la categoría pertenece al usuario si se especifica
      if (docData.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: docData.categoryId,
            userId
          }
        });
        if (!category) {
          throw new ApiError('Categoría no encontrada o no pertenece al usuario', 404);
        }
      }

      // Crear el documento (sin crear versión automáticamente)
      const document = await prisma.document.create({
        data: {
          title: docData.title || 'Documento sin título',
          content: docData.content || '',
          categoryId: docData.categoryId || null,
          userId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return document;
    } catch (error) {
      logger.error('Error en createDocumentForUser:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al crear documento', 500);
    }
  },

  // Actualizar documento para usuario
async updateDocumentForUser(userId: string, documentId: string, docData: any) {
  try {
    // Verificar permisos del usuario sobre el documento
    const permission = await this.getUserDocumentPermission(userId, documentId);
    
    if (!permission) {
      throw new ApiError('Documento no encontrado', 404);
    }
    
    if (permission !== 'owner' && permission !== 'edit') {
      throw new ApiError('No tienes permisos para editar este documento', 403);
    }

    // Validar contenido solo si se proporciona
    if (docData.content !== undefined) {
      if (typeof docData.content !== 'string') {
        throw new ApiError('El contenido del documento debe ser una cadena de texto', 400);
      }
      // Permitir contenido vacío pero no null/undefined
      if (docData.content === null) {
        throw new ApiError('El contenido del documento no puede ser nulo', 400);
      }
    }

    // Validar título solo si se proporciona
    if (docData.title !== undefined) {
      if (typeof docData.title !== 'string' || docData.title.trim() === '') {
        throw new ApiError('El título del documento no puede estar vacío', 400);
      }
    }

    // Si es el owner, validar categoría si se especifica
    if (permission === 'owner' && docData.categoryId !== undefined) {
      if (docData.categoryId !== null) {
        const category = await prisma.category.findFirst({
          where: {
            id: docData.categoryId,
            userId,
            isDeleted: false // Asegurar que la categoría no esté eliminada
          }
        });
        if (!category) {
          throw new ApiError('Categoría no encontrada o no pertenece al usuario', 404);
        }
      }
    }

    // Obtener el documento actual para comparar cambios
    const currentDocument = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        content: true,
        categoryId: true,
        userId: true,
        isDeleted: true
      }
    });

    if (!currentDocument) {
      throw new ApiError('Documento no encontrado', 404);
    }

    if (currentDocument.isDeleted) {
      throw new ApiError('No se puede editar un documento eliminado', 400);
    }

    // Preparar datos para actualización
    const updateData: any = {};
    
    // Solo actualizar campos que se proporcionan
    if (docData.title !== undefined) {
      updateData.title = docData.title.trim();
    }
    
    if (docData.content !== undefined) {
      updateData.content = docData.content;
    }
    
    // Solo permitir cambiar categoryId si es el owner
    if (permission === 'owner' && docData.categoryId !== undefined) {
      updateData.categoryId = docData.categoryId;
    }

    // Verificar si hay cambios reales
    const hasChanges = Object.keys(updateData).some(key => {
      return updateData[key] !== currentDocument[key as keyof typeof currentDocument];
    });

    if (!hasChanges) {
      // No hay cambios, retornar documento actual
      return await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }

    // Obtener la versión más alta actual
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' }
    });

    // Si no hay versiones previas, esta será la versión 1
    // Si ya hay versiones, incrementar en 1
    const newVersionNumber = (lastVersion?.version || 0) + 1;

    // Actualizar el documento y crear nueva versión en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const updatedDocument = await tx.document.update({
        where: { id: documentId },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Crear nueva versión solo si hay cambios en title o content
      if (docData.title !== undefined || docData.content !== undefined) {
        const changeNote = newVersionNumber === 1 
          ? 'Versión inicial' 
          : (docData.changeNote || `Versión ${newVersionNumber}`);
        
        await tx.documentVersion.create({
          data: {
            documentId,
            version: newVersionNumber,
            title: updatedDocument.title,
            content: updatedDocument.content,
            changeNote,
            createdBy: userId
          }
        });
      }

      return updatedDocument;
    });

    logger.info(`Documento ${documentId} actualizado por usuario ${userId}`);
    return result;

  } catch (error) {
    logger.error('Error en updateDocumentForUser:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError('Error al actualizar documento', 500);
  }
},

  // Eliminar documento para usuario (borrado lógico)
  async deleteDocumentForUser(userId: string, documentId: string, deletionReason: string, deletedBy?: string) {
    try {
      const existing = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId,
          isDeleted: false // Solo documentos no eliminados
        }
      });
      if (!existing) {
        throw new ApiError('Documento no encontrado', 404);
      }

      await prisma.document.update({
        where: { id: documentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletionReason,
          deletedBy: deletedBy || userId
        }
      });

      return {
        success: true,
        message: 'Documento eliminado correctamente',
        deletedAt: new Date()
      };
    } catch (error) {
      logger.error('Error en deleteDocumentForUser:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al eliminar documento', 500);
    }
  },

  // Restaurar documento eliminado (solo para admin/superuser)
  async restoreDocument(documentId: string, restoredBy: string) {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          isDeleted: true
        }
      });
      
      if (!document) {
        throw new ApiError('Documento no encontrado o no está eliminado', 404);
      }

      return await prisma.document.update({
        where: { id: documentId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletionReason: null,
          deletedBy: null
        }
      });
    } catch (error) {
      logger.error('Error en restoreDocument:', error);
      throw new ApiError('Error al restaurar documento', 500);
    }
  },

  async updateVersionNote(versionId: string, changeNote: string) {
    try {
      const updated = await prisma.documentVersion.update({
        where: { id: versionId },
        data: { changeNote }
      });
      return updated;
    } catch (error) {
      throw new ApiError('No se pudo actualizar la nota de la versión', 500);
    }
  },


  // Obtener categorías por usuario (propias y compartidas) - solo no eliminadas
  async getCategories(userId: string) {
    // Obtener categorías propias no eliminadas
    const ownCategories = await prisma.category.findMany({
      where: { 
        userId,
        isDeleted: false // Solo categorías no eliminadas
      },
      orderBy: { name: 'asc' }
    });

    // Obtener categorías compartidas conmigo (también no eliminadas)
    const sharedCategories = await prisma.categoryShare.findMany({
      where: { sharedWith: userId },
      include: {
        category: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, id: true }
            }
          }
        }
      }
    });

    // Filtrar categorías compartidas válidas (por si alguna fue eliminada)
    const validSharedCategories = sharedCategories.filter(share => share.category && !share.category.isDeleted);

    // Convertir categorías compartidas al formato esperado
    const formattedSharedCategories = validSharedCategories.map(share => ({
      ...share.category,
      sharedPermission: share.permission,
      owner: share.category.user
    }));

    // Combinar y devolver todas las categorías
    return [...ownCategories, ...formattedSharedCategories];
  },

  // Crear categoría para usuario
  async createCategoryForUser(userId: string, catData: any) {
    try {
      // Verificar permisos del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userPermissions: true }
      });

      if (!user) throw new ApiError('Usuario no encontrado', 404);

      // Solo superuser, admin o usuarios con permiso pueden crear categorías
      if (!['superuser', 'admin'].includes(user.role)) {
        const hasCreatePermission = user.userPermissions.some(p => p.permission === 'create_documents');
        if (!hasCreatePermission) {
          throw new ApiError('No tienes permisos para crear carpetas', 403);
        }
      }

      // Validar que la categoría padre pertenece al usuario si se especifica
      if (catData.parentId) {
        const parentCategory = await prisma.category.findFirst({
          where: {
            id: catData.parentId,
            userId
          }
        });

        if (!parentCategory) {
          throw new ApiError('Categoría padre no encontrada', 404);
        }
      }

      // Verificar que no existe una categoría con el mismo nombre para el mismo usuario y padre
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: catData.name,
          userId,
          parentId: catData.parentId || null
        }
      });

      if (existingCategory) {
        throw new ApiError('Ya existe una categoría con este nombre', 409);
      }

      return await prisma.category.create({
        data: {
          name: catData.name || 'Nueva categoría',
          parentId: catData.parentId || null,
          userId,
        },
        include: {
          _count: {
            select: {
              documents: true,
              subcategories: true
            }
          },
          parent: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error en createCategoryForUser:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al crear categoría', 500);
    }
  },

  // Actualizar categoría para usuario
  async updateCategoryForUser(userId: string, categoryId: string, catData: any) {
    try {
      const existing = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId
        }
      });

      if (!existing) {
        throw new ApiError('Categoría no encontrada', 404);
      }

      // Verificar que no existe otra categoría con el mismo nombre
      if (catData.name && catData.name !== existing.name) {
        const duplicateCategory = await prisma.category.findFirst({
          where: {
            name: catData.name,
            userId,
            parentId: existing.parentId,
            id: { not: categoryId }
          }
        });

        if (duplicateCategory) {
          throw new ApiError('Ya existe una categoría con este nombre', 409);
        }
      }

      return await prisma.category.update({
        where: { id: categoryId },
        data: {
          name: catData.name,
        },
        include: {
          _count: {
            select: {
              documents: true,
              subcategories: true
            }
          },
          parent: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error en updateCategoryForUser:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al actualizar categoría', 500);
    }
  },

  // Eliminar categoría para usuario (borrado lógico)
  async deleteCategoryForUser(userId: string, categoryId: string, deletionReason: string, deletedBy?: string) {
    try {
      const existing = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId,
          isDeleted: false // Solo categorías no eliminadas
        },
        include: {
          _count: {
            select: {
              documents: true,
              subcategories: true
            }
          }
        }
      });

      if (!existing) {
        throw new ApiError('Categoría no encontrada', 404);
      }

      // Verificar si la categoría tiene documentos o subcategorías activas
      const activeDocuments = await prisma.document.count({
        where: { categoryId, isDeleted: false }
      });
      const activeSubcategories = await prisma.category.count({
        where: { parentId: categoryId, isDeleted: false }
      });

      if (activeDocuments > 0 || activeSubcategories > 0) {
        throw new ApiError('No se puede eliminar una categoría que contiene documentos o subcategorías activas', 400);
      }

      await prisma.category.update({
        where: { id: categoryId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletionReason,
          deletedBy: deletedBy || userId
        }
      });

      return {
        success: true,
        message: 'Categoría eliminada correctamente',
        deletedAt: new Date()
      };
    } catch (error) {
      logger.error('Error en deleteCategoryForUser:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al eliminar categoría', 500);
    }
  },

  // Restaurar categoría eliminada (solo para admin/superuser)
  async restoreCategory(categoryId: string, restoredBy: string) {
    try {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          isDeleted: true
        }
      });
      
      if (!category) {
        throw new ApiError('Categoría no encontrada o no está eliminada', 404);
      }

      return await prisma.category.update({
        where: { id: categoryId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletionReason: null,
          deletedBy: null
        }
      });
    } catch (error) {
      logger.error('Error en restoreCategory:', error);
      throw new ApiError('Error al restaurar categoría', 500);
    }
  },

  // Compartir documento con otro usuario
  async shareDocument(ownerId: string, documentId: string, email: string, permission: 'view' | 'edit') {
    // Buscar usuario destino
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError('Usuario destino no encontrado', 404);

    // Verificar que el documento pertenece al owner
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.userId !== ownerId) throw new ApiError('No autorizado', 403);

    // Crear o actualizar el permiso
    return await prisma.documentShare.upsert({
      where: { documentId_sharedWith: { documentId, sharedWith: user.id } },
      update: { permission },
      create: {
        documentId,
        sharedWith: user.id,
        permission,
      }
    });
  },

  // Listar usuarios con los que se compartió un documento
  async getDocumentShares(userId: string, documentId: string) {
    const permission = await this.getUserDocumentPermission(userId, documentId);
    if (!permission) {
      throw new ApiError('Documento no encontrado', 404);
    }
    // Permitir también a los que tienen permiso de edición
    if (permission !== 'owner' && permission !== 'edit') {
      throw new ApiError('No tienes permisos para ver los usuarios compartidos', 403);
    }
    return await prisma.documentShare.findMany({
      where: { documentId },
      include: { user: { select: { email: true, firstName: true, lastName: true, id: true } } }
    });
  },

  // Cambiar permiso de compartido
  async updateDocumentShare(ownerId: string, documentId: string, sharedWith: string, permission: 'view' | 'edit') {
    // Solo el dueño puede cambiar permisos
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.userId !== ownerId) throw new ApiError('No autorizado', 403);

    return await prisma.documentShare.update({
      where: { documentId_sharedWith: { documentId, sharedWith } },
      data: { permission }
    });
  },

  // Revocar acceso
  async revokeDocumentShare(ownerId: string, documentId: string, sharedWith: string) {
    // Solo el dueño puede revocar
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.userId !== ownerId) throw new ApiError('No autorizado', 403);

    return await prisma.documentShare.delete({
      where: { documentId_sharedWith: { documentId, sharedWith } }
    });
  },

  // Verificar permiso de usuario sobre un documento (actualizado con áreas)
  async getUserDocumentPermission(userId: string, documentId: string): Promise<'owner' | 'edit' | 'view' | null> {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return null;
    if (doc.userId === userId) return 'owner';

    // Verificar compartido individual
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedWith: { documentId, sharedWith: userId } }
    });
    if (share) return share.permission as 'view' | 'edit';

    // Verificar compartido por área
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { areaId: true }
    });

    if (user?.areaId) {
      const areaShare = await prisma.areaDocumentShare.findFirst({
        where: {
          documentId,
          OR: [
            { areaId: user.areaId },
            { areaId: null } // Compartido con todas las áreas
          ]
        }
      });
      if (areaShare) return areaShare.permission as 'view' | 'edit';
    }

    return null;
  },

  // Obtener todas las versiones de un documento
  async getDocumentVersions(userId: string, documentId: string) {
    try {
      // Verificar permisos sobre el documento
      const permission = await this.getUserDocumentPermission(userId, documentId);
      if (!permission) {
        throw new ApiError('Documento no encontrado', 404);
      }

      return await prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          title: true,
          changeNote: true,
          createdBy: true,
          createdAt: true
        }
      });
    } catch (error) {
      logger.error('Error en getDocumentVersions:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al obtener versiones del documento', 500);
    }
  },

  // Obtener una versión específica de un documento
  async getDocumentVersion(userId: string, documentId: string, version: number) {
    try {
      // Verificar permisos sobre el documento
      const permission = await this.getUserDocumentPermission(userId, documentId);
      if (!permission) {
        throw new ApiError('Documento no encontrado', 404);
      }

      const documentVersion = await prisma.documentVersion.findUnique({
        where: {
          documentId_version: {
            documentId,
            version
          }
        }
      });

      if (!documentVersion) {
        throw new ApiError('Versión no encontrada', 404);
      }

      return documentVersion;
    } catch (error) {
      logger.error('Error en getDocumentVersion:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al obtener versión del documento', 500);
    }
  },

  // Restaurar un documento a una versión específica
  async restoreDocumentToVersion(userId: string, documentId: string, version: number) {
    try {
      // Verificar permisos sobre el documento
      const permission = await this.getUserDocumentPermission(userId, documentId);
      if (!permission) {
        throw new ApiError('Documento no encontrado', 404);
      }
      
      if (permission !== 'owner' && permission !== 'edit') {
        throw new ApiError('No tienes permisos para restaurar este documento', 403);
      }

      // Obtener la versión específica
      const targetVersion = await prisma.documentVersion.findUnique({
        where: {
          documentId_version: {
            documentId,
            version
          }
        }
      });

      if (!targetVersion) {
        throw new ApiError('Versión no encontrada', 404);
      }

      // Obtener la versión más alta actual para crear la nueva versión
      const lastVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { version: 'desc' }
      });

      const newVersionNumber = (lastVersion?.version || 0) + 1;

      // Restaurar el documento y crear nueva versión en una transacción
      const result = await prisma.$transaction(async (tx) => {
        const updatedDocument = await tx.document.update({
          where: { id: documentId },
          data: {
            title: targetVersion.title,
            content: targetVersion.content
          },
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Crear nueva versión marcando que es una restauración
        await tx.documentVersion.create({
          data: {
            documentId,
            version: newVersionNumber,
            title: targetVersion.title,
            content: targetVersion.content,
            changeNote: `Restaurado desde versión ${version}`,
            createdBy: userId
          }
        });

        return updatedDocument;
      });

      return result;
    } catch (error) {
      logger.error('Error en restoreDocumentToVersion:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al restaurar documento', 500);
    }
  },
};