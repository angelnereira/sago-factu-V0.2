"use client"

import { useMemo, useState } from "react"
import { Upload, Shield, AlertCircle, FilePlus2, Info } from "lucide-react"

interface CertificateUploaderProps {
  onUploaded?: () => void
}

type UploadResult = {
  label: string
  status: "success" | "error"
  message: string
}

export function CertificateUploader({ onUploaded }: CertificateUploaderProps) {
  const [primaryFile, setPrimaryFile] = useState<File | null>(null)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [pin, setPin] = useState("")
  const [scope, setScope] = useState<"organization" | "personal">("organization")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<UploadResult[]>([])

  const hasFiles = useMemo(() => Boolean(primaryFile || backupFile), [primaryFile, backupFile])

  const validateFile = (file: File | null) => {
    if (!file) {
      return null
    }

    if (!file.name.match(/\.(pfx|p12)$/i)) {
      return "Solo se aceptan archivos con extensión .p12 o .pfx emitidos por la DNF."
    }

    return null
  }

  const handleFileChange = (file: File | null, type: "primary" | "backup") => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    if (type === "primary") {
      setPrimaryFile(file)
    } else {
      setBackupFile(file)
    }
  }

  const resetState = () => {
    setPrimaryFile(null)
    setBackupFile(null)
    setPin("")
  }

  const uploadCertificate = async (file: File, activate: boolean, label: string) => {
    const formData = new FormData()
    formData.append("certificate", file)
    formData.append("pin", pin)
    formData.append("activate", String(activate))
    formData.append("scope", scope)

    const response = await fetch("/api/certificates", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result?.error ?? "Error al subir el certificado")
    }

    return result as { certificateId: string }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!primaryFile) {
      setError("Selecciona al menos el certificado principal (prefijo A-).")
      return
    }

    if (!pin.trim()) {
      setError("Debes ingresar el PIN asociado a los archivos .p12.")
      return
    }

    const filesToUpload: Array<{ file: File; activate: boolean; label: string }> = []

    if (primaryFile) {
      filesToUpload.push({
        file: primaryFile,
        activate: true,
        label:
          scope === "organization"
            ? `Certificado principal de la organización (${primaryFile.name})`
            : `Certificado personal principal (${primaryFile.name})`,
      })
    }

    if (backupFile) {
      filesToUpload.push({
        file: backupFile,
        activate: false,
        label:
          scope === "organization"
            ? `Certificado de contingencia de la organización (${backupFile.name})`
            : `Certificado personal de respaldo (${backupFile.name})`,
      })
    }

    setIsUploading(true)
    setError(null)
    setResults([])

    const uploadOutcomes: UploadResult[] = []

    for (const item of filesToUpload) {
      try {
        await uploadCertificate(item.file, item.activate, item.label)
        uploadOutcomes.push({
          label: item.label,
          status: "success",
          message: item.activate
            ? "Se activó este certificado para la organización."
            : "Guardado como respaldo (no activo).",
        })
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Error inesperado al subir el certificado."

        uploadOutcomes.push({
          label: item.label,
          status: "error",
          message,
        })

        // Si falla el principal detenemos todo el flujo.
        if (item.activate) {
          break
        }
      }
    }

    setResults(uploadOutcomes)
    setIsUploading(false)

    const anyError = uploadOutcomes.some((outcome) => outcome.status === "error")
    if (!anyError) {
      resetState()
      onUploaded?.()
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-600" />
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Configurar firma digital HKA</h2>
          <p className="text-sm text-neutral-500">
            Sube los certificados emitidos por la Dirección Nacional de Firma Electrónica (DNF) para tu organización.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="rounded-md border border-neutral-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              ¿Dónde se aplicará este certificado?
            </legend>
            <div className="space-y-2 text-sm text-neutral-600">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 transition hover:border-indigo-300">
                <input
                  type="radio"
                  name="certificate-scope"
                  value="organization"
                  checked={scope === "organization"}
                  onChange={() => setScope("organization")}
                />
                <span>
                  <span className="font-medium text-neutral-900">Certificado de la organización</span>
                  <span className="block text-xs text-neutral-500">
                    Se utilizará como certificado oficial de la empresa para todos los usuarios.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 transition hover:border-indigo-300">
                <input
                  type="radio"
                  name="certificate-scope"
                  value="personal"
                  checked={scope === "personal"}
                  onChange={() => setScope("personal")}
                />
                <span>
                  <span className="font-medium text-neutral-900">Certificado personal</span>
                  <span className="block text-xs text-neutral-500">
                    Solo firmará los documentos que envíes tú. Ideal si cada firmante tiene su propio P12/PFX.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <p className="font-semibold uppercase tracking-wide">Recordatorio</p>
            <p className="mt-2">
              - Configura tu <strong>RUC personal</strong> en tu perfil antes de subir certificados personales.
            </p>
            <p>- El certificado personal se prioriza si tu modo de firma es “PERSONAL”.</p>
            <p>- Puedes alternar entre certificado organizacional o personal desde “Preferencias de firma”.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="rounded-md border border-neutral-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Archivo principal
            </legend>
            <p className="text-xs text-neutral-500">
              Generalmente inicia con <span className="font-semibold">A-</span> y corresponde al certificado
              principal de firma.
            </p>
            <label
              htmlFor="primary-certificate-file"
              className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Upload className="h-8 w-8" />
              <span>{primaryFile ? primaryFile.name : "Selecciona certificado principal (.p12/.pfx)"}</span>
              <input
                id="primary-certificate-file"
                type="file"
                accept=".p12,.pfx"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null, "primary")}
              />
            </label>
          </fieldset>

          <fieldset className="rounded-md border border-neutral-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Archivo de contingencia (opcional)
            </legend>
            <p className="text-xs text-neutral-500">
              Generalmente inicia con <span className="font-semibold">F-</span>. Se almacena como respaldo y no se
              activa automáticamente.
            </p>
            <label
              htmlFor="backup-certificate-file"
              className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <FilePlus2 className="h-8 w-8" />
              <span>{backupFile ? backupFile.name : "Agregar certificado de contingencia (opcional)"}</span>
              <input
                id="backup-certificate-file"
                type="file"
                accept=".p12,.pfx"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null, "backup")}
              />
            </label>
          </fieldset>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">PIN del certificado</label>
          <input
            type="password"
            autoComplete="new-password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN proporcionado por el Registro Público (mismo PIN para A- y F-)"
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Se almacenará cifrado con AES-256-GCM usando las variables <code>CERTIFICATE_MASTER_KEY</code> y{" "}
            <code>CERTIFICATE_ENCRYPTION_KEY</code>.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            {results.map((outcome) => (
              <div
                key={outcome.label}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 ${
                  outcome.status === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span className="font-medium">{outcome.label}</span>
                <span className="text-xs">{outcome.message}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !primaryFile || !pin}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isUploading ? "Procesando certificados..." : hasFiles ? "Guardar certificados" : "Selecciona certificados"}
        </button>
      </form>

      <div className="mt-6 space-y-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-4 text-xs text-blue-800">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold uppercase tracking-wide">Guía rápida (HKA Panamá):</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                Descarga desde la plataforma de HKA los certificados <strong>A-*</strong> (principal) y{" "}
                <strong>F-*</strong> (contingencia). Ambos comparten el mismo PIN.
              </li>
              <li>
                Sube el archivo <strong>A-</strong> en el primer recuadro. Se activará para firmar toda la emisión si
                eliges “Organización”, o solo tus documentos si elegiste “Personal”.
              </li>
              <li>
                (Opcional) Sube el archivo <strong>F-</strong> en el segundo recuadro. Quedará almacenado como
                respaldo y podrás activarlo desde la lista de certificados si el principal expira.
              </li>
              <li>
                Verifica que el RUC del certificado coincida con el RUC registrado en SAGO-FACTU. Si eliges ficha
                personal, debe coincidir con el RUC configurado en “Mi perfil”.
              </li>
            </ol>
          </div>
        </div>
        <div className="rounded-md border border-blue-100 bg-white px-3 py-2 text-blue-700">
          Ante el mensaje <code>PIN incorrecto</code>, confirma la contraseña en la plataforma de HKA antes de
          reintentar. Si persiste, solicita a la DNF la regeneración de los archivos.
        </div>
      </div>
    </div>
  )
}

