# 🔧 Troubleshooting: Configuración de Credenciales HKA

## Problema: Los datos de RUC y Dígito Verificador no persisten

### Causa Root
Cuando cambias de página o reinicias sesión, los campos RUC y DV aparecen vacíos aunque los hayas guardado antes.

### Solución Implementada ✅

**1. Cambio de Ambiente Predeterminado**
```bash
# Antes (causaba errores)
HKA_ENVIRONMENT="prod"

# Ahora (predeterminado a demo)
HKA_ENVIRONMENT="demo"
```

**Por qué**: Si `HKA_ENVIRONMENT` estaba seteado a "prod" pero no tenías credenciales de producción configuradas, el sistema intentaba validar variables de entorno inexistentes.

**2. Mejora en Validación de Variables de Entorno**

El endpoint `/api/settings/test-hka-connection` ahora:
- ✅ Valida que `HKA_DEMO_SOAP_URL` esté configurado
- ✅ Valida que `HKA_PROD_SOAP_URL` esté configurado
- ✅ Proporciona mensajes de error detallados indicando qué variable falta
- ✅ Loggea qué variables de entorno están disponibles para debugging

**3. Logging de Datos Guardados**

Agregamos logs en el GET endpoint para rastrear cuándo se recuperan los datos del contribuyente:

```typescript
console.log('[API] Retrieved organization data:', {
  ruc: org?.ruc,
  dv: org?.dv,
  name: org?.name,
  tradeName: org?.tradeName,
  email: org?.email,
  phone: org?.phone,
  address: org?.address,
});
```

---

## Flujo de Guardado y Recuperación de Credenciales

### 1. **GUARDAR Credenciales** (POST `/api/settings/hka-credentials`)

```
Usuario rellena formulario
    ↓
Cliente POST con datos (tokenUser, tokenPassword, ruc, dv, etc)
    ↓
Servidor guarda en BD:
  - HKACredential (tokenUser, tokenPassword)
  - Organization (ruc, dv, name, tradeName, email, phone, address)
    ↓
Componente llama fetchCredentials() para refetch
    ↓
Usuario ve datos persistidos ✅
```

### 2. **RECUPERAR Credenciales** (GET `/api/settings/hka-credentials`)

```
useEffect(() => fetchCredentials(), [])  ← Al montar componente
    ↓
GET /api/settings/hka-credentials
    ↓
Servidor retorna:
  {
    ruc: "155738031",
    dv: "20",
    razonSocial: "Mi Empresa S.A.",
    nombreComercial: "Mi Empresa",
    email: "empresa@test.com",
    telefono: "+507 1234-5678",
    direccion: "Panama City",
    environments: {
      demo: { tokenUser: "...", isActive: true },
      prod: { tokenUser: "...", isActive: false }
    }
  }
    ↓
Componente puebla campos con datos
    ↓
Usuario ve formulario pre-llenado ✅
```

---

## Problema: "Configuración incompleta del servidor HKA"

### Síntoma
Al probar la conexión, recibes:
```
{
  "success": false,
  "error": "Configuración incompleta del servidor HKA",
  "details": "La variable de entorno 'HKA_PROD_SOAP_URL' no está configurada...",
  "missingVariable": "HKA_PROD_SOAP_URL"
}
```

### Causa
Las variables de entorno requeridas no están configuradas en `.env`:

```bash
# ✅ Estos DEBEN estar configurados:
HKA_DEMO_SOAP_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_PROD_SOAP_URL="https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"

# ✅ Y estos deben estar en Vercel (no en .env local):
HKA_DEMO_TOKEN_USER="tu_token_demo"
HKA_DEMO_TOKEN_PASSWORD="tu_password_demo"
HKA_PROD_TOKEN_USER="tu_token_prod"
HKA_PROD_TOKEN_PASSWORD="tu_password_prod"
```

### Solución

#### **Desarrollo Local**
Asegúrate de que tu `.env` tiene:

```bash
# The Factory HKA - Demo Environment
HKA_ENV="demo"
HKA_DEMO_SOAP_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_DEMO_TOKEN_USER=""  # Opcional en desarrollo
HKA_DEMO_TOKEN_PASSWORD=""  # Opcional en desarrollo

# The Factory HKA - Production Environment
HKA_PROD_SOAP_URL="https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_PROD_TOKEN_USER=""  # Opcional en desarrollo
HKA_PROD_TOKEN_PASSWORD=""  # Opcional en desarrollo

# Ambiente activo
HKA_ENVIRONMENT="demo"  # ← IMPORTANTE: Debe ser "demo" por defecto
```

#### **Producción (Vercel)**
Las variables de entorno se configuran en:
```
Vercel Dashboard → Project Settings → Environment Variables
```

Debes agregar todas estas:
- `HKA_DEMO_SOAP_URL`
- `HKA_PROD_SOAP_URL`
- `HKA_DEMO_TOKEN_USER`
- `HKA_DEMO_TOKEN_PASSWORD`
- `HKA_PROD_TOKEN_USER`
- `HKA_PROD_TOKEN_PASSWORD`
- `HKA_ENVIRONMENT=demo`

---

## Checklist: ¿Tus credenciales persisten correctamente?

### ✅ Verificación Rápida

- [ ] Abre Settings → HKA Credentials Configuration
- [ ] Ingresa RUC: `155738031`
- [ ] Ingresa DV: `20`
- [ ] Ingresa Token Usuario: `test_user_123`
- [ ] Ingresa Token Password: `test_password_456`
- [ ] Selecciona Ambiente: `Demo`
- [ ] Haz clic en "Guardar Credenciales"
- [ ] Espera el mensaje de éxito
- [ ] **Recarga la página (Ctrl+R)**
- [ ] Verifica que los campos mantengan sus valores ✅

### Si los campos se vacían después de recargar:

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Network"**
3. **Busca la request GET a `/api/settings/hka-credentials`**
4. **Verifica la respuesta JSON:**
   ```json
   {
     "ruc": "155738031",  // ← Debe estar aquí
     "dv": "20",           // ← Debe estar aquí
     "razonSocial": null,
     ...
   }
   ```

5. **Si `ruc` y `dv` son `null`:**
   - El servidor NO está guardando los datos en Organization
   - Contacta al admin para revisar los logs del servidor

6. **Si `ruc` y `dv` tienen valores:**
   - El problema es en el frontend
   - Limpia la cache: Ctrl+Shift+Delete
   - Recarga: Ctrl+Shift+R (hard refresh)

---

## Logs para Debugging

### Ver logs del servidor (Vercel)

```bash
# En Vercel Dashboard → Deployment → Functions
# Busca logs que contengan:
[API] Retrieved organization data:
[API] Guardando credenciales HKA en plaintext...
[API] Testing HKA connection for environment:
```

### Ver logs en desarrollo local

```bash
# Terminal donde ejecutas "npm run dev"
# Busca:
[API] Received credentials request:
[API] Retrieved organization data:
[HKA] SOAP client initialized
[HKA] Configuration validation failed
```

---

## Estructura de Datos en BD

### Tabla: `hka_credentials`
```sql
id              | UUID
userId          | Foreign key → User
environment     | DEMO | PROD
tokenUser       | TEXT (plaintext)
tokenPassword   | TEXT (plaintext)
isActive        | Boolean
createdAt       | Timestamp
updatedAt       | Timestamp
```

### Tabla: `organizations`
```sql
id              | UUID
name            | String
ruc             | String? (Unique)
dv              | String? (Dígito verificador)
email           | String?
phone           | String?
address         | String?
tradeName       | String? (Nombre comercial)
hkaEnvironment  | "demo" | "prod"
-- ... otros campos
```

---

## Resumen: ¿Qué Cambió?

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **HKA_ENVIRONMENT** | Seteado a "prod" | Predeterminado a "demo" |
| **Validación SOAP URL** | Silenciosa | Con mensajes explícitos |
| **Logging** | Minimal | Detallado con organización data |
| **Persistencia RUC/DV** | Inconsistente | ✅ Confiable (si env vars están bien) |
| **Error Messages** | Genéricos | Específicos (qué variable falta) |

---

## ¿Necesitas más ayuda?

1. **Credenciales no se guardan:**
   - Revisa que el POST a `/api/settings/hka-credentials` retorne status 200
   - Verifica los logs: `[API] Guardando credenciales HKA en plaintext...`

2. **Test Connection falla:**
   - Asegúrate de que HKA_DEMO_SOAP_URL esté en .env o Vercel
   - Verifica que tu usuario tenga credenciales guardadas
   - Revisa el error message para ver qué variable falta

3. **Datos persisten pero no se recuperan:**
   - Limpia cache del navegador
   - Verifica que el GET `/api/settings/hka-credentials` retorne los datos
   - Revisa los logs: `[API] Retrieved organization data:`

---

**Última actualización:** 2025-11-17
**Versión:** 2.0
**Ambiente:** Production-Ready ✅
