/**
 * API: Trigger Manual de Monitor
 * POST /api/monitors/trigger
 * 
 * Ejecutar un monitor manualmente
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { createErrorResponse } from '@/lib/utils/api-error-response';
import { getInvoiceQueue } from '@/lib/queue/invoice-queue';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acceso restringido' }, { status: 403 });
    }

    const body = await request.json();
    const { monitorId } = body;

    if (!monitorId) {
      return NextResponse.json({ error: 'monitorId es requerido' }, { status: 400 });
    }

    // Buscar monitor
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { collection: true },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor no encontrado' }, { status: 404 });
    }

    // Encolar ejecución (por ahora, solo creamos el run)
    const run = await prisma.monitorRun.create({
      data: {
        monitorId,
        status: 'RUNNING',
        startedAt: new Date(),
        triggeredBy: session.user.id,
      },
    });

    // TODO: Aquí iría el worker que ejecuta realmente el monitor
    // Por ahora solo creamos el run record

    return NextResponse.json({
      success: true,
      runId: run.id,
      message: 'Monitor ejecutándose',
    });
  } catch (error) {
    return createErrorResponse(
      error,
      500,
      session?.user?.role,
      session?.user?.id
    );
  }
}

