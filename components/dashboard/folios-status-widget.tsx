'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { checkFolios } from '@/app/actions/hka/check-folios.action';

/**
 * Folios Status Widget
 * Muestra un indicador visual del estado de folios disponibles
 * Se consulta automáticamente al cargar la página y se puede refrescar manualmente
 */
export function FoliosStatusWidget() {
  const [folios, setFolios] = useState<{ disponibles: number; utilizados: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Cargar folios al montar
  useEffect(() => {
    const loadFolios = async () => {
      setIsLoading(true);
      setError(null);
      const result = await checkFolios();
      if (result.success && result.data) {
        setFolios(result.data);
      } else {
        setError(result.error || 'No se pudo cargar los folios');
      }
      setIsLoading(false);
    };

    loadFolios();

    // Refrescar cada hora
    const interval = setInterval(loadFolios, 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    const result = await checkFolios();
    if (result.success && result.data) {
      setFolios(result.data);
    } else {
      setError(result.error || 'Error al refrescar folios');
    }
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <button className="p-2 text-gray-400 cursor-not-allowed" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  if (error || !folios) {
    return (
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        title="Error al cargar folios"
      >
        <AlertTriangle className="h-5 w-5" />
      </button>
    );
  }

  // Determinar color según cantidad de folios
  const getStatusColor = (disponibles: number) => {
    if (disponibles > 100) return 'bg-green-500';
    if (disponibles < 10) return 'bg-red-500 animate-pulse';
    if (disponibles < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusLabel = (disponibles: number) => {
    if (disponibles > 100) return 'Suficientes folios';
    if (disponibles < 10) return 'Folios críticos - Compra inmediata requerida';
    if (disponibles < 50) return 'Pocos folios - Compra pronto';
    return 'Suficientes folios';
  };

  const statusColor = getStatusColor(folios.disponibles);
  const statusLabel = getStatusLabel(folios.disponibles);

  return (
    <div className="relative">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group disabled:opacity-50"
        title={statusLabel}
      >
        {/* Indicador visual (semáforo) */}
        <div className="relative">
          <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {/* Punto de estado */}
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${statusColor} border border-white dark:border-gray-900`}
          />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
            <div className="font-semibold">Folios Disponibles</div>
            <div className="mt-1">
              {folios.disponibles === 1 ? (
                <div>{folios.disponibles} folio disponible</div>
              ) : (
                <div>{folios.disponibles} folios disponibles</div>
              )}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {folios.utilizados} utilizados
            </div>
            {folios.disponibles < 50 && (
              <div className="text-xs text-yellow-300 mt-2 font-medium">
                ⚠️ {statusLabel}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Click para refrescar
            </div>
          </div>
        )}

        {/* Loading spinner when refreshing */}
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>
        )}
      </button>
    </div>
  );
}
