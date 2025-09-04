import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import Editor from "./pages/Editor";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import AdminDashboard from '@/pages/AdminDashboard';
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* Para depuración - muestra redirecciones en desarrollo */}
              {import.meta.env.DEV && (
                <RouteChangeTracker />
              )}
              <Routes>
                {/* Redirigir la ruta raíz al login */}
                <Route path="/" element={<Navigate to="/auth" replace />} />
                
                {/* Página de editor protegida */}
                <Route
                  path="/editor"
                  element={
                    <ProtectedRoute>
                      <Editor />
                    </ProtectedRoute>
                  }
                />
                
                {/* Página de perfil protegida */}
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                
                {/* Ruta para el panel de administración */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Rutas de autenticación */}
                <Route path="/login/*" element={<Auth />} />
                <Route path="/register/*" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                
                {/* Ruta para capturar 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

// Componente de seguimiento de cambios de ruta para depuración
const RouteChangeTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
  }, [location]);
  
  return null;
};

export default App;