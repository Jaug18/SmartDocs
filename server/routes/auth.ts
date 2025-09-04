import { Router } from 'express';
import * as authController from '../controllers/authController';
import { requireAuth } from '../middleware/auth/authMiddleware';
import { validateRequest } from '../middleware/validation/validateRequest';
import { z } from 'zod';

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para autenticación de usuarios
 */

const router = Router();

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres')
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email o nombre de usuario requerido')
    .refine((value) => {
      // Validar que sea email o username válido
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      return emailRegex.test(value) || usernameRegex.test(value);
    }, 'Debe ser un email válido o un nombre de usuario válido (3-30 caracteres)'),
  password: z.string().min(1, 'La contraseña es requerida')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

const verifyEmailSchema = z.object({
  code: z.string().length(6, 'El código debe tener exactamente 6 dígitos').regex(/^\d{6}$/, 'El código debe contener solo números')
});

const resendCodeSchema = z.object({
  email: z.string().email('Email inválido')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token es requerido')
});

// Rutas públicas (no requieren autenticación)

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Error de validación o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *     responses:
 *       200:
 *         description: Email de restablecimiento enviado
 *       400:
 *         description: Email no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de restablecimiento
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Nueva contraseña
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verificar email con código
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: Código de verificación de 6 dígitos
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Código inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification-code:
 *   post:
 *     summary: Reenviar código de verificación
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *     responses:
 *       200:
 *         description: Código reenviado exitosamente
 *       400:
 *         description: Email no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/resend-verification-code', validateRequest(resendCodeSchema), authController.resendVerificationCode);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Renovar token de acceso
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de renovación
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Nuevo token de acceso
 *                 refreshToken:
 *                   type: string
 *                   description: Nuevo token de renovación
 *       401:
 *         description: Token de renovación inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);

// Rutas protegidas (requieren autenticación)
router.use(requireAuth); // Aplicar middleware a todas las rutas siguientes

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: Token inválido o faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Cerrar todas las sesiones
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las sesiones cerradas exitosamente
 *       401:
 *         description: Token inválido o faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout-all', authController.logoutAll);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
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
 *         description: Token inválido o faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authController.getProfile);

export default router;
