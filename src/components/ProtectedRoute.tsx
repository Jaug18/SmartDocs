import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, adminOnly = false, requiredRoles = [] }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si se requiere admin y el usuario no es admin
  if (adminOnly && !['admin', 'superuser'].includes(user.role)) {
    return <Navigate to="/editor" replace />;
  }

  // Verificar roles específicos requeridos
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/editor" replace />;
  }

  return <>{children}</>;
}
