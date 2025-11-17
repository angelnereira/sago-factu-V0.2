'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="sago-factu-theme"
    >
      {children}
    </ThemeProvider>
  )
}
