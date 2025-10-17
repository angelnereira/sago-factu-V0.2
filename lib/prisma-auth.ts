import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prismaAuth: PrismaClient | undefined
}

export const prismaAuth = globalForPrisma.prismaAuth ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaAuth = prismaAuth
