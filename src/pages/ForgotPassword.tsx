import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, CheckCircle, ArrowLeft, Info, AlertCircle, Check, X, Mail, Key } from 'lucide-react';
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Referencias para enfocar campos
  const emailRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Expresiones regulares para validación
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('El correo electrónico es obligatorio');
      setEmailValid(false);
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError('Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)');
      setEmailValid(false);
      return false;
    } else {
      setEmailError('');
      setEmailValid(true);
      return true;
    }
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('La contraseña es obligatoria');
      setPasswordValid(false);
      return false;
    } else if (value.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      setPasswordValid(false);
      return false;
    } else if (!passwordRegex.test(value)) {
      setPasswordError('La contraseña debe contener al menos una minúscula, una mayúscula, un número y un símbolo');
      setPasswordValid(false);
      return false;
    } else {
      setPasswordError('');
      setPasswordValid(true);
      return true;
    }
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError('Confirma tu contraseña');
      setConfirmPasswordValid(false);
      return false;
    } else if (value !== newPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      setConfirmPasswordValid(false);
      return false;
    } else {
      setConfirmPasswordError('');
      setConfirmPasswordValid(true);
      return true;
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    validatePassword(value);
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    validateConfirmPassword(value);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      emailRef.current?.focus();
      setError('Por favor corrige el error en el correo electrónico');
      setIsLoading(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      setStep('reset');
      setTimeout(() => {
        tokenRef.current?.focus();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!resetToken.trim()) {
      setError('Por favor ingresa el código de verificación');
      tokenRef.current?.focus();
      setIsLoading(false);
      return;
    }

    const isPasswordValid = validatePassword(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid) {
      passwordRef.current?.focus();
      setError('Por favor corrige el error en la contraseña');
      setIsLoading(false);
      return;
    }

    if (!isConfirmValid) {
      confirmPasswordRef.current?.focus();
      setError('Por favor confirma tu contraseña');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(resetToken, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordValid(false);
    setConfirmPasswordError('');
    setConfirmPasswordValid(false);
    setError('');
    setTimeout(() => {
      emailRef.current?.focus();
    }, 100);
  };

  if (success) {
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
          {/* Recuadro principal con glassmorfismo */}
          <div className="relative bg-white/15 dark:bg-gray-900/20 backdrop-blur-sm border border-white/25 dark:border-gray-600/30 rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl">
            {/* Gradiente sutil de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-400/10 dark:to-blue-400/10" />
            
            <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
              
              {/* Lado izquierdo - Información */}
              <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8 relative">
                {/* Línea divisora vertical */}
                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/50 dark:via-gray-300/40 to-transparent shadow-lg" />
                <div className="text-center space-y-4">
                  {/* Logo/Título con efecto glassmorphism */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur-xl opacity-30" />
                    <div className="relative bg-white/15 dark:bg-gray-800/25 backdrop-blur-lg border border-white/25 dark:border-gray-600/30 rounded-2xl p-6">
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                          Smart Docs
                        </h1>
                      </div>
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        Contraseña restablecida exitosamente
                      </p>
                    </div>
                  </div>

                  {/* Imagen decorativa centrada */}
                  <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl" />
                    <img 
                      src="https://branzontech.com/wp-content/uploads/2025/05/purple_dino_4-removebg-preview.png"
                      alt="Smart Docs"
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Lado derecho - Mensaje de éxito */}
              <div className="flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                  {/* Contenedor del mensaje con glassmorphism */}
                  <div className="relative">
                    {/* Efecto de glassmorphism */}
                    <div className="absolute inset-0 bg-white/15 dark:bg-gray-800/20 backdrop-blur-md rounded-3xl border border-white/20 dark:border-gray-600/25 shadow-lg" />
                    
                    {/* Gradiente sutil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 dark:from-green-400/8 dark:to-blue-400/8 rounded-3xl" />
                    
                    {/* Contenido del mensaje */}
                    <Card className="relative bg-transparent border-0 shadow-none">
                      <CardContent className="pt-6 text-center p-6">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">¡Contraseña Restablecida!</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                        </p>
                        <Button 
                          onClick={() => navigate('/auth')}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Ir al Login
                        </Button>
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
  }

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
        {/* Recuadro principal con glassmorfismo */}
        <div className="relative bg-white/15 dark:bg-gray-900/20 backdrop-blur-sm border border-white/25 dark:border-gray-600/30 rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl">
          {/* Gradiente sutil de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-400/10 dark:to-blue-400/10" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            
            {/* Lado izquierdo - Información */}
            <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8 relative">
              {/* Línea divisora vertical */}
              <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/50 dark:via-gray-300/40 to-transparent shadow-lg" />
              <div className="text-center space-y-4">
                {/* Logo/Título con efecto glassmorphism */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30" />
                  <div className="relative bg-white/15 dark:bg-gray-800/25 backdrop-blur-lg border border-white/25 dark:border-gray-600/30 rounded-2xl p-6">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                        Smart Docs
                      </h1>
                    </div>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      Recupera el acceso a tu cuenta
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
                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-sm">Recuperación segura por email</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm">Proceso de verificación rápido</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-sm">Acceso inmediato a tu cuenta</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado derecho - Formularios */}
            <div className="flex items-center justify-center p-6">
              <div className="w-full max-w-md">
                {/* Contenedor del formulario con glassmorphism */}
                <div className="relative">
                  {/* Efecto de glassmorphism */}
                  <div className="absolute inset-0 bg-white/15 dark:bg-gray-800/20 backdrop-blur-md rounded-3xl border border-white/20 dark:border-gray-600/25 shadow-lg" />
                  
                  {/* Gradiente sutil */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-400/8 dark:to-blue-400/8 rounded-3xl" />
                  
                  {/* Contenido del formulario */}
                  <TooltipProvider>
                    <Card className="relative bg-transparent border-0 shadow-none">
                      <CardHeader className="space-y-1 text-center pb-4">
                        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-gray-800 dark:text-gray-100">
                          {step === 'email' ? (
                            <>
                              <Mail className="h-6 w-6" />
                              Recuperar Contraseña
                            </>
                          ) : (
                            <>
                              <Key className="h-6 w-6" />
                              Restablecer Contraseña
                            </>
                          )}
                        </CardTitle>
                        <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                          {step === 'email' 
                            ? 'Ingresa tu correo para recibir un código de verificación'
                            : 'Ingresa el código recibido y tu nueva contraseña'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        {error && (
                          <Alert variant="destructive" className="mb-4 bg-red-50/90 dark:bg-red-900/20 backdrop-blur-sm border-red-300 dark:border-red-500/30">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        {step === 'email' ? (
                          <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Label 
                                  htmlFor="email"
                                  className="text-gray-700 dark:text-gray-300 font-medium"
                                >
                                  Correo electrónico
                                </Label>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Debe ser un correo válido registrado en el sistema</p>
                                  </TooltipContent>
                                </Tooltip>
                                {email && (
                                  emailValid ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <X className="h-3 w-3 text-red-500" />
                                  )
                                )}
                              </div>
                              <Input
                                ref={emailRef}
                                id="email"
                                type="email"
                                placeholder="ejemplo@dominio.com"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                disabled={isLoading}
                                required
                                className={`bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors duration-200 ${
                                  emailError ? 'border-red-500 focus:border-red-500' : 
                                  emailValid ? 'border-green-500' : ''
                                }`}
                              />
                              {emailError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {emailError}
                                </p>
                              )}
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105" 
                              disabled={isLoading || !emailValid}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Enviando código...
                                </>
                              ) : (
                                'Enviar Código de Verificación'
                              )}
                            </Button>
                          </form>
                        ) : (
                          <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="token" className="text-gray-700 dark:text-gray-300 font-medium">
                                Código de verificación
                              </Label>
                              <Input
                                ref={tokenRef}
                                id="token"
                                type="text"
                                placeholder="Ingresa el código recibido"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                disabled={isLoading}
                                required
                                className="bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 font-medium">
                                  Nueva contraseña
                                </Label>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Mínimo 8 caracteres, incluye mayúscula, minúscula, número y símbolo</p>
                                  </TooltipContent>
                                </Tooltip>
                                {newPassword && (
                                  passwordValid ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <X className="h-3 w-3 text-red-500" />
                                  )
                                )}
                              </div>
                              <Input
                                ref={passwordRef}
                                id="newPassword"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                value={newPassword}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                disabled={isLoading}
                                required
                                className={`bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                  passwordError ? 'border-red-500 focus:border-red-500' : 
                                  passwordValid ? 'border-green-500' : ''
                                }`}
                              />
                              {passwordError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {passwordError}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">
                                  Confirmar contraseña
                                </Label>
                                {confirmPassword && (
                                  confirmPasswordValid ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <X className="h-3 w-3 text-red-500" />
                                  )
                                )}
                              </div>
                              <Input
                                ref={confirmPasswordRef}
                                id="confirmPassword"
                                type="password"
                                placeholder="Repite la contraseña"
                                value={confirmPassword}
                                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                disabled={isLoading}
                                required
                                className={`bg-white/15 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 focus:border-purple-400 dark:focus:border-purple-400 focus:bg-white/20 dark:focus:bg-gray-700/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                                  confirmPasswordError ? 'border-red-500 focus:border-red-500' : 
                                  confirmPasswordValid ? 'border-green-500' : ''
                                }`}
                              />
                              {confirmPasswordError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {confirmPasswordError}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={handleBackToEmail}
                                disabled={isLoading}
                                className="flex-1 bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm border-white/25 dark:border-gray-500/30 hover:bg-white/20 dark:hover:bg-gray-700/30"
                              >
                                <ArrowLeft className="mr-1 h-3 w-3" />
                                Volver
                              </Button>
                              <Button 
                                type="submit" 
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105" 
                                disabled={isLoading || !passwordValid || !confirmPasswordValid || !resetToken.trim()}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restableciendo...
                                  </>
                                ) : (
                                  'Restablecer Contraseña'
                                )}
                              </Button>
                            </div>
                          </form>
                        )}

                        <div className="mt-6 text-center space-y-3">
                          <div className="text-gray-500 text-xs dark:text-gray-300">
                            <div className="flex items-center justify-center">
                              <div className="bg-gray-300 dark:bg-gray-500 h-px flex-1"></div>
                              <span className="px-4">o</span>
                              <div className="bg-gray-300 dark:bg-gray-500 h-px flex-1"></div>
                            </div>
                          </div>
                          
                          <div className="text-gray-600 dark:text-gray-300">
                            <Link 
                              to="/auth" 
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors duration-200 inline-flex items-center font-medium"
                            >
                              <ArrowLeft className="mr-1 h-3 w-3" />
                              Volver al login
                            </Link>
                          </div>
                          
                          <div className="text-gray-600 dark:text-gray-300">
                            ¿No tienes una cuenta?{' '}
                            <Link 
                              to="/auth" 
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium hover:underline"
                            >
                              Regístrate
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
