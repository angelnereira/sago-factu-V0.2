'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';

export function RastreoCorreoMethod() {
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/hka/rastreo-correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingId }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Error al rastrear correo');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trackingId">Tracking ID</Label>
        <Input
          id="trackingId"
          type="text"
          placeholder="ID de rastreo del correo"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="mr-2 h-4 w-4" />
        )}
        Rastrear Correo
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <p><strong>Estado:</strong> {result.estado}</p>
              <p><strong>Destinatarios:</strong> {result.destinatarios?.join(', ')}</p>
              {result.fechaEnvio && (
                <p><strong>Fecha Envío:</strong> {result.fechaEnvio}</p>
              )}
              {result.fechaEntrega && (
                <p><strong>Fecha Entrega:</strong> {result.fechaEntrega}</p>
              )}
              <p><strong>Mensaje:</strong> {result.mensaje}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
