import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withHKACredentials } from '@/lib/hka/credentials-manager';
import { getHKAClient } from '@/lib/hka/soap/client';
import { prismaServer as prisma } from '@/lib/prisma-server';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 });
    }

    // Probar conexión usando withHKACredentials
    const result = await withHKACredentials(
      user.organizationId,
      async () => {
        // Intentar inicializar cliente HKA con las credenciales
        const client = getHKAClient();
        await client.initialize();
        
        return { success: true };
      },
      { userId: user.id }
    );

    return NextResponse.json({
      success: true,
      message: 'Conexión con HKA configurada correctamente',
      environment: user.organization.hkaEnvironment || 'demo',
    });

  } catch (error) {
    console.error('[API] Error probando conexión HKA:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

