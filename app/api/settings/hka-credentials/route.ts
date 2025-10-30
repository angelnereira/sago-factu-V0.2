import { NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { encryptToken } from '@/lib/utils/encryption';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const credentialsSchema = z.object({
  tokenUser: z.string().min(1, 'Token de usuario es requerido'),
  tokenPassword: z.string().min(1, 'Token password es requerido'),
  environment: z.enum(['demo', 'prod']),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organization) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 });
    }

    // Solo Plan Simple puede configurar credenciales
    if (user.organization.plan !== 'SIMPLE') {
      return NextResponse.json(
        { error: 'Solo usuarios Plan Simple pueden configurar credenciales HKA' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = credentialsSchema.parse(body);

    // Actualizar organización con credenciales encriptadas
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        hkaTokenUser: data.tokenUser,
        hkaTokenPassword: encryptToken(data.tokenPassword),
        hkaEnvironment: data.environment,
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Credenciales HKA guardadas correctamente'
    });

  } catch (error) {
    console.error('[API] Error guardando credenciales HKA:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organization) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 });
    }

    if (user.organization.plan !== 'SIMPLE') {
      return NextResponse.json(
        { error: 'Solo usuarios Plan Simple pueden ver credenciales HKA' },
        { status: 403 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        hkaTokenUser: true,
        hkaEnvironment: true,
        // NO retornar hkaTokenPassword por seguridad
      }
    });

    return NextResponse.json({
      configured: !!org?.hkaTokenUser,
      tokenUser: org?.hkaTokenUser || null,
      environment: org?.hkaEnvironment || 'demo',
    });

  } catch (error) {
    console.error('[API] Error obteniendo credenciales HKA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

