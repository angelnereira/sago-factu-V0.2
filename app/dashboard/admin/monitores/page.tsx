'use client';

import { useEffect, useState } from 'react';
import { Activity, Play, Plus, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import CreateMonitorModal from '@/components/admin/create-monitor-modal';

interface Monitor {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  runs: Array<{ status: string; startedAt: string; }>;
}

export default function MonitoresPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await fetch('/api/monitors/list');
      const data = await response.json();
      if (data.success) {
        setMonitors(data.monitors);
      }
    } catch (error) {
      console.error('Error fetching monitores:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultMonitors = async () => {
    try {
      const response = await fetch('/api/monitors/create-defaults', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert('Monitores por defecto creados exitosamente');
        fetchMonitors();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating default monitors:', error);
      alert('Error al crear monitores por defecto');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Monitoreo API</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sistema de monitoreo para APIs críticas</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Monitor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Monitores</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{monitors.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Activity className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monitores Activos</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{monitors.filter(m => m.enabled).length}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Ejecución</p>
          <p className="mt-2 text-sm text-gray-500">-</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Monitores Configurados</h2>
          {monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No hay monitores configurados</p>
              <p className="text-sm mt-2">Crea tu primer monitor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {monitors.map((monitor) => (
                <div key={monitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{monitor.name}</h3>
                    {monitor.description && <p className="text-sm text-gray-600 mt-1">{monitor.description}</p>}
                  </div>
                  <button onClick={() => triggerMonitor(monitor.id)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Play className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateMonitorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchMonitors}
      />
    </div>
  );
}
