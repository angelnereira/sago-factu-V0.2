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

    // Solo Plan Simple puede configurar credenciales
    if (user.organization.plan !== 'SIMPLE') {
      return NextResponse.json(
        { error: 'Solo usuarios Plan Simple pueden configurar credenciales HKA' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = credentialsSchema.parse(body);

    // Actualizar organización con credenciales encriptadas y datos del contribuyente
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        hkaTokenUser: data.tokenUser,
        hkaTokenPassword: encryptToken(data.tokenPassword),
        hkaEnvironment: data.environment,
        // Actualizar datos del contribuyente si se proporcionan
        ...(data.ruc && { ruc: data.ruc }),
        ...(data.dv && { dv: data.dv }),
        ...(data.razonSocial && { name: data.razonSocial }),
        ...(data.nombreComercial && { tradeName: data.nombreComercial }),
        ...(data.email && { email: data.email }),
        ...(data.telefono && { phone: data.telefono }),
        ...(data.direccion && { address: data.direccion }),
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
        // Datos del contribuyente
        ruc: true,
        dv: true,
        name: true,
        tradeName: true,
        email: true,
        phone: true,
        address: true,
        // NO retornar hkaTokenPassword por seguridad
      }
    });

    return NextResponse.json({
      configured: !!org?.hkaTokenUser,
      tokenUser: org?.hkaTokenUser || null,
      environment: org?.hkaEnvironment || 'demo',
      // Datos del contribuyente
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

