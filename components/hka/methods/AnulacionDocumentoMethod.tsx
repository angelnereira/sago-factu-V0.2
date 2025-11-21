'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export function AnulacionDocumentoMethod() {
  const [loading, setLoading] = useState(false);
  const [cufe, setCufe] = useState('');
  const [motivo, setMotivo] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/hka/anulacion-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cufe, motivo }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Error al anular documento');
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
        <Label htmlFor="cufe">CUFE del Documento</Label>
        <Input
          id="cufe"
          type="text"
          placeholder="CUFE del documento a anular"
          value={cufe}
          onChange={(e) => setCufe(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo de Anulación</Label>
        <Textarea
          id="motivo"
          placeholder="Describe el motivo de la anulación"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" variant="destructive">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Anular Documento
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
              <p><strong>Mensaje:</strong> {result.mensaje}</p>
              {result.protocoloAnulacion && (
                <p><strong>Protocolo Anulación:</strong> {result.protocoloAnulacion}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
