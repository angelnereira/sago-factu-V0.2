/**
 * NextAuth.js v5 Main Configuration
 * 
 * Este archivo combina la configuración de auth.config.ts con
 * opciones adicionales como session strategy y secret.
 * 
 * @see https://authjs.dev/getting-started/migrating-to-v5
 */

import NextAuth from 'next-auth'
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
})
