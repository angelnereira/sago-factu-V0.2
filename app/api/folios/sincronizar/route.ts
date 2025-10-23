import { NextRequest, NextResponse } from 'next/server';
import { sincronizarFolios } from '@/lib/hka/methods/consultar-folios';
import { sql } from '@/lib/db';

/**
 * POST /api/folios/sincronizar
 * Sincroniza folios desde HKA a la base de datos local
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Obtener datos de la organización
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

    // Sincronizar folios
    await sincronizarFolios(organizationId, organization.ruc, organization.dv);

    return NextResponse.json({
      success: true,
      message: '✅ Folios sincronizados correctamente',
      empresa: {
        id: organizationId,
        nombre: organization.name,
        ruc: organization.ruc,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error al sincronizar folios:', error);
    return NextResponse.json(
      { 
        error: 'Error al sincronizar folios',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

