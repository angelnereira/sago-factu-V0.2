import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { consultarFolios } from '@/lib/hka/methods/consultar-folios';
import { requireAuth } from '@/lib/auth/api-helpers';

// Nota: No usar Edge Runtime porque soap requiere módulos de Node.js
// export const runtime = 'edge';

/**
 * GET /api/folios/tiempo-real?organizationId=xxx
 * Consulta folios en tiempo real desde HKA y muestra estadísticas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Consulta rápida usando Neon Data API para obtener datos de la organización
    const [organization] = await sql`
      SELECT ruc, dv, name
      FROM "organizations"
      WHERE id = ${organizationId} AND "isActive" = true
    `;

    if (!organization) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Consultar folios en tiempo real desde HKA - Solo requiere organizationId
    const foliosResponse = await consultarFolios(
      organizationId,
      { userId: session.user.id }
    );

    // Obtener últimos folios usados desde la base de datos
    const ultimosUsados = await sql`
      SELECT
        "invoiceNumber",
        cufe,
        "createdAt"
      FROM invoices
      WHERE "organizationId" = ${organizationId}
        AND status = 'CERTIFIED'
        AND cufe IS NOT NULL
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      empresa: {
        id: organizationId,
        nombre: organization.name,
        ruc: organization.ruc,
      },
      estadisticas: {
        foliosTotales: foliosResponse.foliosTotales,
        foliosDisponibles: foliosResponse.foliosTotalesDisponibles,
        foliosCicloTotal: foliosResponse.foliosTotalesCiclo,
        foliosCicloUtilizados: foliosResponse.foliosUtilizadosCiclo,
        foliosCicloDisponibles: foliosResponse.foliosDisponibleCiclo,
      },
      licencia: {
        codigo: foliosResponse.licencia,
        vigencia: foliosResponse.fechaLicencia,
        ciclo: foliosResponse.ciclo,
        fechaCiclo: foliosResponse.fechaCiclo,
      },
      ultimosUsados,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error en consulta de folios tiempo real:', error);
    return NextResponse.json(
      { 
        error: 'Error al consultar folios',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

