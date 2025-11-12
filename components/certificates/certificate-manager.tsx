"use client"

import { type ChangeEvent, useRef, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  FileKey,
  Shield,
  Upload,
} from "lucide-react"

interface CertificateSummary {
  id: string
  subject: string
  validUntil: string | Date
  validFrom: string | Date
  ruc: string
  dv: string
  issuer: string
}

interface CertificateManagerProps {
  organizationId: string
  currentCertificate?: CertificateSummary | null
}

export function CertificateManager({ organizationId, currentCertificate }: CertificateManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [password, setPassword] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const notifyError = (message: string) => {
    alert(message)
  }

  const notifySuccess = (message: string) => {
    alert(message)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      setSelectedFiles([])
      return
    }

    const nextFiles: File[] = []

    for (const file of files) {
      if (!file.name.match(/\.(pfx|p12)$/i)) {
        notifyError(`El archivo "${file.name}" no es válido. Seleccione archivos .p12 o .pfx.`)
        continue
      }

      nextFiles.push(file)
    }

    const combined = [...selectedFiles, ...nextFiles].slice(0, 2)

    if (combined.length === 0) {
      event.target.value = ""
      setSelectedFiles([])
      return
    }

    if (combined.length < selectedFiles.length + nextFiles.length) {
      notifyError("Solo se permiten dos archivos de certificado por carga.")
    }

    setSelectedFiles(combined)
  }

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, idx) => idx !== index)
    setSelectedFiles(updated)
    if (fileInputRef.current && updated.length === 0) {
      fileInputRef.current.value = ""
    }
  }

  const resetForm = () => {
    setPassword("")
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      notifyError("Seleccione al menos un certificado para cargar")
      return
    }

    if (!password) {
      notifyError("Ingrese la contraseña del certificado")
      return
    }

    setIsUploading(true)

    try {
      const results = []

      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append("certificate", file)
        formData.append("password", password)
        formData.append("organizationId", organizationId)

        const response = await fetch("/api/certificates/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Error al guardar el certificado ${file.name}`)
        }

        results.push(result)
      }

      notifySuccess(
        results.length === 1
          ? "Certificado cargado correctamente"
          : `${results.length} certificados cargados correctamente`,
      )
      resetForm()
      window.location.reload()
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Error inesperado al cargar los certificados")
    } finally {
      setIsUploading(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!currentCertificate) return null
    const expiry = new Date(currentCertificate.validUntil)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30

  const formattedValidUntil = currentCertificate
    ? format(new Date(currentCertificate.validUntil), "dd/MM/yyyy", { locale: es })
    : null

  const formattedValidFrom = currentCertificate
    ? format(new Date(currentCertificate.validFrom), "dd/MM/yyyy", { locale: es })
    : null

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <Shield className="h-5 w-5" />
            Estado del certificado
          </div>
        </div>
        <div className="px-4 py-5">
          {currentCertificate ? (
            <div
              className={`rounded-lg border p-4 ${
                isExpired
                  ? "border-red-200 bg-red-50"
                  : isExpiringSoon
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {isExpired ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
                ) : isExpiringSoon ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                )}

                <div className="flex-1 space-y-3 text-sm text-neutral-700">
                  <div>
                    <span className="font-semibold text-neutral-900">Sujeto:</span>{" "}
                    {currentCertificate.subject}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>
                      RUC: {currentCertificate.ruc}-{currentCertificate.dv}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileKey className="h-4 w-4" />
                    <span>Emisor: {currentCertificate.issuer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Vigencia: {formattedValidFrom} - {formattedValidUntil}
                      {daysUntilExpiry !== null && !isExpired && (
                        <span className="ml-1 text-neutral-500">({daysUntilExpiry} días restantes)</span>
                      )}
                    </span>
                  </div>

                  {isExpired && (
                    <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      El certificado ha expirado. Cargue un nuevo certificado para continuar emitiendo facturas.
                    </div>
                  )}

                  {isExpiringSoon && !isExpired && (
                    <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                      El certificado expira pronto. Renueve el certificado para evitar interrupciones en la emisión de facturas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
              No hay certificado cargado. Cargue un certificado válido para firmar las facturas electrónicas.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-neutral-900">Cargar certificados (.p12 / .pfx)</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Puedes subir hasta dos archivos de firma digital (principal y respaldo). Ambos deben compartir la misma contraseña.
          </p>
        </div>
        <div className="space-y-4 px-4 py-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="certificate-file">
              Seleccionar certificados
            </label>
            <input
              ref={fileInputRef}
              id="certificate-file"
              type="file"
              accept=".pfx,.p12"
              multiple
              onChange={handleFileChange}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            {selectedFiles.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {selectedFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-2 py-1">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeFile(index)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedFiles.length === 0 && (
              <p className="mt-1 text-xs text-neutral-500">Selecciona uno o dos archivos .p12 /.pfx.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="certificate-password">
              Contraseña de los certificados
            </label>
            <input
              id="certificate-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña del archivo PFX/P12"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-500">
              La contraseña se usará para cada archivo seleccionado.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0 || !password}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            <Upload className={`h-4 w-4 ${isUploading ? "animate-spin" : ""}`} />
            {isUploading ? "Cargando certificados..." : `Cargar ${selectedFiles.length > 1 ? "certificados" : "certificado"}`}
          </button>

          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Los certificados se almacenan cifrados con AES-256-GCM y solo se desencriptan temporalmente al firmar una factura.
          </div>
        </div>
      </div>
    </div>
  )
}

