import { NextRequest, NextResponse } from 'next/server';

import { CertificateManager } from '@/lib/certificates/manager';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('certificate');
    const password = formData.get('password');
    const activateFlag = formData.get('activate');
    const organizationId = (formData.get('organizationId') as string | null) ?? session.user.organizationId;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo de certificado requerido' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Contraseña del certificado requerida' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organización no especificada' }, { status: 400 });
    }

    if (!file.name.match(/\.(pfx|p12)$/i)) {
      return NextResponse.json({ error: 'Formato de archivo inválido. Use un archivo .pfx o .p12' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return NextResponse.json({ error: 'Usuario sin organización' }, { status: 400 });
    }

    if (user.organization.id !== organizationId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado para administrar certificados de esta organización' }, { status: 403 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const activate =
      typeof activateFlag === 'string'
        ? activateFlag.toLowerCase() !== 'false'
        : true;

    const manager = new CertificateManager();
    const certificate = await manager.uploadCertificate(
      organizationId,
      buffer,
      password,
      session.user.id,
      { activate },
    );

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        subject: certificate.subject,
        issuer: certificate.issuer,
        validFrom: certificate.validFrom,
        validUntil: certificate.validUntil,
        ruc: certificate.ruc,
        dv: certificate.dv,
        isActive: certificate.isActive,
      },
    });
  } catch (error) {
    console.error('[API] Error subiendo certificado:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar el certificado' },
      { status: 500 },
    );
  }
}

