import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';

/**
 * Helper para validar autenticación en endpoints API
 */
export async function requireAuth(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

/**
 * Helper para validar acceso a una factura
 */
export async function requireInvoiceAccess(
  invoiceId: string,
  userId: string,
  userRole: string
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { 
      organizationId: true,
      createdBy: true,
      status: true,
    },
  });

  if (!invoice) {
    throw new Error('NOT_FOUND');
  }

  // SUPER_ADMIN puede acceder a todo
  if (userRole === 'SUPER_ADMIN') {
    return invoice;
  }

  // Verificar que pertenece a la misma organización
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (user?.organizationId !== invoice.organizationId) {
    throw new Error('FORBIDDEN');
  }

  return invoice;
}

/**
 * Helper para manejar errores de API
 */
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  if (error.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  if (error.message === 'NOT_FOUND') {
    return NextResponse.json(
      { error: 'Recurso no encontrado' },
      { status: 404 }
    );
  }

  if (error.message === 'FORBIDDEN') {
    return NextResponse.json(
      { error: 'No tiene acceso a este recurso' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
    },
    { status: 500 }
  );
}

