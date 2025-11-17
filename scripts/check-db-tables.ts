import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get all tables
    const result = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )

    console.log('Tables in database:')
    for (const table of result) {
      console.log(`  - ${table.tablename}`)
    }

    // Check specifically for UserSignatureConfig
    const hasSigConfig = result.some((t) => t.tablename === 'user_signature_configs')
    console.log(`\nuser_signature_configs table exists: ${hasSigConfig}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
