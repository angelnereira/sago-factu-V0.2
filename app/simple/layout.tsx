import { redirect } from 'next/navigation';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { auth } from '@/lib/auth';

export default async function SimpleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true }
  });

  // Solo usuarios Plan Simple pueden acceder
  if (user?.organization?.plan !== 'SIMPLE') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              SAGO-FACTU
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plan Simple</p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {user?.name || user?.email}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          SAGO-FACTU © 2024 - Plan Simple
        </div>
      </footer>
    </div>
  );
}

