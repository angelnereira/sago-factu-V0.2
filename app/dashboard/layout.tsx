import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { prismaServer as prisma } from "@/lib/prisma-server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/")
  }

  // Redirigir usuarios del Plan Simple al Home Simple
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: { select: { plan: true } } }
  })

  if (user?.organization?.plan === 'SIMPLE') {
    redirect('/simple')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <DashboardHeader user={session.user} />
      
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar userRole={session.user.role} />
        
        {/* Main Content */}
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
