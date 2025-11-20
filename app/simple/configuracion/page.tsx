import { auth } from '@/lib/auth';
import { prismaServer as prisma } from '@/lib/prisma-server';
import HKACredentialsForm from '@/components/simple/hka-credentials-form';

export default async function ConfiguracionPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true }
  });

  if (user?.organization?.plan !== 'SIMPLE') {
    return null;
  }

  if (!user?.organization) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configuración de The Factory HKA
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configura tus credenciales para conectar con The Factory HKA
          </p>
        </div>

        {/* Alert de instrucciones */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                ¿Cómo obtener mis credenciales?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Para usar SAGO-FACTU con el Plan Simple, necesitas tener una cuenta en The Factory HKA
                y comprar folios directamente. Luego, obtén tus credenciales de acceso (Token Usuario y Token Password)
                y configúralas aquí.
              </p>
              <a
                href="https://demo.thefactoryhka.com.pa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ir a The Factory HKA
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Credenciales de Acceso
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Ingresa tus credenciales de The Factory HKA. Esta información se almacena de forma segura y encriptada.
          </p>
          <HKACredentialsForm />
        </div>
      </section>
    </div>
  );
}

