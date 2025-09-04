import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  LogIn,
  ArrowRight,
  Sparkles,
  Code,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
}

const Auth = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    // Detectar tab inicial basado en la URL
    const path = location.pathname;
    if (path.includes('register')) return 'register';
    if (path.includes('login')) return 'login';
    return 'login'; // Default
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario de login
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  // Estados del formulario de registro
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: ''
  });

  // Estados de validación
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({});
  const [registerErrors, setRegisterErrors] = useState<Partial<RegisterFormData>>({});
  const [error, setError] = useState('');

  // Referencias para enfocar campos
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const registerEmailRef = useRef<HTMLInputElement>(null);

  // Expresiones regulares para validación
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,30}$/;

  // Validación en tiempo real
  const validateLoginField = (field: keyof LoginFormData, value: string) => {
    let error = '';
    
    switch (field) {
      case 'email':
        if (!value) {
          error = 'Email o nombre de usuario requerido';
        } else if (!emailRegex.test(value) && !usernameRegex.test(value)) {
          error = 'Debe ser un email válido o nombre de usuario (3-20 caracteres)';
        }
        break;
      case 'password':
        if (!value) error = 'La contraseña es requerida';
        break;
    }

    setLoginErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateRegisterField = (field: keyof RegisterFormData, value: string) => {
    let error = '';

    switch (field) {
      case 'email':
        if (!value) {
          error = 'El correo electrónico es obligatorio';
        } else if (!emailRegex.test(value)) {
          error = 'Ingresa un correo electrónico válido';
        }
        break;
      case 'password':
        if (!value) {
          error = 'La contraseña es obligatoria';
        } else if (value.length < 8) {
          error = 'La contraseña debe tener al menos 8 caracteres';
        } else if (!passwordRegex.test(value)) {
          error = 'La contraseña debe contener minúscula, mayúscula, número y símbolo';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Confirma tu contraseña';
        } else if (value !== registerForm.password) {
          error = 'Las contraseñas no coinciden';
        }
        break;
      case 'firstName':
        if (!value) {
          error = 'El nombre es obligatorio';
        } else if (!nameRegex.test(value)) {
          error = 'El nombre debe tener 2-30 caracteres válidos';
        }
        break;
      case 'lastName':
        if (!value) {
          error = 'El apellido es obligatorio';
        } else if (!nameRegex.test(value)) {
          error = 'El apellido debe tener 2-30 caracteres válidos';
        }
        break;
      case 'username':
        if (value && !usernameRegex.test(value)) {
          error = 'Solo letras, números y guiones bajos (3-20 caracteres)';
        }
        break;
    }

    setRegisterErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  // Manejo de cambios en formularios
  const handleLoginChange = (field: keyof LoginFormData, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    validateLoginField(field, value);
    setError('');
  };

  const handleRegisterChange = (field: keyof RegisterFormData, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    validateRegisterField(field, value);
    if (field === 'password' && registerForm.confirmPassword) {
      validateRegisterField('confirmPassword', registerForm.confirmPassword);
    }
    setError('');
  };

  // Validar formulario completo
  const validateLoginForm = () => {
    const emailValid = validateLoginField('email', loginForm.email);
    const passwordValid = validateLoginField('password', loginForm.password);
    return emailValid && passwordValid;
  };

  const validateRegisterForm = () => {
    const emailValid = validateRegisterField('email', registerForm.email);
    const passwordValid = validateRegisterField('password', registerForm.password);
    const confirmPasswordValid = validateRegisterField('confirmPassword', registerForm.confirmPassword);
    const firstNameValid = validateRegisterField('firstName', registerForm.firstName);
    const lastNameValid = validateRegisterField('lastName', registerForm.lastName);
    const usernameValid = !registerForm.username || validateRegisterField('username', registerForm.username);
    
    return emailValid && passwordValid && confirmPasswordValid && firstNameValid && lastNameValid && usernameValid;
  };

  // Manejo de envío de formularios
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión exitosamente',
      });
      navigate('/editor');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al iniciar sesión');
      if (error.message.includes('Email no verificado')) {
        // Redirigir a verificación de email si es necesario
        setTimeout(() => {
          navigate('/verify-email', { state: { email: loginForm.email } });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      const result = await register({
        email: registerForm.email,
        password: registerForm.password,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        username: registerForm.username || undefined
      });

      toast({
        title: 'Registro exitoso',
        description: 'Se ha enviado un código de verificación a tu email',
      });

      // Guardar email y redirigir a verificación
      localStorage.setItem('verificationEmail', registerForm.email);
      setTimeout(() => {
        navigate('/verify-email', { state: { email: registerForm.email } });
      }, 1500);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  // Cambio de tab
  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError('');
    setLoginErrors({});
    setRegisterErrors({});
    // Resetear formularios
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', username: '' });
    
    // Actualizar URL sin recargar la página
    const newPath = tab === 'login' ? '/auth' : '/auth';
    if (location.pathname !== newPath) {
      navigate(newPath, { replace: true });
    }
  };

  // Efectos
  useEffect(() => {
    if (activeTab === 'login') {
      setTimeout(() => loginEmailRef.current?.focus(), 100);
    } else {
      setTimeout(() => registerEmailRef.current?.focus(), 100);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 relative">
      {/* Dual Gradient Overlay Swapped Background - Light Mode */}
      <div
        className="absolute inset-0 z-0"
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
      {/* Dark Mode Dual Gradient Background */}
      <div
        className="absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(75,85,99,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75,85,99,0.6) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.2), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.2), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Contenedor principal con glassmorfismo */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        {/* Recuadro principal con glassmorfismo mejorado y más transparente - más pequeño */}
        <div className="relative bg-white/15 dark:bg-gray-900/20 backdrop-blur-sm border border-white/25 dark:border-gray-600/30 rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl">
          {/* Gradiente sutil de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-400/10 dark:to-blue-400/10" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            
            {/* Lado izquierdo - Información */}
            <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8 relative">
              {/* Línea divisora vertical más grande */}
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/50 dark:via-gray-300/40 to-transparent shadow-lg" />
              <div className="text-center space-y-4">
                {/* Logo/Título con efecto glassmorphism */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30" />
                  <div className="relative bg-white/15 dark:bg-gray-800/25 backdrop-blur-lg border border-white/25 dark:border-gray-600/30 rounded-2xl p-6">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                        Smart Docs
                      </h1>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      La plataforma inteligente para gestión de documentos
                    </p>
                  </div>
                </div>

                {/* Imagen decorativa centrada */}
                <div className="relative">
                  <div className="w-64 h-64 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-2xl" />
                  <img 
                    src="https://branzontech.com/wp-content/uploads/2025/05/purple_dino_4-removebg-preview.png"
                    alt="Smart Docs"
                    className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Code className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-sm">Editor de código colaborativo</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm">IA integrada para asistencia</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-sm">Gestión de equipos y permisos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado derecho - Formularios */}
            <div className="flex items-center justify-center p-6">
              <div className="w-full max-w-md">
                {/* Contenedor principal con glassmorphism ultra transparente - TAMAÑO FIJO */}
                <div className="relative h-[680px] w-full">
                  {/* Efecto de glassmorphism ultra transparente */}
                  <div className="absolute inset-0 bg-white/15 dark:bg-gray-800/20 backdrop-blur-md rounded-3xl border border-white/20 dark:border-gray-600/25 shadow-lg" />
                  
                  {/* Gradiente casi imperceptible */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-400/8 dark:to-blue-400/8 rounded-3xl" />

                  {/* Contenido del formulario */}
                  <Card className="relative bg-transparent border-0 shadow-none h-full">
                    <CardContent className="p-4 h-full flex flex-col overflow-hidden">
                      {/* Tabs con glassmorphism mejorado */}
                      <div className="flex space-x-1 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm rounded-xl p-1 mb-4 border border-white/25 dark:border-gray-600/30 shadow-lg">
                        <button
                          type="button"
                          onClick={() => handleTabChange('login')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                            activeTab === 'login'
                              ? 'bg-white/30 dark:bg-gray-600/35 text-purple-700 dark:text-purple-300 shadow-md backdrop-blur-sm'
                              : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-white/15 dark:hover:bg-gray-600/20'
                          }`}
                        >
                          <LogIn className="w-4 h-4 inline mr-2" />
                          Iniciar Sesión
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTabChange('register')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                            activeTab === 'register'
                              ? 'bg-white/30 dark:bg-gray-600/35 text-purple-700 dark:text-purple-300 shadow-md backdrop-blur-sm'
                              : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-white/15 dark:hover:bg-gray-600/20'
                          }`}
                        >
                          <UserPlus className="w-4 h-4 inline mr-2" />
                          Registrarse
                        </button>
                      </div>

                    {/* Error general */}
                    {error && (
                      <Alert variant="destructive" className="mb-4 bg-red-50/90 dark:bg-red-900/20 backdrop-blur-sm border-red-300 dark:border-red-500/30">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Contenedor de formularios con animación */}
                    <div className="flex-1 relative overflow-hidden">
                      {/* Formulario de Login */}
                      <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                        activeTab === 'login' 
                          ? 'opacity-100 transform translate-x-0' 
                          : 'opacity-0 transform translate-x-full pointer-events-none'
                      }`}>
                        <form onSubmit={handleLoginSubmit} className="h-full flex flex-col justify-center space-y-5">
                          {/* Texto de bienvenida para Login */}
                          <div className="text-center space-y-2 mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                              ¡Bienvenido de vuelta!
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Inicia sesión para acceder a tu espacio de trabajo
                            </p>
                          </div>
                          
                          <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300 font-medium">
                            Email o Usuario
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              ref={loginEmailRef}
                              id="login-email"
                              type="text"
                              placeholder="tu@email.com o usuario"
                              value={loginForm.email}
                              onChange={(e) => handleLoginChange('email', e.target.value)}
                              className={`pl-10 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                loginErrors.email ? 'border-red-400' : ''
                              }`}
                            />
                          </div>
                          {loginErrors.email && (
                            <p className="text-sm text-red-500 flex items-center">
                              <X className="w-3 h-3 mr-1" />
                              {loginErrors.email}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300 font-medium">
                            Contraseña
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Tu contraseña"
                              value={loginForm.password}
                              onChange={(e) => handleLoginChange('password', e.target.value)}
                              className={`pl-10 pr-10 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                loginErrors.password ? 'border-red-400' : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {loginErrors.password && (
                            <p className="text-sm text-red-500 flex items-center">
                              <X className="w-3 h-3 mr-1" />
                              {loginErrors.password}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <Link 
                            to="/forgot-password"
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
                          >
                            ¿Olvidaste tu contraseña?
                          </Link>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Iniciando sesión...
                            </>
                          ) : (
                            <>
                              Iniciar Sesión
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        
                        {/* Texto motivacional */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                          Accede a tus documentos y proyectos colaborativos
                        </p>
                        </div>
                        </form>
                      </div>

                      {/* Formulario de Registro */}
                      <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                        activeTab === 'register' 
                          ? 'opacity-100 transform translate-x-0' 
                          : 'opacity-0 transform -translate-x-full pointer-events-none'
                      }`}>
                        <form onSubmit={handleRegisterSubmit} className="h-full flex flex-col justify-center space-y-3">
                          {/* Texto de bienvenida para Registro */}
                          <div className="text-center space-y-2 mb-3">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                              Únete a Smart Docs
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              Crea tu cuenta y comienza a colaborar
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                              Nombre *
                            </Label>
                            <Input
                              ref={registerEmailRef}
                              id="firstName"
                              type="text"
                              placeholder="Juan"
                              value={registerForm.firstName}
                              onChange={(e) => handleRegisterChange('firstName', e.target.value)}
                              className={`bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                registerErrors.firstName ? 'border-red-400' : ''
                              }`}
                            />
                            {registerErrors.firstName && (
                              <p className="text-xs text-red-500">{registerErrors.firstName}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                              Apellido *
                            </Label>
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Pérez"
                              value={registerForm.lastName}
                              onChange={(e) => handleRegisterChange('lastName', e.target.value)}
                              className={`bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                registerErrors.lastName ? 'border-red-400' : ''
                              }`}
                            />
                            {registerErrors.lastName && (
                              <p className="text-xs text-red-500">{registerErrors.lastName}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="register-email" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Email *
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              id="register-email"
                              type="email"
                              placeholder="tu@email.com"
                              value={registerForm.email}
                              onChange={(e) => handleRegisterChange('email', e.target.value)}
                              className={`pl-10 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                registerErrors.email ? 'border-red-400' : ''
                              }`}
                            />
                          </div>
                          {registerErrors.email && (
                            <p className="text-xs text-red-500">{registerErrors.email}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Usuario (opcional)
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              id="username"
                              type="text"
                              placeholder="usuario123"
                              value={registerForm.username}
                              onChange={(e) => handleRegisterChange('username', e.target.value)}
                              className={`pl-10 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                registerErrors.username ? 'border-red-400' : ''
                              }`}
                            />
                          </div>
                          {registerErrors.username && (
                            <p className="text-xs text-red-500">{registerErrors.username}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="register-password" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Contraseña *
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              id="register-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Tu contraseña"
                              value={registerForm.password}
                              onChange={(e) => handleRegisterChange('password', e.target.value)}
                              className={`pl-10 pr-10 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                registerErrors.password ? 'border-red-400' : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {registerErrors.password && (
                            <p className="text-xs text-red-500">{registerErrors.password}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                            Confirmar Contraseña *
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirma tu contraseña"
                              value={registerForm.confirmPassword}
                              onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                              className={`pl-10 pr-10 bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                registerErrors.confirmPassword ? 'border-red-400' : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {registerErrors.confirmPassword && (
                            <p className="text-xs text-red-500">{registerErrors.confirmPassword}</p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 mt-4"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registrando...
                            </>
                          ) : (
                            <>
                              Crear Cuenta
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                          Los campos marcados con * son obligatorios
                        </p>
                        </div>
                        </form>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
