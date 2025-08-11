#!/bin/bash

echo "🚀 Sistema de Gestión Hospitalaria - Inicio de Desarrollo"
echo "========================================================"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    pkill -f "node simple-server.js"
    pkill -f "vite"
    echo "✅ Servidores detenidos"
    exit 0
}

# Configurar señales para limpieza
trap cleanup SIGINT SIGTERM

# Limpiar procesos previos
echo "🧹 Limpiando procesos previos..."
pkill -f "node simple-server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/simple-server.js" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    echo "   cd /Users/alfredo/agntsystemsc && ./start-dev.sh"
    exit 1
fi

# Iniciar backend
echo "📦 Iniciando backend en puerto 3001..."
cd backend
node simple-server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar y verificar backend
sleep 3
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend iniciado correctamente (PID: $BACKEND_PID)"
else
    echo "❌ Error: Backend no responde"
    echo "   Verificar logs: tail -f backend.log"
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando frontend en puerto 3000..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Esperar y verificar frontend
echo "⏳ Esperando que el frontend compile..."
sleep 8

if curl -s http://localhost:3000 | grep -q "Sistema de Gestión"; then
    echo "✅ Frontend iniciado correctamente (PID: $FRONTEND_PID)"
else
    echo "⚠️  Frontend puede estar compilando aún..."
    echo "   Verificar en: http://localhost:3000"
    echo "   Logs: tail -f frontend.log"
fi

echo ""
echo "🌐 URLs del Sistema:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001" 
echo "   Health:   http://localhost:3001/health"
echo ""
echo "🔑 Credenciales de desarrollo:"
echo "   👨‍💼 admin / admin123 (Administrador)"
echo "   👩‍⚕️ enfermero1 / enfermero123 (Enfermero + Hospitalización)"
echo "   👨‍⚕️ especialista1 / medico123 (Médico Especialista)"
echo "   💰 cajero1 / cajero123 (Cajero + POS)"
echo ""
echo "📊 Monitoreo:"
echo "   Logs backend:  tail -f backend.log"
echo "   Logs frontend: tail -f frontend.log"
echo ""
echo "🛑 Para detener: Ctrl+C"
echo "✨ Sistema listo para desarrollo!"

# Esperar indefinidamente
while true; do
    sleep 1
    # Verificar que los procesos sigan corriendo
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend se detuvo inesperadamente"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend se detuvo inesperadamente"
        break
    fi
done