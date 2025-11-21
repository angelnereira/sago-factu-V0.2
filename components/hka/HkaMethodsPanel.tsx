'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  FileSearch,
  XCircle,
  Download,
  Mail,
  MapPin,
  Search,
  FileText,
  Package
} from 'lucide-react';

// Componentes para cada método
import { EnviarMethod } from './methods/EnviarMethod';
import { EstadoDocumentoMethod } from './methods/EstadoDocumentoMethod';
import { AnulacionDocumentoMethod } from './methods/AnulacionDocumentoMethod';
import { DescargaXMLMethod } from './methods/DescargaXMLMethod';
import { DescargaPDFMethod } from './methods/DescargaPDFMethod';
import { FoliosRestantesMethod } from './methods/FoliosRestantesMethod';
import { EnvioCorreoMethod } from './methods/EnvioCorreoMethod';
import { RastreoCorreoMethod } from './methods/RastreoCorreoMethod';
import { ConsultarRucDVMethod } from './methods/ConsultarRucDVMethod';

const METHODS = [
  {
    id: 'enviar',
    name: 'Enviar',
    description: 'Emite una factura electrónica',
    icon: Send,
    component: EnviarMethod,
  },
  {
    id: 'estado',
    name: 'Estado Documento',
    description: 'Consulta el estado de un documento',
    icon: FileSearch,
    component: EstadoDocumentoMethod,
  },
  {
    id: 'anulacion',
    name: 'Anulación',
    description: 'Anula un documento previamente emitido',
    icon: XCircle,
    component: AnulacionDocumentoMethod,
  },
  {
    id: 'descarga-xml',
    name: 'Descarga XML',
    description: 'Descarga el XML de un documento',
    icon: Download,
    component: DescargaXMLMethod,
  },
  {
    id: 'descarga-pdf',
    name: 'Descarga PDF',
    description: 'Descarga el PDF de un documento',
    icon: FileText,
    component: DescargaPDFMethod,
  },
  {
    id: 'folios',
    name: 'Folios Restantes',
    description: 'Consulta folios disponibles',
    icon: Package,
    component: FoliosRestantesMethod,
  },
  {
    id: 'envio-correo',
    name: 'Envío Correo',
    description: 'Envía factura por correo electrónico',
    icon: Mail,
    component: EnvioCorreoMethod,
  },
  {
    id: 'rastreo-correo',
    name: 'Rastreo Correo',
    description: 'Rastrea el estado de un envío de correo',
    icon: MapPin,
    component: RastreoCorreoMethod,
  },
  {
    id: 'consultar-ruc',
    name: 'Consultar RUC/DV',
    description: 'Consulta el dígito verificador de un RUC',
    icon: Search,
    component: ConsultarRucDVMethod,
  },
];

export function HkaMethodsPanel() {
  const [activeMethod, setActiveMethod] = useState('enviar');

  return (
    <div className="space-y-6">
      {/* Grid de tarjetas de métodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {METHODS.map((method) => {
          const Icon = method.icon;
          const isActive = activeMethod === method.id;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isActive
                  ? 'ring-2 ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'hover:border-indigo-300'
              }`}
              onClick={() => setActiveMethod(method.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{method.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{method.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Panel del método activo */}
      <Card>
        <CardHeader>
          <CardTitle>
            {METHODS.find((m) => m.id === activeMethod)?.name}
          </CardTitle>
          <CardDescription>
            {METHODS.find((m) => m.id === activeMethod)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {METHODS.map((method) => {
            const Component = method.component;
            return (
              <div key={method.id} className={activeMethod === method.id ? '' : 'hidden'}>
                <Component />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
