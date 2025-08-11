#!/bin/bash

echo "🔍 Diagnóstico del Sistema Hospitalario"
echo "======================================"
echo ""

# Función para verificar URL
check_url() {
    local url=$1
    local name=$2
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $name: OK"
        return 0
    else
        echo "❌ $name: NO RESPONDE"
        return 1
    fi
}

# Función para verificar proceso
check_process() {
    local pattern=$1
    local name=$2
    local count=$(ps aux | grep -E "$pattern" | grep -v grep | wc -l)
    if [ $count -gt 0 ]; then
        echo "✅ $name: Corriendo ($count proceso(s))"
        return 0
    else
        echo "❌ $name: NO CORRIENDO"
        return 1
    fi
}

# Estado de servicios
echo "🌐 Estado de Servicios:"
check_url "http://localhost:3001/health" "Backend (3001)"
check_url "http://localhost:3000" "Frontend (3000)"
echo ""

# Estado de procesos
echo "📊 Estado de Procesos:"
check_process "node simple-server.js" "Backend Process"
check_process "vite" "Frontend Process"
echo ""

# Verificar puertos ocupados
echo "🔌 Puertos en uso:"
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Puerto 3001: En uso"
    lsof -i :3001 | tail -n +2 | awk '{print "   PID:", $2, "Comando:", $1}'
else
    echo "❌ Puerto 3001: Libre"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Puerto 3000: En uso"
    lsof -i :3000 | tail -n +2 | awk '{print "   PID:", $2, "Comando:", $1}'
else
    echo "❌ Puerto 3000: Libre"
fi
echo ""

# Verificar archivos clave
echo "📁 Archivos del sistema:"
if [ -f "backend/simple-server.js" ]; then
    echo "✅ Backend: simple-server.js existe"
else
    echo "❌ Backend: simple-server.js NO EXISTE"
fi

if [ -f "frontend/package.json" ]; then
    echo "✅ Frontend: package.json existe"
else
    echo "❌ Frontend: package.json NO EXISTE"
fi

if [ -f "frontend/src/App.tsx" ]; then
    echo "✅ Frontend: App.tsx existe"
else
    echo "❌ Frontend: App.tsx NO EXISTE"
fi
echo ""

# TypeScript check (si está en frontend)
if [ -d "frontend" ]; then
    echo "📝 Verificando TypeScript..."
    cd frontend
    if npx tsc --noEmit > /tmp/ts-check.log 2>&1; then
        echo "✅ TypeScript: Sin errores"
    else
        echo "❌ TypeScript: Errores encontrados"
        echo "   Ver detalles: cat /tmp/ts-check.log"
        echo "   Errores comunes:"
        grep -E "(error TS|Property.*undefined)" /tmp/ts-check.log | head -3 | sed 's/^/   /'
    fi
    cd ..
    echo ""
fi

# Test de conectividad básica
echo "🔗 Test de conectividad:"
if curl -s http://localhost:3001/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"admin","password":"admin123"}' | grep -q "token"; then
    echo "✅ Login API: Funcional"
else
    echo "❌ Login API: Error"
fi

if curl -s http://localhost:3001/api/hospitalization/stats | grep -q "pacientesHospitalizados"; then
    echo "✅ Hospitalización API: Funcional"
else
    echo "❌ Hospitalización API: Error"
fi
echo ""

# Resumen y recomendaciones
echo "💡 Recomendaciones:"
if ! check_url "http://localhost:3001/health" "Backend" > /dev/null; then
    echo "   • Iniciar backend: cd backend && node simple-server.js"
fi

if ! check_url "http://localhost:3000" "Frontend" > /dev/null; then
    echo "   • Iniciar frontend: cd frontend && npm run dev"
fi

if ! check_process "node simple-server.js" "Backend" > /dev/null && \
   ! check_process "vite" "Frontend" > /dev/null; then
    echo "   • Usar script de inicio: ./start-dev.sh"
fi

echo ""
echo "🌐 URLs del sistema:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:3001"
echo "   • Health:   http://localhost:3001/health"
echo ""
echo "🔑 Credenciales: admin/admin123 o enfermero1/enfermero123"