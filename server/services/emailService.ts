import nodemailer from 'nodemailer';

// Configuración del transporter de email para Gmail
const createTransporter = () => {
  console.log('🔧 Configurando transporter de Gmail...');
  console.log('📧 Email User:', process.env.EMAIL_USER);
  console.log('🔑 Password Length:', process.env.EMAIL_PASS?.length || 0);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Usar el servicio predefinido de Gmail
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verificar la conexión
  transporter.verify((error: Error | null, success: boolean) => {
    if (error) {
      console.error('❌ Error de conexión SMTP:', error);
    } else {
      console.log('✅ Servidor SMTP listo para enviar emails');
    }
  });

  return transporter;
};

// Enviar email de verificación con código de 6 dígitos
export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@smartdocs.com',
      to: email,
      subject: 'Código de Verificación - Smart Docs',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificar Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 20px; text-align: center; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .code-container { 
              text-align: center; 
              margin: 30px 0; 
              padding: 30px; 
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
              border-radius: 12px; 
              border: 2px dashed #7c3aed;
            }
            .code { 
              font-size: 36px; 
              font-weight: bold; 
              color: #7c3aed; 
              letter-spacing: 8px; 
              font-family: 'Courier New', monospace;
              margin: 10px 0;
              text-shadow: 0 2px 4px rgba(124,58,237,0.1);
            }
            .code-label { 
              font-size: 14px; 
              color: #64748b; 
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .note { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              font-size: 14px;
            }
            .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Smart Docs</div>
              <div class="subtitle">Verificación de Email</div>
            </div>
            <div class="content">
              <h2>¡Bienvenido a Smart Docs!</h2>
              <p>Gracias por registrarte. Para completar tu registro, ingresa el siguiente código de verificación en la aplicación:</p>
              
              <div class="code-container">
                <div class="code-label">Tu código de verificación</div>
                <div class="code">${code}</div>
              </div>
              
              <div class="note">
                <strong>⏰ Importante:</strong> Este código expirará en 15 minutos por seguridad.
              </div>
              
              <p>Si no te registraste en Smart Docs, puedes ignorar este email de forma segura.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Smart Docs. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email de verificación enviado:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error enviando email de verificación:', error);
    throw error;
  }
};

// Enviar email de reset de contraseña con código de 6 dígitos
export const sendPasswordResetEmail = async (email: string, code: string) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@smartdocs.com',
      to: email,
      subject: 'Código de Verificación - Smart Docs',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablecer Contraseña</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 20px; text-align: center; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .code-container { 
              text-align: center; 
              margin: 30px 0; 
              padding: 30px; 
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
              border-radius: 12px; 
              border: 2px dashed #7c3aed;
            }
            .code { 
              font-size: 36px; 
              font-weight: bold; 
              color: #7c3aed; 
              letter-spacing: 8px; 
              font-family: 'Courier New', monospace;
              margin: 10px 0;
              text-shadow: 0 2px 4px rgba(124,58,237,0.1);
            }
            .code-label { 
              font-size: 14px; 
              color: #64748b; 
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .warning { 
              background: linear-gradient(135deg, #fef3cd 0%, #fde68a 100%); 
              border: 1px solid #f59e0b; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 25px 0;
            }
            .warning-title { font-weight: bold; color: #92400e; margin-bottom: 10px; }
            .warning ul { margin: 10px 0; padding-left: 20px; }
            .warning li { color: #92400e; margin: 5px 0; }
            .footer { 
              background: #f8fafc; 
              padding: 30px; 
              text-align: center; 
              font-size: 14px; 
              color: #64748b; 
              border-top: 1px solid #e2e8f0;
            }
            .instructions { 
              background: #f1f5f9; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #7c3aed;
            }
            .step { margin: 10px 0; }
            .step-number { 
              display: inline-block; 
              background: #7c3aed; 
              color: white; 
              width: 24px; 
              height: 24px; 
              border-radius: 50%; 
              text-align: center; 
              line-height: 24px; 
              font-size: 12px; 
              margin-right: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 Smart Docs</div>
              <div class="subtitle">Sistema de Recuperación de Contraseña</div>
            </div>
            <div class="content">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Código de Verificación</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación para continuar:</p>
              
              <div class="code-container">
                <div class="code-label">Tu código de verificación es:</div>
                <div class="code">${code}</div>
                <p style="margin: 15px 0 0 0; color: #64748b; font-size: 14px;">Ingresa este código en la aplicación</p>
              </div>

              <div class="instructions">
                <h4 style="color: #374151; margin-top: 0;">📋 Instrucciones:</h4>
                <div class="step">
                  <span class="step-number">1</span>
                  Regresa a la aplicación Smart Docs
                </div>
                <div class="step">
                  <span class="step-number">2</span>
                  Ingresa el código de 6 dígitos mostrado arriba
                </div>
                <div class="step">
                  <span class="step-number">3</span>
                  Crea tu nueva contraseña segura
                </div>
              </div>
              
              <div class="warning">
                <div class="warning-title">⚠️ Información Importante:</div>
                <ul>
                  <li><strong>Este código expirará en 15 minutos</strong></li>
                  <li>Solo puedes usar este código una vez</li>
                  <li>Si no solicitaste este reset, ignora este email</li>
                </ul>
              </div>

              <p style="color: #64748b;">Si tienes problemas para ingresar el código, asegúrate de:</p>
              <ul style="color: #64748b;">
                <li>Escribir el código exactamente como aparece</li>
                <li>No incluir espacios adicionales</li>
                <li>Usar el código antes de que expire</li>
              </ul>
            </div>
            <div class="footer">
              <p><strong>¿No solicitaste este cambio?</strong></p>
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu cuenta permanece protegida.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              <p>© ${new Date().getFullYear()} Smart Docs. Todos los derechos reservados.</p>
              <p style="font-size: 12px; color: #94a3b8;">Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email de reset enviado:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error enviando email de reset:', error);
    throw error;
  }
};

// Enviar email de bienvenida (opcional)
export const sendWelcomeEmail = async (email: string, firstName?: string) => {
  try {
    const transporter = createTransporter();
    
    const name = firstName || 'Usuario';
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@smartdocs.com',
      to: email,
      subject: '¡Bienvenido a Smart Docs!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; color: #7c3aed; }
            .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
            .feature { 
              background: white; 
              padding: 20px; 
              margin: 15px 0; 
              border-radius: 6px; 
              border-left: 4px solid #7c3aed;
            }
            .footer { margin-top: 30px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Smart Docs</div>
            </div>
            <div class="content">
              <h2>¡Hola ${name}! 👋</h2>
              <p>¡Bienvenido a Smart Docs! Tu cuenta ha sido verificada exitosamente y ya puedes comenzar a usar todas nuestras funcionalidades.</p>

              <h3>¿Qué puedes hacer con Smart Docs?</h3>

              <div class="feature">
                <h4>📝 Gestión de Documentos</h4>
                <p>Crea, edita y organiza tus documentos de manera eficiente.</p>
              </div>
              
              <div class="feature">
                <h4>📁 Categorías y Organización</h4>
                <p>Organiza tus documentos en categorías para un acceso rápido.</p>
              </div>
              
              <div class="feature">
                <h4>🤝 Colaboración</h4>
                <p>Comparte documentos y colabora con tu equipo en tiempo real.</p>
              </div>
              
              <div class="feature">
                <h4>🔒 Seguridad</h4>
                <p>Tus documentos están protegidos con los más altos estándares de seguridad.</p>
              </div>
              
              <p>¡Estamos aquí para ayudarte a ser más productivo!</p>
            </div>
            <div class="footer">
              <p>Si tienes preguntas, no dudes en contactarnos.</p>
              <p>© ${new Date().getFullYear()} Smart Docs. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email de bienvenida enviado:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error);
    throw error;
  }
};
