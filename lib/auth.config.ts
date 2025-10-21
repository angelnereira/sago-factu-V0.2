/**
 * NextAuth.js v5 Configuration (Edge-compatible)
 * 
 * Este archivo contiene la configuración de NextAuth compatible con Edge Runtime.
 * NO debe importar módulos que dependan de Node.js (como Prisma directamente).
 * 
 * @see https://authjs.dev/getting-started/migrating-to-v5
 */

import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { compare } from 'bcryptjs'

// Schema de validación para login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH CONFIG] Iniciando autorización')

        // Validar input
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          console.log('[AUTH CONFIG] Validación fallida')
          return null
        }

        const { email, password } = validatedFields.data

        try {
          // IMPORTANTE: Usar import dinámico para evitar problemas con Edge
          const { prismaServer } = await import('./prisma-server')

          // Buscar usuario
          const user = await prismaServer.user.findUnique({
            where: { email },
            include: {
              organization: true,
            },
          })

          if (!user || !user.password) {
            console.log('[AUTH CONFIG] Usuario no encontrado')
            return null
          }

          // Verificar password con bcryptjs (compatible con Edge)
          const passwordsMatch = await compare(password, user.password)

          if (!passwordsMatch) {
            console.log('[AUTH CONFIG] Password incorrecto')
            return null
          }

          console.log('[AUTH CONFIG] Autorización exitosa:', user.email)

          // Devolver usuario sin password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          }
        } catch (error) {
          console.error('[AUTH CONFIG] Error en autorización:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
      }
      return session
    },
  },
  trustHost: true,
} satisfies NextAuthConfig

