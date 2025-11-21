'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function EnviarMethod() {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleData = {
    tipoEmision: '01',
    tipoDocumento: '01',
    numeroDocumentoFiscal: '001-0000-01-00000001',
    // ... más campos
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = JSON.parse(jsonData);

      const response = await fetch('/api/hka/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (responseData.success) {
        setResult(responseData.data);
      } else {
        setError(responseData.error || 'Error al enviar documento');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Envía el XML completo del documento fiscal en formato JSON. Ver documentación de HKA para estructura completa.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="jsonData">Datos del Documento (JSON)</Label>
        <Textarea
          id="jsonData"
          placeholder={JSON.stringify(exampleData, null, 2)}
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          rows={12}
          className="font-mono text-sm"
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar Documento
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
              <p><strong>Protocolo:</strong> {result.protocoloSeguridad}</p>
              <p><strong>CUFE:</strong> {result.cufe}</p>
              <p><strong>Número Fiscal:</strong> {result.numeroDocumentoFiscal}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
