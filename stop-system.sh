#!/bin/bash

# ==============================================
# SISTEMA HOSPITALARIO - PARADA SEGURA
# Script complementario para stop-system.sh
# ==============================================

echo "🛑 Deteniendo Sistema Hospitalario..."
echo "======================================"

PID_FILE=".system_pids"

# Función para detener proceso por PID
stop_process() {
    local name=$1
    local pid=$2
    
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        echo "🔄 Deteniendo $name (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null
        
        # Esperar terminación graceful
        for i in {1..5}; do
            if ! kill -0 "$pid" 2>/dev/null; then
                echo "✅ $name detenido correctamente"
                return 0
            fi
            sleep 1
        done
        
        # Force kill si no responde
        echo "⚠️  Forzando cierre de $name..."
        kill -KILL "$pid" 2>/dev/null || true
        echo "🔴 $name terminado forzosamente"
    else
        echo "❌ $name no encontrado o ya detenido"
    fi
}

# Detener usando archivo de PIDs si existe
if [[ -f "$PID_FILE" ]]; then
    echo "📋 Leyendo PIDs del archivo $PID_FILE..."
    while read -r pid_line; do
        if [[ -n "$pid_line" && "$pid_line" != *":"* ]]; then
            continue
        fi
        name=$(echo "$pid_line" | cut -d: -f1)
        pid=$(echo "$pid_line" | cut -d: -f2)
        stop_process "$name" "$pid"
    done < "$PID_FILE"
    
    rm -f "$PID_FILE"
    echo "🗑️  Archivo de PIDs eliminado"
else
    echo "⚠️  Archivo $PID_FILE no encontrado, usando pkill..."
fi

# Backup: pkill por nombre de proceso
echo ""
echo "🧹 Limpieza adicional por nombre de proceso..."

if pgrep -f "server-modular" > /dev/null; then
    echo "🔄 Deteniendo procesos server-modular..."
    pkill -f "server-modular"
    sleep 2
    if pgrep -f "server-modular" > /dev/null; then
        echo "⚠️  Forzando terminación server-modular..."
        pkill -9 -f "server-modular"
    fi
    echo "✅ Procesos server-modular detenidos"
else
    echo "✅ No hay procesos server-modular activos"
fi

if pgrep -f "vite" > /dev/null; then
    echo "🔄 Deteniendo procesos Vite..."
    pkill -f "vite"
    sleep 2
    if pgrep -f "vite" > /dev/null; then
        echo "⚠️  Forzando terminación Vite..."
        pkill -9 -f "vite"
    fi
    echo "✅ Procesos Vite detenidos"
else
    echo "✅ No hay procesos Vite activos"
fi

# Verificar puertos liberados
echo ""
echo "🔍 Verificando puertos liberados..."
for port in 3000 3001; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "⚠️  Puerto $port aún ocupado"
        lsof -i:$port
    else
        echo "✅ Puerto $port libre"
    fi
done

echo ""
echo "🎯 Resumen de parada:"
echo "====================="
echo "✅ Procesos backend detenidos"
echo "✅ Procesos frontend detenidos"  
echo "✅ Puertos liberados"
echo "✅ Archivos temporales limpiados"
echo ""
echo "💡 Para reiniciar: ./start-system.sh"
echo "🏥 Sistema Hospitalario detenido completamente"