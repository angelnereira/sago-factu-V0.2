'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'

interface CertificateInfo {
  subject: string
  issuer: string
  validTo: string
  daysUntilExpiration: number
  ruc?: string
}

export function SimpleCertificateUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [currentCert, setCurrentCert] = useState<CertificateInfo | null>(null)

  useEffect(() => {
    fetchCurrentCertificate()
  }, [])

  const fetchCurrentCertificate = async () => {
    try {
      const res = await fetch('/api/certificates/simple-upload')
      const data = await res.json()
      setCurrentCert(data.certificate)
    } catch (error) {
      console.error('Error fetching certificate:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !password) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('password', password)

      const res = await fetch('/api/certificates/simple-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cargar')
        return
      }

      setSuccess(true)
      setFile(null)
      setPassword('')
      setCurrentCert(data.certificate)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Certificado Actual */}
      {currentCert && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Certificado Actual</p>
          <p className="text-sm text-blue-800">{currentCert.subject}</p>
          <p className="text-xs text-blue-700 mt-1">
            Vence: {new Date(currentCert.validTo).toLocaleDateString('es-PA')}
            ({currentCert.daysUntilExpiration} días)
          </p>
        </div>
      )}

      {/* Formulario Carga */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">Certificado cargado exitosamente</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo (.p12 o .pfx)
          </label>
          <input
            type="file"
            accept=".p12,.pfx"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && !f.name.match(/\.(p12|pfx)$/i)) {
                setError('Solo .p12 o .pfx')
              } else {
                setFile(f || null)
                setError(null)
              }
            }}
            className="block w-full text-sm border border-gray-300 rounded-lg p-2"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={!file || !password || loading}
          className="w-full"
        >
          {loading ? 'Cargando...' : 'Cargar Certificado'}
        </Button>
      </form>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p>
          📝 Solo se guarda UN certificado. Al cargar uno nuevo, el anterior se reemplaza.
        </p>
      </div>
    </div>
  )
}
