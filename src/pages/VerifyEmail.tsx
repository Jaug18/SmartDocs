import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface VerifyEmailProps {
  email?: string;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ email: propEmail }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Obtener email de props, location state o localStorage
  const email = propEmail || location.state?.email || localStorage.getItem('verificationEmail') || '';
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Efecto para el cooldown del reenvío
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Manejar cambio en los inputs del código
  const handleCodeChange = (index: number, value: string) => {
    // Solo permitir dígitos
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verificar cuando se complete el código
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyEmail(newCode.join(''));
    }
  };

  // Manejar teclas especiales
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Pegar código desde clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const newCode = paste.split('');
      setCode(newCode);
      setError('');
      handleVerifyEmail(paste);
    }
  };

  // Verificar email
  const handleVerifyEmail = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeToVerify }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('¡Email verificado exitosamente!');
        toast({
          title: 'Email verificado',
          description: 'Tu cuenta ha sido activada correctamente.',
        });
        
        // Limpiar email del localStorage
        localStorage.removeItem('verificationEmail');
        
        // Redirigir al login después de un breve retraso
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
              email: email 
            } 
          });
        }, 2000);
      } else {
        setError(data.error || 'Error verificando el código');
        // Limpiar el código si es inválido
        if (data.code === 'INVALID_CODE') {
          setCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (!email) {
      setError('No se pudo determinar el email. Por favor regresa al registro.');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Código reenviado',
          description: 'Revisa tu bandeja de entrada para el nuevo código.',
        });
        setCode(['', '', '', '', '', '']);
        setCooldown(60); // 60 segundos de cooldown
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Error reenviando el código');
      }
    } catch (error) {
      console.error('Error reenviando código:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Verificar Email</CardTitle>
            <CardDescription>
              Hemos enviado un código de 6 dígitos a <br />
              <span className="font-medium text-gray-900">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 text-green-800 bg-green-50">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-lg font-bold border-2 focus:border-purple-500"
                    disabled={isVerifying}
                  />
                ))}
              </div>

              <Button
                onClick={() => handleVerifyEmail()}
                disabled={isVerifying || code.some(digit => !digit)}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                ¿No recibiste el código?
              </p>
              <Button
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending || cooldown > 0}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : cooldown > 0 ? (
                  `Reenviar en ${cooldown}s`
                ) : (
                  'Reenviar Código'
                )}
              </Button>
            </div>

            <div className="pt-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/register')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Registro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
