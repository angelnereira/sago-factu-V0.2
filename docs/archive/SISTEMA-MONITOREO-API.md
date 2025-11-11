# Sistema de Monitoreo API - SAGO-FACTU

## Objetivo
Monitoreo en tiempo real de APIs críticas del sistema para el SUPER_ADMIN, con alertas automáticas, métricas y ejecución de tests.

## Estado Actual: MVP (Fase 1)

### Completado
- ✅ Schema de base de datos (6 modelos)
- ✅ Prisma Client generado
- ✅ Relaciones configuradas

### Pendiente de Implementación
- ⏳ API endpoints
- ⏳ Worker executor
- ⏳ Dashboard de monitoreo
- ⏳ Sistema de notificaciones
- ⏳ Scheduler automático

## Arquitectura

```
┌─────────────────────────────────────┐
│   Dashboard de Monitoreo            │
│   (SUPER_ADMIN only)                │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   API Endpoints                     │
│   - POST /api/monitors/create       │
│   - POST /api/monitors/trigger      │
│   - GET /api/monitors/runs          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Worker Executor                   │
│   - Ejecuta HTTP requests           │
│   - Captura responses               │
│   - Ejecuta tests/assertions        │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Database                          │
│   - Monitor configs                 │
│   - Monitor runs                    │
│   - Test results                    │
└─────────────────────────────────────┘
```

## Modelos de Base de Datos

### Monitor
Configuración de un monitor de API
- name, description
- collectionId (referencia a colección de requests)
- schedule (expresión cron)
- enabled (activo/inactivo)
- regions (regiones para ejecutar)
- notifications (configuración de alertas)

### MonitorRun
Ejecución de un monitor
- status (RUNNING | SUCCESS | FAILED | TIMEOUT)
- duration (tiempo total)
- totalRequests, passedTests, failedTests
- startedAt, finishedAt

### MonitorRunRequest
Request individual dentro de una ejecución
- method, url, statusCode
- responseTime, responseSize
- passedTests, failedTests
- requestBody, responseBody

### MonitorRunTest
Test/Assertion ejecutado
- testName
- passed (boolean)
- message

### Collection
Definición de colección de requests (tipo Postman)
- name
- definition (JSON con requests, tests, variables)

### Environment
Variables de entorno
- name
- variables (JSON)
- scope (global | collection | monitor)

## Próximos Pasos de Implementación

1. **API Endpoints** (CRUD básico)
2. **Worker simple** (ejecutar HTTP requests)
3. **Dashboard básico** (ver monitores y resultados)
4. **Notificaciones** (email en caso de error)
5. **Scheduler** (ejecutar monitores automáticamente)

## Comandos Útiles

```bash
# Verificar schema
npx prisma studio

# Verificar modelos
npx prisma db pull
```

