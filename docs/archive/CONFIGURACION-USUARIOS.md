# 👥 Configuración de Usuarios - Guía de Uso

## 📋 Descripción

En la página de **Configuración**, sección **Gestión de Usuarios**, ahora puedes hacer clic directamente en cualquier usuario para abrir un panel detallado donde puedes editarlo y asignarle folios.

---

## 🎯 Cómo Usar la Nueva Funcionalidad

### 1️⃣ Acceder a la Configuración de Usuarios

1. Ve a **Dashboard** → **⚙️ Configuración**
2. Haz clic en la pestaña **👥 Usuarios**
3. Verás la lista completa de usuarios

### 2️⃣ Editar un Usuario

1. **Haz clic en cualquier fila de la tabla de usuarios**
2. Se abrirá un modal con dos pestañas:
   - **📝 Información**: Editar datos del usuario
   - **🎫 Asignar Folios**: Asignar folios al usuario (solo SUPER_ADMIN)

### 3️⃣ Pestaña "Información"

Puedes editar:
- ✅ **Nombre completo**
- ✅ **Email**
- ✅ **Estado** (Activo/Inactivo)

**Solo para SUPER_ADMIN:**
- 🔐 **Rol** (Usuario, Administrador de Organización, Super Administrador)
- 🏢 **Organización** (asignar a qué organización pertenece)

#### Ejemplo:
```
📝 Nombre: Juan Pérez
📧 Email: juan@ejemplo.com
🔐 Rol: Usuario
🏢 Organización: Mi Empresa S.A.
✅ Usuario activo: ☑️
```

**Botones:**
- **Cancelar**: Cierra el modal sin guardar cambios
- **💾 Guardar Cambios**: Actualiza el usuario

### 4️⃣ Pestaña "Asignar Folios" (Solo SUPER_ADMIN)

Permite asignar folios directamente al usuario desde su panel.

**Campos:**
- 🎫 **Cantidad de Folios** (1 - 10,000)
- 💵 **Precio por Folio** (USD)
- 📝 **Notas** (opcional)

**Cálculo Automático:**
```
Cantidad: 100 folios
Precio: $0.06 por folio
═══════════════════════════
Costo Total: $6.00
```

**Requisitos:**
- ⚠️ El usuario DEBE tener una organización asignada
- ⚠️ Solo los SUPER_ADMIN pueden asignar folios desde aquí

**Botones:**
- **Cancelar**: Cierra el modal
- **🎫 Asignar Folios**: Crea la asignación y la registra en el sistema

---

## 🔐 Permisos y Roles

### SUPER_ADMIN
✅ Puede editar TODOS los usuarios
✅ Puede cambiar roles
✅ Puede cambiar organización
✅ Puede asignar folios
✅ Puede ver usuarios de todas las organizaciones

### ORG_ADMIN (Administrador de Organización)
✅ Puede editar usuarios de SU organización
✅ Puede cambiar nombre, email, estado
❌ NO puede cambiar roles
❌ NO puede cambiar organización
❌ NO puede asignar folios (debe usar el panel de folios)

### USER (Usuario Final)
❌ NO tiene acceso a la página de configuración

---

## 🎨 Interfaz Visual

### Tabla de Usuarios
- **Hover**: Fondo azul claro (`bg-indigo-50`)
- **Cursor**: Puntero clickeable
- **Información Visible**:
  - Avatar con inicial
  - Nombre y email
  - Rol con badge de color
  - Estado (Activo/Inactivo)
  - Fecha de registro
  - Botón de eliminar (🗑️)

### Modal de Detalle
- **Header**: Avatar, nombre y email del usuario
- **Pestañas**: Navegación entre Información y Folios
- **Formulario**: Campos organizados y validados
- **Mensajes**: Notificaciones de éxito y error
- **Loading**: Indicador visual durante las operaciones

---

## 📊 Ejemplo de Flujo Completo

### Escenario: Super Admin asigna 500 folios a Juan

1. **Entrar a Configuración** → Usuarios
2. **Clic en la fila de "Juan Pérez"**
3. **Ir a la pestaña "Asignar Folios"**
4. Llenar:
   - Cantidad: `500`
   - Precio: `0.06`
   - Notas: `Asignación mensual - Enero 2025`
5. Ver costo total: **$30.00**
6. **Clic en "Asignar Folios"**
7. ✅ Confirmación: "500 folios asignados correctamente"
8. Los folios aparecen inmediatamente en el panel de Juan

---

## 🚨 Mensajes de Error Comunes

### "Usuario sin organización asignada"
**Causa**: El usuario no tiene `organizationId`
**Solución**: 
1. Ve a la pestaña "Información"
2. Selecciona una organización
3. Guarda los cambios
4. Ahora puedes asignar folios

### "No tienes permisos para realizar esta acción"
**Causa**: Tu rol no permite esta operación
**Solución**: Solo SUPER_ADMIN puede asignar folios desde aquí

### "No puedes eliminar usuarios de otra organización"
**Causa**: Intentas eliminar un usuario de otra org siendo ORG_ADMIN
**Solución**: Solo puedes gestionar usuarios de TU organización

---

## ✨ Características Técnicas

### Validaciones Implementadas
- ✅ Validación de roles y permisos
- ✅ Validación de organización
- ✅ Prevención de auto-eliminación
- ✅ Validación de email único
- ✅ Rango de folios (1-10,000)
- ✅ Precio mínimo 0

### Registro de Auditoría
Todas las acciones se registran en `AuditLog`:
- `USER_UPDATE`: Cambios en información del usuario
- `USER_DELETE`: Eliminación de usuario
- `USER_ACTIVATE`: Activación de cuenta
- `USER_DEACTIVATE`: Desactivación de cuenta
- `FOLIO_ASSIGNMENT`: Asignación de folios

### Actualización en Tiempo Real
- Al guardar, se refresca automáticamente la tabla
- Al asignar folios, se actualiza el conteo
- Los cambios son inmediatos

---

## 📝 Notas Adicionales

1. **No puedes editar tu propio usuario** desde esta interfaz (prevención de conflictos)
2. **Los folios se asignan inmediatamente** al usuario y su organización
3. **El modal se cierra automáticamente** después de guardar exitosamente
4. **Los cambios persisten** en la base de datos con registro de auditoría

---

## 🔗 Endpoints API Utilizados

```typescript
PUT  /api/configuration/users/[userId]        // Actualizar usuario
DELETE /api/configuration/users/[userId]      // Eliminar usuario
POST /api/admin/folios/assign                 // Asignar folios
```

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0

