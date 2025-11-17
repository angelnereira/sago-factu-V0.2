import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function reset() {
  try {
    console.log('🔄 Resetting all user configurations...\n')

    // Delete all HKA credentials
    const delCreds = await prisma.hKACredential.deleteMany({})
    console.log(`✓ Deleted ${delCreds.count} HKA credentials`)

    // Delete all digital certificates
    const delSigs = await prisma.digitalCertificate.deleteMany({})
    console.log(`✓ Deleted ${delSigs.count} digital certificates`)

    // Reset organization HKA data
    const updOrgs = await prisma.organization.updateMany({
      data: {
        hkaTokenUser: null,
        hkaTokenPassword: null,
        hkaEnvironment: 'DEMO',
      },
    })
    console.log(`✓ Reset ${updOrgs.count} organization HKA configurations`)

    // Reset user company data
    const updUsers = await prisma.user.updateMany({
      data: {
        ruc: null,
        dv: null,
        razonSocial: null,
        nombreComercial: null,
        email: null,
        telefono: null,
        direccion: null,
      },
    })
    console.log(`✓ Reset ${updUsers.count} user company data`)

    // Reset folio pools
    const delFolios = await prisma.folioPools.deleteMany({})
    console.log(`✓ Deleted ${delFolios.count} folio pools`)

    // Reset folio ranges
    const delRanges = await prisma.folioRange.deleteMany({})
    console.log(`✓ Deleted ${delRanges.count} folio ranges`)

    console.log('\n✅ All user configurations have been reset to initial state!')
    console.log('\n📋 Summary:')
    console.log('  - Users must reconfigure their HKA credentials')
    console.log('  - Digital certificates have been cleared')
    console.log('  - Folio data has been reset')
    console.log('  - Company data must be re-entered')
    console.log('\n⚠️  Note: Invoices are NOT deleted - they remain for audit purposes')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

reset()
