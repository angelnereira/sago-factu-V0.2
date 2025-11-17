# 🔐 INSTRUCCIONES PARA PROBAR EL LOGIN

## ✅ ESTADO ACTUAL

Las credenciales están **VERIFICADAS Y FUNCIONANDO** a nivel de base de datos.

```
Email: admin@sagofactu.com
Contraseña: Admin123!
```

---

## 🚀 PASOS PARA PROBAR EL LOGIN

### 1. Detener el servidor actual

```bash
# Encontrar y matar el proceso de Next.js
pkill -f "next dev"
```

### 2. Limpiar cache y reinstalar (opcional pero recomendado)

```bash
rm -rf .next
npm run db:generate
```

### 3. Iniciar el servidor SIN Turbopack

```bash
npm run dev
```

**IMPORTANTE**: Mantén esta terminal abierta para ver los logs en tiempo real.

### 4. Abrir el navegador

1. Ir a: http://localhost:3000/auth/signin
2. **Limpiar cookies** (F12 > Application > Storage > Clear site data)
3. Recargar la página (F5)

### 5. Intentar login

1. Email: `admin@sagofactu.com`
2. Contraseña: `Admin123!` (con mayúscula en la A y signo de exclamación al final)
3. Click en "Iniciar sesión"

### 6. Observar los logs

En la terminal donde ejecutaste `npm run dev`, deberías ver logs como:

```
═══════════════════════════════════════════════════════════
[AUTH CONFIG] 🔐 INICIANDO AUTORIZACIÓN
═══════════════════════════════════════════════════════════
[AUTH CONFIG] Credentials recibidas: { email: 'admin@sagofactu.com', hasPassword: true, passwordLength: 9 }
[AUTH CONFIG] ✅ Validación exitosa
[AUTH CONFIG] Email: admin@sagofactu.com
[AUTH CONFIG] Password length: 9
[AUTH CONFIG] Importando prismaServer...
[AUTH CONFIG] ✅ prismaServer importado
[AUTH CONFIG] Buscando usuario: admin@sagofactu.com
[AUTH CONFIG] ✅ Usuario encontrado: { ... }
[AUTH CONFIG] Comparando passwords...
[AUTH CONFIG] Comparación completada en XXX ms
[AUTH CONFIG] Resultado: ✅ CORRECTO
[AUTH CONFIG] ✅ Autorización exitosa: admin@sagofactu.com
═══════════════════════════════════════════════════════════
```

---

## 🔍 SI FALLA, VERIFICAR:

### A. Logs en la terminal del servidor

**Si ves**:
```
[AUTH CONFIG] ❌ Validación fallida
```
→ El email o password están vacíos o mal formateados.

**Si ves**:
```
[AUTH CONFIG] ❌ Usuario NO encontrado
```
→ Ejecutar: `npm run admin:reset Admin123!`

**Si ves**:
```
[AUTH CONFIG] ❌ Password incorrecto
```
→ Ejecutar: `npm run admin:reset Admin123!`

**Si ves**:
```
[AUTH CONFIG] ❌ Error en autorización
```
→ Hay un error en el código. Copiar el stack trace completo.

### B. Verificar en el navegador (F12 > Console)

Buscar errores de JavaScript o de red (Network tab).

### C. Verificar cookies

F12 > Application > Cookies > http://localhost:3000

Debería aparecer una cookie llamada `authjs.session-token` o similar después de un login exitoso.

---

## 🧪 SCRIPTS DE VERIFICACIÓN

### Verificar que las credenciales funcionan a nivel de BD

```bash
npm run admin:check admin@sagofactu.com Admin123!
```

Debe mostrar:
```
✅ Usuario encontrado
🔐 Verificación de contraseña: ✅ CORRECTA
```

### Simular el flujo completo de login

```bash
npx tsx scripts/test-login.ts admin@sagofactu.com Admin123!
```

Debe mostrar:
```
✅ LOGIN EXITOSO - TODOS LOS PASOS PASARON
```

### Resetear password si es necesario

```bash
npm run admin:reset Admin123!
```

---

## ⚠️ PROBLEMAS COMUNES

### 1. "Email o contraseña incorrectos" pero las credenciales están bien

**Causas posibles**:
- Cookies antiguas en el navegador
- Cache de Next.js desactualizado
- Servidor no recargado después de cambios

**Solución**:
```bash
# 1. Detener servidor
pkill -f "next dev"

# 2. Limpiar
rm -rf .next

# 3. Reiniciar
npm run dev

# 4. En navegador: F12 > Application > Clear site data
```

### 2. No aparecen logs en la terminal

**Causa**: El servidor no está mostrando los console.log

**Solución**:
```bash
# Asegurarse de que NODE_ENV está en development
echo $NODE_ENV

# Si no está, agregar a .env:
NODE_ENV=development
```

### 3. Error 500 al hacer login

**Causa**: Error en el servidor (Prisma, base de datos, etc.)

**Solución**:
```bash
# Ver logs completos
npm run dev

# Verificar conexión a BD
npm run db:studio
```

---

## 📊 CHECKLIST ANTES DE INTENTAR LOGIN

- [ ] Servidor corriendo (`npm run dev`)
- [ ] Terminal visible para ver logs
- [ ] Navegador con cookies limpias
- [ ] URL correcta: http://localhost:3000/auth/signin
- [ ] Email exacto: `admin@sagofactu.com`
- [ ] Contraseña exacta: `Admin123!` (con A mayúscula y !)
- [ ] Script de verificación pasó: `npm run admin:check`

---

## 🎯 QUÉ COMPARTIR SI SIGUE FALLANDO

Si después de seguir todos estos pasos aún falla, comparte:

1. **Logs completos de la terminal** cuando intentas hacer login
2. **Errores en la consola del navegador** (F12 > Console)
3. **Resultado de**:
   ```bash
   npm run admin:check admin@sagofactu.com Admin123!
   ```
4. **Resultado de**:
   ```bash
   npx tsx scripts/test-login.ts admin@sagofactu.com Admin123!
   ```
5. **Screenshot** del formulario de login con el error

---

## 💡 NOTA IMPORTANTE

He agregado **logs detallados** al proceso de autenticación. Cuando intentes hacer login, **DEBES ver logs en la terminal** del servidor. Si no ves ningún log, significa que:

1. El servidor no está corriendo
2. El formulario no está enviando los datos
3. Hay un error antes de llegar al authorize callback

---

**Última actualización**: 22 de octubre de 2025  
**Credenciales verificadas**: ✅ Sí  
**Logs habilitados**: ✅ Sí  
**Scripts de prueba**: ✅ Funcionando  

🔐 **¡Ahora intenta el login y observa los logs en la terminal!**

