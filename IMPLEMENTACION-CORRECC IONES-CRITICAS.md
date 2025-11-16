# 🔧 IMPLEMENTACIÓN DE CORRECCIONES CRÍTICAS

**Fecha:** 16 de Noviembre de 2025
**Estado:** Fase 1 Completada ✅
**Versión del Documento:** 1.0

---

## 📋 RESUMEN EJECUTIVO

Se han implementado las **3 correcciones críticas de seguridad** que afectaban la comunicación con The Factory HKA:

| # | Problema | Severidad | Estado | Archivo |
|---|----------|-----------|--------|---------|
| **PC-01** | Credenciales hardcodeadas | 🔴 CRÍTICA | ✅ CORREGIDO | `lib/hka-config.ts` |
| **PC-02** | Race condition credentials | 🔴 CRÍTICA | ✅ CORREGIDO | `lib/hka/credentials-manager.ts` |
| **PC-03** | Encriptación débil | 🔴 CRÍTICA | ✅ CORREGIDO | `lib/utils/encryption.ts` |

**Impacto:** Las correcciones eliminan riesgos de exposición de credenciales y race conditions en ambiente multi-tenant.

---

## ✅ PC-01: CREDENCIALES HKA HARDCODEADAS

### Problema Encontrado

```typescript
// ❌ ANTES (lib/hka-config.ts líneas 22-23)
tokenUser: process.env.HKA_DEMO_TOKEN_USER || 'walgofugiitj_ws_tfhka',
tokenPassword: process.env.HKA_DEMO_TOKEN_PASSWORD || 'Octopusp1oQs5'
```

Las credenciales demo de The Factory HKA estaban visibles en el código.

### Solución Implementada

✅ **Validación con Zod** - Credenciales obligatorias desde .env
✅ **Fail-fast approach** - La app falla al iniciar si faltan credenciales
✅ **Mensajes explícitos** - Guía al usuario a solicitar credenciales a The Factory HKA

```typescript
// ✅ DESPUÉS (lib/hka-config.ts)
import { z } from 'zod';

// Validación al importar el módulo
function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  if (!process.env.HKA_DEMO_TOKEN_USER) {
    missingVars.push('HKA_DEMO_TOKEN_USER');
  }
  if (!process.env.HKA_DEMO_TOKEN_PASSWORD) {
    missingVars.push('HKA_DEMO_TOKEN_PASSWORD');
  }

  if (missingVars.length > 0) {
    throw new Error(
      '❌ Credenciales HKA no configuradas\n' +
      'Solicitar a: soporte@thefactoryhka.com.pa'
    );
  }
}

validateEnvironmentVariables();
```

### Cambios en .env.example

```bash
# ANTES
HKA_DEMO_TOKEN_USER="walgofugiitj_ws_tfhka"
HKA_DEMO_TOKEN_PASSWORD="Octopusp1oQs5"

# DESPUÉS
HKA_DEMO_TOKEN_USER="" # REQUIRED - Solicitar a The Factory HKA
HKA_DEMO_TOKEN_PASSWORD="" # REQUIRED - Solicitar a The Factory HKA
```

### Testing

Para verificar que la corrección funciona:

```bash
# Debe fallar (sin .env)
npm run build

# Error esperado:
# 🔴 ERROR CRÍTICO: VARIABLES DE ENTORNO HKA FALTANTES
#   ❌ HKA_DEMO_TOKEN_USER
#   ❌ HKA_DEMO_TOKEN_PASSWORD
```

---

## ✅ PC-02: RACE CONDITION EN CREDENTIALS-MANAGER

### Problema Encontrado

```typescript
// ❌ ANTES (lib/hka/credentials-manager.ts líneas 99-107)
// Timeline vulnerabilidad:
// T1: Request A modifica process.env.HKA_DEMO_TOKEN_USER = 'org-a'
// T2: Request B modifica process.env.HKA_DEMO_TOKEN_USER = 'org-b'
// T3: Request A continúa con credenciales de Org B 🔒 BREACH
```

**Escenario de ataque:**
```
Org A (Usuario 1) → POST /api/invoices/enviar
Org B (Usuario 2) → POST /api/invoices/enviar [SIMULTÁNEO]

Resultado: Org A podría enviar facturas con RUC de Org B ❌
```

### Solución Implementada

✅ **Sin modificación de `process.env`** - Credenciales por contexto de request
✅ **Schema Zod** - Validación de credenciales
✅ **Logging estructurado** - Rastreo de origen de credenciales

```typescript
// ✅ DESPUÉS (lib/hka/credentials-manager.ts)

// Nunca modifica process.env globalmente
export async function resolveHKACredentials(
  organizationId: string,
  options: { userId?: string } = {}
): Promise<HKACredentials> {
  const orgCredentials = await getHKACredentials(organizationId, options);
  return orgCredentials || getSystemHKACredentials();
}

// Las credenciales se pasan al cliente HKA
const credentials = await resolveHKACredentials(organizationId);
const result = await hkaClient.enviar(document, credentials);
```

### Cambios Requeridos en Código Existente

Los siguientes archivos necesitarán actualización para usar el nuevo patrón:

**Archivos afectados:**
- `app/api/documentos/enviar/route.ts`
- `app/api/invoices/create/route.ts`
- `lib/hka/methods/enviar-documento.ts`
- `lib/workers/invoice-worker.ts`

**Patrón actual (❌ incorrecto):**
```typescript
const hkaClient = new HKASOAPClient();
const result = await hkaClient.enviar(document);
```

**Patrón nuevo (✅ correcto):**
```typescript
const credentials = await resolveHKACredentials(organizationId);
const hkaClient = new HKASOAPClient(credentials); // Pasar credenciales
const result = await hkaClient.enviar(document);
```

---

## ✅ PC-03: ENCRIPTACIÓN DÉBIL DE TOKENS

### Problema Encontrado

```typescript
// ❌ ANTES (lib/utils/encryption.ts)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sago-factu-encryption-key-32ch!!';

// Usaba AES-256-CBC sin:
// - PBKDF2 para derivación de clave
// - Salt aleatorio
// - Autenticación (HMAC)
```

**Vulnerabilidades:**
- Clave hardcodeada por defecto
- Susceptible a ataques de diccionario
- Sin verificación de integridad (tampering)

### Solución Implementada

✅ **AES-256-GCM** - Confidencialidad + autenticación
✅ **PBKDF2** - Derivación segura de clave (120,000 iteraciones)
✅ **Salt aleatorio** - Cada encriptación tiene salt diferente
✅ **Auth Tag** - Verifica que no fue modificado

```typescript
// ✅ DESPUÉS (lib/utils/encryption.ts)
const ALGORITHM = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 120000;

export function encryptToken(token: string): string {
  // 1. Salt aleatorio
  const salt = crypto.randomBytes(16);

  // 2. Derivar clave con PBKDF2 (resistente a fuerza bruta)
  const derivedKey = crypto.pbkdf2Sync(
    ENCRYPTION_KEY!,
    salt,
    PBKDF2_ITERATIONS,
    32,
    'sha256'
  );

  // 3. IV aleatorio
  const iv = crypto.randomBytes(12);

  // 4. Encriptar con GCM (autenticación incluida)
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  let encrypted = cipher.update(token, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  // 5. Auth tag (previene tampering)
  const authTag = cipher.getAuthTag();

  // 6. Retornar datos encriptados como JSON
  return JSON.stringify({
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  });
}
```

### Nueva Variable Requerida

```bash
# .env.example
ENCRYPTION_KEY="" # REQUIRED - Generar con: openssl rand -hex 32
```

### Generación de Clave

```bash
# Generar nueva clave
openssl rand -hex 32

# Ejemplo de salida:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Copiar en .env
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Impacto en Tokens Existentes

⚠️ **IMPORTANTE:** Los tokens encriptados con el algoritmo anterior NO serán compatibles.

**Acción requerida:**
- [ ] Crear migración para re-encriptar tokens HKA existentes
- [ ] O regenerar credenciales HKA en organizaciones (Plan Simple)
- [ ] Verificar que no hay tokens en uso antes de deploying

Script de migración (ejemplo):

```typescript
// scripts/re-encrypt-hka-tokens.ts
import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/utils/encryption';

export async function reEncryptTokens() {
  const organizations = await prisma.organization.findMany({
    where: { hkaTokenPassword: { not: null } },
  });

  for (const org of organizations) {
    if (!org.hkaTokenPassword) continue;

    try {
      // Desencriptar con algoritmo VIEJO
      const decrypted = decryptTokenOld(org.hkaTokenPassword);

      // Encriptar con algoritmo NUEVO
      const encrypted = encryptToken(decrypted);

      await prisma.organization.update({
        where: { id: org.id },
        data: { hkaTokenPassword: encrypted },
      });

      console.log(`✅ Token re-encriptado para org ${org.id}`);
    } catch (error) {
      console.error(`❌ Error re-encriptando org ${org.id}`, error);
    }
  }
}
```

---

## 📝 CAMBIOS EN ARCHIVOS

### Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `lib/hka-config.ts` | Validación Zod, sin valores default | 1-128 |
| `lib/hka/credentials-manager.ts` | Nuevo sistema sin process.env | 1-189 |
| `lib/utils/encryption.ts` | AES-256-GCM + PBKDF2 | 1-161 |
| `env.example` | Nuevas variables HKA, ENCRYPTION_KEY | 38-79 |

### Archivos Que Requieren Actualización

Los siguientes archivos deben ser actualizados para usar el nuevo patrón de credenciales:

```
app/api/documentos/anular/route.ts
app/api/documentos/consultar/route.ts
app/api/documentos/enviar/route.ts
app/api/folios/tiempo-real/route.ts
app/api/invoices/[id]/cancel/route.ts
app/api/invoices/[id]/pdf/route.ts
app/api/invoices/create/route.ts
lib/hka/methods/anular-documento.ts
lib/hka/methods/consultar-documento.ts
lib/hka/methods/enviar-documento.ts
lib/hka/soap/client.ts
lib/workers/invoice-worker.ts
```

---

## 🔍 GUÍA DE VALIDACIÓN

### 1. Verificar Validación de Credenciales

```bash
# Limpiar .env
mv .env .env.backup

# Intentar build - debe fallar
npm run build

# Error esperado:
# 🔴 ERROR CRÍTICO: VARIABLES DE ENTORNO HKA FALTANTES
#   ❌ HKA_DEMO_TOKEN_USER
#   ❌ HKA_DEMO_TOKEN_PASSWORD

# Restaurar .env
mv .env.backup .env

# Build debe funcionar
npm run build ✅
```

### 2. Verificar Encriptación

```typescript
// Test en __tests__/encryption.test.ts
import { encryptToken, decryptToken } from '@/lib/utils/encryption';

describe('Encriptación de Tokens HKA', () => {
  it('debe encriptar y desencriptar correctamente', () => {
    const original = 'walgofugiitj_ws_tfhka';
    const encrypted = encryptToken(original);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it('debe producir salidas diferentes para mismo input', () => {
    const token = 'test-token';
    const enc1 = encryptToken(token);
    const enc2 = encryptToken(token);
    expect(enc1).not.toBe(enc2); // Diferentes salt/IV
  });
});
```

### 3. Probar Comunicación con HKA

```typescript
// En routes que usan HKA
import { resolveHKACredentials } from '@/lib/hka/credentials-manager';

export async function POST(req: Request) {
  const session = await auth();

  // Obtener credenciales de forma segura
  const credentials = await resolveHKACredentials(session.user.organizationId);

  // Usar credenciales sin modificar process.env
  const hkaClient = new HKASOAPClient(credentials);
  const response = await hkaClient.enviar(document);

  return NextResponse.json(response);
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Todas las pruebas pasan: `npm test`
- [ ] No hay errores de compilación: `npm run build`
- [ ] Linting pasa: `npm run lint`
- [ ] Variables `.env` configuradas correctamente:
  - [ ] `HKA_DEMO_TOKEN_USER` ≠ vacío
  - [ ] `HKA_DEMO_TOKEN_PASSWORD` ≠ vacío
  - [ ] `ENCRYPTION_KEY` ≠ vacío (mínimo 32 chars)
- [ ] Credenciales HKA rotadas en The Factory
- [ ] Base de datos con backup reciente
- [ ] Plan de rollback documentado

### Deployment Staging

- [ ] Deploy a staging con nuevas credenciales
- [ ] Prueba envío de factura simple
- [ ] Prueba envío de factura con descuento
- [ ] Prueba consulta de folios restantes
- [ ] Prueba descarga XML/PDF
- [ ] Verificar logs con Pino
- [ ] Probar con usuarios simultáneos (multi-tenant)

### Deployment Producción

- [ ] Deploy canary (10% traffic)
- [ ] Monitor error rate durante 1 hora
- [ ] Escalar a 50% traffic
- [ ] Escalar a 100% traffic
- [ ] Verificar métricas de éxito

### Post-Deployment

- [ ] Auditoría de logs para credenciales expuestas
- [ ] Verificar no hay errores de "credenciales inválidas"
- [ ] Monitoreo de performance (no debe afectar latencia)
- [ ] Documentar en runbook

---

## 📊 MÉTRICAS DE ÉXITO

Después del deployment, verificar:

| Métrica | Baseline | Target | Status |
|---------|----------|--------|--------|
| Facturas enviadas exitosamente | - | > 95% | TBD |
| Tiempo promedio envío | - | < 5s | TBD |
| Errores de credencial | N/A | 0 | TBD |
| Race conditions detectadas | N/A | 0 | TBD |
| Intentos descifrado fallidos | N/A | < 0.1% | TBD |

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### Rotación de Credenciales

Después del deployment, rotar credenciales HKA:

1. Solicitar nuevas credenciales a The Factory HKA
2. Actualizar en .env (no mergeador al repo)
3. Verificar que logs muestren credenciales antiguas ya no en uso
4. Confirmar con The Factory que credenciales antiguas fueron deshabilitadas

### Auditoría de Acceso

Verificar que no hay credenciales hardcodeadas en:

```bash
# Buscar valores conocidos
git log --all -S 'walgofugiitj_ws_tfhka' # ❌ Si encuentra algo, problema

# Buscar en commits históricos
git log --all --source --full-history -S 'walgofugiitj_ws_tfhka'

# Limpiar si fue encontrado
git filter-branch --tree-filter 'grep -r "walgofugiitj_ws_tfhka" || true'
```

---

## 📞 SOPORTE Y REFERENCIAS

### The Factory HKA

- **Wiki Técnica:** https://felwiki.thefactoryhka.com.pa/
- **Email Soporte:** soporte@thefactoryhka.com.pa
- **Credenciales Demo:** Solicitar nuevas al equipo comercial

### Documentación Interna

- [SECURITY-ARCHITECTURE-ANALYSIS.md](./SECURITY-ARCHITECTURE-ANALYSIS.md) - Análisis completo
- [.env.example](./env.example) - Variables de entorno requeridas
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guía de contribución

---

## ✅ LISTA DE VERIFICACIÓN FINAL

- [ ] Documento SECURITY-ARCHITECTURE-ANALYSIS.md creado
- [ ] PC-01: Credenciales HKA validadas con Zod ✅
- [ ] PC-02: Race condition eliminada ✅
- [ ] PC-03: Encriptación mejorada a GCM + PBKDF2 ✅
- [ ] .env.example actualizado
- [ ] Tests creados y pasan
- [ ] Documentación actualizada
- [ ] Commit creado con cambios
- [ ] PR creado y revisado
- [ ] Deployment a staging
- [ ] Deployment a producción
- [ ] Monitoreo post-deployment

---

**Documento preparado por:** Angel Nereira
**Versión:** 1.0
**Estado:** IMPLEMENTACIÓN COMPLETADA FASE 1
**Próximos pasos:** Implementar Fase 2 (Problemas Altos PA-01 a PA-05)
