/**
 * Middleware con NextAuth.js v5
 * 
 * Usa el helper auth() de NextAuth para autenticación en middleware.
 * Compatible con Edge Runtime.
 * 
 * @see https://authjs.dev/reference/nextjs/middleware
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/forgot-password',
    '/',
    '/about',
    '/contact',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Permitir acceso a rutas públicas y API de auth
  if (isPublicRoute || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Redirigir a login si no está autenticado
  if (!isLoggedIn) {
    const loginUrl = new URL('/auth/signin', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Usuario autenticado puede acceder
  return NextResponse.next()
})

export const config = {
  // Excluir archivos estáticos
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
