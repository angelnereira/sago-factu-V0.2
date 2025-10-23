# Funcionalidades de Administración del Sistema

## 📋 Resumen

Se han implementado tres paneles de administración completos para Super Administradores, permitiendo gestionar organizaciones, ver métricas del sistema y auditar todas las acciones realizadas.

## ✅ Funcionalidades Implementadas (3/3)

### 1. ️ Vista de Organizaciones (`/dashboard/admin/organizaciones`)

**Acceso:** Solo Super Administradores

**Funcionalidades:**

#### 📊 Tarjetas de Estadísticas
- **Total Organizaciones**: Muestra el conteo total con desglose de activas/inactivas
- **Total Usuarios**: Suma de usuarios en todas las organizaciones
- **Total Folios**: Folios asignados a nivel sistema
- **Total Facturas**: Facturas emitidas por todas las organizaciones

#### 🏢 Tabla de Organizaciones
**Información por Organización:**
- Nombre y RUC
- Estado (Activa/Inactiva)
- Número de usuarios
- Número de facturas
- Folios asignados/consumidos/disponibles
- Porcentaje de consumo de folios
- Barra de progreso visual

**Acciones Disponibles:**
- ✅ **Crear Nueva Organización**: Modal completo con todos los campos
- ✅ **Editar Organización**: Modificar información y configuración
- ✅ **Activar/Desactivar**: Toggle de estado
- ✅ **Eliminar**: Con confirmación y eliminación en cascada

#### 📋 Campos del Formulario de Organización
```typescript
{
  name: string          // Nombre de la organización
  ruc: string          // RUC (único)
  dv: string           // Dígito verificador
  email: string        // Email de contacto
  phone: string        // Teléfono
  address: string      // Dirección física
  website: string      // Sitio web (opcional)
  logo: string         // URL del logo (opcional)
  isActive: boolean    // Estado activo/inactivo
}
```

#### 🎨 Componentes
```
app/dashboard/admin/organizaciones/page.tsx
├── Stats Cards (4 tarjetas de métricas)
├── OrganizationsTable
    ├── Organization Cards (Grid responsivo)
    └── OrganizationModal (CRUD)
```

---

### 2. 📈 Dashboard de Estadísticas y Métricas (`/dashboard/admin/metricas`)

**Acceso:** Solo Super Administradores

**Funcionalidades:**

#### 📊 Métricas Generales (6 Tarjetas)

1. **Organizaciones**
   - Total de organizaciones
   - Cantidad de organizaciones activas
   - Icono: Building2
   - Color: Indigo

2. **Usuarios Totales**
   - Conteo total de usuarios
   - Nuevos usuarios últimos 30 días
   - Icono: Users
   - Color: Azul

3. **Facturas Emitidas**
   - Total de facturas en el sistema
   - Nuevas facturas últimos 30 días
   - Icono: FileText
   - Color: Verde

4. **Folios Asignados**
   - Total de folios asignados
   - Folios consumidos
   - Icono: Ticket
   - Color: Púrpura

5. **Folios Disponibles**
   - Folios disponibles actuales
   - Porcentaje del total
   - Icono: CheckCircle
   - Color: Emerald

6. **Ingresos Estimados**
   - Ingresos por venta de folios
   - Formato: $X,XXX.XX USD
   - Icono: DollarSign
   - Color: Ámbar

#### 📊 Estadísticas del Sistema

**Facturas por Estado:**
- DRAFT (Borrador)
- PENDING (Pendiente)
- APPROVED (Aprobada)
- REJECTED (Rechazada)
- FAILED (Fallida)
- CANCELLED (Cancelada)

Visualización: Tarjetas con conteo por estado

#### 🏆 Top 5 Organizaciones

**Ranking por:**
- Número de facturas emitidas
- Cantidad de usuarios

**Información mostrada:**
- Nombre de la organización
- Total de facturas
- Total de usuarios
- Badge de posición (#1, #2, etc.)

#### 📈 Gráfico de Actividad

**Características:**
- **Período**: Últimos 6 meses
- **Tipo**: Gráfico de líneas
- **Datos**: Facturas emitidas por mes
- **Formato eje X**: MMM YYYY (Ene 2025, Feb 2025)
- **Formato eje Y**: Número de facturas
- **Librería**: Recharts (ya incluida)

**Implementación:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={monthlyData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="invoices" 
      stroke="#8b5cf6" 
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
```

#### 🎨 Componentes
```
app/dashboard/admin/metricas/page.tsx
├── MetricsOverview (6 tarjetas de métricas principales)
├── SystemStats (Facturas por estado)
├── TopOrganizations (Top 5 por facturas)
└── ActivityChart (Gráfico de 6 meses)
```

---

### 3. 🔍 Logs de Auditoría y Actividad (`/dashboard/admin/auditoria`)

**Acceso:** Solo Super Administradores

**Funcionalidades:**

#### 📊 Estadísticas de Auditoría (3 Tarjetas)

1. **Total de Eventos**
   - Conteo total de logs
   - Formato: X,XXX registros
   - Icono: Document
   - Color: Azul

2. **Últimas 24 Horas**
   - Eventos en el último día
   - Actividad reciente
   - Icono: Clock
   - Color: Verde

3. **Tipos de Acción**
   - Cantidad de acciones distintas
   - Diversidad de eventos
   - Icono: Chart
   - Color: Púrpura

#### 🔎 Sistema de Filtros

**Filtros Disponibles:**

1. **Por Acción**
   - USER_CREATE
   - USER_UPDATE
   - USER_DELETE
   - USER_ACTIVATE
   - USER_DEACTIVATE
   - ORGANIZATION_CREATE
   - ORGANIZATION_UPDATE
   - ORGANIZATION_DELETE
   - FOLIO_ASSIGNMENT
   - INVOICE_CREATE
   - INVOICE_UPDATE
   - Y más...

2. **Por Entidad**
   - User
   - Organization
   - Invoice
   - FolioAssignment
   - ApiKey
   - SystemConfig

3. **Por Usuario**
   - Búsqueda por email
   - Búsqueda por ID de usuario
   - Filtro sensible/insensible a mayúsculas

**UI de Filtros:**
- Sidebar colapsable en móvil
- Chips de filtros activos
- Contador de resultados por filtro
- Botón "Limpiar filtros"

#### 📋 Tabla de Logs

**Columnas:**
- **Timestamp**: Fecha y hora precisa
- **Acción**: Tipo de acción realizada
- **Entidad**: Tipo de entidad afectada
- **Usuario**: Email del usuario que realizó la acción
- **Detalles**: Botón para ver cambios detallados
- **IP**: Dirección IP del usuario
- **User Agent**: Navegador/dispositivo usado

**Información Adicional:**
- Entity ID: ID del registro afectado
- Changes: JSON con cambios (before/after)
- Timestamp preciso hasta segundos

**Formato de Ejemplo:**
```json
{
  "action": "USER_UPDATE",
  "entity": "User",
  "entityId": "usr_123",
  "userId": "adm_456",
  "userEmail": "admin@ejemplo.com",
  "changes": {
    "before": {"role": "USER", "isActive": true},
    "after": {"role": "ORG_ADMIN", "isActive": true}
  },
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2025-01-15T10:30:45.123Z"
}
```

#### 📄 Paginación

**Características:**
- **Tamaño de página**: 50 registros
- **Navegación**: Anterior/Siguiente
- **Info**: "Mostrando X-Y de Z registros"
- **Persistencia**: Query params preservados

**Formato URL:**
```
/dashboard/admin/auditoria?action=USER_UPDATE&page=2
/dashboard/admin/auditoria?entity=Organization&user=admin@ejemplo.com
```

#### 🎨 Componentes
```
app/dashboard/admin/auditoria/page.tsx
├── Stats Cards (3 tarjetas de estadísticas)
├── AuditFilters (Sidebar de filtros)
│   ├── Filtro por Acción
│   ├── Filtro por Entidad
│   └── Búsqueda por Usuario
└── AuditLogsList (Tabla paginada)
    ├── LogRow (Fila expandible)
    └── Pagination (Navegación)
```

---

## 🗄️ Modelo de Datos

### AuditLog Schema
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?  // Usuario que ejecutó la acción
  userEmail   String?  // Email del usuario
  action      String   // Tipo de acción
  entity      String   // Tipo de entidad
  entityId    String?  // ID de la entidad
  changes     String?  // JSON con cambios
  ip          String?  // IP del usuario
  userAgent   String?  // User agent del navegador
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([createdAt])
}
```

### Organization Schema (Extendido)
```prisma
model Organization {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  ruc         String?  @unique
  dv          String?
  address     String?
  phone       String?
  email       String?
  website     String?
  logo        String?
  isActive    Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  users            User[]
  invoices         Invoice[]
  folioAssignments FolioAssignment[]
  apiKeys          ApiKey[]
  systemConfigs    SystemConfig[]
}
```

---

## 🔐 Seguridad y Permisos

### Control de Acceso

**Solo SUPER_ADMIN puede:**
- ✅ Ver y gestionar todas las organizaciones
- ✅ Ver métricas globales del sistema
- ✅ Acceder a logs de auditoría
- ✅ Crear/editar/eliminar organizaciones
- ✅ Asignar folios a organizaciones
- ✅ Ver información financiera (ingresos)

**Middleware de Protección:**
```typescript
// Verifica rol en cada página
if (session.user.role !== "SUPER_ADMIN") {
  redirect("/dashboard")
}
```

### Audit Logging

**Acciones Registradas:**
- ✅ Creación de organizaciones
- ✅ Actualización de organizaciones
- ✅ Eliminación de organizaciones
- ✅ Cambio de estado (activar/desactivar)
- ✅ Creación/modificación de usuarios
- ✅ Asignación de folios
- ✅ Cambios de configuración

**Información Capturada:**
- Usuario que ejecuta la acción
- Timestamp preciso
- Cambios realizados (before/after)
- IP y User Agent
- Entidad afectada

---

## 📊 Métricas y KPIs

### Organizaciones
- Total de organizaciones
- Tasa de activación (activas/total)
- Promedio de usuarios por organización
- Promedio de facturas por organización

### Usuarios
- Total de usuarios en el sistema
- Crecimiento mensual
- Usuarios activos vs inactivos
- Distribución por rol

### Facturas
- Total de facturas emitidas
- Facturas por estado
- Tasa de éxito (approved/total)
- Tendencia mensual

### Folios
- Total asignados
- Total consumidos
- Disponibles actuales
- Tasa de consumo

### Financiero
- Ingresos totales por folios
- Ingreso promedio por organización
- Proyección de ingresos

---

## 🎨 Diseño y UX

### Paleta de Colores por Sección

**Organizaciones:**
- Primario: Indigo (#6366f1)
- Activa: Verde (#22c55e)
- Inactiva: Rojo (#ef4444)

**Métricas:**
- Organizaciones: Indigo
- Usuarios: Azul
- Facturas: Verde
- Folios: Púrpura
- Disponibles: Emerald
- Ingresos: Ámbar

**Auditoría:**
- Info: Azul
- Reciente: Verde
- Tipos: Púrpura
- CREATE: Verde
- UPDATE: Azul
- DELETE: Rojo

### Iconos (lucide-react)
- Building2: Organizaciones
- Users: Usuarios
- FileText: Facturas
- Ticket: Folios
- CheckCircle: Disponibles/Activos
- XCircle: Inactivos/Errores
- DollarSign: Ingresos
- TrendingUp: Crecimiento
- Clock: Tiempo/Reciente
- AlertCircle: Alertas
- Edit: Editar
- Trash2: Eliminar
- Plus: Crear nuevo

### Responsive Design

**Mobile (< 640px):**
- Cards en columna única
- Sidebar de filtros colapsable
- Tabla con scroll horizontal
- Acciones en menú dropdown

**Tablet (640px - 1024px):**
- Cards en 2 columnas
- Tabla con todas las columnas
- Filtros en panel lateral

**Desktop (>= 1024px):**
- Cards en 3-4 columnas
- Layout completo
- Filtros siempre visibles
- Hover effects activos

---

## 🚀 Performance

### Optimizaciones Implementadas

1. **Paginación:**
   - 50 registros por página
   - Reduce carga de datos
   - Consultas eficientes con `skip` y `take`

2. **Agregaciones:**
   - `groupBy` para estadísticas
   - `_count` para conteos
   - `_sum` para totales

3. **Índices de Base de Datos:**
   ```prisma
   @@index([userId])
   @@index([action])
   @@index([entity])
   @@index([createdAt])
   ```

4. **Consultas Paralelas:**
   ```typescript
   const [data1, data2, data3] = await Promise.all([
     query1(),
     query2(),
     query3(),
   ])
   ```

5. **Server Components:**
   - Rendering en servidor
   - Menos JavaScript al cliente
   - SEO friendly

---

## 📝 Casos de Uso

### Caso 1: Super Admin crea una nueva organización
1. Navega a `/dashboard/admin/organizaciones`
2. Click en "Nueva Organización"
3. Completa el formulario:
   - Nombre: "Empresa Demo S.A."
   - RUC: "123456789-1"
   - Email: "contacto@demo.com"
   - Teléfono: "+507 1234-5678"
4. Guarda
5. Sistema crea:
   - Organización en BD
   - Slug único generado
   - Audit log registrado
6. Organización aparece en la tabla

### Caso 2: Super Admin revisa métricas del sistema
1. Navega a `/dashboard/admin/metricas`
2. Ve resumen de 6 métricas principales
3. Revisa distribución de facturas por estado
4. Analiza top 5 organizaciones más activas
5. Observa tendencia de 6 meses en gráfico
6. Identifica patrones de uso

### Caso 3: Super Admin audita acciones de un usuario
1. Navega a `/dashboard/admin/auditoria`
2. Filtra por usuario: "admin@ejemplo.com"
3. Ve todas las acciones de ese usuario
4. Click en "Detalles" de un log
5. Revisa cambios realizados (before/after)
6. Verifica IP y timestamp
7. Exporta o documenta hallazgos

---

## ✅ Checklist de Funcionalidades

### Vista de Organizaciones
- [x] Tarjetas de estadísticas globales
- [x] Tabla de organizaciones con información completa
- [x] Modal de creación de organización
- [x] Modal de edición de organización
- [x] Toggle activar/desactivar organización
- [x] Eliminación con confirmación
- [x] Eliminación en cascada de datos relacionados
- [x] Estadísticas de folios por organización
- [x] Barra de progreso de consumo
- [x] Validación de RUC único
- [x] Generación automática de slug
- [x] Audit logging de todas las acciones

### Dashboard de Métricas
- [x] 6 tarjetas de métricas principales
- [x] Contador de organizaciones activas/inactivas
- [x] Nuevos usuarios últimos 30 días
- [x] Nuevas facturas últimos 30 días
- [x] Estadísticas de folios (asignados/consumidos/disponibles)
- [x] Cálculo de ingresos estimados
- [x] Distribución de facturas por estado
- [x] Top 5 organizaciones por facturas
- [x] Top 5 organizaciones por usuarios
- [x] Gráfico de actividad últimos 6 meses
- [x] Formato de números (1,000 separador de miles)
- [x] Formato de moneda ($X,XXX.XX)

### Logs de Auditoría
- [x] 3 tarjetas de estadísticas de auditoría
- [x] Filtro por tipo de acción
- [x] Filtro por tipo de entidad
- [x] Búsqueda por usuario
- [x] Tabla paginada (50 por página)
- [x] Información completa de cada log
- [x] Visualización de cambios (JSON)
- [x] Timestamp con formato localizado
- [x] IP y User Agent del usuario
- [x] Navegación por páginas
- [x] Query params preservados en URL
- [x] Índices de base de datos optimizados

---

## 🔮 Futuras Mejoras (Opcional)

### Vista de Organizaciones
- [ ] Exportar lista a CSV/Excel
- [ ] Vista de calendario de creación
- [ ] Gráfico de crecimiento de organizaciones
- [ ] Comparativa de organizaciones
- [ ] Notas/comentarios por organización

### Dashboard de Métricas
- [ ] Selector de rango de fechas custom
- [ ] Comparativa con período anterior
- [ ] Proyecciones y predicciones
- [ ] Alertas de métricas críticas
- [ ] Export de reportes en PDF
- [ ] Dashboard personalizable (drag & drop)

### Logs de Auditoría
- [ ] Exportar logs filtrados
- [ ] Alertas en tiempo real
- [ ] Detección de patrones anómalos
- [ ] Búsqueda avanzada (queries complejas)
- [ ] Retención configurable de logs
- [ ] Visualización de línea de tiempo
- [ ] Integración con SIEM externos

---

## ✅ Conclusión

Las tres funcionalidades de administración están completamente implementadas y funcionando:

- ✅ **Vista de Organizaciones**: CRUD completo, estadísticas, gestión avanzada
- ✅ **Dashboard de Métricas**: 6 métricas principales, gráficos, rankings
- ✅ **Logs de Auditoría**: Filtros avanzados, paginación, detalles completos

**Estado:** ✅ Producción Ready
**Build:** ✅ Exitoso
**Performance:** ✅ Optimizado
**Seguridad:** ✅ SUPER_ADMIN only
**Auditoría:** ✅ Todas las acciones registradas
