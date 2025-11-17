/**
 * Página: Dashboard - Gestión de Certificados Digitales
 *
 * Panel completo para:
 * - Cargar nuevos certificados
 * - Ver lista de certificados activos
 * - Monitorear vencimientos
 * - Gestionar certificados por defecto
 * - Revocar certificados
 */

'use client'

import { useState } from 'react'
import { CertificateUploadForm } from '@/app/components/certificates/CertificateUploadForm'
import { CertificateList } from '@/app/components/certificates/CertificateList'
import { Shield, Upload, List } from 'lucide-react'

export default function CertificadosPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Certificados Digitales
          </h1>
        </div>
        <p className="text-gray-600">
          Gestiona tus certificados digitales para firma electrónica de facturas
        </p>
      </div>

      {/* Information Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Información importante</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Los certificados deben estar en formato .p12 o .pfx con su contraseña
          </li>
          <li>
            • Se requiere un certificado válido para firmar facturas electrónicas
          </li>
          <li>
            • Te alertaremos cuando un certificado esté próximo a vencer
          </li>
          <li>
            • Solo administradores pueden gestionar certificados
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div className="w-full">
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="h-4 w-4" />
            Mis Certificados
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="h-4 w-4" />
            Cargar Nuevo
          </button>
        </div>

        {/* Lista de Certificados */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Certificados Disponibles
              </h2>
              <CertificateList />
            </div>
          </div>
        )}

        {/* Cargar Certificado */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Cargar Nuevo Certificado
              </h2>
              <CertificateUploadForm />
            </div>
          </div>
        )}
      </div>

      {/* Guidelines Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            Requisitos del Certificado
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>
              ✓ Formato PKCS#12 (.p12 o .pfx)
            </li>
            <li>
              ✓ Certificado X.509 válido
            </li>
            <li>
              ✓ Clave privada RSA 2048+ bits
            </li>
            <li>
              ✓ Emitido por autoridad confiable
            </li>
            <li>
              ✓ No vencido
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            Información Almacenada
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>
              📦 Certificado en base64 (encriptado)
            </li>
            <li>
              🔐 Nunca almacenamos la contraseña
            </li>
            <li>
              👤 Sujeto y emisor del certificado
            </li>
            <li>
              📅 Fechas de validez
            </li>
            <li>
              🏢 RUC de la organización
            </li>
          </ul>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Seguridad</h3>
        <p className="text-sm text-yellow-800">
          Tus certificados se almacenan encriptados en la base de datos y nunca se
          comparten con terceros. Asegúrate de mantener tu contraseña en un lugar seguro.
        </p>
      </div>
    </div>
  )
}
