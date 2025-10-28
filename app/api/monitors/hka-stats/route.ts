/**
 * API: Estadísticas HKA
 * GET /api/monitors/hka-stats
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHKAStatistics } from '@/lib/monitoring/hka-monitor-wrapper';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const stats = await getHKAStatistics();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener estadísticas HKA' },
      { status: 500 }
    );
  }
}

