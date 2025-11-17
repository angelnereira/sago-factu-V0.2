'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Upload, CheckCircle2 } from 'lucide-react'

interface CertificateInfo {
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiration: number
  ruc?: string
  fingerprint: string
}

interface UploadResponse {
  success: boolean
  certificateId: string
  certificate: CertificateInfo
}

export function CertificateUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<UploadResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const ext = selectedFile.name.toLowerCase().split('.').pop()
      if (ext !== 'p12' && ext !== 'pfx') {
        setError('Solo se aceptan archivos .p12 o .pfx')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !password) {
      setError('Completa todos los campos requeridos')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('password', password)
      if (name) formData.append('name', name)
      formData.append('setAsDefault', setAsDefault.toString())

      const response = await fetch('/api/certificates/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cargar el certificado')
        return
      }

      setSuccess(data)
      setFile(null)
      setPassword('')
      setName('')
      setSetAsDefault(false)

      window.dispatchEvent(new CustomEvent('certificatesUpdated'))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar el certificado'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const daysText =
      success.certificate.daysUntilExpiration === 1
        ? '1 día'
        : `${success.certificate.daysUntilExpiration} días`

    return (
      <div className="space-y-4">
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">Certificado cargado exitosamente</p>
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Sujeto</label>
            <p className="text-sm text-gray-900">{success.certificate.subject}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Emisor</label>
            <p className="text-sm text-gray-900">{success.certificate.issuer}</p>
          </div>

          {success.certificate.ruc && (
            <div>
              <label className="text-sm font-medium text-gray-700">RUC</label>
              <p className="text-sm text-gray-900">{success.certificate.ruc}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Vencimiento</label>
            <p className="text-sm text-gray-900">
              {new Date(success.certificate.validTo).toLocaleDateString(
                'es-PA'
              )}{' '}
              ({daysText} restantes)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Huella digital</label>
            <p className="text-xs font-mono text-gray-600 break-all">
              {success.certificate.fingerprint}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setSuccess(null)}
          className="w-full"
        >
          Cargar otro certificado
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificado Digital (.p12 o .pfx)
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".p12,.pfx"
            onChange={handleFileChange}
            className="hidden"
            id="cert-file"
            disabled={loading}
          />
          <label
            htmlFor="cert-file"
            className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-700">
                {file ? file.name : 'Selecciona un archivo o arrastra aquí'}
              </p>
              <p className="text-xs text-gray-500 mt-1">.p12 o .pfx</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña del Certificado
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa la contraseña"
          disabled={loading}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre (opcional)
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Certificado Empresa 2024"
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="default"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          disabled={loading}
          className="rounded border-gray-300"
        />
        <label htmlFor="default" className="text-sm text-gray-700">
          Usar como certificado por defecto
        </label>
      </div>

      <Button
        type="submit"
        disabled={!file || !password || loading}
        className="w-full"
      >
        {loading ? 'Cargando...' : 'Cargar Certificado'}
      </Button>
    </form>
  )
}
