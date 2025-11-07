"use client"

import { useRef, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.match(/\.(pfx|p12)$/i)) {
      toast.error("Seleccione un archivo .pfx o .p12 válido")
      event.target.value = ""
      return
    }

    setSelectedFile(file)
  }

  const resetForm = () => {
    setPassword("")
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Seleccione un certificado para cargar")
      return
    }

    if (!password) {
      toast.error("Ingrese la contraseña del certificado")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("certificate", selectedFile)
      formData.append("password", password)
      formData.append("organizationId", organizationId)

      const response = await fetch("/api/certificates/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el certificado")
      }

      toast.success("Certificado cargado correctamente")
      resetForm()
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado al cargar el certificado")
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Estado del certificado
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <Alert className="mt-2">
                      <AlertDescription>
                        El certificado ha expirado. Cargue un nuevo certificado para continuar emitiendo facturas.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isExpiringSoon && !isExpired && (
                    <Alert className="mt-2">
                      <AlertDescription>
                        El certificado expira pronto. Renueve el certificado para evitar interrupciones en la emisión de
                        facturas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No hay certificado cargado. Cargue un certificado válido para firmar las facturas electrónicas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cargar certificado (.pfx o .p12)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="certificate-file">Certificado</Label>
            <Input
              ref={fileInputRef}
              id="certificate-file"
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileChange}
              className="mt-1"
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-neutral-500">Archivo seleccionado: {selectedFile.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="certificate-password">Contraseña del certificado</Label>
            <Input
              id="certificate-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña del archivo PFX/P12"
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !password}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Cargar certificado
              </>
            )}
          </Button>

          <Alert>
            <AlertDescription className="text-xs text-neutral-600">
              Los certificados se almacenan cifrados con AES-256-GCM y solo se desencriptan temporalmente al firmar
              una factura.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

