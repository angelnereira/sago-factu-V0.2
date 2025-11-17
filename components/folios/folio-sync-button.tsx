'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface FolioSyncButtonProps {
  organizationId: string;
  onSyncComplete?: () => void;
}

export function FolioSyncButton({ organizationId, onSyncComplete }: FolioSyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);

    console.log('[FolioSync] Iniciando sincronización de folios para org:', organizationId);

    try {
      const res = await fetch('/api/folios/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const result = await res.json();

      if (res.ok) {
        console.log('[FolioSync] Sincronización exitosa:', result);
        setMessage({
          type: 'success',
          text: '✅ Folios actualizados correctamente desde HKA',
        });
        // Recargar la página para mostrar los datos actualizados
        onSyncComplete?.();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        console.error('[FolioSync] Error en sincronización:', result);
        setMessage({
          type: 'error',
          text: result.error || 'Error al sincronizar folios',
        });
      }
    } catch (error) {
      console.error('[FolioSync] Error de conexión:', error);
      setMessage({
        type: 'error',
        text: 'Error de conexión. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Consulta HKA para actualizar el estado de tus folios disponibles"
      >
        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Consultando...' : 'Consultar Folios'}</span>
      </button>

      {message && (
        <div
          className={`p-3 rounded-lg flex items-start ${
            message.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'error'
                ? 'text-red-800 dark:text-red-200'
                : 'text-green-800 dark:text-green-200'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}
