# 🎨 NUEVOS FEATURES DE FRONTEND REQUERIDOS - INTEGRACIÓN HKA

## 📊 ANÁLISIS DE LO QUE TENEMOS vs LO QUE NECESITAMOS

### ✅ **LO QUE YA EXISTE EN EL FRONTEND:**

1. **Dashboard Principal** (`/dashboard`)
   - ✅ Métricas de folios y facturas
   - ✅ Gráfica de consumo
   - ✅ Lista de facturas recientes

2. **Gestión de Folios** (`/dashboard/folios`)
   - ✅ Estadísticas de folios (total, disponibles, usados)
   - ✅ Lista de pools de folios
   - ✅ Botón de compra de folios
   - ✅ Modal de compra

3. **Facturas** (`/dashboard/facturas`)
   - ✅ Lista de facturas
   - ✅ Formulario de nueva factura
   - ✅ Vista de detalle de factura

4. **Configuración** (`/dashboard/configuracion`)
   - ✅ Página de configuración básica

---

## 🆕 **NUEVOS FEATURES REQUERIDOS PARA HKA:**

### 1. **📡 SINCRONIZACIÓN DE FOLIOS EN TIEMPO REAL** (CRÍTICO)

**Ubicación**: `/dashboard/folios`

**Descripción**: Agregar botón para sincronizar folios desde HKA y mostrar datos en tiempo real.

**Componentes a Crear**:

#### **A. Botón de Sincronización con HKA**
```tsx
// components/folios/sync-hka-button.tsx
"use client"

import { useState } from "react"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

interface SyncHKAButtonProps {
  organizationId: string
}

export function SyncHKAButton({ organizationId }: SyncHKAButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/folios/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al sincronizar')
      }

      setLastSync(new Date())
      // Recargar la página para mostrar los datos actualizados
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Sincronizando...' : 'Sincronizar con HKA'}
      </button>

      {lastSync && (
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          Última sincronización: {lastSync.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div className="flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  )
}
```

**Integración en `/dashboard/folios/page.tsx`**:
- Agregar el botón `<SyncHKAButton organizationId={organizationId} />` junto al botón de compra
- Mostrar última fecha de sincronización

---

#### **B. Panel de Folios en Tiempo Real**
```tsx
// components/folios/real-time-folios.tsx
"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface RealTimeFoliosProps {
  organizationId: string
}

export function RealTimeFolios({ organizationId }: RealTimeFoliosProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFolios()
  }, [organizationId])

  const fetchFolios = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/folios/tiempo-real?organizationId=${organizationId}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al consultar folios')
      }

      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Estado en Tiempo Real (HKA)</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Disponibles</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.estadisticas?.disponibles || 0}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Asignados</p>
          <p className="text-2xl font-bold text-blue-600">
            {data?.estadisticas?.asignados || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Utilizados</p>
          <p className="text-2xl font-bold text-purple-600">
            {data?.estadisticas?.utilizados || 0}
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Actualizado: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  )
}
```

---

### 2. **📄 GESTIÓN DE DOCUMENTOS CERTIFICADOS** (ALTA PRIORIDAD)

**Ubicación**: `/dashboard/facturas/[id]`

**Descripción**: Agregar funcionalidades para consultar, descargar y anular documentos certificados.

#### **A. Panel de Acciones de Factura**
```tsx
// components/invoices/invoice-actions.tsx
"use client"

import { useState } from "react"
import { Download, FileX, FileCheck, AlertTriangle } from "lucide-react"

interface InvoiceActionsProps {
  invoiceId: string
  cufe: string | null
  status: string
  createdAt: Date
}

export function InvoiceActions({ invoiceId, cufe, status, createdAt }: InvoiceActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const canCancel = () => {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceCreation <= 7 && status === 'CERTIFIED'
  }

  const downloadPDF = async () => {
    if (!cufe) return
    
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/documentos/consultar?cufe=${cufe}&tipo=pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${cufe}.pdf`
      a.click()
    } catch (error) {
      console.error('Error al descargar PDF:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadXML = async () => {
    if (!cufe) return
    
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/documentos/consultar?cufe=${cufe}&tipo=xml`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${cufe}.xml`
      a.click()
    } catch (error) {
      console.error('Error al descargar XML:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    const motivo = prompt('Ingrese el motivo de anulación:')
    if (!motivo) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/documentos/anular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cufe, motivo, invoiceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al anular')
      }

      alert('Documento anulado exitosamente')
      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!cufe || status !== 'CERTIFIED') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            Esta factura no ha sido certificada por HKA
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Acciones del Documento</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={downloadPDF}
          disabled={isProcessing}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </button>

        <button
          onClick={downloadXML}
          disabled={isProcessing}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Descargar XML
        </button>

        {canCancel() && (
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="col-span-2 flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
          >
            <FileX className="h-4 w-4 mr-2" />
            Anular Documento (dentro de 7 días)
          </button>
        )}
      </div>

      {!canCancel() && status === 'CERTIFIED' && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 Han pasado más de 7 días. Para corregir este documento, debe emitir una <strong>Nota de Crédito</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
```

---

### 3. **📋 NOTAS DE CRÉDITO Y DÉBITO** (ALTA PRIORIDAD)

**Ubicación**: `/dashboard/facturas/[id]`

#### **A. Botones para Emitir Notas**
```tsx
// components/invoices/credit-debit-notes.tsx
"use client"

import { useState } from "react"
import { FileMinus, FilePlus } from "lucide-react"

interface CreditDebitNotesProps {
  invoiceId: string
  cufe: string
  status: string
  createdAt: Date
}

export function CreditDebitNotes({ invoiceId, cufe, status, createdAt }: CreditDebitNotesProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const canIssueNotes = status === 'CERTIFIED' && daysSinceCreation <= 180

  const handleCreditNote = () => {
    // TODO: Abrir modal para crear nota de crédito
    alert('Funcionalidad de Nota de Crédito en desarrollo')
  }

  const handleDebitNote = () => {
    // TODO: Abrir modal para crear nota de débito
    alert('Funcionalidad de Nota de Débito en desarrollo')
  }

  if (!canIssueNotes) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Notas de Ajuste</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCreditNote}
          disabled={isProcessing}
          className="flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 disabled:opacity-50"
        >
          <FileMinus className="h-4 w-4 mr-2" />
          Nota de Crédito
        </button>

        <button
          onClick={handleDebitNote}
          disabled={isProcessing}
          className="flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
        >
          <FilePlus className="h-4 w-4 mr-2" />
          Nota de Débito
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Puede emitir notas de ajuste hasta {180 - daysSinceCreation} días más
      </div>
    </div>
  )
}
```

---

### 4. **🔍 CONSULTA DE ESTADO DE DOCUMENTO** (MEDIA PRIORIDAD)

#### **A. Badge de Estado en Tiempo Real**
```tsx
// components/invoices/invoice-status-badge.tsx
"use client"

import { useState, useEffect } from "react"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface InvoiceStatusBadgeProps {
  invoiceId: string
  cufe: string | null
  currentStatus: string
}

export function InvoiceStatusBadge({ invoiceId, cufe, currentStatus }: InvoiceStatusBadgeProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshStatus = async () => {
    if (!cufe) return

    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/documentos/consultar?cufe=${cufe}&tipo=json`)
      const data = await response.json()

      if (data.success && data.data.codigo === '0200') {
        setStatus('CERTIFIED')
      }
    } catch (error) {
      console.error('Error al consultar estado:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const statusConfig = {
    DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Borrador' },
    QUEUED: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En Cola' },
    PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, label: 'Procesando' },
    CERTIFIED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Certificada' },
    REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rechazada' },
    CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Anulada' },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1.5" />
        {config.label}
      </span>

      {cufe && status !== 'CANCELLED' && (
        <button
          onClick={refreshStatus}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-100 rounded"
          title="Actualizar estado"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  )
}
```

---

### 5. **⚙️ PANEL DE CONFIGURACIÓN DE HKA** (MEDIA PRIORIDAD)

**Ubicación**: `/dashboard/configuracion`

#### **A. Sección de Integración HKA**
```tsx
// components/configuration/hka-config-section.tsx
"use client"

import { useState } from "react"
import { Settings, CheckCircle, XCircle } from "lucide-react"

export function HKAConfigSection() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/hka/test-connection')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, error: 'Error de conexión' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Integración The Factory HKA</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configuración de la conexión con el proveedor de facturación electrónica
          </p>
        </div>
        <Settings className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ambiente
          </label>
          <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value="demo">Demo (Pruebas)</option>
            <option value="prod">Producción</option>
          </select>
        </div>

        <div>
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Settings className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Probando conexión...' : 'Probar Conexión'}
          </button>
        </div>

        {testResult && (
          <div className={`flex items-start p-4 rounded-lg ${
            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message || testResult.error}
              </p>
              {testResult.success && (
                <div className="mt-2 text-xs text-green-700">
                  <p>Usuario: {testResult.credentials?.usuario}</p>
                  <p>Ambiente: {testResult.environment}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### **FASE 1 - CRÍTICO** (Implementar Ya)
1. ✅ Botón de Sincronización con HKA en `/dashboard/folios`
2. ✅ Panel de Folios en Tiempo Real
3. ✅ Panel de Acciones de Factura (Descargar PDF/XML, Anular)

### **FASE 2 - ALTA PRIORIDAD** (Esta Semana)
4. ✅ Notas de Crédito y Débito (Botones + Modales)
5. ✅ Badge de Estado en Tiempo Real
6. ✅ Panel de Configuración HKA

### **FASE 3 - MEDIA PRIORIDAD** (Próxima Semana)
7. ⏳ Dashboard de Métricas HKA
8. ⏳ Historial de Sincronizaciones
9. ⏳ Validador de XML antes de enviar

---

## 📝 INFORMACIÓN ADICIONAL REQUERIDA

Para completar la implementación óptima, necesito que me confirmes:

### 1. **Sobre los Datos de la Organización**
- ¿Ya tienes RUC y DV configurados en el modelo `Organization`?
- ¿En qué parte del sistema se capturan estos datos?

### 2. **Sobre el Generador de XML**
- ¿Ya existe un generador de XML para DGI Panamá?
- ¿O necesitas que implemente uno completo siguiendo la especificación DGI?
- ¿Tienes ejemplos de XML válidos de HKA?

### 3. **Sobre el Flujo de Facturación**
- ¿Las facturas se envían automáticamente a HKA al crearlas?
- ¿O prefieres un botón manual "Enviar a HKA"?
- ¿Prefieres procesamiento sincrónico o asincrónico con BullMQ?

### 4. **Sobre las Notas de Crédito/Débito**
- ¿Deben tener un formulario completo como las facturas?
- ¿O solo un campo de "motivo" + referencia a factura original?
- ¿Deben generar su propio XML o usar el de la factura original?

### 5. **Sobre Permisos y Roles**
- ¿Qué roles pueden anular documentos?
- ¿Qué roles pueden emitir notas de crédito/débito?
- ¿Todos pueden sincronizar folios o solo ADMIN?

### 6. **Sobre Notificaciones**
- ¿Deseas notificaciones push cuando se certifica una factura?
- ¿Email automático al cliente con PDF/XML adjunto?
- ¿Notificaciones cuando quedan pocos folios?

---

## 🚀 PRÓXIMOS PASOS

Una vez que me proporciones la información adicional, procederé a:

1. ✅ Implementar los componentes de FASE 1 (Sincronización + Descargas)
2. ✅ Crear los modales para Notas de Crédito/Débito
3. ✅ Integrar todo con las APIs de HKA ya creadas
4. ✅ Agregar validaciones y manejo de errores
5. ✅ Documentar cada componente

**¿Quieres que empiece con algún feature específico mientras me proporcionas la información adicional?**

