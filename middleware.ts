import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/api/auth',
    '/',
    '/about',
    '/contact'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If user is not logged in and trying to access protected route
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', nextUrl))
  }

  // If user is logged in but trying to access auth pages, redirect to dashboard
  if (isLoggedIn && (nextUrl.pathname.startsWith('/auth/'))) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Add organization context to headers for multi-tenancy
  if (req.auth?.user?.organizationId) {
    const response = NextResponse.next()
    response.headers.set('x-organization-id', req.auth.user.organizationId)
    return response
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
