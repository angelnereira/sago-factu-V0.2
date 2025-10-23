# 🔐 CREDENCIALES DE ACCESO - SAGO-FACTU

**Proyecto**: SAGO-FACTU  
**Fecha**: 22 de octubre de 2025  
**Estado**: Desarrollo  

---

## ⚠️ IMPORTANTE - SEGURIDAD

**🚨 ESTE ARCHIVO CONTIENE CREDENCIALES DE DESARROLLO**

- ❌ **NO subir este archivo a GitHub**
- ❌ **NO compartir estas credenciales públicamente**
- ✅ Cambiar contraseñas en producción
- ✅ Usar variables de entorno en Vercel

---

## 👑 SUPER ADMINISTRADOR

### Credenciales de Acceso

**Email**: `admin@sagofactu.com`  
**Contraseña**: `admin123`

**Rol**: `SUPER_ADMIN`  
**Permisos**: Acceso completo al sistema

### URLs de Acceso

**Desarrollo Local**:
```
http://localhost:3000/auth/signin
```

**Después del Login**:
```
http://localhost:3000/dashboard/admin
```

---

## 🔑 OTRAS CUENTAS

### Usuario de Prueba (Empresa)

**Email**: `usuario@empresa.com`  
**Contraseña**: `usuario123`  
**Rol**: `USER`  
**Acceso**: Dashboard normal (sin panel admin)

---

## 🚀 CÓMO INICIAR SESIÓN

### Paso 1: Acceder a la Página de Login

1. Abrir navegador
2. Ir a: `http://localhost:3000/auth/signin`
3. O click en "Iniciar Sesión" desde la homepage

### Paso 2: Ingresar Credenciales

**Para Super Admin**:
- Email: `admin@sagofactu.com`
- Password: `admin123`
- Click en "Iniciar Sesión"

### Paso 3: Acceder al Panel

Después del login, serás redirigido a:
- **Super Admin**: `/dashboard/admin` (Panel de administración)
- **Usuario Normal**: `/dashboard` (Dashboard estándar)

---

## 🎯 FUNCIONALIDADES DISPONIBLES

### Como Super Admin (`admin@sagofactu.com`)

✅ **Dashboard Admin** (`/dashboard/admin`)
- Ver estadísticas del sistema
- Métricas de usuarios, organizaciones, folios
- Actividad reciente

✅ **Gestión de Usuarios** (`/dashboard/admin/users`)
- Crear nuevos usuarios
- Editar usuarios existentes
- Eliminar usuarios (excepto Super Admins)
- Asignar folios a usuarios
- Ver listado completo de usuarios

✅ **Dashboard Normal** (`/dashboard`)
- Acceso a todas las funcionalidades normales
- Facturas
- Folios
- Reportes
- Configuración

### Como Usuario Normal (`usuario@empresa.com`)

✅ **Dashboard** (`/dashboard`)
- Ver facturas de su organización
- Crear nuevas facturas
- Gestionar clientes
- Ver reportes
- Configuración de perfil

❌ **NO tiene acceso a:**
- Panel de administración (`/dashboard/admin`)
- Gestión de usuarios de otras organizaciones
- Compra de folios desde HKA

---

## 🔧 CONFIGURACIÓN DE CREDENCIALES

### Variables de Entorno (`.env`)

```env
# Super Admin
SUPER_ADMIN_EMAIL="admin@sagofactu.com"
SUPER_ADMIN_PASSWORD="admin123"
```

### Cambiar Credenciales

#### Opción 1: Modificar `.env` y Re-seed

```bash
# 1. Editar .env
nano .env

# Cambiar:
SUPER_ADMIN_EMAIL="tu-email@example.com"
SUPER_ADMIN_PASSWORD="tu-password-seguro"

# 2. Re-ejecutar seed
npm run db:seed
```

#### Opción 2: Cambiar Directamente en la Base de Datos

```bash
# 1. Abrir Prisma Studio
npm run db:studio

# 2. Ir a tabla "User"
# 3. Buscar usuario con role = "SUPER_ADMIN"
# 4. Editar email y/o password (password debe ser hasheado)
```

#### Opción 3: Usar Script de Node.js

```javascript
// cambiar-password.js
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 12);
  console.log('Password hasheado:', hash);
}

hashPassword('tu-nuevo-password');
```

---

## 🛡️ SEGURIDAD EN PRODUCCIÓN

### Recomendaciones

1. **Cambiar contraseñas antes de deployment**
   ```bash
   # Generar password seguro
   openssl rand -base64 32
   ```

2. **Usar variables de entorno en Vercel**
   - Ir a Vercel Dashboard
   - Settings > Environment Variables
   - Agregar `SUPER_ADMIN_EMAIL` y `SUPER_ADMIN_PASSWORD`

3. **Habilitar 2FA** (Futuro)
   - Implementar autenticación de dos factores
   - Usar Google Authenticator o similar

4. **Rotar credenciales periódicamente**
   - Cada 90 días en producción
   - Después de cada incidente de seguridad

---

## 🔐 ROLES Y PERMISOS

### SUPER_ADMIN

**Puede**:
- ✅ Acceder a panel de administración
- ✅ Crear/editar/eliminar usuarios
- ✅ Gestionar todas las organizaciones
- ✅ Asignar folios
- ✅ Ver logs de auditoría
- ✅ Acceder a todas las funcionalidades del sistema

**No puede**:
- ❌ Ser eliminado del sistema
- ❌ Cambiar su propio rol a uno inferior

### ADMIN

**Puede**:
- ✅ Gestionar su organización
- ✅ Crear/editar usuarios de su organización
- ✅ Asignar folios dentro de su organización
- ✅ Ver facturas de su organización

**No puede**:
- ❌ Acceder al panel de administración global
- ❌ Gestionar otras organizaciones
- ❌ Comprar folios de HKA

### USER

**Puede**:
- ✅ Crear y gestionar facturas
- ✅ Ver folios disponibles de su organización
- ✅ Gestionar clientes
- ✅ Generar reportes

**No puede**:
- ❌ Acceder al panel de administración
- ❌ Gestionar usuarios
- ❌ Asignar folios

---

## 🧪 TESTING

### Probar Login como Super Admin

```bash
# 1. Asegurar que el servidor está corriendo
npm run dev

# 2. Abrir navegador
http://localhost:3000/auth/signin

# 3. Ingresar:
Email: admin@sagofactu.com
Password: admin123

# 4. Debe redirigir a:
http://localhost:3000/dashboard/admin
```

### Probar Funcionalidades Admin

1. **Ver Dashboard Admin**
   - Verificar que se muestran estadísticas
   - Confirmar métricas de usuarios, organizaciones, folios

2. **Gestionar Usuarios**
   - Ir a `/dashboard/admin/users`
   - Crear un nuevo usuario de prueba
   - Editar el usuario creado
   - Asignar folios al usuario
   - Eliminar el usuario (si no es Super Admin)

3. **Verificar Protección de Rutas**
   - Logout
   - Login como usuario normal
   - Intentar acceder a `/dashboard/admin`
   - Debe redirigir a `/dashboard`

---

## 🔄 RECUPERAR ACCESO

### Si Olvidaste la Contraseña

**Opción 1: Verificar `.env`**
```bash
cat .env | grep SUPER_ADMIN
```

**Opción 2: Re-ejecutar Seed**
```bash
npm run db:seed
# Esto recreará el Super Admin con las credenciales del .env
```

**Opción 3: Actualizar Directamente en BD**
```bash
# Abrir Prisma Studio
npm run db:studio

# Ir a tabla User
# Buscar email: admin@sagofactu.com
# Copiar password hasheado de otro usuario
# O generar nuevo hash con bcrypt
```

**Opción 4: Script SQL Directo**
```sql
-- Generar hash de 'admin123' y actualizar
-- (Ejecutar en Prisma Studio o cliente SQL)
UPDATE "User" 
SET password = '$2a$12$...' -- Hash generado con bcrypt
WHERE email = 'admin@sagofactu.com';
```

---

## 📊 RESUMEN DE CREDENCIALES

| Usuario | Email | Password | Rol | Acceso |
|---------|-------|----------|-----|--------|
| **Super Admin** | `admin@sagofactu.com` | `admin123` | SUPER_ADMIN | Panel admin + Todo |
| Usuario Prueba | `usuario@empresa.com` | `usuario123` | USER | Dashboard normal |

---

## 📞 SOPORTE

### Si No Puedes Acceder

1. Verificar que el servidor está corriendo
2. Verificar credenciales en `.env`
3. Re-ejecutar seed: `npm run db:seed`
4. Revisar logs del servidor
5. Verificar que la base de datos tiene datos

### Logs de Debug

```bash
# Ver logs del servidor
tail -f /tmp/sago-dev.log

# Ver logs de Prisma
npm run db:studio
```

---

## ⚠️ RECORDATORIOS DE SEGURIDAD

- 🔒 Cambiar contraseñas en producción
- 🔒 No compartir credenciales
- 🔒 Usar contraseñas fuertes
- 🔒 Habilitar 2FA cuando esté disponible
- 🔒 Rotar credenciales periódicamente
- 🔒 No commitear este archivo a Git

---

**Última actualización**: 22 de octubre de 2025  
**Versión**: 1.0-dev  
**Ambiente**: Desarrollo  

---

🔐 **¡Mantén estas credenciales seguras!**

