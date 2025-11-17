# Blueprint de Diseño UI/UX - SAGO FACTU

## 🎨 Principios de Diseño

### 1. Simplicidad sobre Complejidad
La facturación electrónica es técnicamente compleja, pero la interfaz debe ser simple.

```
❌ MALO: Mostrar XML, tokens, SOAP, certificados
✅ BUENO: "Emitir Factura" con 1 clic
```

### 2. Feedback Inmediato
Cada acción debe tener respuesta visual instantánea.

```
Acciones:
- Input: Usuario escribe RUC
- Feedback: Validación en tiempo real (✅ o ❌)
- Estado: Botón habilitado/deshabilitado según validación
```

### 3. Prevención de Errores
Es mejor evitar errores que mostrar mensajes de error.

```
- Validar mientras escribe, no después de enviar
- Desactivar botones en lugar de mostrar errores
- Sugerir valores (autocomplete)
```

### 4. Accesibilidad Universal
Funciona en mobile, tablet, desktop.

```
- Responsive design (mobile-first)
- Alto contraste para legibilidad
- Navegación solo con teclado
- Modo oscuro/claro
```

---

## 📐 Estructura de Navegación

### Header (Barra Superior)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 SAGO-FACTU | Org: Mi Empresa ▼  │  🔔 2  │  👤 Juan ▼   │
│                                                              │
│ Folios: ████████████░░ 150/500  (30%)  [Comprar más]       │
└─────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Logo/Marca (clickeable → Dashboard)
- Selector de Organización (para multi-empresa)
- Indicador de Folios (rojo/amarillo/verde)
- Notificaciones (con badge de count)
- Menú de Usuario (Perfil, Configuración, Logout)

### Sidebar (Menú Lateral)

```
┌──────────────────────┐
│ SAGO FACTU           │
├──────────────────────┤
│ 📊 Dashboard         │
├──────────────────────┤
│ ➕ Nueva Factura     │
│ 📋 Mis Facturas      │
│ ✉️  Envíos           │
│ 📦 Portal Clientes   │
├──────────────────────┤
│ 📈 Reportes          │
│ 🛠️  Configuración   │
│ 📞 Soporte           │
├──────────────────────┤
│ ? Ayuda              │
│ ℹ️  Acerca de        │
└──────────────────────┘
```

**Diseño:**
- Colapsable en mobile
- Iconos + Texto en desktop
- Solo iconos en mobile
- Active state clara
- Hover effects sutiles

---

## 🏠 Dashboard Principal

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tarjeta 1              Tarjeta 2          Tarjeta 3        │
│  ┌──────────────┐      ┌──────────────┐  ┌──────────────┐  │
│  │ 📄 Facturas  │      │ ⏳ Pendientes │  │ ✅ Procesadas│  │
│  │   45 hoy     │      │     2        │  │    1,234     │  │
│  │ $ 125.450    │      │              │  │   $ 450.000  │  │
│  └──────────────┘      └──────────────┘  └──────────────┘  │
│                                                              │
│  Tarjeta 4                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚙️ Estado del Sistema                                │  │
│  │ ✅ Conectado a HKA                                   │  │
│  │ ✅ Última sincronización: hace 3 minutos             │  │
│  │ ✅ Certificado digital: Vigente (vence 15-03-2025)  │  │
│  │ ⚠️ Folios críticos: 150 disponibles (comprar pronto) │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Gráfico 1: Facturación Semanal     Gráfico 2: Por Cliente  │
│  ┌──────────────────────┐           ┌─────────────────────┐ │
│  │                      │           │                     │ │
│  │        📊 Barras     │           │     📈 Línea        │ │
│  │        LUN-DOM       │           │     MES             │ │
│  │                      │           │                     │ │
│  └──────────────────────┘           └─────────────────────┘ │
│                                                              │
│  Actividad Reciente                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅ Factura #0125 certificada - Juan García - 14:32  │  │
│  │ 📧 Email enviado a cliente@empresa.com - 14:25      │  │
│  │ 🔄 Sincronización de folios - Sistema - 14:00       │  │
│  │ ⬇️ Factura #0124 descargada - María López - 13:45   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Clave

#### Tarjeta de Métrica
```
┌────────────────────┐
│ 📄 Facturas Hoy    │
│                    │
│       45           │
│   $ 125,450        │
│                    │
│ ↑ 23% vs ayer      │
└────────────────────┘
```

**Propiedades:**
- Grande número (48px+)
- Icono representativo
- Subtítulo con contexto (vs período anterior)
- Color según trending (↑ verde, ↓ rojo)

#### Gráfico de Facturación
```
Barras verticales por día (Mon-Sun)
Colores: Verde (certificadas), Amarillo (pendientes), Rojo (rechazadas)
Hover: Muestra tooltip con detalles
Y-axis: Monto total
```

#### Feed de Actividad
```
Timeline vertical
- Icono (✅ ❌ 📧 🔄 ⬇️)
- Descripción clara
- Usuario/Sistema
- Timestamp relativo (hace 5 minutos)
- Click → Detalle
```

---

## ➕ Página: Nueva Factura

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← Nueva Factura                                [Guardar] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┬─────────────────────────────────┐ │
│  │ Colapsables:    │ Panel Derecho:                  │ │
│  │                 │                                  │ │
│  │ ▼ Cliente       │ ┌──────────────────────────────┐│ │
│  │   RUC: [__]     │ │ 📋 VISTA PREVIA PDF          ││ │
│  │   Nombre: [__]  │ │                              ││ │
│  │                 │ │   FACTURA Nº 0125            ││ │
│  │ ▼ Items         │ │                              ││ │
│  │  + Agregar      │ │   Cliente: Juan García       ││ │
│  │  | Prod | Cant  │ │   RUC: 8-123456-789          ││ │
│  │  |------|-----| │ │                              ││ │
│  │  | 001  |  2  | │ │   Items:                     ││ │
│  │                 │ │   Servicio A ........  $ 500  ││ │
│  │ ▼ Impuestos     │ │   Servicio B ........  $ 800  ││ │
│  │   IVA 7%: [calc]│ │                              ││ │
│  │   Subtotal: [$] │ │   TOTAL ............... $1.550│ │
│  │                 │ │                              ││ │
│  │ ▼ Notas         │ │ [Descargar PDF] [Vista]      ││ │
│  │   [Textarea]    │ │                              ││ │
│  │                 │ │ QR: [QR Code]                ││ │
│  │ ☑ Enviar al     │ └──────────────────────────────┘│ │
│  │   cliente       │                                  │ │
│  │                 │                                  │ │
│  └─────────────────┴─────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Cancelar]              [Guardar Borrador]       │  │
│  │              [Emitir y Certificar] ✓             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Validación en Tiempo Real

```
Campo RUC:
┌─────────────────────────┐
│ RUC: [8-123456-789] ✅ │ ← Verde si válido
└─────────────────────────┘

Validaciones:
- Formato: 8-XXXXXX-XXX ✅
- Dígito verificador ✅
- En padrón de DGI ✅

Botón "Emitir y Certificar":
Deshabilitado ❌ mientras hay errores
Habilitado ✅ cuando todo es válido
```

### Selector de Cliente Inteligente

```
Campo: Cliente
┌──────────────────────────┐
│ Buscar... [Juan________] │
└──────────────────────────┘

Dropdown:
┌────────────────────────────────────┐
│ 🔄 Recientes:                      │
│  • Juan García (8-123456-789)      │
│  • María López (8-987654-321)      │
│                                    │
│ 🔍 Resultados:                     │
│  • Juan Carlos Pérez               │
│  • Juan Diego Rodríguez            │
│                                    │
│ ➕ Crear nuevo cliente             │
└────────────────────────────────────┘
```

**Funcionalidades:**
- Busca mientras escribe
- Recientes primero (últimos 5)
- Opción de crear sin salir del formulario
- Click → Autocompleta RUC, Nombre

### Editor de Items

```
┌─────────────────────────────────────────────────────────┐
│ Items (3 agregados):                    [+ Agregar]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ✎ Descripción        │ Cant. │ Precio │ Subtotal │ X   │
│ ─────────────────────┼────────────────┼──────────┼──── │
│ Servicio A (Select)  │  2   │ $250   │  $500   │ 🗑️  │
│ Servicio B (Select)  │  1   │ $800   │  $800   │ 🗑️  │
│ Producto X (Select)  │  5   │ $100   │  $500   │ 🗑️  │
│                                                          │
│                                  Subtotal:  $1,800       │
│                                  IVA (7%):  $126         │
│                                  TOTAL:     $1,926       │
│                                                          │
└─────────────────────────────────────────────────────────┘

Cada fila es editable:
- Descripción: Dropdown con sugerencias basadas en historial
- Cantidad: Input numérico con validación
- Precio: Calcula automáticamente (con historial de precios)
- Subtotal: Calcula automáticamente
```

---

## 📋 Página: Mis Facturas

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Mis Facturas                    [➕ Nueva] [⬇️ Descargar] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Filtros (Colapsable):                                  │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔍 Buscar: [_________] | Período: [De][A]          │ │
│ │ Estado: [Todas ▼] | Cliente: [________]            │ │
│ │ Monto: [$] a [$]   | Certificado: [Todas ▼]       │ │
│ │                   [🔄 Limpiar] [Buscar]            │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Tabla de Facturas (Scroll infinito):                    │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ☑ | # | Cliente | Monto | Estado | Fecha | Acciones││
│ ├─────────────────────────────────────────────────────┤│
│ │  | 0125| Juan    | $1.550| ✅ Cert| 15-01| ⋯       ││
│ │  | 0124| María   | $ 890| ✅ Cert| 15-01| ⋯       ││
│ │  | 0123| Pedro   | $2.100| ⏳ Proc | 15-01| ⋯       ││
│ │  | 0122| Ana     | $ 450| ❌ Rech | 15-01| ⋯       ││
│ │  ...                                               ││
│ └─────────────────────────────────────────────────────┘│
│                                                          │
│ Mostrado: 1-50 de 1,234 | [< Anterior] [Siguiente >]  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Estados Visuales

```
✅ Certificada: Verde
   Icono: ✓
   Indicador: Fondo claro verde
   Acciones: Ver PDF, Descargar, Enviar, Anular

⏳ En Proceso: Amarillo
   Icono: ⏱
   Indicador: Fondo claro amarillo
   Acciones: Ver estado, Reintentar

❌ Rechazada: Rojo
   Icono: ✗
   Indicador: Fondo claro rojo
   Acciones: Ver error, Editar y reintentar

⭕ Borrador: Gris
   Icono: ○
   Indicador: Fondo gris claro
   Acciones: Editar, Emitir, Eliminar
```

### Menú de Acciones Contextuales

```
Click en ⋯ o clic derecho en fila:

┌──────────────────────┐
│ 📄 Ver Detalle       │
│ 📥 Descargar PDF     │
│ 💾 Descargar XML     │
│ ─────────────────────│
│ ✉️ Enviar Email      │
│ 💬 Enviar WhatsApp   │
│ 🔗 Copiar Link       │
│ ─────────────────────│
│ 🔄 Sincronizar       │
│ 🗑️ Anular           │
│ 📋 Duplicar          │
└──────────────────────┘
```

---

## 🔍 Página: Detalle de Factura

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← Facturas / #0125 de Juan García          [⋯ Menú]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────┬──────────────────────────────┐ │
│ │ Información          │ Vista Previa PDF              │ │
│ │ ┌──────────────────┐ │ ┌──────────────────────────┐ │ │
│ │ │ FACTURA #0125    │ │ │ 📄 PDF Preview           │ │ │
│ │ │                  │ │ │                          │ │ │
│ │ │ Estado: ✅       │ │ │ FACTURA Nº 0125          │ │ │
│ │ │ Certificada      │ │ │ SAGO FACTU               │ │ │
│ │ │                  │ │ │                          │ │ │
│ │ │ CUFE:            │ │ │ Cliente: Juan García     │ │ │
│ │ │ 0125XYZ...       │ │ │ RUC: 8-123456-789        │ │ │
│ │ │ (click copy)     │ │ │                          │ │ │
│ │ │                  │ │ │ Total: $1,550            │ │ │
│ │ │ QR: [QR Code]    │ │ │                          │ │ │
│ │ │                  │ │ │ [⬇️ Descargar] [🖨️ Impr] │ │ │
│ │ │ Fecha Emisión:   │ │ │                          │ │ │
│ │ │ 15/01/2024 14:32 │ │ │                          │ │ │
│ │ │                  │ │ │                          │ │ │
│ │ │ Certificación:   │ │ └──────────────────────────┘ │ │
│ │ │ 15/01/2024 14:33 │ │                              │ │
│ │ │                  │ │ [Verificar autenticidad] ✅  │ │
│ │ │ Items:           │ │                              │ │
│ │ │ • Servicio A: 2  │ │ Código de Verificación:     │ │
│ │ │   $250 c/u       │ │ https://dgi.gob.pa/v/...    │ │
│ │ │   Subtotal: $500 │ │                              │ │
│ │ │                  │ │                              │ │
│ │ │ • Servicio B: 1  │ │                              │ │
│ │ │   $800 c/u       │ │                              │ │
│ │ │   Subtotal: $800 │ │                              │ │
│ │ │                  │ │                              │ │
│ │ │ IVA 7%: $126     │ │                              │ │
│ │ │ TOTAL: $1,550    │ │                              │ │
│ │                  │ │                              │ │
│ │ [Editar]         │ │ [Descargar PDF]              │ │
│ │ [Duplicar]       │ │ [Descargar XML]              │ │
│ └──────────────────┘ │                              │ │
│                      │ [Enviar Email]               │ │
│ Timeline de Estado:  │ [Enviar WhatsApp]            │ │
│ ┌──────────────────┐ │                              │ │
│ │ ✅ Certificada   │ │                              │ │
│ │ 15/01 14:33      │ │                              │ │
│ │                  │ │                              │ │
│ │ • Enviada HKA    │ │                              │ │
│ │   15/01 14:32    │ │                              │ │
│ │                  │ │                              │ │
│ │ • Validada       │ │                              │ │
│ │   15/01 14:32    │ │                              │ │
│ │                  │ │                              │ │
│ │ • Creada         │ │                              │ │
│ │   15/01 14:15    │ │                              │ │
│ └──────────────────┘ │                              │ │
│                      │                              │ │
│ Distribución:        │                              │ │
│ ┌──────────────────┐ │                              │ │
│ │ 📧 Email:        │ │                              │ │
│ │ ✅ Enviado       │ │                              │ │
│ │ ✅ Entregado     │ │                              │ │
│ │ 👁️ Abierto 3x    │ │                              │ │
│ │                  │ │                              │ │
│ │ 💬 WhatsApp:     │ │                              │ │
│ │ No enviado       │ │                              │ │
│ │ [Enviar ahora]   │ │                              │ │
│ └──────────────────┘ │                              │ │
│                                                      │ │
└──────────────────────┴──────────────────────────────┘ │
│                                                          │
│ Comentarios (Auditoría):                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Juan García emitió factura | 15/01 14:15            │ │
│ │ Sistema certificó factura | 15/01 14:33             │ │
│ │ María López descargó PDF | 15/01 15:00              │ │
│ │ Factura enviada a juan@empresa.com | 15/01 15:05   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Componentes Reutilizables

### Tarjeta de Estado

```typescript
<StatusCard
  status="CERTIFIED"
  cufe="0125XYZ..."
  qrCode={qrImage}
  emissionDate="15/01/2024 14:32"
  certificationDate="15/01/2024 14:33"
/>
```

Render:
```
┌──────────────────────┐
│ ✅ Certificada       │
│ CUFE: 0125XYZ...     │
│ [QR Code]            │
│ Emitida: 15/01 14:32 │
│ Certificada: 14:33   │
└──────────────────────┘
```

### Selector de Cliente Inteligente

```typescript
<ClientSelector
  onSelect={(client) => updateForm({client})}
  allowCreate={true}
/>
```

Comportamiento:
- Dropdown con búsqueda
- Recientes primero
- Opción crear sin salir
- Auto-complete RUC

### Editor de Items

```typescript
<ItemsEditor
  items={formItems}
  onAdd={addItem}
  onUpdate={updateItem}
  onRemove={removeItem}
  onCalculate={calculateTotals}
/>
```

Característica:
- Edición inline
- Auto-complete de productos
- Cálculo automático
- Validación en tiempo real

### Selector de Período

```typescript
<PeriodSelector
  startDate={dateFrom}
  endDate={dateTo}
  onDateChange={(from, to) => filter({from, to})}
/>
```

Opciones:
- Hoy, Esta semana, Este mes
- Últimas 3 meses, 6 meses, 1 año
- Personalizado (date picker)

### Timeline de Estados

```typescript
<Timeline
  events={[
    {status: 'CREATED', date: '15/01 14:15'},
    {status: 'VALIDATED', date: '15/01 14:32'},
    {status: 'SENT_HKA', date: '15/01 14:32'},
    {status: 'CERTIFIED', date: '15/01 14:33'},
  ]}
/>
```

Render:
```
✅ CERTIFIED
|
• SENT_HKA
|
• VALIDATED
|
• CREATED
```

---

## 📱 Adaptación Mobile

### Header Colapsado
```
┌──────────────────┐
│ ☰ | SAGO | 🔔 👤 │
│ ████████░░ 150   │
└──────────────────┘
```

### Sidebar como Drawer
```
Taps ☰ → Slide from left
Covers 80% of screen
Can swipe to close
```

### Tabla → Cards
```
En lugar de tabla:
┌─────────────────┐
│ #0125           │
│ Juan García     │
│ $1,550          │
│ ✅ Certificada  │
│ 15/01           │
│ [⋯]             │
└─────────────────┘

Swipe left → Acciones rápidas
```

### Formulario → Stacked
```
Inputs de 100% width
Scrollable verticalmente
Botones flotantes en bottom
```

---

## 🎨 Paleta de Colores

```
Primary (Azul SAGO):    #0066FF
Primary Light:          #E6F2FF
Primary Dark:           #003399

Success (Verde):        #22C55E
Warning (Amarillo):     #EAB308
Error (Rojo):           #EF4444

Background Light:       #FFFFFF
Background Dark:        #0F172A

Text Primary:           #1F2937
Text Secondary:         #6B7280

Border Light:           #E5E7EB
Border Dark:            #374151
```

---

## ⌨️ Navegación por Teclado

```
Tab: Navega por elementos
Shift+Tab: Atrás
Enter: Confirma/abre
Esc: Cierra/cancela
Space: Toggle checkbox/botón
Arrow keys: Navega en tablas/dropdowns
Ctrl+N: Nueva factura
Ctrl+S: Guardar
Ctrl+F: Buscar
/: Focus búsqueda
```

---

## 🎯 Flujos de Usuario Optimizados

### Flujo 1: Emisión Rápida (< 30 segundos)

```
1. Dashboard → Click "+ Nueva Factura" (1 seg)
2. Sistema sugiere próximo #, enfoca RUC campo
3. Usuario busca cliente: "Juan" → Click
   Sistema auto-complete: RUC, Nombre (2 seg)
4. Click "+ Agregar Item"
5. Selecciona producto del dropdown (2 seg)
6. Sistema pre-carga precio histórico
7. Usuario cambia cantidad si es necesario
8. Repite 4-7 para más items
9. Sistema calcula impuestos automáticamente
10. Review en vista previa
11. Click "Emitir y Certificar"
12. ✅ Confirmación con CUFE en 2-3 segundos

Total: < 30 segundos para factura simple
```

### Flujo 2: Búsqueda y Descarga (< 10 segundos)

```
1. Dashboard → "Mis Facturas"
2. Click campo búsqueda
3. Escribe "Juan" o "#0125"
4. Enter o espera autocomplete
5. Tabla filtra automáticamente
6. Click en factura deseada
7. Click "Descargar PDF"
8. ✅ Descarga inicia

Total: < 10 segundos
```

### Flujo 3: Envío a Cliente (< 20 segundos)

```
1. En detalle de factura
2. Click "Enviar Email"
3. Modal se abre con:
   - Email pre-llenado (del cliente)
   - Asunto pre-escrito
   - Mensaje template personalizable
4. Usuario revisa/modifica si quiere
5. Click "Enviar"
6. ✅ Enviado en 2-3 segundos

Total: < 20 segundos
```

---

## 🔔 Notificaciones

### Tipos

```
Success (Verde): "✅ Factura #0125 certificada"
Info (Azul): "ℹ️ Sincronización iniciada"
Warning (Amarillo): "⚠️ Folios bajos (150 disponibles)"
Error (Rojo): "❌ Error al enviar factura"
```

### Posición
- Top-right (desktop)
- Top (mobile, full width)
- Auto-dismiss después 5 segundos (user puede cerrar)

### Toasts vs Modals
```
Toast: Acciones exitosas, alertas informativas
Modal: Confirmaciones críticas, errores graves
```

---

## 🌙 Modo Oscuro

```
Automático según preferencia del sistema
Toggle en menú de usuario

Colores en modo oscuro:
Background: #0F172A
Surface: #1E293B
Text: #E2E8F0
Primary: #60A5FA
Borders: más claros
```

---

## ♿ Accesibilidad

### WCAG 2.1 AA

```
- Ratio de contraste: 4.5:1 para texto
- Tamaño mínimo fuente: 16px
- Elementos interactivos: 44x44px mínimo
- Labels en todos los inputs
- Alt text en imágenes
- Navegación solo teclado
- Estructura de headings correcta (h1>h2>h3)
```

### Screen Reader
```
- Descripción de estados
- Anuncios de cambios dinámicos
- Aria-labels donde sea necesario
- Orden tab lógico
```

---

## 📊 Conclusión

El diseño UI/UX de SAGO FACTU debe:
1. ✅ Simplificar la complejidad técnica
2. ✅ Dar feedback inmediato
3. ✅ Prevenir errores
4. ✅ Ser accesible universalmente
5. ✅ Funcionar perfectamente en mobile y desktop

Cada componente está diseñado para que el usuario pueda:
- Emitir factura en < 30 segundos
- Buscar documento en < 2 segundos
- Enviar a cliente en < 20 segundos
- Entender estado en 1 vistazo

La meta es: "Invisible complexity, obvious value"
