"use client"

import { useCallback, useEffect, useState } from "react"

type SignatureMode = "ORGANIZATION" | "PERSONAL"

interface CertificateOption {
  id: string
  subject: string
  issuer: string
  validFrom: string
  validTo: string
  ruc: string
}

interface InitialConfig {
  signatureMode: SignatureMode
  digitalCertificateId: string | null
  autoSign: boolean
  notifyOnExpiration: boolean
}

interface DigitalSignatureSettingsProps {
  initialCertificates: CertificateOption[]
  initialPersonalCertificates: CertificateOption[]
  initialConfig: InitialConfig | null
  refreshToken?: number
}

interface StatusMessage {
  type: "success" | "error" | null
  message: string | null
}

export function DigitalSignatureSettings({
  initialCertificates,
  initialPersonalCertificates,
  initialConfig,
  refreshToken,
}: DigitalSignatureSettingsProps) {
  const [signatureMode, setSignatureMode] = useState<SignatureMode>(
    initialConfig?.signatureMode ?? "ORGANIZATION",
  )
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(
    initialConfig?.digitalCertificateId ?? null,
  )
  const [autoSign, setAutoSign] = useState<boolean>(initialConfig?.autoSign ?? true)
  const [notifyOnExpiration, setNotifyOnExpiration] = useState<boolean>(
    initialConfig?.notifyOnExpiration ?? true,
  )
  const [orgCertificates, setOrgCertificates] = useState<CertificateOption[]>(initialCertificates)
  const [personalCertificates, setPersonalCertificates] = useState<CertificateOption[]>(
    initialPersonalCertificates,
  )
  const [status, setStatus] = useState<StatusMessage>({ type: null, message: null })
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialLoadCompleted, setIsInitialLoadCompleted] = useState(false)

  const fetchCertificates = useCallback(async () => {
    try {
      const response = await fetch("/api/certificates")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudieron obtener los certificados")
      }

      if (data?.organization) {
        setOrgCertificates(
          data.organization.map((certificate: any) => ({
            id: certificate.id,
            subject: certificate.subject,
            issuer: certificate.issuer,
            validFrom: certificate.validFrom,
            validTo: certificate.validTo,
            ruc: certificate.ruc,
          })),
        )
      }

      if (data?.personal) {
        setPersonalCertificates(
          data.personal.map((certificate: any) => ({
            id: certificate.id,
            subject: certificate.subject,
            issuer: certificate.issuer,
            validFrom: certificate.validFrom,
            validTo: certificate.validTo,
            ruc: certificate.ruc,
          })),
        )
      }
    } catch (error) {
      console.error("[DigitalSignatureSettings] Error al refrescar certificados:", error)
    }
  }, [])

  useEffect(() => {
    if (typeof refreshToken === "number") {
      void fetchCertificates()
    }
  }, [refreshToken, fetchCertificates])

  useEffect(() => {
    const loadInitialConfig = async () => {
      try {
        const response = await fetch("/api/settings/digital-signature", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (Array.isArray(data?.certificates)) {
          setOrgCertificates(
            data.certificates.map((certificate: any) => ({
              id: certificate.id,
              subject: certificate.subject,
              issuer: certificate.issuer,
              validFrom: certificate.validFrom,
              validTo: certificate.validTo,
              ruc: certificate.ruc,
            })),
          )
        }

        if (data?.config) {
          setSignatureMode(data.config.signatureMode ?? "ORGANIZATION")
          setSelectedCertificate(data.config.certificateId ?? null)
          setAutoSign(typeof data.config.autoSign === "boolean" ? data.config.autoSign : true)
          setNotifyOnExpiration(
            typeof data.config.notifyOnExpiration === "boolean" ? data.config.notifyOnExpiration : true,
          )
        }
      } catch (error) {
        console.error("[DigitalSignatureSettings] Error cargando configuración inicial:", error)
      } finally {
        setIsInitialLoadCompleted(true)
      }
    }

    // Evitar sobreescribir valores si ya se cargaron desde el servidor a través de props
    if (!isInitialLoadCompleted) {
      void loadInitialConfig()
    }
  }, [isInitialLoadCompleted])

  useEffect(() => {
    const activeList = signatureMode === "PERSONAL" ? personalCertificates : orgCertificates
    if (selectedCertificate && !activeList.some((certificate) => certificate.id === selectedCertificate)) {
      setSelectedCertificate(null)
    }
  }, [signatureMode, personalCertificates, orgCertificates, selectedCertificate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setStatus({ type: null, message: null })

    try {
      const response = await fetch("/api/settings/digital-signature", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureMode,
          certificateId: signatureMode === "PERSONAL" ? selectedCertificate : null,
          autoSign,
          notifyOnExpiration,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setStatus({
          type: "error",
          message: result?.error ?? "No se pudo guardar la configuración",
        })
        return
      }

      setStatus({ type: "success", message: "Configuración guardada correctamente" })
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Error desconocido"
      setStatus({ type: "error", message: fallbackMessage })
    } finally {
      setIsSaving(false)
    }
  }

  const renderStatusMessage = () => {
    if (!status.type || !status.message) {
      return null
    }

    const baseClass =
      status.type === "success"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-red-200 bg-red-50 text-red-700"

    return (
      <div className={`rounded-md border px-3 py-2 text-sm ${baseClass}`}>{status.message}</div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <form className="space-y-6 px-4 py-5" onSubmit={handleSubmit}>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Preferencias de firma</h3>
          <p className="text-sm text-neutral-600">
            Define cómo se aplicará la firma digital al enviar facturas. Esta configuración se guarda por usuario.
          </p>
        </div>

        {renderStatusMessage()}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Modo de firma</label>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="signature-mode"
                value="ORGANIZATION"
                checked={signatureMode === "ORGANIZATION"}
                onChange={() => setSignatureMode("ORGANIZATION")}
              />
              <span>
                <span className="font-medium text-neutral-900">Usar certificado de la organización</span>
                <span className="block text-neutral-600">
                  Se empleará el certificado principal cargado por el administrador de la organización.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm">
              <input
                type="radio"
                name="signature-mode"
                value="PERSONAL"
                checked={signatureMode === "PERSONAL"}
                onChange={() => setSignatureMode("PERSONAL")}
              />
              <span>
                <span className="font-medium text-neutral-900">Usar certificado personal</span>
                <span className="block text-neutral-600">
                  Selecciona uno de los certificados activos para firmar únicamente las facturas que envíes.
                </span>
              </span>
            </label>
          </div>
        </div>

        {signatureMode === "PERSONAL" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700" htmlFor="personal-certificate">
              Certificado personal
            </label>
            <select
              id="personal-certificate"
              value={selectedCertificate ?? ""}
              onChange={(event) => setSelectedCertificate(event.target.value || null)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Selecciona un certificado</option>
              {(signatureMode === "PERSONAL" ? personalCertificates : orgCertificates).map((certificate) => (
                <option key={certificate.id} value={certificate.id}>
                  {certificate.subject} · Vence {new Date(certificate.validTo).toLocaleDateString("es-PA")}
                </option>
              ))}
            </select>
            {personalCertificates.length === 0 && (
              <p className="text-xs text-red-600">
                No hay certificados activos disponibles. Carga uno en la sección de “Firma electrónica”.
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Preferencias adicionales</label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={autoSign}
              onChange={(event) => setAutoSign(event.target.checked)}
            />
            Firmar automáticamente las facturas que envíe
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={notifyOnExpiration}
              onChange={(event) => setNotifyOnExpiration(event.target.checked)}
            />
            Recibir alertas cuando el certificado esté próximo a vencer
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving || (signatureMode === "PERSONAL" && !selectedCertificate)}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </button>
          <span className="text-xs text-neutral-500">
            Los cambios se aplican únicamente a tu usuario y no afectan a otros miembros.
          </span>
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          <p className="font-medium text-neutral-700">Certificados disponibles</p>
          {orgCertificates.length === 0 && personalCertificates.length === 0 ? (
            <p>No hay certificados activos registrados aún.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {orgCertificates.length > 0 && (
                <li className="rounded border border-neutral-200 bg-white px-3 py-2">
                  <p className="font-medium text-neutral-800">Certificados de la organización</p>
                  <ul className="mt-2 space-y-2">
                    {orgCertificates.map((certificate) => (
                      <li key={certificate.id} className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <p className="font-medium text-neutral-800">{certificate.subject}</p>
                        <p className="text-neutral-600">
                          Emisor: {certificate.issuer} · RUC {certificate.ruc}
                        </p>
                        <p className="text-neutral-600">
                          Vigencia: {new Date(certificate.validFrom).toLocaleDateString("es-PA")} -{" "}
                          {new Date(certificate.validTo).toLocaleDateString("es-PA")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              {personalCertificates.length > 0 && (
                <li className="rounded border border-neutral-200 bg-white px-3 py-2">
                  <p className="font-medium text-neutral-800">Tus certificados personales</p>
                  <ul className="mt-2 space-y-2">
                    {personalCertificates.map((certificate) => (
                      <li key={certificate.id} className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <p className="font-medium text-neutral-800">{certificate.subject}</p>
                        <p className="text-neutral-600">
                          Emisor: {certificate.issuer} · RUC {certificate.ruc}
                        </p>
                        <p className="text-neutral-600">
                          Vigencia: {new Date(certificate.validFrom).toLocaleDateString("es-PA")} -{" "}
                          {new Date(certificate.validTo).toLocaleDateString("es-PA")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          )}
        </div>
      </form>
    </div>
  )
}

