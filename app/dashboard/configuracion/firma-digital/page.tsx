/**
 * Configuración - Firma Digital
 *
 * Página simplificada: solo cargar el certificado
 * Todo lo demás usa configuraciones existentes de HKA
 */

'use client'

import { SimpleCertificateUpload } from '@/app/components/certificates/SimpleCertificateUpload'
import { Shield } from 'lucide-react'

export default function FirmaDigitalConfigPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firma Digital</h1>
          <p className="text-gray-600">Configura tu certificado para firmar facturas</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">¿Qué necesitas?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Certificado en formato .p12 o .pfx</li>
          <li>✓ Contraseña del certificado</li>
          <li>✓ Certificado válido (no vencido)</li>
        </ul>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cargar Certificado
        </h2>
        <SimpleCertificateUpload />
      </div>

      {/* Info de Seguridad */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-gray-900">Seguridad</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>🔒 El certificado se almacena encriptado en la base de datos</li>
          <li>👤 Solo tu usuario puede usar este certificado</li>
          <li>🔑 Nunca almacenamos la contraseña</li>
          <li>📝 Al cargar uno nuevo, el anterior se reemplaza automáticamente</li>
        </ul>
      </div>

      {/* Info de HKA */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 mb-2">Integración con HKA</h3>
        <p className="text-sm text-amber-800">
          El certificado se usará automáticamente para firmar facturas que se envíen a HKA.
          Las credenciales de HKA se configuran en{' '}
          <a href="/dashboard/configuracion/hka" className="underline font-medium">
            Configuración HKA
          </a>
        </p>
      </div>
    </div>
  )
}
