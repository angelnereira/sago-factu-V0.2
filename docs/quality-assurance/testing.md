# 🧪 Guía de Testing en Producción

**Última actualización**: Noviembre 2025
**Status**: ✅ Producción Operativa
**URL**: https://sago-factu.vercel.app/

---

## Inicio Rápido

### 1. Acceder a la App

1. Abre tu navegador en: **https://sago-factu.vercel.app/**
2. Verás la pantalla de login

### 2. Credenciales Demo

Elige una de las dos cuentas disponibles:

#### Super Admin (Acceso Completo)
```
Email:    admin@sago-factu.com
Password: admin123
```
- Acceso a: Dashboards, configuración, usuarios, folios, facturas
- Panel de administración con métricas
- Gestión de organizaciones y usuarios

#### Usuario Regular (Acceso Estándar)
```
Email:    usuario@empresa.com
Password: usuario123
```
- Acceso a: Dashboard personal, crear facturas, gestionar credenciales
- Limitado a su propia organización
- Sin acceso a panel de admin

---

## 🔐 Testing de Encriptación de Credenciales HKA

Esta es la funcionalidad crítica que fue fixed en Nov 2025. Pruébala así:

### Paso 1: Inicia Sesión

Usa cualquiera de las dos cuentas (recomendado: usuario regular para ver multi-tenancy)

```
Email:    usuario@empresa.com
Password: usuario123
```

### Paso 2: Navega a Configuración

1. Haz clic en tu **avatar/perfil** (esquina superior derecha)
2. Selecciona **"Settings"** o **"Configuración"**
3. Busca la sección **"HKA Credentials Configuration"** o **"Configuración de Credenciales HKA"**

### Paso 3: Guarda Credenciales Demo

En el formulario de credenciales, ingresa:

```
Token User:     demo_user_12345
Token Password: demo_pass_secure_abc123
Environment:    Demo  (selecciona del dropdown)
```

Campos opcionales (puedes llenarlos o dejarlos vacíos):
```
RUC:                (Ej: 7-123-456789)
Dígito Verificador: (Ej: 7)
Razón Social:       (Ej: Mi Empresa S.A.)
Nombre Comercial:   (Ej: Mi Tienda Online)
Email:              (Ej: contacto@miempresa.com)
Teléfono:           (Ej: +507 1234-5678)
Dirección:          (Ej: Calle Principal 123, Panamá)
```

### Paso 4: Guarda y Verifica

1. Haz clic en **"Save"** o **"Guardar"**
2. **Espera** a que se complete (verás un spinner/loading)
3. Deberías ver un mensaje de éxito: **"Credenciales HKA guardadas correctamente"**

### Paso 5: Verifica Persistencia

1. **Recarga la página** (F5 o Cmd+R)
2. Vuelve a Settings → HKA Credentials
3. **Verifica que los datos se mantienen**:
   - El Token User debería ser: `demo_user_12345` (parcialmente oculto por seguridad)
   - El Token Password no debe mostrarse (está encriptado)
   - El Environment debe mostrar: `Demo`
   - Los datos del contribuyente deben persistir

✅ Si todo funciona, significa que:
- La encriptación AES-256-GCM está operativa
- Los datos se guardan en PostgreSQL correctamente
- La multi-tenancy por usuario está funcionando
- Las variables de entorno están configuradas correctamente

---

## 🧪 Testing de Otras Funcionalidades

### 1. Dashboard Principal

**Para acceder**: Después de login, verás el dashboard
**Qué ver**:
- Resumen de folios disponibles
- Facturas recientes
- Estadísticas de documentos procesados
- Métricas de uso

### 2. Crear una Factura (Demo)

1. Ve a **"Facturas"** en el menú principal
2. Haz clic en **"Nueva Factura"** o **"+ Crear Factura"**
3. Llena los datos básicos:
   ```
   Cliente:      Cliente Demo S.A.
   Producto:     Servicio de Consultoría
   Cantidad:     1
   Precio Unit:  $500.00
   ```
4. Haz clic en **"Enviar"** o **"Submit"**
5. Verifica que aparezca en el listado de facturas

### 3. Gestión de Folios

1. Ve a **"Folios"** en el menú
2. Verás folios disponibles y consumidos
3. Observa las estadísticas:
   - Folios activos
   - Folios consumidos
   - Próximo rango a vencer

### 4. Reportes

1. Ve a **"Reportes"** (solo visible para Super Admin)
2. Verás dashboards con:
   - Facturación por período
   - Documentos procesados
   - Errores de sincronización
   - Tendencias de uso

---

## 🔍 Verificación de Infraestructura

### Base de Datos

Para verificar que PostgreSQL está conectado:
- Los datos de credenciales se guardan correctamente
- Puedes crear y consultar facturas
- El logout/login funciona (significa que la sesión se almacena)

### Encriptación

Para verificar el endpoint de encriptación (solo en dev o test):
```bash
curl https://sago-factu.vercel.app/api/debug/encryption-test
```

Respuesta esperada:
```json
{
  "success": true,
  "match": true,
  "message": "Encryption test passed"
}
```

**Nota**: Este endpoint puede ser removido en producción por seguridad.

### Autenticación

Para verificar que NextAuth está funcionando:
- Login y logout funcionan correctamente
- Las sesiones persisten entre recargas
- Los roles y permisos se respetan

---

## ⚠️ Errores Conocidos y Soluciones

### Error: "Fallo al encriptar token HKA"

**Causa**: ENCRYPTION_KEY no está configurado en Vercel

**Solución**:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   ```
   ENCRYPTION_KEY=923f1d9ae34a1bf8d793499ec3fc200334ebedf165c85a3ad4da5f54e8aa4e8a
   ```
4. Redeploy la app

### Error: "Usuario sin organización"

**Causa**: El usuario de login no tiene una organización asignada

**Solución**:
- Usa `admin@sago-factu.com` o `usuario@empresa.com` (pre-configuradas en seed)
- O crea una nueva organización en admin panel

### Datos no persisten después de guardar

**Causa**: Conexión a BD está fallando o ENCRYPTION_KEY no está disponible

**Verificación**:
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Haz clic en Save nuevamente
4. Verifica el status del request (debe ser 200)
5. Si es 500, revisa el body del response para el error

---

## 📊 Observaciones de Seguridad

### Lo que está Encriptado

- ✅ Token Password (credencial HKA) — AES-256-GCM
- ✅ Certificados digitales — AES-256-GCM
- ✅ Sesiones de usuario — JWT + Cookies seguras

### Lo que NO está Encriptado

- ❌ Token User (solo es username, no credential)
- ❌ Datos de contribuyente (RUC, razón social, etc.)
- ❌ Listado de facturas (acceso restringido por rol)

### Validaciones

- ✅ ENCRYPTION_KEY: 256-bit (64 caracteres hex)
- ✅ PBKDF2: 120,000 iteraciones
- ✅ Salt: 16 bytes aleatorios por encriptación
- ✅ IV: 12 bytes (AES-GCM)
- ✅ Auth Tag: 128 bits (para integridad)

---

## 🚀 Próximos Steps

Después de verificar que todo funciona:

1. **Integración Real con HKA**:
   - Configura credenciales reales de HKA
   - Prueba enviando una factura de prueba
   - Verifica que se procese correctamente

2. **Testing de Edge Cases**:
   - Intenta cambiar credenciales (debe marcar anteriores como inactivas)
   - Prueba con ambos environments (Demo y Prod)
   - Verifica logs en Vercel Analytics

3. **Load Testing**:
   - Si esperas mucho tráfico, testea con múltiples usuarios simultáneos
   - Verifica que Redis está disponible para queues
   - Monitorea latency en Vercel Analytics

4. **Deployment Adicionales**:
   - Configura dominio personalizado
   - Añade CDN para imágenes
   - Configura backups de BD

---

## 📝 Checklist de Verificación

- [ ] Login funciona con ambas cuentas
- [ ] Dashboard carga correctamente
- [ ] Puedo guardar credenciales HKA sin errores
- [ ] Los datos persistidos después de recarga
- [ ] Puedo crear una factura de prueba
- [ ] Puedo ver reportes (Super Admin)
- [ ] Logout funciona correctamente
- [ ] Responsive en mobile
- [ ] Sin errores en console (F12)
- [ ] API endpoint de encriptación funciona (curl test)

---

## 🆘 Soporte

Si encuentras problemas:

1. **Verifica los logs**:
   - Vercel → Dashboard → Project → Functions
   - Busca errores relacionados a encryptión

2. **Revisa la documentación**:
   - [ENCRYPTION-FIX-SUMMARY.md](./ENCRYPTION-FIX-SUMMARY.md)
   - [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md)
   - [CONNECTIVITY-AND-DEPLOYMENT-STATUS.md](./CONNECTIVITY-AND-DEPLOYMENT-STATUS.md)

3. **Contacta al equipo**:
   - Email: soporte@sago-factu.com
   - Incluye: URL de la issue, pasos para reproducir, logs (si aplica)

---

**Última verificación**: ✅ Nov 2025 - Sistema en vivo y operativo
**Ambiente**: Vercel (Production)
**Base de datos**: Neon PostgreSQL (Production)
