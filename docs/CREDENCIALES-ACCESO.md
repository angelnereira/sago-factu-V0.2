# 🔐 CREDENCIALES DE ACCESO - SAGO-FACTU

**Última actualización**: 22 de octubre de 2025

---

## ✅ CREDENCIALES ACTUALES

### Super Admin

```
Email: admin@sagofactu.com
Contraseña: Admin123!
```

**Rol**: `SUPER_ADMIN`  
**Acceso**: Panel de administración completo  
**URL**: http://localhost:3000/auth/signin

### Usuario Demo

```
Email: usuario@empresa.com
Contraseña: usuario123
```

**Rol**: `USER`  
**Acceso**: Dashboard estándar  
**Organización**: Empresa Demo S.A.

---

## 🔧 SCRIPTS DE UTILIDAD

### Resetear Contraseña del Super Admin

```bash
# Con contraseña personalizada
npm run admin:reset Admin123!

# O con contraseña por defecto desde .env
npm run admin:reset
```

### Verificar Credenciales

```bash
# Verificar que las credenciales funcionen
npm run admin:check admin@sagofactu.com Admin123!
```

### Verificar Cualquier Usuario

```bash
npx tsx scripts/check-user.ts usuario@empresa.com usuario123
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Error: "Contraseña incorrecta"

**Posibles causas**:
1. La contraseña no está hasheada correctamente
2. Espacios o caracteres especiales en la contraseña
3. Base de datos desactualizada

**Solución**:

```bash
# 1. Verificar credenciales actuales
npm run admin:check admin@sagofactu.com Admin123!

# 2. Si falla, resetear contraseña
npm run admin:reset Admin123!

# 3. Verificar de nuevo
npm run admin:check admin@sagofactu.com Admin123!
```

### ❌ Error: "Usuario no encontrado"

**Solución**:

```bash
# Ejecutar seed para crear usuarios
npm run db:seed

# O resetear completamente la BD
npm run db:reset
```

### ❌ Error: "Usuario inactivo"

**Solución**:

```bash
# Activar usuario con Prisma Studio
npm run db:studio

# Luego en la tabla User:
# - Buscar el usuario
# - Cambiar isActive a true
```

---

## 🔍 VERIFICACIÓN PASO A PASO

### 1. Verificar que el usuario existe

```bash
npm run db:studio
```

En Prisma Studio:
- Ir a la tabla `User`
- Buscar `admin@sagofactu.com`
- Verificar que:
  - ✅ `email` = admin@sagofactu.com
  - ✅ `role` = SUPER_ADMIN
  - ✅ `isActive` = true
  - ✅ `password` tiene un hash (empieza con `$2b$12$...`)

### 2. Verificar hash de contraseña

```bash
npx tsx scripts/check-user.ts admin@sagofactu.com Admin123!
```

Debe mostrar:
```
✅ Usuario encontrado
🔐 Verificación de contraseña: ✅ CORRECTA
```

### 3. Probar login en la aplicación

1. Ir a: http://localhost:3000/auth/signin
2. Ingresar:
   - Email: `admin@sagofactu.com`
   - Contraseña: `Admin123!`
3. Click en "Iniciar sesión"
4. Debe redirigir a `/dashboard`

---

## 🔐 SEGURIDAD

### ⚠️ IMPORTANTE EN PRODUCCIÓN

1. **NUNCA** usar contraseñas simples como `Admin123!`
2. **SIEMPRE** cambiar las credenciales por defecto
3. **Usar** contraseñas de al menos 12 caracteres
4. **Incluir**: mayúsculas, minúsculas, números y símbolos

### Ejemplo de contraseña segura:

```bash
npm run admin:reset "X9k#mP2$vL8@qW4!"
```

### Variables de entorno en producción:

```env
# .env
SUPER_ADMIN_EMAIL=admin@tuempresa.com
SUPER_ADMIN_PASSWORD=TuContraseñaSuperSegura123!#
```

---

## 📊 ROLES DEL SISTEMA

| Rol | Descripción | Accesos |
|-----|-------------|---------|
| `SUPER_ADMIN` | Administrador global | Todo el sistema, panel admin |
| `ORG_ADMIN` | Admin de organización | Gestión de su organización |
| `USER` | Usuario estándar | Dashboard, facturas, reportes |
| `API_USER` | Usuario API | Solo endpoints de API |

---

## 🧪 TESTING DE AUTENTICACIÓN

### Test manual completo:

```bash
# 1. Resetear contraseña
npm run admin:reset Admin123!

# 2. Verificar credenciales
npm run admin:check admin@sagofactu.com Admin123!

# 3. Iniciar servidor
npm run dev

# 4. Abrir navegador
# http://localhost:3000/auth/signin

# 5. Login con:
# Email: admin@sagofactu.com
# Password: Admin123!
```

---

## 🔄 RESETEAR TODO EL SISTEMA

Si nada funciona, resetear completamente:

```bash
# 1. Parar servidor
# Ctrl+C

# 2. Resetear base de datos
npm run db:reset

# 3. Verificar credenciales
npm run admin:check admin@sagofactu.com Admin123!

# 4. Iniciar servidor
npm run dev

# 5. Intentar login
```

---

## 📝 LOGS ÚTILES PARA DEBUGGING

### Ver logs de autenticación:

Los logs aparecen en la consola cuando haces login:

```
[AUTH CONFIG] Iniciando autorización
[AUTH CONFIG] Validación fallida  <- Si falla validación
[AUTH CONFIG] Usuario no encontrado  <- Si no existe
[AUTH CONFIG] Password incorrecto  <- Si password no coincide
[AUTH CONFIG] Autorización exitosa: admin@sagofactu.com  <- ✅ Success
```

### Activar modo debug:

En `.env`:
```env
NODE_ENV=development
```

---

## 🆘 SOPORTE

Si después de seguir todos estos pasos aún tienes problemas:

1. **Verificar versión de bcryptjs**:
   ```bash
   npm ls bcryptjs
   ```

2. **Reinstalar dependencias**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verificar que Prisma está actualizado**:
   ```bash
   npm run db:generate
   ```

4. **Ver logs completos del servidor**:
   ```bash
   npm run dev
   # No cerrar esta terminal y ver los logs cuando hagas login
   ```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de hacer login, verifica:

- [ ] El servidor está corriendo (`npm run dev`)
- [ ] La base de datos está conectada
- [ ] El usuario existe (`npm run admin:check`)
- [ ] El hash de contraseña es correcto
- [ ] El usuario está activo (`isActive: true`)
- [ ] No hay errores en la consola del servidor
- [ ] Estás usando el email correcto
- [ ] Estás usando la contraseña correcta (sin espacios extras)

---

## 🎯 RESUMEN RÁPIDO

```bash
# Si el login falla, ejecuta esto:
npm run admin:reset Admin123!
npm run admin:check admin@sagofactu.com Admin123!

# Credenciales actuales:
# Email: admin@sagofactu.com
# Password: Admin123!
```

---

**Última actualización**: 22 de octubre de 2025  
**Contraseña reseteada**: Sí ✅  
**Hash verificado**: Sí ✅  
**Login funcionando**: Sí ✅  

---

🔐 **¡Las credenciales están listas para usar!**
