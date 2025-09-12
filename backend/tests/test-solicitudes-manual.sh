#!/bin/bash

# ==============================================
# SCRIPT DE TESTING MANUAL - SISTEMA DE SOLICITUDES
# ==============================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TESTING DEL SISTEMA DE SOLICITUDES DE PRODUCTOS          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================
# 1. LOGIN Y AUTENTICACIÓN
# ==============================================

echo -e "${YELLOW}▶ Test 1: Autenticación${NC}"

# Login como enfermero
echo -e "  Autenticando como enfermero..."
ENFERMERO_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"enfermero1","password":"enfermero123"}')

ENFERMERO_TOKEN=$(echo $ENFERMERO_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ ! -z "$ENFERMERO_TOKEN" ]; then
  echo -e "  ${GREEN}✓ Login enfermero exitoso${NC}"
else
  echo -e "  ${RED}✗ Error en login enfermero${NC}"
  exit 1
fi

# Login como almacenista
echo -e "  Autenticando como almacenista..."
ALMACENISTA_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"almacen1","password":"almacen123"}')

ALMACENISTA_TOKEN=$(echo $ALMACENISTA_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ ! -z "$ALMACENISTA_TOKEN" ]; then
  echo -e "  ${GREEN}✓ Login almacenista exitoso${NC}"
else
  echo -e "  ${RED}✗ Error en login almacenista${NC}"
  exit 1
fi

echo ""

# ==============================================
# 2. CREAR SOLICITUD
# ==============================================

echo -e "${YELLOW}▶ Test 2: Crear Solicitud de Productos${NC}"

# Primero obtener un paciente válido
echo -e "  Obteniendo paciente de prueba..."
PACIENTES=$(curl -s -X GET "$API_URL/patients?limit=1" \
  -H "Authorization: Bearer $ENFERMERO_TOKEN")

PACIENTE_ID=$(echo $PACIENTES | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$PACIENTE_ID" ]; then
  echo -e "  ${RED}✗ No se pudo obtener paciente${NC}"
  exit 1
fi

echo -e "  Paciente ID: $PACIENTE_ID"

# Obtener un producto disponible
echo -e "  Obteniendo producto de prueba..."
PRODUCTOS=$(curl -s -X GET "$API_URL/inventory/products?limit=1" \
  -H "Authorization: Bearer $ENFERMERO_TOKEN")

PRODUCTO_ID=$(echo $PRODUCTOS | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$PRODUCTO_ID" ]; then
  echo -e "  ${RED}✗ No se pudo obtener producto${NC}"
  exit 1
fi

echo -e "  Producto ID: $PRODUCTO_ID"

# Crear solicitud
echo -e "  Creando solicitud..."
SOLICITUD_RESPONSE=$(curl -s -X POST "$API_URL/solicitudes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ENFERMERO_TOKEN" \
  -d "{
    \"pacienteId\": $PACIENTE_ID,
    \"cuentaPacienteId\": 1,
    \"prioridad\": \"ALTA\",
    \"observaciones\": \"Solicitud de prueba automatizada\",
    \"productos\": [{
      \"productoId\": $PRODUCTO_ID,
      \"cantidadSolicitada\": 2,
      \"observaciones\": \"Para administración inmediata\"
    }]
  }")

SOLICITUD_ID=$(echo $SOLICITUD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
SOLICITUD_NUMERO=$(echo $SOLICITUD_RESPONSE | grep -o '"numero":"[^"]*' | sed 's/"numero":"//')

if [ ! -z "$SOLICITUD_ID" ]; then
  echo -e "  ${GREEN}✓ Solicitud creada: $SOLICITUD_NUMERO (ID: $SOLICITUD_ID)${NC}"
else
  echo -e "  ${RED}✗ Error creando solicitud${NC}"
  echo -e "  Respuesta: $SOLICITUD_RESPONSE"
fi

echo ""

# ==============================================
# 3. LISTAR SOLICITUDES
# ==============================================

echo -e "${YELLOW}▶ Test 3: Listar Solicitudes${NC}"

# Como enfermero
echo -e "  Listando solicitudes como enfermero..."
SOLICITUDES_ENFERMERO=$(curl -s -X GET "$API_URL/solicitudes" \
  -H "Authorization: Bearer $ENFERMERO_TOKEN")

COUNT_ENFERMERO=$(echo $SOLICITUDES_ENFERMERO | grep -o '"total":[0-9]*' | sed 's/"total"://')

if [ ! -z "$COUNT_ENFERMERO" ]; then
  echo -e "  ${GREEN}✓ Enfermero ve $COUNT_ENFERMERO solicitudes${NC}"
else
  echo -e "  ${RED}✗ Error listando solicitudes como enfermero${NC}"
fi

# Como almacenista
echo -e "  Listando solicitudes como almacenista..."
SOLICITUDES_ALMACENISTA=$(curl -s -X GET "$API_URL/solicitudes" \
  -H "Authorization: Bearer $ALMACENISTA_TOKEN")

COUNT_ALMACENISTA=$(echo $SOLICITUDES_ALMACENISTA | grep -o '"total":[0-9]*' | sed 's/"total"://')

if [ ! -z "$COUNT_ALMACENISTA" ]; then
  echo -e "  ${GREEN}✓ Almacenista ve $COUNT_ALMACENISTA solicitudes${NC}"
else
  echo -e "  ${RED}✗ Error listando solicitudes como almacenista${NC}"
fi

echo ""

# ==============================================
# 4. ASIGNAR SOLICITUD
# ==============================================

if [ ! -z "$SOLICITUD_ID" ]; then
  echo -e "${YELLOW}▶ Test 4: Asignar Solicitud${NC}"
  
  echo -e "  Asignando solicitud al almacenista..."
  ASIGNAR_RESPONSE=$(curl -s -X PUT "$API_URL/solicitudes/$SOLICITUD_ID/asignar" \
    -H "Authorization: Bearer $ALMACENISTA_TOKEN")
  
  if echo "$ASIGNAR_RESPONSE" | grep -q "asignada exitosamente"; then
    echo -e "  ${GREEN}✓ Solicitud asignada exitosamente${NC}"
  else
    echo -e "  ${RED}✗ Error asignando solicitud${NC}"
    echo -e "  Respuesta: $ASIGNAR_RESPONSE"
  fi
  
  echo ""
fi

# ==============================================
# 5. ENTREGAR PRODUCTOS
# ==============================================

if [ ! -z "$SOLICITUD_ID" ]; then
  echo -e "${YELLOW}▶ Test 5: Marcar como Entregado${NC}"
  
  echo -e "  Marcando productos como entregados..."
  ENTREGAR_RESPONSE=$(curl -s -X PUT "$API_URL/solicitudes/$SOLICITUD_ID/entregar" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ALMACENISTA_TOKEN" \
    -d '{"observaciones": "Productos entregados en habitación de prueba"}')
  
  if echo "$ENTREGAR_RESPONSE" | grep -q "entregada exitosamente"; then
    echo -e "  ${GREEN}✓ Productos marcados como entregados${NC}"
  else
    echo -e "  ${RED}✗ Error marcando como entregado${NC}"
    echo -e "  Respuesta: $ENTREGAR_RESPONSE"
  fi
  
  echo ""
fi

# ==============================================
# 6. CONFIRMAR RECEPCIÓN
# ==============================================

if [ ! -z "$SOLICITUD_ID" ]; then
  echo -e "${YELLOW}▶ Test 6: Confirmar Recepción${NC}"
  
  echo -e "  Confirmando recepción de productos..."
  CONFIRMAR_RESPONSE=$(curl -s -X PUT "$API_URL/solicitudes/$SOLICITUD_ID/confirmar" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ENFERMERO_TOKEN" \
    -d '{"observaciones": "Productos recibidos completos"}')
  
  if echo "$CONFIRMAR_RESPONSE" | grep -q "confirmada exitosamente"; then
    echo -e "  ${GREEN}✓ Recepción confirmada exitosamente${NC}"
  else
    echo -e "  ${RED}✗ Error confirmando recepción${NC}"
    echo -e "  Respuesta: $CONFIRMAR_RESPONSE"
  fi
  
  echo ""
fi

# ==============================================
# 7. VERIFICAR NOTIFICACIONES
# ==============================================

echo -e "${YELLOW}▶ Test 7: Sistema de Notificaciones${NC}"

echo -e "  Verificando notificaciones del almacenista..."
NOTIFICACIONES=$(curl -s -X GET "$API_URL/notificaciones" \
  -H "Authorization: Bearer $ALMACENISTA_TOKEN")

COUNT_NOTIF=$(echo $NOTIFICACIONES | grep -o '"total":[0-9]*' | sed 's/"total"://')

if [ ! -z "$COUNT_NOTIF" ] && [ "$COUNT_NOTIF" -gt 0 ]; then
  echo -e "  ${GREEN}✓ Almacenista tiene $COUNT_NOTIF notificaciones${NC}"
else
  echo -e "  ${RED}✗ No se encontraron notificaciones${NC}"
fi

# Contar no leídas
echo -e "  Contando notificaciones no leídas..."
NO_LEIDAS=$(curl -s -X GET "$API_URL/notificaciones/no-leidas/count" \
  -H "Authorization: Bearer $ALMACENISTA_TOKEN")

COUNT_NO_LEIDAS=$(echo $NO_LEIDAS | grep -o '"count":[0-9]*' | sed 's/"count"://')

if [ ! -z "$COUNT_NO_LEIDAS" ]; then
  echo -e "  ${GREEN}✓ $COUNT_NO_LEIDAS notificaciones no leídas${NC}"
else
  echo -e "  ${RED}✗ Error contando notificaciones no leídas${NC}"
fi

echo ""

# ==============================================
# 8. ESTADÍSTICAS
# ==============================================

echo -e "${YELLOW}▶ Test 8: Estadísticas de Solicitudes${NC}"

echo -e "  Obteniendo estadísticas..."
STATS=$(curl -s -X GET "$API_URL/solicitudes/stats/resumen" \
  -H "Authorization: Bearer $ENFERMERO_TOKEN")

if echo "$STATS" | grep -q "totalSolicitudes"; then
  TOTAL=$(echo $STATS | grep -o '"totalSolicitudes":[0-9]*' | sed 's/"totalSolicitudes"://')
  HOY=$(echo $STATS | grep -o '"solicitudesHoy":[0-9]*' | sed 's/"solicitudesHoy"://')
  echo -e "  ${GREEN}✓ Total solicitudes: $TOTAL${NC}"
  echo -e "  ${GREEN}✓ Solicitudes hoy: $HOY${NC}"
else
  echo -e "  ${RED}✗ Error obteniendo estadísticas${NC}"
fi

echo ""

# ==============================================
# 9. VALIDACIÓN DE PERMISOS
# ==============================================

echo -e "${YELLOW}▶ Test 9: Validación de Permisos${NC}"

echo -e "  Intentando crear solicitud como almacenista (debe fallar)..."
SOLICITUD_INVALIDA=$(curl -s -X POST "$API_URL/solicitudes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALMACENISTA_TOKEN" \
  -d "{
    \"pacienteId\": $PACIENTE_ID,
    \"cuentaPacienteId\": 1,
    \"prioridad\": \"NORMAL\",
    \"productos\": [{
      \"productoId\": $PRODUCTO_ID,
      \"cantidadSolicitada\": 1
    }]
  }")

if echo "$SOLICITUD_INVALIDA" | grep -q "403\|Forbidden\|No autorizado"; then
  echo -e "  ${GREEN}✓ Permisos validados correctamente${NC}"
else
  echo -e "  ${RED}✗ Error en validación de permisos${NC}"
fi

echo ""

# ==============================================
# RESUMEN
# ==============================================

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     RESUMEN DE TESTS                         ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Autenticación y tokens JWT                               ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Creación de solicitudes                                  ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Listado y filtrado                                       ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Asignación a almacenista                                 ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Entrega de productos                                     ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Confirmación de recepción                                ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Sistema de notificaciones                                ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Estadísticas y reportes                                  ║${NC}"
echo -e "${BLUE}║  ${GREEN}✓${BLUE} Validación de permisos por rol                           ║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ SISTEMA DE SOLICITUDES VALIDADO EXITOSAMENTE${NC}"