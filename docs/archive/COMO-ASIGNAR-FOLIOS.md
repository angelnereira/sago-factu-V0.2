# 📋 CÓMO ASIGNAR FOLIOS A USUARIOS

**Guía paso a paso para Super Admin**

---

## 🎯 UBICACIÓN

**Ruta**: `/dashboard/admin/users`

**Acceso**: Solo usuarios con rol `SUPER_ADMIN`

---

## 📝 PASOS PARA ASIGNAR FOLIOS

### 1. Ir a Gestión de Usuarios

```
Dashboard Admin → Gestión de Usuarios
URL: /dashboard/admin/users
```

### 2. Localizar el Usuario

En la tabla de usuarios, busca el usuario al que quieres asignar folios.

**Columnas de la tabla**:
- Usuario (nombre y email)
- Organización
- Rol
- Estado (Activo/Inactivo)
- Fecha de Registro
- **Acciones** ← Aquí está el botón

### 3. Click en el Menú de Acciones

En la última columna "Acciones", verás un botón con **tres puntos verticales (⋮)**.

```
┌─────────────────────┐
│   👤 Juan Pérez     │
│   usuario@email.com │
├─────────────────────┤
│   ⋮  ← Click aquí  │
└─────────────────────┘
```

**Click en los 3 puntos (⋮)** para abrir el menú desplegable.

### 4. Seleccionar "Asignar Folios"

Se abrirá un menú con las siguientes opciones:

```
┌─────────────────────────┐
│ ✏️  Editar Usuario       │
│ 🔑  Asignar Folios  ←   │
│ 🗑️  Eliminar Usuario     │
└─────────────────────────┘
```

**Click en "Asignar Folios"** (el que tiene el ícono de llave 🔑).

### 5. Completar el Formulario

Se abrirá un modal con el formulario de asignación:

```
┌────────────────────────────────┐
│  🎫 Asignar Folios             │
├────────────────────────────────┤
│                                │
│  Asignar a:                    │
│  Juan Pérez                    │
│  usuario@email.com             │
│  Organización: Empresa XYZ     │
│                                │
│  📊 Cantidad de Folios         │
│  [   100   ]                   │
│  Mínimo 1, máximo 10,000       │
│                                │
│  💵 Precio por Folio (USD)     │
│  $ [  0.06  ]                  │
│  Precio actual: $0.06          │
│                                │
│  📝 Notas (Opcional)           │
│  [____________________]        │
│                                │
│  💰 Costo Total: $6.00         │
│  100 folios × $0.06 = $6.00    │
│                                │
│  [Cancelar] [Asignar Folios]  │
└────────────────────────────────┘
```

#### Campos del Formulario:

1. **Cantidad de Folios** (obligatorio)
   - Mínimo: 1
   - Máximo: 10,000
   - Ejemplo: `100`

2. **Precio por Folio** (obligatorio)
   - Default: `$0.06` (6 centavos)
   - Puedes cambiarlo si es necesario

3. **Notas** (opcional)
   - Descripción o comentario
   - Ejemplo: "Asignación mensual de diciembre"

### 6. Confirmar Asignación

Click en el botón **"Asignar Folios"** (verde).

**Confirmación**:
```
✅ 100 folios asignados correctamente
```

El modal se cerrará automáticamente después de 2 segundos.

---

## 🔍 VERIFICAR LA ASIGNACIÓN

### Opción 1: Dashboard de Folios

```
Dashboard Admin → Gestión de Folios
URL: /dashboard/admin/folios
```

Verás la asignación en la tabla "Últimas Asignaciones":

| Organización | Cantidad | Consumidos | Fecha | Notas |
|--------------|----------|------------|-------|-------|
| Empresa XYZ  | 100      | 0          | Hoy   | ...   |

### Opción 2: Verificar en Base de Datos

```bash
npm run db:studio
```

Ir a tabla `FolioAssignment` y buscar por `organizationId`.

---

## 🎯 EJEMPLO COMPLETO

### Escenario:

**Quiero asignar 50 folios a María García de la empresa "ACME Corp"**

### Pasos:

1. ✅ Voy a `/dashboard/admin/users`
2. ✅ Busco a "María García" en la tabla
3. ✅ Click en los 3 puntos (⋮) en su fila
4. ✅ Click en "Asignar Folios" en el menú
5. ✅ Modal se abre
6. ✅ Ingreso:
   - Cantidad: `50`
   - Precio: `0.06` (default)
   - Notas: `Asignación mensual enero`
7. ✅ Costo total: $3.00 (50 × $0.06)
8. ✅ Click en "Asignar Folios"
9. ✅ Mensaje: "✅ 50 folios asignados correctamente"
10. ✅ Modal se cierra automáticamente

### Resultado:

- ✅ María García tiene 50 folios disponibles
- ✅ La organización ACME Corp puede emitir 50 facturas
- ✅ El sistema creó un `FolioPool` si no existía
- ✅ Se creó un `FolioAssignment` para ACME Corp

---

## ⚠️ NOTAS IMPORTANTES

### 1. Requisitos para Asignar

- ✅ Debes ser **SUPER_ADMIN**
- ✅ El usuario debe tener una **organización asignada**
- ✅ La cantidad debe ser **entre 1 y 10,000**

### 2. ¿Qué Pasa al Asignar?

Cuando asignas folios:

1. **Se busca un Pool activo** de HKA
2. **Si no existe**, se crea uno nuevo con:
   - Batch: `BATCH-{timestamp}`
   - Total: cantidad asignada
   - Proveedor: HKA
3. **Se crea FolioAssignment** para la organización
4. **Se actualizan contadores**:
   - `availableFolios` - (cantidad)
   - `assignedFolios` + (cantidad)

### 3. Límites

- **Mínimo por asignación**: 1 folio
- **Máximo por asignación**: 10,000 folios
- **Sin límite de asignaciones**: Puedes asignar múltiples veces

### 4. Precio por Folio

El precio por defecto es **$0.06 (6 centavos)**.

Puedes cambiarlo según:
- Negociaciones con el cliente
- Volumen de compra
- Promociones especiales

---

## 🚨 PROBLEMAS COMUNES

### ❌ "No aparece el botón de 3 puntos"

**Solución**: El botón está en la última columna "Acciones". Desplázate a la derecha si estás en móvil.

### ❌ "No aparece la opción Asignar Folios"

**Causas**:
1. No eres SUPER_ADMIN
2. El componente no se cargó correctamente

**Solución**: Recargar la página (F5)

### ❌ "Error: Organización no encontrada"

**Causa**: El usuario no tiene organización asignada

**Solución**: 
1. Editar el usuario
2. Asignar una organización
3. Guardar
4. Intentar asignar folios de nuevo

### ❌ "Error: Datos inválidos"

**Causa**: Cantidad es 0 o negativa

**Solución**: Ingresar una cantidad entre 1 y 10,000

---

## 📊 TRACKING DE FOLIOS

### Ver Folios Disponibles de una Organización

En la página de **Gestión de Folios**:

```
/dashboard/admin/folios
```

Verás:
- **Pools Activos**: Total de pools de folios
- **Disponibles**: Folios sin asignar
- **Asignados**: Folios asignados a organizaciones
- **Consumidos**: Folios usados en facturas

### Tabla de Asignaciones

Muestra todas las asignaciones:
- Organización
- Cantidad asignada
- Cantidad consumida
- Fecha de asignación
- Notas

---

## 🎯 RESUMEN RÁPIDO

```bash
# Ruta
/dashboard/admin/users

# Pasos
1. Click en 3 puntos (⋮) en la fila del usuario
2. Click en "Asignar Folios"
3. Ingresar cantidad
4. Click en "Asignar Folios"
5. ✅ Confirmación

# Verificar
/dashboard/admin/folios
```

---

## 📸 UBICACIÓN VISUAL

```
┌──────────────────────────────────────────────────┐
│  Gestión de Usuarios                             │
├──────────────────────────────────────────────────┤
│                                                  │
│  Usuario       Organización   Rol     Acciones  │
│  ──────────────────────────────────────────────  │
│  Juan Pérez    Empresa XYZ    USER      ⋮ ←──┐  │
│  María García  ACME Corp      USER      ⋮    │  │
│  Pedro López   Tech Solutions USER      ⋮    │  │
│                                                │  │
│                                                │  │
│     Click aquí para abrir menú ───────────────┘  │
│                                                  │
│     ┌─────────────────────────┐                 │
│     │ ✏️  Editar Usuario       │                 │
│     │ 🔑  Asignar Folios  ←   │ Click aquí      │
│     │ 🗑️  Eliminar Usuario     │                 │
│     └─────────────────────────┘                 │
└──────────────────────────────────────────────────┘
```

---

**Última actualización**: 22 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Funcional  

---

🎫 **¡Asignar folios es fácil y rápido!**

