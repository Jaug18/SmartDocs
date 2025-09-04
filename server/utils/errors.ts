import { Response } from 'express';
import { logger } from './logger';

export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static handleError(error: unknown, res: Response) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }

    logger.error('Error no controlado:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
    });
  }

  static badRequest(message: string) {
    return new ApiError(message, 400);
  }

  static unauthorized(message: string = 'No autorizado') {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Acceso prohibido') {
    return new ApiError(message, 403);
  }

  static notFound(message: string = 'Recurso no encontrado') {
    return new ApiError(message, 404);
  }

  static conflict(message: string) {
    return new ApiError(message, 409);
  }

  static internal(message: string = 'Error interno del servidor') {
    return new ApiError(message, 500);
  }
}
