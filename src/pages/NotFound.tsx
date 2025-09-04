import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    // Página 404 - ruta no encontrada
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 relative">
      {/* Dual Gradient Overlay Background - Light Mode */}
      <div
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.3), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.3), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      
      {/* Dual Gradient Overlay Background - Dark Mode */}
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(75,85,99,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75,85,99,0.6) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.4), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.4), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      {/* Your Content/Components */}
      <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-20 p-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-600/30 rounded-full shadow-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 group"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-12 transition-transform duration-300" />
          ) : (
            <Moon className="h-5 w-5 text-gray-700 group-hover:rotate-12 transition-transform duration-300" />
          )}
        </button>

        <div className="max-w-xl mx-auto">
          {/* Glassmorphism Container */}
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-600/30 rounded-2xl p-6 shadow-2xl">
            <div className="text-center">
              {/* 404 Icon */}
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 rounded-full flex items-center justify-center mb-3 border border-white/20 dark:border-gray-600/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-pulse">
                    404
                  </span>
                </div>
              </div>

              {/* Main Message */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                ¡Ups! Página no encontrada
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                Lo sentimos, la página que buscas no existe o ha sido movida.
              </p>
              <p className="text-base text-gray-500 dark:text-gray-500 mb-5 leading-relaxed">
                Pero no te preocupes, ¡estamos aquí para ayudarte! 🚀
              </p>

              {/* Detailed Information */}
              <div className="bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm rounded-lg p-4 mb-5 text-left">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  ¿Qué puedes hacer ahora?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-purple-500/20 dark:bg-purple-400/30 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-purple-600 dark:text-purple-400 text-xs">✓</span>
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Verifica la URL</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-blue-500/20 dark:bg-blue-400/30 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-400 text-xs">✓</span>
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Navega desde inicio</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-green-500/20 dark:bg-green-400/30 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Busca en el sitio</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="w-5 h-5 bg-orange-500/20 dark:bg-orange-400/30 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-orange-600 dark:text-orange-400 text-xs">✓</span>
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Contacta soporte</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <a 
                  href="/" 
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Ir al Inicio
                </a>
                
                <button 
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-white/20 dark:bg-gray-700/30 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-white/30 dark:hover:bg-gray-600/40 transition-all duration-300"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver Atrás
                </button>
              </div>

              {/* Quick Navigation Links */}
              <div className="pt-4 border-t border-white/20 dark:border-gray-600/30">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Enlaces rápidos:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <a href="/login" className="flex flex-col items-center p-2 bg-white/10 dark:bg-gray-700/20 rounded-lg hover:bg-white/20 dark:hover:bg-gray-600/30 transition-all duration-300 group">
                    <span className="text-lg mb-1 group-hover:scale-110 transition-transform">🔑</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Login</span>
                  </a>
                  <a href="/register" className="flex flex-col items-center p-2 bg-white/10 dark:bg-gray-700/20 rounded-lg hover:bg-white/20 dark:hover:bg-gray-600/30 transition-all duration-300 group">
                    <span className="text-lg mb-1 group-hover:scale-110 transition-transform">📝</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Registro</span>
                  </a>
                  <a href="/dashboard" className="flex flex-col items-center p-2 bg-white/10 dark:bg-gray-700/20 rounded-lg hover:bg-white/20 dark:hover:bg-gray-600/30 transition-all duration-300 group">
                    <span className="text-lg mb-1 group-hover:scale-110 transition-transform">📊</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Panel</span>
                  </a>
                  <a href="/profile" className="flex flex-col items-center p-2 bg-white/10 dark:bg-gray-700/20 rounded-lg hover:bg-white/20 dark:hover:bg-gray-600/30 transition-all duration-300 group">
                    <span className="text-lg mb-1 group-hover:scale-110 transition-transform">👤</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Perfil</span>
                  </a>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
