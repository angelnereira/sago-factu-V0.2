import { NextResponse } from "next/server";

// Arranque condicional del workflow para no romper si no está instalado
let start: ((fn: any, args: any[]) => Promise<void>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  start = require('workflow/api').start;
} catch (_) {
  start = null;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!start) {
      return NextResponse.json({
        message: 'Workflow no instalado. Endpoint en modo placeholder.',
      });
    }

    // Cargar workflow dinámicamente para tree-shaking y evitar import si no está presente
    const { handleUserSignup } = await import('@/workflows/user-signup');

    await start!(handleUserSignup as any, [email]);

    return NextResponse.json({ message: 'User signup workflow started' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error iniciando workflow' },
      { status: 500 }
    );
  }
}
