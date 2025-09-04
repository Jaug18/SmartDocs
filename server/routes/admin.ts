import { Router } from 'express';
import { requireRole } from '../middleware/auth/roleMiddleware';
import { adminController } from '../controllers/adminController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Area:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del área
 *         name:
 *           type: string
 *           description: Nombre del área
 *         description:
 *           type: string
 *           description: Descripción del área
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *     UserRole:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID del usuario
 *         role:
 *           type: string
 *           enum: [user, admin, superuser]
 *           description: Rol a asignar
 *         areaId:
 *           type: string
 *           description: ID del área (opcional)
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/admin/areas:
 *   post:
 *     summary: Crear nueva área
 *     description: Crea una nueva área. Solo disponible para superusuarios.
 *     tags: [Admin - Áreas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del área
 *               description:
 *                 type: string
 *                 description: Descripción del área
 *     responses:
 *       201:
 *         description: Área creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Area'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 */
// Solo superusers pueden crear áreas y asignar roles
router.post('/areas', requireRole(['superuser']), adminController.createArea);

/**
 * @swagger
 * /api/admin/areas:
 *   get:
 *     summary: Obtener todas las áreas
 *     description: Lista todas las áreas disponibles. Disponible para superusuarios y administradores.
 *     tags: [Admin - Áreas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de áreas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Area'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.get('/areas', requireRole(['superuser', 'admin']), adminController.getAreas);

/**
 * @swagger
 * /api/admin/assign-role:
 *   post:
 *     summary: Asignar rol a usuario
 *     description: Asigna un rol específico a un usuario. Disponible para superusuarios y administradores.
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRole'
 *     responses:
 *       200:
 *         description: Rol asignado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/assign-role', requireRole(['superuser', 'admin']), adminController.assignUserRole);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Lista todos los usuarios del sistema. Disponible para superusuarios y administradores.
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID del usuario
 *                   username:
 *                     type: string
 *                     description: Nombre de usuario
 *                   email:
 *                     type: string
 *                     description: Email del usuario
 *                   firstName:
 *                     type: string
 *                     description: Nombre
 *                   lastName:
 *                     type: string
 *                     description: Apellido
 *                   role:
 *                     type: string
 *                     description: Rol del usuario
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha de creación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.get('/users', requireRole(['superuser', 'admin']), adminController.getUsers);

/**
 * @swagger
 * /api/admin/areas/{id}:
 *   put:
 *     summary: Actualizar área
 *     description: Actualiza los datos de un área. Disponible para superusuarios y administradores.
 *     tags: [Admin - Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del área a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nuevo nombre del área
 *               description:
 *                 type: string
 *                 description: Nueva descripción del área
 *     responses:
 *       200:
 *         description: Área actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Area'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Área no encontrada
 *   delete:
 *     summary: Eliminar área
 *     description: Elimina un área del sistema. Solo disponible para superusuarios.
 *     tags: [Admin - Áreas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del área a eliminar
 *     responses:
 *       200:
 *         description: Área eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Área no encontrada
 */
// Editar/eliminar área (solo superuser puede eliminar, pero admin puede editar su propia área)
router.put('/areas/:id', requireRole(['superuser', 'admin']), adminController.updateArea);
router.delete('/areas/:id', requireRole(['superuser']), adminController.deleteArea);

/**
 * @swagger
 * /api/admin/add-user-to-area:
 *   post:
 *     summary: Agregar usuario a área
 *     description: Agrega un usuario a un área específica. Solo disponible para administradores.
 *     tags: [Admin - Gestión de Área]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - areaId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               areaId:
 *                 type: string
 *                 description: ID del área
 *     responses:
 *       200:
 *         description: Usuario agregado al área exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario o área no encontrado
 */
// Solo admins pueden gestionar su área
router.post('/add-user-to-area', requireRole(['admin']), adminController.addUserToArea);

/**
 * @swagger
 * /api/admin/grant-permission:
 *   post:
 *     summary: Otorgar permiso
 *     description: Otorga un permiso específico a un usuario. Solo disponible para administradores.
 *     tags: [Admin - Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permission
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               permission:
 *                 type: string
 *                 description: Tipo de permiso a otorgar
 *               resourceId:
 *                 type: string
 *                 description: ID del recurso (opcional)
 *     responses:
 *       200:
 *         description: Permiso otorgado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 */
router.post('/grant-permission', requireRole(['admin']), adminController.grantPermission);

/**
 * @swagger
 * /api/admin/revoke-permission:
 *   delete:
 *     summary: Revocar permiso
 *     description: Revoca un permiso específico de un usuario. Solo disponible para administradores.
 *     tags: [Admin - Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permission
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               permission:
 *                 type: string
 *                 description: Tipo de permiso a revocar
 *               resourceId:
 *                 type: string
 *                 description: ID del recurso (opcional)
 *     responses:
 *       200:
 *         description: Permiso revocado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 */
router.delete('/revoke-permission', requireRole(['admin']), adminController.revokePermission);

/**
 * @swagger
 * /api/admin/area-users:
 *   get:
 *     summary: Obtener usuarios del área
 *     description: Lista todos los usuarios pertenecientes al área del administrador. Solo disponible para administradores.
 *     tags: [Admin - Gestión de Área]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios del área
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID del usuario
 *                   username:
 *                     type: string
 *                     description: Nombre de usuario
 *                   email:
 *                     type: string
 *                     description: Email del usuario
 *                   firstName:
 *                     type: string
 *                     description: Nombre
 *                   lastName:
 *                     type: string
 *                     description: Apellido
 *                   role:
 *                     type: string
 *                     description: Rol del usuario
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.get('/area-users', requireRole(['admin']), adminController.getAreaUsers);

/**
 * @swagger
 * /api/admin/share-document-area:
 *   post:
 *     summary: Compartir documento con área
 *     description: Comparte un documento específico con un área. Solo disponible para administradores.
 *     tags: [Admin - Compartir Recursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *               - areaId
 *             properties:
 *               documentId:
 *                 type: string
 *                 description: ID del documento a compartir
 *               areaId:
 *                 type: string
 *                 description: ID del área con la que compartir
 *               permission:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 description: Nivel de permiso a otorgar
 *                 default: read
 *     responses:
 *       200:
 *         description: Documento compartido exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Documento o área no encontrado
 */
// Compartir documentos con áreas
router.post('/share-document-area', requireRole(['admin']), adminController.shareDocumentWithArea);

/**
 * @swagger
 * /api/admin/share-category-area:
 *   post:
 *     summary: Compartir categoría con área
 *     description: Comparte una categoría completa (carpeta) con un área de forma recursiva. Disponible para administradores y superusuarios.
 *     tags: [Admin - Compartir Recursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - areaId
 *             properties:
 *               categoryId:
 *                 type: string
 *                 description: ID de la categoría a compartir
 *               areaId:
 *                 type: string
 *                 description: ID del área con la que compartir
 *               permission:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 description: Nivel de permiso a otorgar
 *                 default: read
 *               recursive:
 *                 type: boolean
 *                 description: Si debe aplicarse recursivamente a subcategorías
 *                 default: true
 *     responses:
 *       200:
 *         description: Categoría compartida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Categoría o área no encontrado
 */
// NUEVO: Compartir carpetas (categorías) con áreas (masivo, recursivo)
router.post('/share-category-area', requireRole(['admin', 'superuser']), adminController.shareCategoryWithArea);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina un usuario del sistema permanentemente. Solo disponible para superusuarios.
 *     tags: [Admin - Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: No se puede eliminar el usuario (ej. tiene recursos asignados)
 */
// Agrega la ruta para eliminar usuario (solo superuser)
router.delete('/users/:id', requireRole(['superuser']), adminController.deleteUser);

export default router;
