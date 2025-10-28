/**
 * API: Crear Monitor
 * POST /api/monitors/create
 * 
 * Solo SUPER_ADMIN puede crear monitores
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { createErrorResponse } from '@/lib/utils/api-error-response';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso restringido a SUPER_ADMIN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, collectionId, schedule, regions, notifications } = body;

    // Validaciones básicas
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name es requerido' },
        { status: 400 }
      );
    }

    // Crear monitor
    const monitor = await prisma.monitor.create({
      data: {
        name,
        description: description || null,
        collectionId: collectionId || null,
        schedule: schedule || { frequency: 'hourly' },
        enabled: true,
        regions: regions || null,
        notifications: notifications || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      monitor,
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

