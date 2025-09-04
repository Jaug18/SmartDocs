import { prisma } from '../config/database';
import { ApiError } from '../utils/errors';

export const adminService = {
  // SUPERUSER: Crear área
  async createArea(name: string, description?: string) {
    const existingArea = await prisma.area.findUnique({ where: { name } });
    if (existingArea) {
      throw new ApiError('Ya existe un área con este nombre', 409);
    }

    return await prisma.area.create({
      data: { name, description }
    });
  },

  // SUPERUSER/ADMIN: Editar área
  async updateArea(areaId: string, name: string, description?: string) {
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) throw new ApiError('Área no encontrada', 404);

    return await prisma.area.update({
      where: { id: areaId },
      data: { name, description }
    });
  },

  // SUPERUSER: Eliminar área
  async deleteArea(areaId: string) {
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) throw new ApiError('Área no encontrada', 404);

    // Primero, actualizar todos los usuarios de esa área para quitarles la asignación
    await prisma.user.updateMany({
      where: { areaId },
      data: { 
        areaId: null,
        isLeader: false, // Si se elimina el área, nadie puede ser líder de ella
      }
    });

    // Luego, eliminar el área
    await prisma.area.delete({ where: { id: areaId } });
    return true;
  },

  // SUPERUSER: Asignar usuario a área con rol
  async assignUserToArea(userId: string, areaId: string, role: string, isLeader = false) {
    // Verificar que el área existe
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      throw new ApiError('Área no encontrada', 404);
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { areaId, role, isLeader }
    });
  },

  // ADMIN: Agregar usuario normal a su área
  async addUserToArea(adminId: string, userEmail: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin' || !admin.areaId) {
      throw new ApiError('No autorizado', 403);
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      throw new ApiError('Usuario no encontrado', 404);
    }

    return await prisma.user.update({
      where: { id: user.id },
      data: { areaId: admin.areaId, role: 'normal' }
    });
  },

  // ADMIN: Dar permisos a usuario normal
  async grantPermission(adminId: string, userId: string, permission: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin') {
      throw new ApiError('No autorizado', 403);
    }

    return await prisma.userPermission.upsert({
      where: { userId_permission: { userId, permission } },
      update: {},
      create: { userId, permission, grantedBy: adminId }
    });
  },

  // ADMIN: Compartir documento con área o todas las áreas
  async shareDocumentWithArea(adminId: string, documentId: string, areaId: string | null, permission: 'view' | 'edit') {
    // Verificar que el admin es dueño del documento
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.userId !== adminId) {
      throw new ApiError('No autorizado', 403);
    }

    let sharedCount = 0;

    if (areaId === null) {
      // Compartir con todas las áreas reales
      const allAreas = await prisma.area.findMany({ 
        select: { 
          id: true,
          // Incluir usuarios para compartir directamente con ellos también
          users: {
            select: { id: true }
          }
        }
      });

      for (const area of allAreas) {
        // 1. Compartir con el área como entidad
        const existing = await prisma.areaDocumentShare.findFirst({
          where: { documentId, areaId: area.id }
        });
        
        if (existing) {
          await prisma.areaDocumentShare.update({
            where: { id: existing.id },
            data: { permission }
          });
        } else {
          await prisma.areaDocumentShare.create({
            data: { documentId, areaId: area.id, permission }
          });
        }

        // 2. NUEVO: Compartir también con cada usuario del área
        for (const user of area.users) {
          // Evitar compartir con el propio creador
          if (user.id === adminId) continue;
          
          const existingUserShare = await prisma.documentShare.findFirst({
            where: { documentId, sharedWith: user.id }
          });
          
          if (existingUserShare) {
            await prisma.documentShare.update({
              where: { id: existingUserShare.id },
              data: { permission }
            });
          } else {
            await prisma.documentShare.create({
              data: { documentId, sharedWith: user.id, permission }
            });
          }
          sharedCount++;
        }
      }
      
      return { 
        success: true, 
        documentId, 
        areaId: null, 
        permission, 
        sharedCount,
        message: `Documento compartido con todas las áreas y sus ${sharedCount} usuarios`
      };
    } else if (Array.isArray(areaId)) {
      // Compartir con varias áreas específicas
      for (const singleAreaId of areaId) {
        // 1. Compartir con el área como entidad
        const existing = await prisma.areaDocumentShare.findFirst({
          where: { documentId, areaId: singleAreaId }
        });
        
        if (existing) {
          await prisma.areaDocumentShare.update({
            where: { id: existing.id },
            data: { permission }
          });
        } else {
          await prisma.areaDocumentShare.create({
            data: { documentId, areaId: singleAreaId, permission }
          });
        }

        // 2. NUEVO: Compartir con los usuarios de esta área
        const areaUsers = await prisma.user.findMany({
          where: { areaId: singleAreaId }
        });
        
        for (const user of areaUsers) {
          if (user.id === adminId) continue; // No compartir con uno mismo
          
          const existingUserShare = await prisma.documentShare.findFirst({
            where: { documentId, sharedWith: user.id }
          });
          
          if (existingUserShare) {
            await prisma.documentShare.update({
              where: { id: existingUserShare.id },
              data: { permission }
            });
          } else {
            await prisma.documentShare.create({
              data: { documentId, sharedWith: user.id, permission }
            });
          }
          sharedCount++;
        }
      }
      
      return { 
        success: true, 
        documentId, 
        areaId, 
        permission, 
        sharedCount,
        message: `Documento compartido con las áreas seleccionadas y sus ${sharedCount} usuarios`
      };
    } else {
      // Compartir con una sola área específica
      // 1. Compartir con el área como entidad
      const existing = await prisma.areaDocumentShare.findFirst({
        where: { documentId, areaId }
      });

      if (existing) {
        await prisma.areaDocumentShare.update({
          where: { id: existing.id },
          data: { permission }
        });
      } else {
        await prisma.areaDocumentShare.create({
          data: { documentId, areaId, permission }
        });
      }

      // 2. NUEVO: Compartir con los usuarios de esta área
      const areaUsers = await prisma.user.findMany({
        where: { areaId }
      });
      
      for (const user of areaUsers) {
        if (user.id === adminId) continue; // No compartir con uno mismo
        
        const existingUserShare = await prisma.documentShare.findFirst({
          where: { documentId, sharedWith: user.id }
        });
        
        if (existingUserShare) {
          await prisma.documentShare.update({
            where: { id: existingUserShare.id },
            data: { permission }
          });
        } else {
          await prisma.documentShare.create({
            data: { documentId, sharedWith: user.id, permission }
          });
        }
        sharedCount++;
      }

      return { 
        success: true, 
        documentId, 
        areaId, 
        permission, 
        sharedCount,
        message: `Documento compartido con el área y sus ${sharedCount} usuarios` 
      };
    }
  },

  // ADMIN/SUPERUSER: Compartir documento con varios usuarios
  async shareDocumentWithUsers(adminId: string, documentId: string, emails: string[], permission: 'view' | 'edit') {
    // Verificar que el admin es dueño del documento
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.userId !== adminId) {
      throw new ApiError('No autorizado', 403);
    }

    let sharedCount = 0;
    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;
      const existing = await prisma.documentShare.findFirst({
        where: { documentId, sharedWith: user.id } // CORREGIDO: userId → sharedWith
      });
      if (existing) {
        await prisma.documentShare.update({
          where: { id: existing.id },
          data: { permission }
        });
      } else {
        await prisma.documentShare.create({
          data: { 
            documentId, 
            permission, 
            sharedWith: user.id // CORREGIDO: userId → sharedWith
          }
        });
      }
      sharedCount++;
    }
    return { success: true, documentId, sharedCount };
  },

  // ADMIN/SUPERUSER: Compartir carpeta (categoría) con áreas (masivo, recursivo)
  async shareCategoryWithArea(adminId: string, categoryId: string, areaIds: string[] | null, permission: 'view' | 'edit') {
    console.log('=== COMPARTIR CARPETA SERVICIO ===');
    console.log('Admin ID:', adminId);
    console.log('Category ID:', categoryId);
    console.log('Area IDs recibidos:', areaIds);
    console.log('Permission:', permission);

    // Verificar que el admin es dueño de la categoría
    const category = await prisma.category.findUnique({ 
      where: { id: categoryId },
      include: { user: true }
    });
    
    if (!category) throw new ApiError('Categoría no encontrada', 404);

    // Verificar que el usuario es dueño de la categoría
    if (category.userId !== adminId) {
      throw new ApiError('No tienes permisos para compartir esta categoría', 403);
    }

    // Recopilar todas las subcategorías recursivamente
    const collectCategoriesRecursively = async (catId: string): Promise<string[]> => {
      const subcats = await prisma.category.findMany({ 
        where: { parentId: catId, userId: adminId }
      });
      let catIds = [catId];
      for (const subcat of subcats) {
        const subCatIds = await collectCategoriesRecursively(subcat.id);
        catIds = catIds.concat(subCatIds);
      }
      return catIds;
    };

    // Obtener todas las categorías a compartir (la principal y subcategorías)
    const allCategoryIds = await collectCategoriesRecursively(categoryId);
    console.log('Categorías a compartir:', allCategoryIds);

    // Recopilar todos los documentos de esas categorías
    const allDocumentIds: string[] = [];
    for (const catId of allCategoryIds) {
      const docs = await prisma.document.findMany({ 
        where: { categoryId: catId, userId: adminId }
      });
      allDocumentIds.push(...docs.map(d => d.id));
    }

    if (allDocumentIds.length === 0) {
      throw new ApiError('La carpeta seleccionada no contiene documentos', 400);
    }

    // Obtener todas las áreas si areaIds es null (todas las áreas)
    let targetAreaIds: string[] = [];
    // Permitir areaId nulo
    let targetUsers: Array<{ id: string, areaId: string | null }> = [];
    let areaUserCount = 0;
    
    if (areaIds === null || (Array.isArray(areaIds) && areaIds.length === 0)) {
      const allAreas = await prisma.area.findMany({ 
        include: { 
          users: {
            where: { id: { not: adminId } },
            select: { id: true, areaId: true }
          } 
        } 
      });
      targetAreaIds = allAreas.map(a => a.id);
      // Recopilar usuarios únicos por id
      const userMap = new Map<string, { id: string, areaId: string | null }>();
      allAreas.forEach(area => {
        area.users.forEach(user => {
          if (!userMap.has(user.id)) {
            userMap.set(user.id, user);
          }
        });
      });
      targetUsers = Array.from(userMap.values());
      areaUserCount = targetUsers.length;
    } else {
      targetAreaIds = Array.isArray(areaIds) ? areaIds : [];
      const userMap = new Map<string, { id: string, areaId: string | null }>();
      for (const areaId of targetAreaIds) {
        const areaUsers = await prisma.user.findMany({
          where: { 
            areaId,
            id: { not: adminId }
          },
          select: { id: true, areaId: true }
        });
        areaUsers.forEach(user => {
          if (!userMap.has(user.id)) {
            userMap.set(user.id, user);
          }
        });
      }
      targetUsers = Array.from(userMap.values());
      areaUserCount = targetUsers.length;
    }

    if (targetAreaIds.length === 0) {
      throw new ApiError('No se seleccionó ninguna área para compartir', 400);
    }

    // NUEVO: Compartir cada categoría con los usuarios (crear categoryShare)
    for (const user of targetUsers) {
      for (const catId of allCategoryIds) {
        // Verifica si ya existe el compartido de categoría
        const existingCatShare = await prisma.categoryShare.findFirst({
          where: { categoryId: catId, sharedWith: user.id }
        });
        
        if (existingCatShare) {
          // Actualiza el permiso si ya existe
          await prisma.categoryShare.update({
            where: { id: existingCatShare.id },
            data: { permission }
          });
        } else {
          // Crea nuevo compartido de categoría
          await prisma.categoryShare.create({
            data: {
              categoryId: catId,
              sharedWith: user.id,
              permission
            }
          });
        }
      }
    }

    // Compartir cada documento con las áreas y usuarios indicadas
    let sharedCount = 0;
    for (const docId of allDocumentIds) {
      // 1. Compartir con cada área
      for (const areaId of targetAreaIds) {
        const existing = await prisma.areaDocumentShare.findFirst({
          where: { documentId: docId, areaId }
        });
        if (existing) {
          await prisma.areaDocumentShare.update({
            where: { id: existing.id },
            data: { permission }
          });
        } else {
          await prisma.areaDocumentShare.create({
            data: { documentId: docId, areaId, permission }
          });
        }
        sharedCount++;
      }
      
      // 2. Compartir con cada usuario de las áreas
      for (const user of targetUsers) {
        const existingShare = await prisma.documentShare.findFirst({
          where: { documentId: docId, sharedWith: user.id }
        });
        
        if (existingShare) {
          await prisma.documentShare.update({
            where: { id: existingShare.id },
            data: { permission }
          });
        } else {
          await prisma.documentShare.create({
            data: { documentId: docId, sharedWith: user.id, permission }
          });
        }
      }
    }

    const areasText = targetAreaIds.length === 1 
      ? "1 área" 
      : `${targetAreaIds.length} áreas`;
    
    const usersText = areaUserCount === 1
      ? "1 usuario"
      : `${areaUserCount} usuarios`;
      
    return { 
      success: true, 
      sharedCount, 
      sharedCategoriesCount: allCategoryIds.length,
      message: `Se compartieron ${allCategoryIds.length} carpetas y ${allDocumentIds.length} documentos con ${areasText} y ${usersText}`
    };
  },

  // ADMIN/SUPERUSER: Compartir carpeta (categoría) con varios usuarios (masivo, recursivo)
  async shareCategoryWithUsers(adminId: string, categoryId: string, emails: string[], permission: 'view' | 'edit') {
    // Verificar que el admin es dueño de la categoría
    const category = await prisma.category.findUnique({ 
      where: { id: categoryId },
      include: { user: true }
    });
    if (!category) throw new ApiError('Categoría no encontrada', 404);
    if (category.userId !== adminId) {
      throw new ApiError('No tienes permisos para compartir esta categoría', 403);
    }

    // Recopilar todas las categorías hijas recursivamente
    const collectCategoriesRecursively = async (catId: string): Promise<string[]> => {
      const subcats = await prisma.category.findMany({ 
        where: { parentId: catId, userId: adminId }
      });
      let catIds = [catId];
      for (const subcat of subcats) {
        const subCatIds = await collectCategoriesRecursively(subcat.id);
        catIds = catIds.concat(subCatIds);
      }
      return catIds;
    };

    const allCategoryIds = await collectCategoriesRecursively(categoryId);
    console.log('Categorías a compartir:', allCategoryIds);

    // Recopilar todos los documentos de esas categorías
    const allDocumentIds: string[] = [];
    for (const catId of allCategoryIds) {
      const docs = await prisma.document.findMany({ 
        where: { categoryId: catId, userId: adminId }
      });
      allDocumentIds.push(...docs.map(d => d.id));
    }

    if (allDocumentIds.length === 0) {
      throw new ApiError('La carpeta seleccionada no contiene documentos', 400);
    }

    let sharedCount = 0;
    let categoriesShared = 0;
    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;

      // 1. Compartir todas las categorías (estructura de carpetas)
      for (const catId of allCategoryIds) {
        const existing = await prisma.categoryShare.findFirst({
          where: { categoryId: catId, sharedWith: user.id }
        });
        if (existing) {
          await prisma.categoryShare.update({
            where: { id: existing.id },
            data: { permission }
          });
        } else {
          await prisma.categoryShare.create({
            data: { categoryId: catId, sharedWith: user.id, permission }
          });
          categoriesShared++;
        }
      }

      // 2. Compartir todos los documentos
      for (const docId of allDocumentIds) {
        const existing = await prisma.documentShare.findFirst({
          where: { documentId: docId, sharedWith: user.id }
        });
        if (existing) {
          await prisma.documentShare.update({
            where: { id: existing.id },
            data: { permission }
          });
        } else {
          await prisma.documentShare.create({
            data: { documentId: docId, sharedWith: user.id, permission }
          });
          sharedCount++;
        }
      }
    }

    return { 
      success: true, 
      categoryId, 
      sharedCount,
      sharedCategoriesCount: categoriesShared,
      message: `Se compartieron ${allCategoryIds.length} carpetas y ${allDocumentIds.length} documentos con ${emails.length} usuarios`
    };
  },

  // SUPERUSER/ADMIN: Obtener todas las áreas
  async getAreas() {
    return await prisma.area.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  // SUPERUSER: Asignar usuario por email
  async assignUserToAreaByEmail(userEmail: string, areaId: string | null, role: string, isLeader = false) {
    console.log('=== ASSIGN USER TO AREA BY EMAIL ===');
    console.log('Datos recibidos:', { userEmail, areaId, role, isLeader });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      throw new ApiError('Usuario no encontrado', 404);
    }

    console.log('Usuario encontrado:', { id: user.id, currentRole: user.role, currentAreaId: user.areaId });

    // Si areaId es null, quitar del área actual
    if (areaId === null) {
      return await prisma.user.update({
        where: { id: user.id },
        data: { 
          areaId: null, 
          role, // Mantener el rol que se está pasando, no forzar a 'normal'
          isLeader 
        }
      });
    }

    // Verificar que el área existe si se está asignando
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      throw new ApiError('Área no encontrada', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { areaId, role, isLeader }
    });
    
    console.log('Usuario actualizado:', { 
      id: updatedUser.id, 
      newRole: updatedUser.role,
      newAreaId: updatedUser.areaId
    });
    
    return updatedUser;
  },

  // SUPERUSER/ADMIN: Obtener usuarios
  async getUsers(currentUserId: string, currentUserRole: string) {
    if (currentUserRole === 'superuser') {
      // Superuser puede ver todos los usuarios
      return await prisma.user.findMany({
        include: {
          area: { select: { name: true } },
          _count: {
            select: {
              documents: true,
              categories: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (currentUserRole === 'admin') {
      // Admin puede ver todos los usuarios también
      return await prisma.user.findMany({
        include: {
          area: { select: { name: true } },
          _count: {
            select: {
              documents: true,
              categories: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      throw new ApiError('No autorizado', 403);
    }
  },

  // ADMIN: Obtener usuarios de mi área
  async getAreaUsers(adminId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { areaId: true, role: true }
    });

    if (!admin || admin.role !== 'admin' || !admin.areaId) {
      throw new ApiError('No autorizado', 403);
    }

    return await prisma.user.findMany({
      where: { areaId: admin.areaId },
      include: {
        userPermissions: true,
        _count: {
          select: {
            documents: true,
            categories: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // ADMIN: Revocar permiso
  async revokePermission(adminId: string, userId: string, permission: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin') {
      throw new ApiError('No autorizado', 403);
    }

    return await prisma.userPermission.delete({
      where: { userId_permission: { userId, permission } }
    });
  },
};
