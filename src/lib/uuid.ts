/**
 * Utilidades para generar IDs únicos
 * Proporciona compatibilidad para crypto.randomUUID() en navegadores que no lo soportan
 */

/**
 * Genera un UUID v4 compatible con crypto.randomUUID()
 * Usa crypto.randomUUID() si está disponible, de lo contrario usa un polyfill
 * @returns UUID v4 string
 */
export const generateUUID = (): string => {
  // Verificar si crypto.randomUUID está disponible (navegadores modernos)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Polyfill para navegadores que no soportan crypto.randomUUID
  // Genera un UUID v4 usando Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Genera un ID corto para uso interno (no es un UUID estándar)
 * Útil para casos donde no necesitas un UUID completo
 * @returns String de 8 caracteres hexadecimales
 */
export const generateShortId = (): string => {
  return Math.random().toString(16).substring(2, 10);
};

/**
 * Verifica si el navegador soporta crypto.randomUUID nativo
 * @returns true si crypto.randomUUID está disponible
 */
export const isCryptoUUIDSupported = (): boolean => {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
};
