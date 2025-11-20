'use client';

/**
 * Folios Widget
 * Muestra balance de folios HKA en dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { checkFolios } from '@/app/actions/hka/check-folios.action';
import type { FolioBalance } from '@/lib/hka/mappers';

export function FoliosWidget() {
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
        setError(result.error || 'Failed to load folios');
      }
    } catch (err: any) {
      setError('An error occurred while loading folios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFolios();
  }, []);

  const handleRefresh = () => {
    loadFolios();
  };

  if (isLoading && !balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Folios Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Folios Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Folios Balance
            </CardTitle>
            <CardDescription>HKA electronic invoice folios</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert si están bajos */}
        {balance.alertaBajo && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-yellow-900 dark:bg-yellow-900/10 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Low folio balance!</p>
          </div>
        )}

        {/* Stats principales */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {balance.disponibles.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Used</p>
            <p className="text-2xl font-bold">{balance.utilizados.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{balance.total.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <Badge variant={balance.alertaBajo ? 'destructive' : 'secondary'}>
              {balance.porcentajeUso.toFixed(1)}%
            </Badge>
          </div>
          <Progress
            value={balance.porcentajeUso}
            className="h-2"
            indicatorClassName={balance.alertaBajo ? 'bg-yellow-500' : 'bg-blue-500'}
          />
        </div>

        {/* Info adicional */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {balance.alertaBajo ? (
            <p>Consider recharging your folios to avoid service interruption.</p>
          ) : (
            <p>Your folio balance is healthy.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
