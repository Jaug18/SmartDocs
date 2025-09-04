# 🚂 Guía de Despliegue en Railway - SmartDocs Backend

## 📋 Pasos para desplegar en Railway

### 1. 🔧 Preparación del proyecto

✅ **Archivos ya configurados:**
- `railway.toml` - Configuración de Railway
- `Dockerfile` - Contenedor optimizado para Railway
- `healthcheck.js` - Health check para monitoreo
- `.dockerignore` - Archivos a ignorar en Docker
- `package.json` - Scripts actualizados para Railway

### 2. 🌐 Crear cuenta y proyecto en Railway

1. **Ir a Railway**: https://railway.app
2. **Iniciar sesión** con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Seleccionar** tu repositorio `smartdocs`
5. **Configure** el servicio:
   - **Root Directory**: `server`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### 3. 🗄️ Agregar base de datos PostgreSQL

1. En tu proyecto de Railway: **+ Add Service**
2. **Database** → **PostgreSQL**
3. Railway automáticamente:
   - ✅ Crea la base de datos
   - ✅ Genera la variable `DATABASE_URL`
   - ✅ La conecta a tu servicio

### 4. ⚙️ Configurar variables de entorno

En el dashboard de Railway, ve a tu servicio → **Variables**, agrega:

```bash
# Servidor
NODE_ENV=production
PORT=8002

# JWT (GENERAR NUEVOS PARA PRODUCCIÓN)
JWT_SECRET=tu_jwt_secret_super_seguro_64_caracteres_minimo
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_64_caracteres_minimo

# OpenAI (opcional)
OPENAI_API_KEY=sk-proj-tu_api_key_de_openai

# Email (opcional - para verificación de email)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# CORS (URL del frontend)
FRONTEND_URL=https://smartdocs.vercel.app
```

### 5. 🔐 Generar JWT secrets seguros

```bash
# Opción 1: Con Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Opción 2: Con OpenSSL
openssl rand -hex 64

# Usar cada resultado para JWT_SECRET y JWT_REFRESH_SECRET
```

### 6. 🚀 Deploy automático

1. **Commit y push** tus cambios:
```bash
git add .
git commit -m "feat: configuración Railway"
git push origin main
```

2. **Railway detecta automáticamente** y despliega
3. **Monitor del deploy** en Railway dashboard
4. **URL generada** automáticamente: `https://tu-proyecto.railway.app`

### 7. ✅ Verificar deployment

```bash
# Health check
curl https://tu-proyecto.railway.app/health

# API docs
curl https://tu-proyecto.railway.app/api-docs

# Test básico de API
curl https://tu-proyecto.railway.app/api/auth/health
```

### 8. 🌐 Configurar dominio personalizado (opcional)

1. En Railway: **Settings** → **Domains**
2. **Custom Domain** → Agregar tu dominio
3. **Configurar DNS** en tu proveedor:
   - Tipo: `CNAME`
   - Nombre: `api` (o el subdominio que prefieras)
   - Valor: `tu-proyecto.railway.app`

## 📊 Monitoreo y logs

### Ver logs en tiempo real:
```bash
# En Railway dashboard → Service → Deployments → View Logs
```

### Métricas disponibles:
- ✅ **CPU usage**
- ✅ **Memory usage** 
- ✅ **Network usage**
- ✅ **Response times**
- ✅ **Error rates**

## 🔧 Comandos útiles Railway CLI (opcional)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Logs en tiempo real
railway logs

# Variables de entorno
railway variables

# Connect a la base de datos
railway connect postgresql
```

## 💰 Costos estimados

- **Backend + PostgreSQL**: ~$5/mes
- **Incluye**:
  - 500MB RAM
  - 1GB storage
  - PostgreSQL incluida
  - SSL automático
  - Monitoreo básico

## 🚨 Troubleshooting

### Error: "Build failed"
```bash
# Verificar logs de build en Railway dashboard
# Común: dependencias faltantes o variables mal configuradas
```

### Error: "Health check failed"
```bash
# Verificar que el endpoint /health responda correctamente
curl https://tu-proyecto.railway.app/health
```

### Error: "Database connection failed"
```bash
# Verificar que DATABASE_URL esté configurada automáticamente
# No configurar manualmente - Railway la inyecta
```

### Error de CORS
```bash
# Agregar la URL del frontend a FRONTEND_URL
# Verificar que allowedOrigins incluya tu dominio de Vercel
```

## ✅ Checklist final

- [ ] Repositorio con código actualizado
- [ ] Servicio creado en Railway
- [ ] PostgreSQL agregada al proyecto
- [ ] Variables de entorno configuradas
- [ ] JWT secrets generados y configurados
- [ ] Deploy exitoso (status verde)
- [ ] Health check funcionando
- [ ] API docs accesibles
- [ ] CORS configurado para frontend

## 🔗 URLs importantes

Una vez desplegado tendrás:
- **API Backend**: `https://tu-proyecto.railway.app`
- **Health Check**: `https://tu-proyecto.railway.app/health`
- **API Documentation**: `https://tu-proyecto.railway.app/api-docs`
- **Database**: Accesible desde Railway dashboard

¡Tu backend SmartDocs estará listo en Railway! 🎉
