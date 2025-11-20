'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, FileText, ExternalLink, TrendingDown, CheckCircle } from 'lucide-react';
import { checkFolios } from '@/app/actions/hka/check-folios.action';
import type { FolioBalance } from '@/lib/hka/mappers';

export function FoliosMonitor() {
    const [balance, setBalance] = useState<FolioBalance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFolios = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await checkFolios();

            if (result.success && result.data) {
                setBalance(result.data);
            } else {
                setError(result.error || 'No se pudo cargar la información de folios');
            }
        } catch (err: any) {
            setError('Ocurrió un error al consultar HKA');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFolios();
    }, []);

    if (isLoading && !balance) {
        return (
            <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-gray-500">Consultando saldo en HKA...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-red-900 dark:text-red-300 mb-2">Error de Conexión</h3>
                <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={loadFolios} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                </Button>
            </div>
        );
    }

    if (!balance) return null;

    return (
        <div className="space-y-6">
            {/* Tarjeta Principal de Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saldo Disponible - Destacado */}
                <Card className="md:col-span-2 border-l-4 border-l-indigo-500 shadow-md">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                    Folios Disponibles
                                </CardTitle>
                                <CardDescription>
                                    Saldo actual en plataforma HKA
                                </CardDescription>
                            </div>
                            <Badge variant={balance.alertaBajo ? "destructive" : "outline"} className="text-sm px-3 py-1">
                                {balance.alertaBajo ? "Saldo Bajo" : "Estado Saludable"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {balance.disponibles.toLocaleString()}
                            </span>
                            <span className="text-gray-500 font-medium">folios</span>
                        </div>

                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-600 dark:text-gray-300">Consumo del Paquete</span>
                                <span className="text-gray-900 dark:text-white">{balance.porcentajeUso.toFixed(1)}%</span>
                            </div>
                            <Progress
                                value={balance.porcentajeUso}
                                className="h-3"
                                indicatorClassName={balance.alertaBajo ? 'bg-yellow-500' : 'bg-indigo-600'}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Resumen de Uso */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                            Resumen de Uso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Paquete</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{balance.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Consumidos</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{balance.utilizados.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Acciones y Detalles */}
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Folios</CardTitle>
                    <CardDescription>
                        Acciones para administrar tu saldo de facturación electrónica
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">Sincronizar Saldo</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza la información directamente desde HKA</p>
                            </div>
                        </div>
                        <Button onClick={loadFolios} disabled={isLoading} variant="secondary">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Actualizar Ahora
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                                <ExternalLink className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-indigo-900 dark:text-indigo-300">Comprar Más Folios</h4>
                                <p className="text-sm text-indigo-700 dark:text-indigo-400">Adquiere nuevos paquetes a través del portal de The Factory HKA</p>
                            </div>
                        </div>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <a href="https://portal.thefactoryhka.com.pa/" target="_blank" rel="noopener noreferrer">
                                Ir al Portal HKA <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
