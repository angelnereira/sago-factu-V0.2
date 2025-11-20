'use client';

/**
 * Emission History Widget
 * Muestra historial reciente de emisiones HKA
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  emittedAt: Date | null;
  cufe: string | null;
}

interface EmissionHistoryProps {
  limit?: number;
}

export function EmissionHistory({ limit = 5 }: EmissionHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implementar action para obtener facturas recientes
    // Por ahora mock data
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        // const result = await getRecentEmissions({ limit });
        // setInvoices(result.data || []);

        // Mock data por ahora
        setInvoices([]);
      } catch (error) {
        console.error('Failed to load emissions', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Emissions
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Emissions
            </CardTitle>
            <CardDescription>Latest invoices emitted via HKA</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices">
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No emissions yet. Create and emit your first invoice!
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/invoices/new">Create Invoice</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/dashboard/invoices/${invoice.id}`}
                className="block rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                    {invoice.cufe && (
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {invoice.cufe}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.total.toFixed(2)}</p>
                    {invoice.emittedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(invoice.emittedAt, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; icon: any; label: string }> = {
    EMITTED: {
      variant: 'default',
      icon: CheckCircle2,
      label: 'Emitted',
    },
    CANCELLED: {
      variant: 'destructive',
      icon: XCircle,
      label: 'Cancelled',
    },
    DRAFT: {
      variant: 'secondary',
      icon: FileText,
      label: 'Draft',
    },
  };

  const config = variants[status] || variants.DRAFT;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
