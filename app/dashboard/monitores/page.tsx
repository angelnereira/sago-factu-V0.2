'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { Activity, Play, Pause, Plus, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Monitor {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  runs: {
    status: string;
    startedAt: string;
  }[];
}

export default function MonitoresPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch monitors
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Monitoreo API</h1>
        <p className="text-gray-600">Sistema de monitoreo para APIs críticas</p>
      </div>

      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="stats">
          <div className="stat-value text-2xl">{monitors.length}</div>
          <div className="stat-desc">Monitores Activos</div>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Monitor
        </button>
      </div>

      {/* Monitores List */}
      <div className="grid gap-4">
        {monitors.length === 0 ? (
          <div className="alert">
            <AlertCircle className="w-6 h-6" />
            <span>No hay monitores configurados</span>
          </div>
        ) : (
          monitors.map((monitor) => (
            <div key={monitor.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{monitor.name}</h3>
                  {monitor.description && (
                    <p className="text-gray-600">{monitor.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-sm">
                    <Play className="w-4 h-4" />
                  </button>
                  {monitor.enabled ? (
                    <span className="badge badge-success">Activo</span>
                  ) : (
                    <span className="badge badge-error">Inactivo</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 alert alert-info">
        <Activity className="w-6 h-6" />
        <div>
          <h3 className="font-semibold">Sistema de Monitoreo</h3>
          <p className="text-sm">
            Monitorea el estado y performance de tus APIs críticas.
            Solo disponible para SUPER_ADMIN.
          </p>
        </div>
      </div>
    </div>
  );
}

