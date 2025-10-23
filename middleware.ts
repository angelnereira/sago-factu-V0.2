/**
 * Middleware Optimizado para Vercel Edge (< 1MB)
 * 
 * Este middleware NO usa NextAuth directamente para mantener el tamaño bajo.
 * En su lugar:
 * 1. Permite rutas públicas sin verificación
 * 2. Deja que Server Components y Server Actions manejen auth
 * 3. Solo hace routing básico
 * 
 * La autenticación real se maneja en:
 * - Server Components con auth() de NextAuth
 * - Server Actions con auth() de NextAuth
 * - API routes con getServerSession()
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que NO requieren autenticación
  const publicRoutes = [
    '/',
    '/auth/signup',
    '/auth/error',
    '/auth/forgot-password',
    '/about',
    '/contact',
  ]

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Permitir acceso a:
  // - Rutas públicas
  // - API routes (NextAuth maneja /api/auth/*)
  // - Archivos estáticos (ya excluidos en matcher)
  if (isPublicRoute || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Para rutas protegidas:
  // Verificar si hay cookie de sesión de NextAuth
  const sessionToken = 
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token')

  // Si NO hay session token, redirigir a login
  if (!sessionToken) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay session token, permitir acceso
  // La validación real del token se hace en el Server Component
  return NextResponse.next()
}

export const config = {
  // Excluir archivos estáticos y API de NextAuth
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
