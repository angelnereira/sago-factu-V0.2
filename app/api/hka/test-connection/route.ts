import { NextResponse } from 'next/server';
import { getHKAClient } from '@/lib/hka/soap/client';

/**
 * GET /api/hka/test-connection
 * Prueba la conexión con el servicio SOAP de HKA
 */
export async function GET() {
  try {
    const client = getHKAClient();
    await client.initialize();
    
    const credentials = client.getCredentials();
    
    return NextResponse.json({
      success: true,
      message: '✅ Conexión a HKA exitosa',
      environment: process.env.HKA_ENVIRONMENT || 'demo',
      credentials: {
        usuario: credentials.usuario,
        tokenEmpresa: credentials.tokenEmpresa.substring(0, 10) + '...',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error al probar conexión HKA:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

