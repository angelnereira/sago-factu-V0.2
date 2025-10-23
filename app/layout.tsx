import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SAGO-FACTU - Plataforma de Facturación Electrónica",
  description: "Sistema Multi-Tenant de Facturación Electrónica para Panamá",
  icons: {
    icon: [
      {
        url: '/sago-factu-logo.png',
        sizes: 'any',
      }
    ],
    apple: [
      {
        url: '/sago-factu-logo.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}