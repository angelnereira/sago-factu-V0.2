/**
 * Configuración centralizada de URLs y variables de entorno
 */

// URL base de la aplicación
// En producción, usa la URL de Vercel
// En desarrollo, usa localhost
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://sago-factu.vercel.app'
    : 'http://localhost:3000')

// URL de la landing page para redirecciones después de logout
export const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'https://sago-factu.vercel.app/'

// Otras configuraciones
export const config = {
  app: {
    name: 'SAGO-FACTU',
    description: 'Sistema de Facturación Electrónica para Panamá',
    url: APP_URL,
    landingUrl: LANDING_URL,
  },
  urls: {
    home: '/',
    signIn: '/',
    signOut: LANDING_URL,
    dashboard: '/dashboard',
  },
} as const

