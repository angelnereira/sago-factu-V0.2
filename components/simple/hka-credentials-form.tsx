'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function HKACredentialsForm() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tokenUser, setTokenUser] = useState('');
  const [tokenPassword, setTokenPassword] = useState('');
  const [environment, setEnvironment] = useState<'demo' | 'prod'>('demo');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    fetch('/api/settings/hka-credentials')
      .then(res => res.json())
      .then(data => {
        if (data.configured) {
          setTokenUser(data.tokenUser);
          setEnvironment(data.environment);
          setIsConfigured(true);
        }
      })
      .catch(err => console.error('Error cargando credenciales:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/hka-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenUser, tokenPassword, environment }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Credenciales guardadas correctamente' });
        setIsConfigured(true);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al guardar credenciales' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/test-hka-connection', {
        method: 'POST',
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ type: 'success', text: '✓ Conexión con HKA exitosa' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al conectar con HKA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al probar conexión' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tokenUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Token Usuario <span className="text-red-500">*</span>
        </label>
        <input
          id="tokenUser"
          type="text"
          value={tokenUser}
          onChange={(e) => setTokenUser(e.target.value)}
          disabled={loading}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          placeholder="Ingresa tu token de usuario de HKA"
        />
      </div>

      <div>
        <label htmlFor="tokenPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Token Password <span className="text-red-500">*</span>
        </label>
        <input
          id="tokenPassword"
          type="password"
          value={tokenPassword}
          onChange={(e) => setTokenPassword(e.target.value)}
          disabled={loading}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          placeholder="Ingresa tu token password de HKA"
        />
      </div>

      <div>
        <label htmlFor="environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ambiente
        </label>
        <select
          id="environment"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as 'demo' | 'prod')}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="demo">Demo (Pruebas)</option>
          <option value="prod">Producción</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Usa "Demo" para pruebas y "Producción" para facturas reales
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg flex items-start ${
          message.type === 'error' 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'error' 
              ? 'text-red-800 dark:text-red-200' 
              : 'text-green-800 dark:text-green-200'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Credenciales
        </button>
        
        {isConfigured && (
          <button
            type="button"
            onClick={testConnection}
            disabled={testing || loading}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Probar Conexión
          </button>
        )}
      </div>
    </form>
  );
}

