import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import { z } from 'zod';

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un símbolo'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .regex(/^[a-zA-Z0-9_]{3,20}$/, 'Solo se permiten letras, números y guiones bajos').optional()
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email o nombre de usuario requerido')
    .refine((value) => {
      // Validar que sea email o username válido
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      return emailRegex.test(value) || usernameRegex.test(value);
    }, 'MENSAJE PERSONALIZADO: Debe ser un email válido o un nombre de usuario válido (3-30 caracteres)'),
  password: z.string().min(1, 'La contraseña es requerida')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un símbolo')
});

const verifyEmailSchema = z.object({
  code: z.string().length(6, 'El código debe tener exactamente 6 dígitos').regex(/^\d{6}$/, 'El código debe contener solo números')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido')
});

// Generar tokens JWT
const generateTokens = async (userId: string, email: string) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets no configurados');
  }

  const sessionId = crypto.randomUUID();
  
  // Token de acceso (1 hora)
  const accessToken = jwt.sign(
    { userId, email, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Token de renovación (7 días)
  const refreshToken = jwt.sign(
    { userId, sessionId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Guardar sesión en la base de datos
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora

  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId,
      token: accessToken,
      refreshToken,
      expiresAt,
      isActive: true
    }
  });

  return { accessToken, refreshToken, sessionId };
};

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, firstName, lastName, username } = validatedData;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(username ? [{ username }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          error: 'Ya existe una cuenta con este email',
          code: 'EMAIL_EXISTS'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          error: 'Este nombre de usuario ya está en uso',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generar código de verificación de email de 6 dígitos
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setMinutes(emailVerificationExpires.getMinutes() + 15); // 15 minutos

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        username,
        emailVerificationToken,
        emailVerificationExpires,
        emailVerified: false,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError);
      // No fallar el registro si hay error en el email
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
      user,
      requiresEmailVerification: true
    });
  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuario por email o username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email } // Permitir usar el campo email para enviar username
        ]
      },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        username: true,
        imageUrl: true,
        role: true,
        areaId: true,
        isLeader: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar que la cuenta esté activa
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar email (opcional por ahora)
    if (!user.emailVerified) {
      return res.status(401).json({
        error: 'Email no verificado. Revisa tu bandeja de entrada.',
        code: 'EMAIL_NOT_VERIFIED',
        requiresEmailVerification: true
      });
    }

    // Generar tokens
    const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Respuesta exitosa (sin incluir la contraseña)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login exitoso',
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.user?.sessionId;
    
    if (sessionId) {
      // Desactivar la sesión
      await prisma.authSession.update({
        where: { id: sessionId },
        data: { isActive: false }
      });
    }

    res.json({
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Logout de todas las sesiones
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      // Desactivar todas las sesiones del usuario
      await prisma.authSession.updateMany({
        where: { 
          userId,
          isActive: true 
        },
        data: { isActive: false }
      });
    }

    res.json({
      message: 'Logout de todas las sesiones exitoso'
    });
  } catch (error) {
    console.error('Error en logout all:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Verificar email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const validatedData = verifyEmailSchema.parse(req.body);
    const { code } = validatedData;

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: code,
        emailVerified: false,
        emailVerificationExpires: {
          gt: new Date() // Código no expirado
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Código de verificación inválido o expirado',
        code: 'INVALID_CODE'
      });
    }

    // Marcar email como verificado
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.json({
      message: 'Email verificado exitosamente'
    });
  } catch (error) {
    console.error('Error en verificación de email:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Código inválido',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Solicitar reset de contraseña
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const { email } = validatedData;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Siempre responder exitosamente para no revelar si el email existe
    if (!user) {
      return res.json({
        message: 'Si el email existe, recibirás un código de verificación'
      });
    }

    // Generar código de reset de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // Genera un número de 6 dígitos
    const resetExpires = new Date();
    resetExpires.setMinutes(resetExpires.getMinutes() + 15); // 15 minutos

    // Guardar código en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetCode,
        passwordResetExpires: resetExpires
      }
    });

    // Enviar email de reset
    try {
      await sendPasswordResetEmail(email, resetCode);
    } catch (emailError) {
      console.error('Error enviando email de reset:', emailError);
    }

    res.json({
      message: 'Si el email existe, recibirás un código de verificación'
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Reset de contraseña
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const { token, password } = validatedData;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Token de reset inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar contraseña y limpiar tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Desactivar todas las sesiones existentes
    await prisma.authSession.updateMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      data: { isActive: false }
    });

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en reset password:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Typed payload for refresh tokens
interface RefreshTokenPayload extends jwt.JwtPayload {
  userId: string;
  sessionId: string;
}

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token requerido',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({
        error: 'Error de configuración del servidor',
        code: 'SERVER_CONFIG_ERROR'
      });
    }

    // Verificar refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

    // Buscar sesión activa
    const session = await prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        refreshToken,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            emailVerified: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (!session.user.isActive) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Generar nuevos tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      session.user.id,
      session.user.email
    );

    // Desactivar sesión anterior
    await prisma.authSession.update({
      where: { id: session.id },
      data: { isActive: false }
    });

    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Error en refresh token:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Reenviar código de verificación de email
export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        code: 'EMAIL_REQUIRED'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'El email ya está verificado',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Generar nuevo código de verificación
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setMinutes(emailVerificationExpires.getMinutes() + 15); // 15 minutos

    // Actualizar el código en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    // Enviar nuevo email de verificación
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError);
      return res.status(500).json({
        error: 'Error enviando el email de verificación',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    res.json({
      message: 'Código de verificación reenviado exitosamente'
    });
  } catch (error) {
    console.error('Error reenviando código de verificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Obtener perfil del usuario actual
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
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
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        area: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};
