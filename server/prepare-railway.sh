#!/bin/bash

# 🚂 Script de preparación para Railway - SmartDocs Backend
# Ejecutar desde el directorio server/

echo "🚂 Preparando SmartDocs Backend para Railway..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio server/"
    exit 1
fi

# Verificar archivos necesarios
echo "📋 Verificando archivos de configuración..."

files=("railway.toml" "Dockerfile" "healthcheck.js" ".dockerignore")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file faltante"
    fi
done

# Verificar dependencias
echo "📦 Verificando dependencias..."
if npm list --depth=0 > /dev/null 2>&1; then
    echo "✅ Dependencias instaladas"
else
    echo "⚠️  Ejecutar: npm install"
fi

# Test de build
echo "🔨 Probando build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build exitoso"
    rm -rf dist  # Limpiar para Railway
else
    echo "❌ Error en build - revisar código"
fi

# Verificar variables de entorno template
if [ -f ".env.railway" ]; then
    echo "✅ Template de variables Railway disponible"
else
    echo "⚠️  .env.railway no encontrado"
fi

echo ""
echo "🎯 Próximos pasos:"
echo "1. Push del código a GitHub"
echo "2. Crear proyecto en Railway (https://railway.app)"
echo "3. Conectar repositorio GitHub"
echo "4. Configurar Root Directory: server"
echo "5. Agregar PostgreSQL al proyecto"
echo "6. Configurar variables de entorno desde .env.railway"
echo "7. ¡Deploy automático!"
echo ""
echo "📖 Guía completa: RAILWAY_DEPLOYMENT.md"
