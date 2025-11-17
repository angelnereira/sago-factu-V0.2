import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get columns for UserSignatureConfig
    const columns = await prisma.$queryRawUnsafe<
      Array<{ column_name: string; data_type: string; is_nullable: string }>
    >(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'UserSignatureConfig'
       ORDER BY ordinal_position`
    )

    console.log('Columns in UserSignatureConfig table:')
    for (const col of columns) {
      console.log(`  ${col.column_name} | ${col.data_type} | nullable=${col.is_nullable}`)
    }

    // Try to query the table
    console.log('\nAttempting to query UserSignatureConfig...')
    const records = await prisma.$queryRawUnsafe(
      `SELECT * FROM "UserSignatureConfig" LIMIT 5`
    )
    console.log(`Found ${(records as any[]).length} records`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
