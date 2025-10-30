#!/bin/bash

###############################################################################
# Script para ejecutar Tests E2E completos
# Sistema de Gestión Hospitalaria Integral
#
# Desarrollado por: Alfredo Manuel Reyes
# Empresa: agnt_ - Software Development Company
###############################################################################

set -e  # Exit on error

echo "========================================="
echo "🧪 Tests E2E - Sistema Hospitalario"
echo "========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Limpiando procesos...${NC}"

    # Matar backend si está corriendo
    pkill -f "nodemon.*server-modular.js" 2>/dev/null || true
    pkill -f "node.*server-modular.js" 2>/dev/null || true

    # Matar frontend si está corriendo (Playwright lo maneja, pero por si acaso)
    pkill -f "vite" 2>/dev/null || true

    echo -e "${GREEN}✅ Procesos terminados${NC}"
}

# Registrar cleanup al salir
trap cleanup EXIT INT TERM

# Verificar pre-requisitos
echo "📋 Verificando pre-requisitos..."
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL CLI (psql) no encontrado${NC}"
    echo "   Tests pueden fallar si la base de datos no está activa"
else
    echo -e "${GREEN}✅ PostgreSQL instalado${NC}"

    # Verificar si PostgreSQL está corriendo
    if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw hospital_management; then
        echo -e "${GREEN}✅ Base de datos 'hospital_management' encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️  Base de datos 'hospital_management' no encontrada${NC}"
        echo "   Ejecuta: cd backend && npx prisma db push"
    fi
fi

echo ""

# Verificar dependencias
echo "📦 Verificando dependencias..."
echo ""

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Instalando dependencias de frontend...${NC}"
    cd frontend && npm install && cd ..
fi
echo -e "${GREEN}✅ Dependencias frontend OK${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Instalando dependencias de backend...${NC}"
    cd backend && npm install && cd ..
fi
echo -e "${GREEN}✅ Dependencias backend OK${NC}"

echo ""

# Verificar navegadores Playwright
echo "🌐 Verificando navegadores Playwright..."
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}⚠️  Instalando navegadores Playwright...${NC}"
    cd frontend && npx playwright install chromium && cd ..
fi
echo -e "${GREEN}✅ Navegadores Playwright OK${NC}"

echo ""
echo "========================================="
echo "🚀 Iniciando Tests E2E"
echo "========================================="
echo ""

# Iniciar backend
echo "🔧 Iniciando backend (puerto 3001)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend responda
echo "⏳ Esperando respuesta del backend..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend activo en puerto 3001${NC}"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend no respondió después de 30 segundos${NC}"
        echo "   Revisa backend.log para más detalles"
        cat backend.log
        exit 1
    fi

    sleep 1
done

echo ""

# Ejecutar tests E2E
echo "🧪 Ejecutando tests E2E con Playwright..."
echo "   (Playwright iniciará frontend automáticamente en puerto 3000)"
echo ""

cd frontend

# Ejecutar tests
if npm run test:e2e; then
    echo ""
    echo "========================================="
    echo -e "${GREEN}✅ TESTS E2E COMPLETADOS EXITOSAMENTE${NC}"
    echo "========================================="
    TEST_EXIT=0
else
    echo ""
    echo "========================================="
    echo -e "${RED}❌ TESTS E2E FALLARON${NC}"
    echo "========================================="
    echo ""
    echo "📊 Para ver el reporte detallado:"
    echo "   npm run test:e2e:report"
    echo ""
    echo "🐛 Para debug:"
    echo "   npm run test:e2e:debug"
    TEST_EXIT=1
fi

cd ..

echo ""
echo "📋 Logs guardados en: backend.log"
echo ""

# cleanup() se ejecuta automáticamente por trap

exit $TEST_EXIT
