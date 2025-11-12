"use client"

import { useState } from "react"
import { Upload, Shield, AlertCircle } from "lucide-react"

interface CertificateUploaderProps {
  onUploaded?: () => void
}

export function CertificateUploader({ onUploaded }: CertificateUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [pin, setPin] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file || !pin) {
      setError("Selecciona un archivo .p12/.pfx y proporciona el PIN")
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append("certificate", file)
      formData.append("pin", pin)

      const response = await fetch("/api/certificates", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al subir el certificado")
      }

      setSuccess(true)
      setFile(null)
      setPin("")
      onUploaded?.()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Error inesperado al subir el certificado")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Configurar firma digital</h2>
          <p className="text-sm text-neutral-500">Carga tu certificado P12/PFX emitido por el Registro Público</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Certificado (.p12 / .pfx)</label>
          <label
            htmlFor="certificate-file"
            className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-sm text-neutral-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Upload className="h-8 w-8" />
            <span>{file ? file.name : "Selecciona un archivo"}</span>
            <input
              id="certificate-file"
              type="file"
              accept=".p12,.pfx"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">PIN del certificado</label>
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN proporcionado por el Registro Público"
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-neutral-500">Se almacenará cifrado con AES-256-GCM</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            ✓ Certificado cargado correctamente
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !file || !pin}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isUploading ? "Procesando..." : "Guardar certificado"}
        </button>
      </form>

      <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <p className="font-medium text-blue-800">Requisitos:</p>
        <ul className="mt-2 space-y-1">
          <li>• Certificado emitido por un Prestador Acreditado del Registro Público</li>
          <li>• El RUC del certificado debe coincidir con el RUC de la organización</li>
          <li>• Vigencia activa y claves RSA de al menos 2048 bits</li>
        </ul>
      </div>
    </div>
  )
}


