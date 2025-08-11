# 🔧 Guía de Solución de Problemas - Sistema Hospitalario

> **Fecha de creación**: 31 de julio de 2025  
> **Actualizado**: Después de resolver problemas de inicio de servidores

## 🚨 Problemas Críticos y Soluciones Inmediatas

### 1. "No veo nada en localhost:3000"

**Síntomas:**
- Página en blanco o no carga
- Error de conexión en el navegador
- El frontend no responde

**Diagnóstico rápido:**
```bash
# Verificar si los procesos están corriendo
ps aux | grep -E "node|vite" | grep -v grep

# Verificar puertos
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
```

**Solución paso a paso:**
```bash
# 1. Detener todos los procesos
pkill -f "vite"
pkill -f "node simple-server.js"

# 2. Iniciar backend
cd /Users/alfredo/agntsystemsc/backend
node simple-server.js &

# 3. Iniciar frontend en otra terminal
cd /Users/alfredo/agntsystemsc/frontend
npm run dev

# 4. Verificar que ambos estén corriendo
curl http://localhost:3001/health    # Debe responder {"status": "OK"}
curl -s http://localhost:3000 | grep -o "<title>.*</title>"  # Debe mostrar título
```

**Alternativa con script automático:**
```bash
cd /Users/alfredo/agntsystemsc
./start-dev.sh
```

### 2. Errores de TypeScript que impiden compilación

**Síntomas:**
- Frontend no compila
- Errores rojos en la consola
- Vite se detiene con errores

**Diagnóstico:**
```bash
cd frontend
npx tsc --noEmit
```

**Errores comunes y soluciones:**

#### ❌ `Property 'data' is possibly 'undefined'`
```typescript
// ❌ Problemático
const data = response.data.filter(...)
const items = response.data.map(...)

// ✅ Correcto
const data = response.data?.filter(...) || []
const items = response.data?.items || []
```

#### ❌ `Module has no exported member`
```typescript
// ❌ Import incorrecto
import { hospitalizationService } from '@/services/hospitalizationService'

// ✅ Import correcto (verificar si es default export)
import hospitalizationService from '@/services/hospitalizationService'
```

#### ❌ `No overload matches this call` (MUI Components)
```typescript
// ❌ Problemático
<Chip color={someVariable} />

// ✅ Correcto
<Chip color={someVariable as 'primary' | 'secondary' | 'default'} />
```

### 3. Backend retorna 404 para nuevos endpoints

**Síntomas:**
- Endpoints de hospitalización no funcionan
- Error 404 en APIs recién agregadas

**Causa:** Orden incorrecto de middlewares - el handler 404 está antes que las rutas

**Solución:**
```javascript
// En backend/simple-server.js
// ✅ Correcto: Rutas ANTES del 404 handler

// Todas las rutas de la aplicación
app.get('/api/hospitalization/admissions', ...)
app.post('/api/hospitalization/admissions', ...)
// ... más rutas ...

// 404 handler AL FINAL
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});
```

### 4. CORS Errors

**Síntomas:**
- "Access to fetch blocked by CORS policy"
- APIs no responden desde el frontend

**Solución:**
```javascript
// En backend/simple-server.js
app.use(cors({
  origin: 'http://localhost:3000',  // URL exacta del frontend
  credentials: true
}));
```

## 📋 Lista de Verificación para Desarrollo

### Antes de implementar nueva funcionalidad:

1. **Verificar tipos existentes**
   ```bash
   ls frontend/src/types/
   grep -r "interface.*Form" frontend/src/types/
   ```

2. **Revisar servicios similares**
   ```bash
   ls frontend/src/services/
   grep -r "createAdmission\|updateAdmission" frontend/src/services/
   ```

3. **Comprobar endpoints en backend**
   ```bash
   grep -r "app\.(get\|post\|put\|delete)" backend/simple-server.js | grep hospitalization
   ```

### Después de implementar:

1. **Verificar TypeScript**
   ```bash
   cd frontend && npx tsc --noEmit
   ```

2. **Probar endpoints**
   ```bash
   # GET endpoint
   curl http://localhost:3001/api/hospitalization/stats
   
   # POST endpoint (con datos de prueba)
   curl -X POST http://localhost:3001/api/hospitalization/admissions \
        -H "Content-Type: application/json" \
        -d '{"pacienteId": 1, "habitacionId": 1, ...}'
   ```

3. **Verificar en navegador**
   - Login exitoso
   - Navegación a módulo
   - Funcionalidad nueva trabajando

## 🔍 Comandos de Diagnóstico

### Estado completo del sistema:
```bash
#!/bin/bash
echo "🔍 Diagnóstico del Sistema Hospitalario"
echo "======================================="

# Backend
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend: OK (localhost:3001)"
else
    echo "❌ Backend: NO RESPONDE"
fi

# Frontend
if curl -s http://localhost:3000 | grep -q "Sistema de Gestión"; then
    echo "✅ Frontend: OK (localhost:3000)"
else
    echo "❌ Frontend: NO RESPONDE"
fi

# Procesos
echo ""
echo "📊 Procesos activos:"
ps aux | grep -E "node|vite" | grep -v grep | awk '{print $2, $11, $12, $13, $14}'

# TypeScript
echo ""
echo "📝 Verificando TypeScript..."
cd frontend && npx tsc --noEmit && echo "✅ TypeScript: OK" || echo "❌ TypeScript: ERRORES"
```

### Logs en tiempo real:
```bash
# Backend logs
tail -f backend/server.log

# Frontend logs (si existen)
tail -f frontend/frontend.log

# Logs del sistema
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

## 🏥 URLs y Credenciales de Desarrollo

### URLs del Sistema:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Credenciales por Rol:
```bash
# Administrador (acceso completo)
admin / admin123

# Personal médico (hospitalización)
enfermero1 / enfermero123
especialista1 / medico123
residente1 / residente123

# Otros roles
cajero1 / cajero123      # POS, facturación
almacen1 / almacen123    # Inventario
socio1 / socio123        # Reportes financieros
```

## 🛠️ Herramientas de Desarrollo

### Scripts útiles:
```bash
# Inicio completo
./start-dev.sh

# Reinicio rápido
pkill -f "node\|vite" && ./start-dev.sh

# Solo backend
cd backend && node simple-server.js

# Solo frontend
cd frontend && npm run dev

# Verificar tipos
cd frontend && npx tsc --noEmit

# Limpiar cache
cd frontend && rm -rf node_modules/.vite && rm -rf dist
```

### Testing de APIs:
```bash
# Login test
curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'

# Hospitalización stats
curl http://localhost:3001/api/hospitalization/stats

# Pacientes disponibles
curl http://localhost:3001/api/patients
```

## 📚 Referencias Rápidas

### Estructura de archivos críticos:
```
frontend/src/
├── components/           # Componentes reutilizables
├── pages/               # Páginas por módulo
│   └── hospitalization/ # 🆕 Módulo de hospitalización
├── services/            # Servicios API
├── types/               # Definiciones TypeScript
└── utils/               # Utilidades

backend/
├── simple-server.js     # Servidor principal con todas las rutas
└── mockData/           # Datos de prueba
```

### Patrones comunes:
```typescript
// Servicio API
class SomeService {
  async getSomething(): Promise<ApiResponse<SomeType>> {
    try {
      const response = await api.get('/api/something');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Componente React
const SomeComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [data, setData] = useState<SomeType[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await someService.getSomething();
      setData(response.data?.items || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    // JSX aquí
  );
};
```

---
**💡 Tip**: Guarda este archivo como referencia y actualízalo cuando encuentres nuevos problemas y soluciones.