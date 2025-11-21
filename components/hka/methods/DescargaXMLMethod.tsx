'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, AlertTriangle } from 'lucide-react';

export function DescargaXMLMethod() {
  const [loading, setLoading] = useState(false);
  const [cufe, setCufe] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hka/descarga-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cufe }),
      });

      const data = await response.json();

      if (data.success && data.data.xmlBase64) {
        // Descargar el XML
        const blob = new Blob(
          [atob(data.data.xmlBase64)],
          { type: 'application/xml' }
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cufe}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(data.error || 'Error al descargar XML');
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

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Descargar XML
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
