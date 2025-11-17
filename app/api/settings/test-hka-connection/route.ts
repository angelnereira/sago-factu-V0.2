import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withHKACredentials } from '@/lib/hka/credentials-manager';
import { getHKAClient, resetHKAClient } from '@/lib/hka/soap/client';
import { prismaServer as prisma } from '@/lib/prisma-server';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Usuario sin organización' },
        { status: 400 }
      );
    }

    const environment = user.organization.hkaEnvironment || 'demo';

    // ✅ Validar que las variables de entorno WSDL estén configuradas
    const soapUrlVar = environment === 'demo' ? 'HKA_DEMO_SOAP_URL' : 'HKA_PROD_SOAP_URL';
    const soapUrl = environment === 'demo'
      ? process.env.HKA_DEMO_SOAP_URL
      : process.env.HKA_PROD_SOAP_URL;

    if (!soapUrl) {
      console.error(`[API] Missing environment variable: ${soapUrlVar}`);
      console.log('[API] Available environment variables:', {
        HKA_DEMO_SOAP_URL: process.env.HKA_DEMO_SOAP_URL ? '✓ configured' : '✗ missing',
        HKA_PROD_SOAP_URL: process.env.HKA_PROD_SOAP_URL ? '✓ configured' : '✗ missing',
      });
      return NextResponse.json(
        {
          success: false,
          error: `Configuración incompleta del servidor HKA`,
          details: `La variable de entorno '${soapUrlVar}' no está configurada en el servidor. ` +
            `Por favor, contacta al administrador del sistema para configurar las credenciales de HKA. ` +
            `Requiere: HKA_${environment.toUpperCase()}_SOAP_URL`,
          environment,
          missingVariable: soapUrlVar,
        },
        { status: 503 } // Service Unavailable
      );
    }

    console.log(`[API] Testing HKA connection for environment: ${environment}`);

    // Reset cliente para asegurar configuración fresca
    resetHKAClient();

    // Probar conexión usando withHKACredentials
    await withHKACredentials(
      user.organizationId,
      async () => {
        try {
          // Intentar inicializar cliente HKA con las credenciales
          const client = getHKAClient();
          await client.initialize();
          console.log(`[API] ✅ HKA client initialized successfully for ${environment}`);
        } catch (initError) {
          console.error(`[API] ❌ HKA client initialization failed:`, initError);
          throw initError;
        }
      },
      { userId: user.id }
    );

    return NextResponse.json({
      success: true,
      message: 'Conexión con HKA configurada correctamente',
      environment,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Error probando conexión HKA:', error);

    // Analizar el tipo de error para proporcionar mensajes más útiles
    let errorMessage = 'Error desconocido al conectar con HKA';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('ENOENT') || error.message.includes('undefined')) {
        errorDetails = 'Error: La URL del servicio WSDL no está correctamente configurada. ' +
          'Las variables de entorno HKA_DEMO_SOAP_URL y HKA_PROD_SOAP_URL deben estar configuradas.';
      } else if (error.message.includes('CONFIGURATION ERROR')) {
        errorDetails = 'Error: Falta configurar las variables de entorno para HKA. ' +
          'Por favor, verifica que HKA_DEMO_SOAP_URL y HKA_PROD_SOAP_URL estén configuradas en el servidor.';
      } else if (error.message.includes('INVALID WSDL')) {
        errorDetails = 'Error: La URL del servicio WSDL no es válida. ' +
          'Por favor, verifica la configuración de las variables de entorno.';
      } else if (error.message.includes('getaddrinfo')) {
        errorDetails = 'Error: No se puede conectar al servidor HKA. ' +
          'Verifica que: 1) La URL es correcta, 2) El servidor HKA está disponible, 3) Tienes conexión a internet.';
      } else if (error.message.includes('credentials') || error.message.includes('token')) {
        errorDetails = 'Error: Las credenciales de HKA no son válidas. ' +
          'Por favor, verifica que hayas configurado correctamente tu Token de Usuario y Token de Contraseña.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

