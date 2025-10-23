"use client"

import { useState, useRef } from "react"
import { Upload, FileText, X, CheckCircle, AlertTriangle, Loader2, FileSpreadsheet } from "lucide-react"
import { createInvoiceParser, InvoiceXMLParser, type ParsedInvoiceData } from "@/lib/utils/xml-parser"
import { createExcelParser, InvoiceExcelParser } from "@/lib/utils/excel-parser"

interface XMLUploaderProps {
  onDataExtracted: (data: ParsedInvoiceData) => void
}

export function XMLUploader({ onDataExtracted }: XMLUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fileName, setFileName] = useState("")
  const [previewData, setPreviewData] = useState<ParsedInvoiceData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setError("")
    setSuccess("")
    setPreviewData(null)

    // Validar tipo de archivo
    if (!file.name.endsWith(".xml") && !file.type.includes("xml")) {
      setError("Por favor, sube un archivo XML válido")
      return
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande (máx 5MB)")
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    try {
      // Leer contenido del archivo
      const xmlContent = await file.text()

      // Validar XML
      const validation = InvoiceXMLParser.validate(xmlContent)
      if (!validation.valid) {
        setError(`XML inválido: ${validation.errors.join(", ")}`)
        setIsProcessing(false)
        return
      }

      // Parsear XML
      const parser = createInvoiceParser()
      const parsedData = await parser.parse(xmlContent)

      // Mostrar preview
      setPreviewData(parsedData)
      setSuccess(`✅ XML procesado correctamente: ${parsedData.items.length} item(s) encontrado(s)`)
      
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo XML")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApplyData = () => {
    if (previewData) {
      onDataExtracted(previewData)
      setSuccess("✅ Datos aplicados al formulario")
      
      // Limpiar después de 2 segundos
      setTimeout(() => {
        setPreviewData(null)
        setFileName("")
        setSuccess("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 2000)
    }
  }

  const handleCancel = () => {
    setPreviewData(null)
    setFileName("")
    setError("")
    setSuccess("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Área de subida */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          onChange={handleFileSelect}
          className="hidden"
          id="xml-upload"
        />

        {!fileName && !isProcessing && (
          <>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra un archivo XML aquí
            </p>
            <p className="text-sm text-gray-600 mb-4">
              o haz click para seleccionar
            </p>
            <label
              htmlFor="xml-upload"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              Seleccionar XML
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Formatos soportados: FEL Panamá, CFDI México, XML genérico
            </p>
          </>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Procesando {fileName}...
            </p>
          </div>
        )}

        {fileName && !isProcessing && !previewData && (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="h-8 w-8 text-gray-400" />
            <span className="text-gray-700">{fileName}</span>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={handleCancel} className="text-red-400 hover:text-red-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && !previewData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Preview de datos extraídos */}
      {previewData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Vista Previa de Datos</span>
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Cliente:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Nombre:</strong> {previewData.client.name}</p>
              <p><strong>RUC:</strong> {previewData.client.taxId}</p>
              {previewData.client.email && <p><strong>Email:</strong> {previewData.client.email}</p>}
              {previewData.client.phone && <p><strong>Teléfono:</strong> {previewData.client.phone}</p>}
              <p><strong>Dirección:</strong> {previewData.client.address}</p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Items ({previewData.items.length}):
            </h4>
            <div className="space-y-2">
              {previewData.items.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm text-gray-700 bg-white p-2 rounded">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-gray-600">
                    Cant: {item.quantity} × ${item.unitPrice.toFixed(2)} | IVA: {item.taxRate}%
                  </p>
                </div>
              ))}
              {previewData.items.length > 3 && (
                <p className="text-xs text-gray-500">
                  ...y {previewData.items.length - 3} item(s) más
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleApplyData}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Aplicar Datos al Formulario
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

