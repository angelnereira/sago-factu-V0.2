'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Mail } from 'lucide-react';

export function EnvioCorreoMethod() {
  const [loading, setLoading] = useState(false);
  const [cufe, setCufe] = useState('');
  const [correos, setCorreos] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/hka/envio-correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cufe,
          correos: correos.split(',').map(e => e.trim()),
          asunto,
          mensaje,
          incluirPDF: true,
          incluirXML: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Error al enviar correo');
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
          placeholder="CUFE del documento"
          value={cufe}
          onChange={(e) => setCufe(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="correos">Correos Electrónicos</Label>
        <Input
          id="correos"
          type="text"
          placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
          value={correos}
          onChange={(e) => setCorreos(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">Separa múltiples correos con comas</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="asunto">Asunto (Opcional)</Label>
        <Input
          id="asunto"
          type="text"
          placeholder="Asunto del correo"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje">Mensaje (Opcional)</Label>
        <Textarea
          id="mensaje"
          placeholder="Mensaje personalizado"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Enviar Correo
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
              {result.trackingId && (
                <p><strong>Tracking ID:</strong> {result.trackingId}</p>
              )}
              <p><strong>Mensaje:</strong> {result.mensaje}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
