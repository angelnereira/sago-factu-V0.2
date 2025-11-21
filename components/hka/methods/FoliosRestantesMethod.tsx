'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { checkFolios } from '@/app/actions/hka/check-folios.action';

export function FoliosRestantesMethod() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkFolios();

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message || 'Error al consultar folios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Consulta la cantidad de folios disponibles en tu cuenta de HKA.
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Consultar Folios
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            <div className="space-y-2">
              <p><strong>Folios Disponibles:</strong> {result.disponibles}</p>
              <p><strong>Folios Utilizados:</strong> {result.utilizados}</p>
              <p><strong>Total:</strong> {result.total}</p>
              <p><strong>Porcentaje Usado:</strong> {result.porcentajeUso.toFixed(2)}%</p>
              {result.alertaBajo && (
                <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  ⚠️ Saldo bajo de folios
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
