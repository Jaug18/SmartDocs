import { Router } from 'express';
import { usersController } from '../controllers/usersController';
import multer from 'multer';

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Endpoints para gestión de usuarios y documentos
 */

// Configurar multer para subida de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (aumentado desde 5MB)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

const router = Router();

// --- Rutas de usuario ---

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', usersController.getUserProfile);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtener estadísticas del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDocuments:
 *                   type: number
 *                   description: Total de documentos
 *                 totalCategories:
 *                   type: number
 *                   description: Total de categorías
 *                 recentActivity:
 *                   type: array
 *                   description: Actividad reciente
 */
router.get('/stats', usersController.getUserStats);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Nombre del usuario
 *               lastName:
 *                 type: string
 *                 description: Apellido del usuario
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/profile', usersController.updateUserProfile);

/**
 * @swagger
 * /api/users/profile/image:
 *   post:
 *     summary: Subir imagen de perfil
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (máximo 50MB)
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   description: URL de la imagen subida
 *       400:
 *         description: Error en el archivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/profile/image', upload.single('image'), usersController.uploadProfileImage);

// --- Rutas de área ---
router.get('/area/:id', usersController.getAreaById);

// --- Rutas de documentos ---

/**
 * @swagger
 * /api/users/documents:
 *   get:
 *     summary: Obtener documentos del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: ID de categoría para filtrar
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Lista de documentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */
router.get('/documents', usersController.getUserDocuments);

/**
 * @swagger
 * /api/users/documents/{id}:
 *   get:
 *     summary: Obtener un documento específico
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/documents/:id', usersController.getUserDocument);

/**
 * @swagger
 * /api/users/documents:
 *   post:
 *     summary: Crear nuevo documento
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del documento
 *               content:
 *                 type: string
 *                 description: Contenido del documento
 *               categoryId:
 *                 type: string
 *                 description: ID de la categoría
 *     responses:
 *       201:
 *         description: Documento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/documents', usersController.createUserDocument);

/**
 * @swagger
 * /api/users/documents/{id}:
 *   put:
 *     summary: Actualizar documento
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del documento
 *               content:
 *                 type: string
 *                 description: Contenido del documento
 *               categoryId:
 *                 type: string
 *                 description: ID de la categoría
 *     responses:
 *       200:
 *         description: Documento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/documents/:id', usersController.updateUserDocument);

/**
 * @swagger
 * /api/users/documents/{id}:
 *   delete:
 *     summary: Eliminar documento (borrado lógico)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento eliminado exitosamente
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/documents/:id', usersController.deleteUserDocument);

/**
 * @swagger
 * /api/users/documents/{id}/restore:
 *   post:
 *     summary: Restaurar documento eliminado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento restaurado exitosamente
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/documents/:id/restore', usersController.restoreDocument);

// Rutas de versiones de documentos
router.get('/documents/:id/versions', usersController.getDocumentVersions);
router.get('/documents/:id/versions/:version', usersController.getDocumentVersion);
router.post('/documents/:id/versions/:version/restore', usersController.restoreDocumentToVersion);
router.put('/documents/versions/:versionId/note', usersController.updateVersionNote);

// Compartir documentos
router.post('/documents/:id/share', usersController.shareDocument);
router.get('/documents/:id/shares', usersController.getDocumentShares);
router.put('/documents/:id/share', usersController.updateDocumentShare);
router.delete('/documents/:id/share/:userId', usersController.revokeDocumentShare);

// --- Rutas de categorías ---
router.get('/categories', usersController.getCategories);
router.post('/categories', usersController.createUserCategory);
router.put('/categories/:id', usersController.updateUserCategory);
router.delete('/categories/:id', usersController.deleteUserCategory);
router.post('/categories/:id/restore', usersController.restoreCategory); // Restaurar categoría

export default router;
