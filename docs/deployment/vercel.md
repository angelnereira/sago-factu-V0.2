# Vercel Deployment Guide - SAGO-FACTU v0.8.1

Este documento describe cómo desplegar SAGO-FACTU en Vercel con todas las configuraciones necesarias para producción.

## 1. Requisitos Previos

- Vercel CLI instalado localmente
- Cuenta de Vercel con acceso al proyecto
- The Factory HKA credentials (demo y/o producción)
- Base de datos Neon configurada y accesible

## 2. Variables de Entorno Requeridas en Vercel

Agregar las siguientes variables en **Vercel → Project Settings → Environment Variables**:

### Base de Datos
```
DATABASE_URL=postgresql://...  # Tu URL de Neon PostgreSQL
```

### Autenticación NextAuth
```
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
```

### Encriptación de Credenciales
```
ENCRYPTION_KEY=<generado con: openssl rand -hex 32>
```

**IMPORTANTE**: Este valor debe ser el MISMO que en `.env.local`:
```
923f1d9ae34a1bf8d793499ec3fc200334ebedf165c85a3ad4da5f54e8aa4e8a
```

### The Factory HKA - SOAP URLs
```
HKA_DEMO_SOAP_URL=https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
HKA_PROD_SOAP_URL=https://produccion.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
HKA_DEMO_REST_URL=https://demointegracion.thefactoryhka.com.pa
HKA_PROD_REST_URL=https://integracion.thefactoryhka.com.pa
```

### Certificado de Encriptación (para certificados digitales)
```
CERTIFICATE_ENCRYPTION_KEY=5c8f1e01b2c9a4d7e3f8b65a90c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9
CERTIFICATE_MASTER_KEY=0f6a9b1c4d8e2057b3f6c1a9d48e02f73b5c19a4e6d2078f9c3b6a1d7e40258f
```

### Redis (Opcional - para jobs)
```
REDIS_URL=redis://tu-redis-cloud.com:puerto
```

### Superusuario Demo
```
SUPER_ADMIN_EMAIL=admin@sagofactu.com
SUPER_ADMIN_PASSWORD=<generar contraseña segura>
```

### Características
```
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_WEBHOOKS=false
ENABLE_API_KEYS=true
```

## 3. Proceso de Despliegue

### Paso 1: Verificar Build Local
```bash
npm run build
# Debe completar exitosamente
```

### Paso 2: Desplegar a Vercel
```bash
npx vercel --prod
# O usando el dashboard de Vercel
```

### Paso 3: Verificar Despliegue
```bash
# Acceder a: https://tu-dominio.vercel.app
# Verificar que la app carga correctamente
```

### Paso 4: Resetear Configuraciones de Usuarios

Una vez en Vercel, ejecutar el script de reset para limpiar datos de prueba:

```bash
# Usando Vercel CLI
npx vercel --prod env pull  # Obtener variables de Vercel
node scripts/reset-user-configs.mjs

# O en la consola de Vercel:
vercel env pull
npm run reset:users
```

Este script elimina:
- ✓ Todas las credenciales HKA de usuarios
- ✓ Todos los certificados digitales
- ✓ Datos de empresa de todos los usuarios
- ✓ Pools de folios sincronizados
- ✗ NO elimina facturas (se mantienen para auditoría)

## 4. Arquitectura de Credenciales (Producción)

### ✓ Implementado Correctamente

Las credenciales HKA ya NO se obtienen de variables de entorno para usuarios individuales.

**Flujo correcto:**

```
Usuario configura credenciales en /simple/configuracion (formulario web)
    ↓
Credenciales se encriptan con AES-256-GCM + PBKDF2
    ↓
Se guardan en tabla HKACredential (encriptadas)
    ↓
Al enviar factura, se obtienen desde BD
    ↓
Se inyectan temporalmente en process.env via withHKACredentials()
    ↓
Se usan en HKASOAPClient
    ↓
Se restauran valores originales (seguridad multi-tenancy)
```

### Variables de Entorno - Solo para Setup de Sistema

Las siguientes variables de entorno se usan SOLO para:
- Fallback en Plan Empresarial (si no hay credenciales en BD)
- Configuración de URLs SOAP
- NO deben contener credenciales reales de usuarios

```
HKA_DEMO_TOKEN_USER=<demo para fallback - opcional>
HKA_DEMO_TOKEN_PASSWORD=<demo para fallback - opcional>
HKA_PROD_TOKEN_USER=<NOT CONFIGURED EN PRODUCCIÓN>
HKA_PROD_TOKEN_PASSWORD=<NOT CONFIGURED EN PRODUCCIÓN>
```

## 5. Datos de Usuario Requeridos para Facturas

Cada usuario/organización DEBE configurar antes de enviar facturas:

### En /simple/configuracion:
- **RUC**: 155738031-2
- **DV**: 20
- **Razón Social**: Mi Empresa S.A.
- **Nombre Comercial**: Mi Empresa (opcional)
- **Email**: empresa@ejemplo.com
- **Teléfono**: +507 XXXX-XXXX
- **Dirección**: Ciudad, Provincia

### Credenciales HKA:
- **Token Usuario**: Proporcionado por The Factory HKA
- **Token Password**: Proporcionado por The Factory HKA
- **Ambiente**: Demo o Producción

### Certificado Digital:
- **Archivo P12/PFX**: Certificado digital válido
- **PIN**: Para desproteger el certificado
- **RUC en certificado**: Debe coincidir con RUC del usuario

## 6. Gestión de Folios

El sistema consulta y gestiona folios automáticamente:

1. **Consultar folios disponibles**: API `GET /api/folios/tiempo-real`
   - Devuelve folios disponibles desde HKA en tiempo real
   - NO requiere sincronización previa

2. **Sincronizar folios**: API `POST /api/folios/sincronizar`
   - Opcional: guardar estado en BD para referencia rápida
   - Útil para dashboards que muestran estado histórico

3. **Consumir folio**: Automático al enviar factura
   - Validar disponibilidad antes de enviar
   - Consumir después de respuesta exitosa de HKA
   - Actualizar estado en BD

## 7. Validación Post-Despliegue

### Verificar Encriptación
```bash
curl -X POST https://tu-dominio.vercel.app/api/settings/hka-credentials \
  -H "Content-Type: application/json" \
  -d '{"tokenUser": "test", "tokenPassword": "test"}'

# Debe responder con credenciales encriptadas guardadas
```

### Verificar Conexión HKA
```bash
curl -X POST https://tu-dominio.vercel.app/api/settings/test-hka-connection \
  -H "Authorization: Bearer <tu-token-session>"

# Debe responder con estado de conexión
```

### Verificar Folios
```bash
curl -X GET 'https://tu-dominio.vercel.app/api/folios/tiempo-real?ruc=155738031&dv=2' \
  -H "Authorization: Bearer <tu-token-session>"

# Debe devolver folios disponibles
```

## 8. Monitoreo en Producción

### Logs de HKA
Revisar en Vercel Analytics → Functions:
- Tiempo de respuesta de HKA
- Errores de encriptación/desencriptación
- Fallos de conexión

### Métricas Importantes
- Tiempo de encriptación de credenciales
- Tasa de éxito en envío de facturas
- Disponibilidad de folios

## 9. Rollback en Caso de Error

Si hay problemas con la encriptación:

1. Verificar que `ENCRYPTION_KEY` es correcta en Vercel
2. Ejecutar: `npx vercel env ls` para ver todas las variables
3. Si es necesario cambiar la clave:
   - Generar nueva: `openssl rand -hex 32`
   - Actualizar en Vercel
   - Cambiar en local `.env`
   - Re-desplegar

⚠️ **IMPORTANTE**: Cambiar `ENCRYPTION_KEY` hará que credenciales existentes sean ilegibles. Se recomienda solo en emergencias.

## 10. Checklist Pre-Producción

- [ ] ENCRYPTION_KEY configurada en Vercel
- [ ] DATABASE_URL apunta a Neon producción
- [ ] NEXTAUTH_URL correcto para el dominio
- [ ] NEXTAUTH_SECRET generado y configurado
- [ ] HKA URLs correctas (demo/prod)
- [ ] Build local ejecuta sin errores
- [ ] Despliegue a Vercel exitoso
- [ ] Variables de entorno visibles en Vercel dashboard
- [ ] Reset script ejecutado
- [ ] Prueba de encriptación exitosa
- [ ] Prueba de conexión HKA exitosa
- [ ] Usuarios pueden configurar credenciales
- [ ] Usuarios pueden subir certificados

## 11. Soporte y Troubleshooting

### Error: "ENCRYPTION_KEY no está configurada"
- Verificar que la variable existe en Vercel
- Ejecutar: `npx vercel env pull` para obtener variables localmente

### Error: "Fallo al desencriptar token HKA"
- Verificar que ENCRYPTION_KEY es la misma en local y Vercel
- Credenciales antiguas podrían estar corruptas
- Ejecutar reset script y re-configurar

### Error: "No hay folios disponibles"
- Verificar que las credenciales HKA sean válidas
- Contactar a The Factory HKA para validar cuenta
- Verificar que el RUC tiene folios asignados

### Lentitud en envío de facturas
- Revisar tiempo de respuesta de HKA (Vercel Analytics)
- Verificar conexión a base de datos Neon
- Considerar aumentar timeouts si es necesario
