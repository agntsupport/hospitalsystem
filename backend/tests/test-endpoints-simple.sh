#!/bin/bash

# ==============================================
# SCRIPT SIMPLE DE TESTING - ENDPOINTS API
# ==============================================

API_URL="http://localhost:3001/api"

echo "🧪 Testing básico de endpoints del sistema de solicitudes..."
echo ""

# 1. Health check
echo "1. Health check..."
curl -s "$API_URL/../health" | grep -q "ok" && echo "✅ Health OK" || echo "❌ Health FAIL"

# 2. Login
echo "2. Autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"enfermero1","password":"enfermero123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ ! -z "$TOKEN" ]; then
  echo "✅ Login exitoso"
else
  echo "❌ Login fallido"
  exit 1
fi

# 3. Verificar rutas de solicitudes existen
echo "3. Verificando rutas de solicitudes..."
SOLICITUDES_RESPONSE=$(curl -s -X GET "$API_URL/solicitudes" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SOLICITUDES_RESPONSE" | grep -q "data\|total"; then
  echo "✅ Endpoint /solicitudes responde"
else
  echo "❌ Endpoint /solicitudes no responde"
fi

# 4. Verificar estadísticas
echo "4. Verificando estadísticas..."
STATS_RESPONSE=$(curl -s -X GET "$API_URL/solicitudes/stats/resumen" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | grep -q "totalSolicitudes"; then
  echo "✅ Endpoint /solicitudes/stats/resumen responde"
else
  echo "❌ Endpoint /solicitudes/stats/resumen no responde"
fi

# 5. Verificar notificaciones
echo "5. Verificando notificaciones..."
NOTIF_RESPONSE=$(curl -s -X GET "$API_URL/notificaciones" \
  -H "Authorization: Bearer $TOKEN")

if echo "$NOTIF_RESPONSE" | grep -q "data\|total"; then
  echo "✅ Endpoint /notificaciones responde"
else
  echo "❌ Endpoint /notificaciones no responde"
fi

# 6. Verificar conteo de notificaciones
echo "6. Verificando conteo de notificaciones no leídas..."
COUNT_RESPONSE=$(curl -s -X GET "$API_URL/notificaciones/no-leidas/count" \
  -H "Authorization: Bearer $TOKEN")

if echo "$COUNT_RESPONSE" | grep -q "count"; then
  COUNT=$(echo $COUNT_RESPONSE | grep -o '"count":[0-9]*' | sed 's/"count"://')
  echo "✅ Endpoint /notificaciones/no-leidas/count responde: $COUNT notificaciones"
else
  echo "❌ Endpoint /notificaciones/no-leidas/count no responde"
fi

# 7. Verificar pacientes (necesario para solicitudes)
echo "7. Verificando acceso a pacientes..."
PACIENTES_RESPONSE=$(curl -s -X GET "$API_URL/patients?limit=1" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PACIENTES_RESPONSE" | grep -q "data"; then
  echo "✅ Endpoint /patients responde"
else
  echo "❌ Endpoint /patients no responde"
fi

# 8. Verificar productos (necesario para solicitudes)
echo "8. Verificando acceso a productos..."
PRODUCTOS_RESPONSE=$(curl -s -X GET "$API_URL/inventory/products?limit=1" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PRODUCTOS_RESPONSE" | grep -q "data"; then
  echo "✅ Endpoint /inventory/products responde"
else
  echo "❌ Endpoint /inventory/products no responde"
fi

echo ""
echo "🎯 Testing básico completado"
echo ""

# Mostrar estructura de respuestas para debug
echo "📋 Muestras de respuestas:"
echo ""
echo "Solicitudes:"
echo $SOLICITUDES_RESPONSE | head -c 200
echo "..."
echo ""
echo "Estadísticas:"
echo $STATS_RESPONSE | head -c 200
echo "..."
echo ""
echo "Notificaciones:"
echo $NOTIF_RESPONSE | head -c 200
echo "..."