import { NextResponse } from 'next/server';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { encryptToken } from '@/lib/utils/encryption';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const credentialsSchema = z.object({
  tokenUser: z.string().min(1, 'Token de usuario es requerido'),
  tokenPassword: z.string().min(1, 'Token password es requerido'),
  environment: z.enum(['demo', 'prod']),
  // Datos del contribuyente
  ruc: z.string().optional(),
  dv: z.string().optional(),
  razonSocial: z.string().optional(),
  nombreComercial: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
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

    const body = await request.json();
    const data = credentialsSchema.parse(body);

    console.log('[API] Received credentials request:', {
      tokenUser: data.tokenUser.substring(0, 5) + '***',
      environment: data.environment,
    });

    const environmentEnum = data.environment === 'prod' ? 'PROD' : 'DEMO';
    console.log('[API] About to call encryptToken...');
    const encryptedPassword = encryptToken(data.tokenPassword);
    console.log('[API] encryptToken succeeded');

    await prisma.$transaction(async (tx) => {
      // Marcar otras credenciales como inactivas
      await tx.hKACredential.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });

      await tx.hKACredential.upsert({
        where: {
          userId_environment: {
            userId: user.id,
            environment: environmentEnum,
          },
        },
        update: {
          tokenUser: data.tokenUser,
          tokenPassword: encryptedPassword,
          isActive: true,
        },
        create: {
          userId: user.id,
          environment: environmentEnum,
          tokenUser: data.tokenUser,
          tokenPassword: encryptedPassword,
          isActive: true,
        },
      });

      // Mantener datos del contribuyente actualizados a nivel de organización
      await tx.organization.update({
        where: { id: user.organizationId },
        data: {
          hkaEnvironment: data.environment,
          ...(data.ruc && { ruc: data.ruc }),
          ...(data.dv && { dv: data.dv }),
          ...(data.razonSocial && { name: data.razonSocial }),
          ...(data.nombreComercial && { tradeName: data.nombreComercial }),
          ...(data.email && { email: data.email }),
          ...(data.telefono && { phone: data.telefono }),
          ...(data.direccion && { address: data.direccion }),
        },
      });
    });

    return NextResponse.json({ 
      success: true,
      message: 'Credenciales HKA guardadas correctamente',
      environment: data.environment,
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

    const [org, userCredentials] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: {
          hkaTokenUser: true,
          hkaEnvironment: true,
          ruc: true,
          dv: true,
          name: true,
          tradeName: true,
          email: true,
          phone: true,
          address: true,
        },
      }),
      prisma.hKACredential.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const environmentMap: Record<'demo' | 'prod', { tokenUser: string | null; isActive: boolean; lastUpdated: string | null }> = {
      demo: { tokenUser: null, isActive: false, lastUpdated: null },
      prod: { tokenUser: null, isActive: false, lastUpdated: null },
    };

    let activeEnvironment: 'demo' | 'prod' | null = null;

    userCredentials.forEach((credential) => {
      const envKey = credential.environment === 'PROD' ? 'prod' : 'demo';
      environmentMap[envKey] = {
        tokenUser: credential.tokenUser,
        isActive: credential.isActive,
        lastUpdated: credential.updatedAt.toISOString(),
      };

      if (credential.isActive && !activeEnvironment) {
        activeEnvironment = envKey;
      }
    });

    if (!activeEnvironment) {
      activeEnvironment = (org?.hkaEnvironment || 'demo').toLowerCase() === 'prod' ? 'prod' : 'demo';
    }

    const fallback = org?.hkaTokenUser
      ? {
          tokenUser: org.hkaTokenUser,
          environment: (org.hkaEnvironment || 'demo').toLowerCase() === 'prod' ? 'prod' : 'demo',
        }
      : null;

    const activeTokenUser =
      environmentMap[activeEnvironment].tokenUser ??
      fallback?.tokenUser ??
      null;

    const configured =
      Object.values(environmentMap).some((env) => env.tokenUser) ||
      !!fallback;

    return NextResponse.json({
      configured,
      tokenUser: activeTokenUser,
      environment: activeEnvironment,
      environments: environmentMap,
      fallback,
      ruc: org?.ruc || null,
      dv: org?.dv || null,
      razonSocial: org?.name || null,
      nombreComercial: org?.tradeName || null,
      email: org?.email || null,
      telefono: org?.phone || null,
      direccion: org?.address || null,
    });

  } catch (error) {
    console.error('[API] Error obteniendo credenciales HKA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

