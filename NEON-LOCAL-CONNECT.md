# 🔌 Configuración de Neon Local Connect

## 📋 ¿Qué es Neon Local Connect?

Neon Local Connect es una extensión que te permite:
- Conectarte a tu base de datos de Neon desde tu desarrollo local
- Usar un proxy seguro para debugging
- Monitorear queries en tiempo real
- No exponer credenciales directamente

---

## ✅ Estado Actual

**Ya configurado:**
- ✅ `neonctl` instalado en el proyecto
- ✅ `DATABASE_URL` en `.env` apunta a Neon
- ✅ Conexión directa funcional

**Configuración actual:**
```bash
# .env
DATABASE_URL="postgresql://neondb_owner:PASSWORD@HOST.neon.tech/neondb?sslmode=require"
```

---

## 🎯 Opciones de Configuración

### **Opción 1: Mantener Configuración Actual** (Recomendado)

**Ventajas:**
- ✅ Ya funciona perfectamente
- ✅ Conexión directa a Neon
- ✅ No requiere proxy local
- ✅ Más simple

**Cuándo usar:**
- Desarrollo normal
- La conexión es rápida
- No necesitas debugging avanzado

**Acción:** ✅ Nada que hacer, ya está configurado

---

### **Opción 2: Usar Neon Local Connect para Debugging**

**Ventajas:**
- ✅ Monitorea todas las queries
- ✅ Ve queries en tiempo real
- ✅ Debugging avanzado
- ✅ Inspección de conexiones

**Cuándo usar:**
- Debugging de queries lentas
- Inspección de conexiones
- Desarrollo de features complejas

**Configuración:**

1. **Instalar extensión de Neon en VS Code/Cursor:**
   - Ya instalada ✅

2. **Autenticarte con Neon:**
   ```bash
   npx neonctl auth
   ```
   Esto abre el navegador para autenticarte.

3. **Listar tus proyectos:**
   ```bash
   npx neonctl projects list
   ```

4. **Seleccionar proyecto:**
   ```bash
   # Toma nota del project_id
   # Debería ser: ep-divine-field-ad26eaav
   ```

5. **Iniciar proxy local:**
   ```bash
   npx neonctl connection-string --project-id YOUR_PROJECT_ID
   ```

6. **Usar en desarrollo:**
   ```bash
   # Temporal, solo para debugging
   DATABASE_URL="postgresql://localhost:5432/neondb" npm run dev
   ```

---

## 🔧 Configuración Recomendada para tu Proyecto

### **Para Desarrollo Normal:**

```bash
# .env (actual - NO CAMBIAR)
DATABASE_URL="postgresql://neondb_owner:PASSWORD@HOST.neon.tech/neondb?sslmode=require"
```

Ejecutar:
```bash
npm run dev
```

✅ **Esto ya funciona y es lo recomendado**

---

### **Para Debugging Avanzado (Opcional):**

Crear archivo: `.env.local.debug`

```bash
# Solo para debugging temporal
DATABASE_URL="postgresql://localhost:5432/neondb"
```

Usar cuando necesites debuggear:
```bash
# Terminal 1: Iniciar proxy
npx neonctl connection-string --project-id YOUR_PROJECT_ID --pooled

# Terminal 2: Ejecutar app con proxy
cp .env.local.debug .env.local
npm run dev
```

---

## 🎯 Scripts Útiles

Agregar a `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "neon:auth": "neonctl auth",
    "neon:projects": "neonctl projects list",
    "neon:branches": "neonctl branches list --project-id YOUR_PROJECT_ID",
    "neon:proxy": "neonctl connection-string --project-id YOUR_PROJECT_ID"
  }
}
```

---

## 📊 Comandos de neonctl

### **Autenticación:**
```bash
npx neonctl auth
```

### **Ver proyectos:**
```bash
npx neonctl projects list
```

### **Ver branches:**
```bash
npx neonctl branches list --project-id YOUR_PROJECT_ID
```

### **Obtener connection string:**
```bash
npx neonctl connection-string --project-id YOUR_PROJECT_ID
```

### **Crear branch:**
```bash
npx neonctl branches create --project-id YOUR_PROJECT_ID --name dev/feature-x
```

### **Eliminar branch:**
```bash
npx neonctl branches delete --project-id YOUR_PROJECT_ID --branch dev/feature-x
```

---

## 🔐 Seguridad

### **Archivo .env:**
```bash
# ✅ BIEN (conexión directa segura)
DATABASE_URL="postgresql://neondb_owner:PASSWORD@HOST.neon.tech/neondb?sslmode=require"
```

### **Con proxy local:**
```bash
# ⚠️ SOLO PARA DEBUGGING LOCAL
DATABASE_URL="postgresql://localhost:5432/neondb"
```

**Importante:**
- Nunca uses el proxy local en producción
- El proxy es solo para debugging
- La conexión directa es más rápida

---

## 🎯 Recomendación para tu Proyecto

### **Estado Actual: ✅ PERFECTO**

```
Tu configuración actual:
├─ DATABASE_URL apunta directamente a Neon ✅
├─ Conexión pooled ✅
├─ SSL habilitado ✅
└─ Funciona en dev y prod ✅
```

### **¿Necesitas cambiar algo? NO**

La extensión de Neon Local Connect es útil para:
- 🔍 Debugging avanzado (opcional)
- 👀 Monitorear queries (opcional)
- 🔧 Inspección profunda (opcional)

**Para desarrollo normal:**
- ✅ Tu configuración actual es óptima
- ✅ No necesitas proxy local
- ✅ La conexión directa es rápida y segura

---

## 🚀 Uso Práctico

### **Escenario 1: Desarrollo Normal**
```bash
# Usar configuración actual
npm run dev
```
✅ Recomendado para uso diario

### **Escenario 2: Debugging de Query Lenta**
```bash
# Terminal 1: Proxy con logging
npx neonctl connection-string --project-id YOUR_PROJECT_ID

# Terminal 2: App con proxy
DATABASE_URL="postgresql://localhost:5432/neondb" npm run dev

# Inspeccionar queries en la consola del proxy
```
🔍 Útil para debugging específico

### **Escenario 3: Crear Branch para Feature**
```bash
# Crear branch de BD para feature
npx neonctl branches create --project-id YOUR_PROJECT_ID --name dev/mi-feature

# Obtener connection string del nuevo branch
npx neonctl connection-string --project-id YOUR_PROJECT_ID --branch dev/mi-feature

# Usar en .env.local
DATABASE_URL="[nueva_url_del_branch]"

# Desarrollar
npm run dev

# Cuando termines, eliminar branch
npx neonctl branches delete --project-id YOUR_PROJECT_ID --branch dev/mi-feature
```
🎯 Útil para features que modifican el schema

---

## 📚 Recursos

- **neonctl CLI:** https://neon.tech/docs/reference/neon-cli
- **Local Connect:** https://neon.tech/docs/guides/neon-local-connect
- **Branching:** https://neon.tech/docs/guides/branching

---

## ✅ Conclusión

**Para tu proyecto actual:**

1. ✅ **Mantén la configuración actual** (DATABASE_URL directo a Neon)
2. ✅ **neonctl ya está instalado** (por si lo necesitas)
3. ✅ **Extensión instalada** (disponible cuando la necesites)
4. ✅ **Todo funciona perfectamente** sin cambios adicionales

**Usa neonctl cuando:**
- 🔍 Necesites debuggear queries
- 🌿 Quieras crear branches de BD para features
- 👀 Necesites monitorear conexiones
- 🔧 Estés optimizando rendimiento

**Para desarrollo diario:**
- ✅ Sigue usando `npm run dev` como ahora
- ✅ La conexión directa es más rápida
- ✅ No requiere proxy adicional

---

**Última actualización:** Instalación de neonctl completada  
**Estado:** ✅ Configuración actual óptima, neonctl disponible para debugging  
**Mantenido por:** Equipo SAGO-FACTU

