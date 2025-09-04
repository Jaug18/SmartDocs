import axios from 'axios';

// Obtener la URL base de la API desde las variables de entorno
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// Crear una instancia de Axios con la configuración base
const apiClient = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Importante para cookies de sesión
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para añadir el token JWT a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Obtener el token desde localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores globalmente
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el token expiró, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
