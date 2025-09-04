# SmartDocs

## Un editor de documentos avanzado con IA integrada

SmartDocs es una aplicación web moderna que combina un editor de texto enriquecido con capacidades de inteligencia artificial, permitiendo a los usuarios crear, editar y gestionar documentos de forma colaborativa.

## 🚀 Características principales

- **Editor rico**: Editor WYSIWYG con TipTap
- **IA integrada**: Asistente de escritura con GPT-4
- **Gestión de usuarios**: Autenticación completa con roles
- **Colaboración**: Compartir documentos entre usuarios
- **Versionado**: Control de versiones de documentos
- **Responsive**: Diseño adaptativo para todos los dispositivos
- **Temas**: Modo claro y oscuro

## 🛠️ Tecnologías utilizadas

### Frontend

- **Vite** - Build tool y dev server
- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **TailwindCSS** - Framework de CSS
- **shadcn/ui** - Componentes UI
- **TipTap** - Editor de texto enriquecido
- **React Query** - Gestión de estado del servidor

### Backend

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Winston** - Logging
- **Nodemailer** - Envío de emails

## 📦 Instalación y configuración

### Prerrequisitos

- **Node.js** 18+ y npm - [Instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Docker** y **Docker Compose** - [Instalar Docker](https://docs.docker.com/get-docker/)
- **Git** - [Instalar Git](https://git-scm.com/downloads)

### 1. Clonar el repositorio

```bash
git clone https://github.com/jaug17/smartdocs.git
cd smartdocs
```

### 2. Configurar la base de datos

```bash
# Iniciar PostgreSQL con Docker Compose
docker-compose up -d postgres

# Esperar a que la base de datos se inicialice (30-60 segundos)
docker logs smartdocs_postgres -f
```

### 3. Configurar el backend

```bash
# Navegar al directorio del servidor
cd server

# Instalar dependencias del backend
npm install

# Configurar variables de entorno (opcional)
cp .env.example .env
# Editar .env si necesitas cambiar configuraciones

# Aplicar migraciones de la base de datos
npx prisma migrate deploy

# Generar el cliente de Prisma
npx prisma generate

# Iniciar el servidor backend en modo desarrollo
npm run dev
```

El servidor backend estará disponible en `http://localhost:8002`

### 4. Configurar el frontend

```bash
# En una nueva terminal, navegar a la raíz del proyecto
cd ..

# Instalar dependencias del frontend
npm install

# Iniciar el servidor de desarrollo del frontend
npm run dev
```

El frontend estará disponible en `http://localhost:8001`

## 🚀 Comandos disponibles

### Frontend (desde la raíz del proyecto)

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build de producción
npm run lint         # Ejecutar linter
```

### Backend (desde /server)

```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar TypeScript
npm run start            # Iniciar servidor de producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:studio    # Abrir Prisma Studio
```

### Base de datos

```bash
# Desde /server
npx prisma migrate dev       # Crear y aplicar nueva migración
npx prisma migrate deploy    # Aplicar migraciones en producción
npx prisma studio           # Interfaz web para la base de datos
npx prisma db seed          # Ejecutar semillas (si están configuradas)
```

## 🔧 Configuración

### Variables de entorno del servidor

Crear archivo `.env` en la carpeta `server/`:

```env
# Base de datos
DATABASE_URL="postgresql://admin:password@localhost:5432/smartdocs"

# JWT
JWT_SECRET="tu_secreto_jwt_aqui"
JWT_REFRESH_SECRET="tu_secreto_refresh_jwt_aqui"

# Email (opcional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu_email@gmail.com"
EMAIL_PASS="tu_password_de_aplicacion"

# OpenAI (opcional para IA)
OPENAI_API_KEY="tu_api_key_de_openai"

# Entorno
NODE_ENV="development"
PORT=8002
```

### Configuración de Docker

El proyecto incluye `docker-compose.yml` con:

- **PostgreSQL** en puerto `5432`
- **pgAdmin** en puerto `8080` (opcional)

Credenciales por defecto:

- PostgreSQL: `admin` / `password`
- pgAdmin: `admin@smartdocs.com` / `password`

## 🌐 Acceso a la aplicación

Una vez configurado todo:

1. **Frontend**: <http://localhost:8001>
2. **Backend API**: <http://localhost:8002>
3. **Documentación API (Swagger)**: <http://localhost:8002/api-docs>
4. **Base de datos**: localhost:5432
5. **pgAdmin** (opcional): <http://localhost:8080>

## 📚 Documentación de la API

La API está completamente documentada con **Swagger/OpenAPI 3.0**:

- **URL**: <http://localhost:8002/api-docs>
- **Formato JSON**: <http://localhost:8002/swagger.json>

### Endpoints principales

- **Autenticación** (`/api/auth/*`):
  - Registro, login, verificación de email
  - Renovación de tokens, logout
  - Restablecimiento de contraseña

- **Usuarios** (`/api/users/*`):
  - Gestión de perfil y estadísticas
  - CRUD de documentos y categorías
  - Subida de imágenes de perfil
  - Control de versiones de documentos
  - Compartir documentos entre usuarios

- **IA** (`/api/AIGPT41Nano`):
  - Consultas al asistente de inteligencia artificial
  - Generación de contenido automatizado

- **Administración** (`/api/admin/*`):
  - Gestión de usuarios (solo administradores)
  - Estadísticas del sistema

### Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación:

```bash
# Ejemplo de uso con curl
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:8002/api/users/profile
```

## 👥 Uso

1. **Registro**: Crea una cuenta nueva
2. **Verificación**: Confirma tu email (si está configurado)
3. **Login**: Inicia sesión con tus credenciales
4. **Crear documento**: Usa el editor para crear contenido
5. **IA**: Usa el asistente de IA para mejorar tu texto
6. **Compartir**: Comparte documentos con otros usuarios