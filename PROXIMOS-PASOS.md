# 📋 PRÓXIMOS PASOS - ROADMAP DE CORRECCIONES

**Estado Actual:** Fase 1 Completada ✅
**Documentos Generados:** 3
**Cambios Realizados:** 4 archivos

---

## 🎯 RESUMEN DE LO REALIZADO (FASE 1 - CRÍTICA)

### ✅ Problemas Solucionados

| Problema | Descripción | Archivo Modificado | Estado |
|----------|-------------|-------------------|--------|
| **PC-01** | Credenciales HKA hardcodeadas | `lib/hka-config.ts` | ✅ CORREGIDO |
| **PC-02** | Race condition en multi-tenant | `lib/hka/credentials-manager.ts` | ✅ CORREGIDO |
| **PC-03** | Encriptación débil (CBC → GCM) | `lib/utils/encryption.ts` | ✅ CORREGIDO |

### 📄 Documentos Generados

1. **SECURITY-ARCHITECTURE-ANALYSIS.md** (320KB)
   - Análisis exhaustivo de 21 problemas encontrados
   - Soluciones detalladas para cada uno
   - Plan de remediación por fases

2. **IMPLEMENTACION-CORRECCIONES-CRITICAS.md** (50KB)
   - Explicación de qué se cambió y por qué
   - Guía de validación
   - Checklist de deployment

3. **PROXIMOS-PASOS.md** (este documento)
   - Roadmap de implementación
   - Priorización de trabajo

---

## 🔴 FASE 2: PROBLEMAS ALTOS (1-2 semanas)

### PA-01: Consolidar Validadores de RUC

**Archivos Afectados:**
- `lib/validations/ruc-validator.ts` (184 líneas)
- `lib/hka/utils/ruc-validator.ts` (213 líneas) ← DEPRECAR

**Trabajo:**
```typescript
// 1. Crear tabla comparativa de ambos algoritmos
// 2. Identificar diferencias
// 3. Mantener versión correcta en lib/validations/
// 4. Importar desde HKA utils (export de consolidado)
// 5. Agregar tests de equivalencia
// 6. Actualizar todos los imports
```

**Tiempo estimado:** 3-4 horas

---

### PA-02: Unificar Instancias de Prisma Client

**Archivos Afectados:**
- `lib/prisma.ts` (con extensiones)
- `lib/prisma-server.ts` (sin extensiones)
- `lib/db/index.ts` (otra instancia)
- `lib/prisma-singleton.ts` (cliente base)

**Trabajo:**
```typescript
// 1. Crear lib/db/prisma.ts único con singleton
// 2. Incluir todas las extensiones necesarias
// 3. Reemplazar imports en:
//    - app/api/**/*.ts
//    - lib/hka/**/*.ts
//    - lib/workers/**/*.ts
// 4. Eliminar archivos duplicados
// 5. Tests de pool connections
// 6. Documentar en lib/README-PRISMA-CLIENTS.md
```

**Tiempo estimado:** 4-5 horas

---

### PA-03: Error Handling Consistente en HKA

**Archivos Afectados:**
- `lib/hka/methods/enviar-documento.ts` (línea 95-110) - Silent failures
- Todos los routes que usan HKA

**Trabajo:**
```typescript
// 1. Crear tipos HKAValidationError y HKAServiceError
// 2. Implementar validaciones ANTES de envío
// 3. Remover console.warn/console.error
// 4. Actualizar error handling en routes
// 5. Documentar códigos de error HKA
// 6. Tests de error cases

// Ejemplo:
try {
  // Validar RUC
  const rucValidation = await validarRUCEnXML(xmlDocumento);
  if (!rucValidation.isValid) {
    throw new HKAValidationError('RUC inválido', { errors: ... });
  }

  // Validar schema XML
  const schemaValidation = validateXMLSchema(xmlDocumento);
  if (!schemaValidation.valid) {
    throw new HKAValidationError('XML inválido', { errors: ... });
  }

  // Luego sí, enviar
  return await this.soapClient.enviar(...);
} catch (error) {
  if (isHKAValidationError(error)) {
    throw new HKAServiceError('Validación fallida', error.context);
  }
  throw error;
}
```

**Tiempo estimado:** 5-6 horas

---

### PA-04: Migrar Todo Logging a Pino

**Archivos Afectados:**
- ~180+ instancias de `console.log/error/warn`
- `lib/hka/utils/logger.ts` ← DEPRECAR
- `lib/middleware/api-logger.ts`

**Trabajo:**
```typescript
// 1. Crear función createRequestLogger(requestId, organizationId)
// 2. Reemplazar console.log → logger.info
// 3. Reemplazar console.error → logger.error
// 4. Reemplazar console.warn → logger.warn
// 5. Agregar requestId en logs críticos
// 6. Tests de logging con diferentes niveles
// 7. Documentar estructura de logs

// Búsqueda y reemplazo de console.*
const files = [
  'app/api/**/*.ts',
  'lib/**/*.ts',
  'lib/hka/**/*.ts',
  'lib/workers/**/*.ts'
];

// Para cada línea con console.*, reemplazar por logger.*
console.log('msg') → logger.info('msg')
console.error('msg', err) → logger.error({ error: err, msg: 'msg' })
console.warn('msg') → logger.warn('msg')
```

**Tiempo estimado:** 6-8 horas

---

### PA-05: Consolidar Configuración HKA

**Archivos Afectados:**
- `lib/hka-config.ts` (URLs)
- `lib/hka/config/ubicsys-config.ts`
- Variables esparcidas en métodos

**Trabajo:**
```typescript
// Crear lib/hka/config.ts único con todas las opciones:

export const HKAConfigSchema = z.object({
  environment: z.enum(['demo', 'production']),
  demo: z.object({
    wsdlUrl: z.string().url(),
    restUrl: z.string().url(),
    credentials: z.object({
      tokenUser: z.string(),
      tokenPassword: z.string(),
    }),
  }),
  production: z.object({
    wsdlUrl: z.string().url(),
    restUrl: z.string().url(),
    credentials: z.object({
      tokenUser: z.string(),
      tokenPassword: z.string(),
    }),
  }),
  soap: z.object({
    timeout: z.number().positive(),
    maxRetries: z.number().positive(),
    retryDelayMs: z.number().positive(),
  }),
  validation: z.object({
    strictRUCValidation: z.boolean(),
    requireClientAddress: z.boolean(),
    maxItemsPerInvoice: z.number().positive(),
  }),
});

// Documentar variables de entorno en .env.example
HKA_SOAP_TIMEOUT
HKA_SOAP_MAX_RETRIES
HKA_SOAP_RETRY_DELAY
HKA_STRICT_RUC_VALIDATION
HKA_REQUIRE_CLIENT_ADDRESS
HKA_MAX_ITEMS
```

**Tiempo estimado:** 3-4 horas

---

## 🟡 FASE 3: PROBLEMAS MEDIOS (2-4 semanas)

### PM-01 a PM-03: Esquemas Zod + Encriptación Dual + Circuit Breaker

```
PM-01: Implementar esquemas Zod para transformers HKA
  ├─ FacturaElectronicaInputSchema
  ├─ EmisorDataSchema
  ├─ ReceptorDataSchema
  └─ Tests de transformación

PM-02: Unificar a GCM para encriptación de PINs
  └─ Consolidar lib/utils/encryption.ts y lib/certificates/encryption.ts

PM-03: Implementar Circuit Breaker en worker de invoices
  └─ npm install opossum
  └─ Configurar umbral de fallos
  └─ Tests de circuito abierto/cerrado
```

---

## 📅 TIMELINE ESTIMADO

| Fase | Problemas | Tiempo | Inicio | Fin |
|------|-----------|--------|--------|-----|
| 1 (Crítica) | PC-01, PC-02, PC-03 | 11h | ✅ Hecho | ✅ Hecho |
| 2 (Alta) | PA-01 a PA-05 | 21h | TBD | TBD |
| 3 (Media) | PM-01 a PM-09 | 15h | TBD | TBD |
| **Total** | 21 problemas | **47h** | Hoy | 2-3 semanas |

---

## 🚀 PRÓXIMAS ACCIONES INMEDIATAS

### HOY (Urgente)

- [ ] Commit cambios de Fase 1: `git commit -m "fix(security): remove hardcoded HKA credentials, fix race condition, improve encryption"`
- [ ] Crear rama feature: `git checkout -b fix/security-hardening-phase2`
- [ ] Comunicar cambios a stakeholders
- [ ] Crear backup de DB
- [ ] Preparar plan de rollback

### ESTA SEMANA (Within 3 days)

- [ ] Actualizar todos los API routes que usan HKA:
  ```
  app/api/documentos/anular/route.ts
  app/api/documentos/consultar/route.ts
  app/api/documentos/enviar/route.ts
  app/api/folios/tiempo-real/route.ts
  app/api/invoices/[id]/cancel/route.ts
  app/api/invoices/[id]/pdf/route.ts
  app/api/invoices/create/route.ts
  ```

- [ ] Pattern que usar en todos los routes:
  ```typescript
  import { resolveHKACredentials } from '@/lib/hka/credentials-manager';

  export async function POST(req: Request) {
    const session = await auth();
    const credentials = await resolveHKACredentials(session.user.organizationId);
    const hkaClient = new HKASOAPClient(credentials);
    // ... resto del código
  }
  ```

- [ ] Crear tests para cada corrección:
  ```bash
  npm test -- lib/utils/encryption.test.ts
  npm test -- lib/hka/credentials-manager.test.ts
  npm test -- lib/hka-config.test.ts
  ```

### PRÓXIMA SEMANA (Fase 2)

- [ ] Implementar PA-01: Consolidar RUC validators
- [ ] Implementar PA-02: Unificar Prisma
- [ ] Implementar PA-03: Error handling consistente
- [ ] Crear PR con cambios Fase 1 + Fase 2

---

## 📊 MÉTRICAS DE PROGRESO

Después de cada fase, medir:

```typescript
// Tests unitarios
npm test -- --coverage

// Vulnerabilidades de seguridad
npm audit

// Tipo checking
tsc --noEmit

// Linting
npm run lint

// Build
npm run build

// Deploy a staging
npm run build:vercel
```

---

## 📞 NECESIDAD DE SOPORTE

### The Factory HKA

Si durante la implementación surgen preguntas sobre The Factory HKA:

**Contacto:** soporte@thefactoryhka.com.pa
**Wiki:** https://felwiki.thefactoryhka.com.pa/
**Referencia:** "SAGO-FACTU - Integración HKA Panama"

### Dentro del Equipo

Para cambios que afecten múltiples módulos:

1. Documentar en este archivo
2. Crear issue en GitHub
3. Comunicar en standups
4. Revisar PRs entre pares

---

## 🎓 APRENDIZAJES Y REFERENCIAS

- [SECURITY-ARCHITECTURE-ANALYSIS.md](./SECURITY-ARCHITECTURE-ANALYSIS.md)
- [IMPLEMENTACION-CORRECCIONES-CRITICAS.md](./IMPLEMENTACION-CORRECCIONES-CRITICAS.md)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [OWASP Top 10 Crypto Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)

---

**Preparado por:** Angel Nereira
**Fecha:** 16 de Noviembre de 2025
**Estado:** FASE 1 COMPLETADA, PHASE 2 PENDIENTE
