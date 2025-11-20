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
        console.log('═'.repeat(60))
        console.log('[AUTH CONFIG] 🔐 INICIANDO AUTORIZACIÓN')
        console.log('═'.repeat(60))
        console.log('[AUTH CONFIG] Credentials recibidas:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          passwordLength: credentials?.password?.toString().length
        })

        // Validar input
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          console.log('[AUTH CONFIG] ❌ Validación fallida')
          console.log('[AUTH CONFIG] Errores:', validatedFields.error.issues)
          return null
        }

        const { email, password } = validatedFields.data
        console.log('[AUTH CONFIG] ✅ Validación exitosa')
        console.log('[AUTH CONFIG] Email:', email)
        console.log('[AUTH CONFIG] Password length:', password.length)

        try {
          // IMPORTANTE: Usar import dinámico para evitar problemas con Edge
          console.log('[AUTH CONFIG] Importando prismaServer...')
          const { prismaServer } = await import('./prisma-server')
          console.log('[AUTH CONFIG] ✅ prismaServer importado')

          // Buscar usuario
          console.log('[AUTH CONFIG] Buscando usuario:', email)
          const user = await prismaServer.user.findUnique({
            where: { email },
            include: {
              organization: true,
            },
          })

          if (!user) {
            console.log('[AUTH CONFIG] ❌ Usuario NO encontrado')
            return null
          }

          console.log('[AUTH CONFIG] ✅ Usuario encontrado:', {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            hasPassword: !!user.password
          })

          if (!user.password) {
            console.log('[AUTH CONFIG] ❌ Usuario sin password')
            return null
          }

          // Verificar password con bcryptjs (compatible con Edge)
          console.log('[AUTH CONFIG] Comparando passwords...')
          const startTime = Date.now()
          const passwordsMatch = await compare(password, user.password)
          const compareTime = Date.now() - startTime
          
          console.log('[AUTH CONFIG] Comparación completada en', compareTime, 'ms')
          console.log('[AUTH CONFIG] Resultado:', passwordsMatch ? '✅ CORRECTO' : '❌ INCORRECTO')

          if (!passwordsMatch) {
            console.log('[AUTH CONFIG] ❌ Password incorrecto')
            return null
          }

          console.log('[AUTH CONFIG] ✅ Autorización exitosa:', user.email)
          console.log('═'.repeat(60))

          // Devolver usuario sin password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          }
        } catch (error) {
          console.error('[AUTH CONFIG] ❌ Error en autorización:', error)
          console.error('[AUTH CONFIG] Stack:', error instanceof Error ? error.stack : 'No stack')
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
    signOut: 'https://sago-factu.vercel.app/',
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

