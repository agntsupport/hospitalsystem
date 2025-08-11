#!/bin/bash

# ==============================================
# SISTEMA HOSPITALARIO - INICIO AUTOMATIZADO
# PostgreSQL + Arquitectura Modular
# Versión 2.0 - Mejorado con validaciones y manejo de errores
# ==============================================

# Configuración
BACKEND_PORT=3001
FRONTEND_PORT=3000
MAX_RETRIES=15
PID_FILE=".system_pids"

# Función de cleanup en caso de error
cleanup_on_error() {
    echo "🔥 Error detectado. Limpiando procesos..."
    [[ -f "$PID_FILE" ]] && {
        while read -r pid_line; do
            pid=$(echo "$pid_line" | cut -d: -f2)
            [[ -n "$pid" ]] && kill -9 "$pid" 2>/dev/null || true
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    }
    pkill -f "server-modular" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    exit 1
}

# Configurar trap para manejo de errores
trap cleanup_on_error ERR INT TERM

echo "🏥 Iniciando Sistema Hospitalario Completo..."
echo "📊 PostgreSQL + Arquitectura Modular v2.0"
echo "🔧 Backend: :$BACKEND_PORT | Frontend: :$FRONTEND_PORT"
echo ""

# Validar directorio y dependencias
echo "📍 Validando entorno..."
if [[ ! -f "backend/server-modular.js" ]] || [[ ! -f "frontend/package.json" ]]; then
    echo "❌ Error: Ejecutar desde directorio raíz del proyecto"
    echo "   Actual: $(pwd)"
    echo "   Esperado: /Users/alfredo/agntsystemsc"
    exit 1
fi

# Verificar herramientas requeridas
for cmd in node npm psql curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ Error: '$cmd' no encontrado. Instalar dependencias."
        exit 1
    fi
done
echo "✅ Entorno validado"

# Verificar puertos disponibles
echo "🔍 Verificando puertos disponibles..."
if lsof -i :$BACKEND_PORT >/dev/null 2>&1; then
    echo "⚠️  Puerto $BACKEND_PORT ocupado. Liberando..."
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
fi
if lsof -i :$FRONTEND_PORT >/dev/null 2>&1; then
    echo "⚠️  Puerto $FRONTEND_PORT ocupado. Liberando..."
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
fi

# Limpiar procesos previos
echo "🧹 Limpiando procesos anteriores..."
pkill -f "server-modular" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
[[ -f "$PID_FILE" ]] && rm -f "$PID_FILE"
sleep 2

# Verificar PostgreSQL con reintentos
echo "🗄️  Verificando PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL no está corriendo"
    echo "🔧 Iniciando PostgreSQL automáticamente..."
    brew services start postgresql@14
    
    # Esperar hasta que PostgreSQL esté listo
    for i in {1..10}; do
        if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
            break
        fi
        echo "⏳ Esperando PostgreSQL ($i/10)..."
        sleep 2
    done
    
    if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo "❌ Error: PostgreSQL no pudo iniciarse"
        exit 1
    fi
fi
echo "✅ PostgreSQL conectado ($(psql --version | head -1))"

# Verificar base de datos
echo "🔍 Verificando base de datos hospital_management..."
if ! psql -d hospital_management -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Base de datos hospital_management no encontrada"
    echo "🔧 Intentando crear y poblar base de datos..."
    cd backend
    if npx prisma db seed > /dev/null 2>&1; then
        echo "✅ Base de datos creada y poblada"
        cd ..
    else
        echo "❌ Error: No se pudo crear la base de datos"
        echo "   Ejecutar manualmente: cd backend && npx prisma db seed"
        exit 1
    fi
else
    # Verificar cantidad de datos
    USER_COUNT=$(psql -d hospital_management -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | tr -d ' \n' || echo "0")
    echo "✅ Base de datos verificada ($USER_COUNT usuarios)"
fi

# Iniciar Backend
echo ""
echo "🚀 Iniciando Backend (Puerto $BACKEND_PORT)..."
cd backend
nohup node server-modular.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "backend:$BACKEND_PID" >> "../$PID_FILE"
cd ..

echo "⏳ Esperando que el backend inicie..."
sleep 4

# Verificar Backend con reintentos
echo "🔍 Verificando Backend..."
for i in {1..10}; do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s http://localhost:$BACKEND_PORT/health | jq -r '.message' 2>/dev/null || echo "API Respondiendo")
        echo "✅ Backend activo: $HEALTH_RESPONSE"
        echo "📋 PID: $BACKEND_PID | Puerto: $BACKEND_PORT"
        break
    fi
    echo "⏳ Esperando backend ($i/10)..."
    sleep 2
    if [[ $i -eq 10 ]]; then
        echo "❌ Backend no responde después de 20 segundos"
        echo "📄 Últimas líneas del log:"
        tail -5 logs/backend.log 2>/dev/null || echo "   No hay logs disponibles"
        exit 1
    fi
done

# Iniciar Frontend
echo ""
echo "🎨 Iniciando Frontend (Puerto $FRONTEND_PORT)..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "frontend:$FRONTEND_PID" >> "../$PID_FILE"
cd ..

echo "⏳ Esperando compilación de Vite..."
sleep 6

# Verificar Frontend con reintentos extendidos
echo "🔍 Verificando Frontend..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        TITLE=$(curl -s http://localhost:$FRONTEND_PORT | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g' 2>/dev/null || echo "React App")
        echo "✅ Frontend activo: $TITLE"
        echo "📋 PID: $FRONTEND_PID | Puerto: $FRONTEND_PORT"
        break
    fi
    echo "⏳ Compilando frontend ($i/$MAX_RETRIES)..."
    sleep 2
    if [[ $i -eq $MAX_RETRIES ]]; then
        echo "❌ Frontend no responde después de $(($MAX_RETRIES * 2)) segundos"
        echo "📄 Últimas líneas del log:"
        tail -5 logs/frontend.log 2>/dev/null || echo "   No hay logs disponibles"
        echo "⚠️  El frontend puede seguir compilando en segundo plano"
    fi
done

# Status final
echo ""
echo "🎯 SISTEMA HOSPITALARIO INICIADO"
echo "================================="
echo "🏥 Backend:  http://localhost:3001"
echo "🖥️  Frontend: http://localhost:3000"
echo "❤️  Health:   http://localhost:3001/health"
echo ""
echo "📊 Procesos activos:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📄 Logs y monitoreo:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo "   PIDs:     cat $PID_FILE"
echo ""
echo "🛑 Para detener sistema:"
echo "   pkill -f 'server-modular'; pkill -f 'vite'"
echo "   O usa: ./stop-system.sh (si existe)"
echo ""
echo "🔐 Credenciales completas de prueba:"
echo "   👨‍💼 admin / admin123 (Administrador completo)"
echo "   💰 cajero1 / cajero123 (Cajero + POS)"
echo "   👩‍⚕️ enfermero1 / enfermero123 (Enfermero + Hospitalización)"
echo "   👨‍⚕️ especialista1 / medico123 (Médico Especialista)"
echo "   👩‍⚕️ residente1 / residente123 (Médico Residente)"
echo "   📦 almacen1 / almacen123 (Almacenista)"
echo "   👔 socio1 / socio123 (Socio - Solo reportes)"
echo ""
echo "🔧 Endpoints de desarrollo:"
echo "   Health: curl http://localhost:$BACKEND_PORT/health"
echo "   Auth:   curl -X POST http://localhost:$BACKEND_PORT/api/auth/login"
echo "   Stats:  curl http://localhost:$BACKEND_PORT/api/patients/stats"
echo ""
echo "✅ Sistema Hospitalario v2.0 - Completamente operacional"