import { NextRequest, NextResponse } from 'next/server';
import { sincronizarFolios } from '@/lib/hka/methods/consultar-folios';
import { sql } from '@/lib/db';

/**
 * POST /api/folios/sincronizar
 * Sincroniza folios desde HKA a la base de datos local
 */
export async function POST(request: NextRequest) {
  try {
    // Permitir body vacío o con organizationId
    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (error) {
      // Body vacío o inválido, continuar con {}
      console.log('Body vacío o inválido, continuando con valores por defecto');
    }
    
    const { organizationId } = body;

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error al sincronizar folios:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      organizationId,
    });

    // Retornar error con más contexto
    return NextResponse.json(
      {
        error: 'Error al sincronizar folios',
        details: errorMessage,
        code: errorMessage.includes('credenciales') ? 'CREDENTIALS_NOT_CONFIGURED' : 'SYNC_ERROR',
      },
      { status: 500 }
    );
  }
}

