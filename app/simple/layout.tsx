import { redirect } from 'next/navigation';
import { prismaServer as prisma } from '@/lib/prisma-server';
import { auth } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header unificado */}
      <DashboardHeader user={{ name: user?.name, email: user?.email, role: 'SIMPLE_USER' }} />

      <div className="flex">
        {/* Sidebar unificado (modo simple muestra menú reducido) */}
        <DashboardSidebar userRole={'SIMPLE_USER'} />

        {/* Contenido */}
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

