import { auth } from '@/lib/auth'

export type AppRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'USER'

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return session
}

export function hasRole(role: string | undefined, allowed: AppRole[]): boolean {
  if (!role) return false
  return allowed.includes(role as AppRole)
}

export function assertRole(role: string | undefined, allowed: AppRole[]) {
  if (!hasRole(role, allowed)) {
    throw new Response('Forbidden', { status: 403 })
  }
}

