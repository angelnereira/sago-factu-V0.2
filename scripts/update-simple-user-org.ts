#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Actualizando organización del usuario simple de prueba...')

  // Buscar usuario simple de pruebas
  const user = await prisma.user.findUnique({
    where: { email: 'simple@test.com' },
    select: { id: true, organizationId: true },
  })

  if (!user?.organizationId) {
    throw new Error('Usuario simple de pruebas no encontrado o sin organización')
  }

  // Actualizar datos de la organización con la información proporcionada por HKA
  const updated = await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      name: 'SAGO PANAMA, S.A.',
      tradeName: 'UBICSYS',
      ruc: '155738031-2-2023',
      dv: '20',
      email: 'soporte@ubicsys.com',
      phone: '6410-5658',
      address: 'CALLE SANTA ISABEL, EDIFICIO: HOTEL MERYLAND',
      province: 'Colon',
      district: 'Colon',
      corregimiento: 'Barrio Norte',
      // Opcional: guardar datos extra en metadata
      metadata: {
        taxpayerType: 'Persona Juridica',
        registrationDate: '2025-09-08',
        lastModified: '2025-09-08',
        certificate: {
          ruc: '155738031-2-2023',
          dv: '20',
          validTo: '2027-09-08T16:41:13',
        },
        country: 'Panamá',
        secondaryPhone: null,
        logo: 'UBICSYS',
      },
    },
  })

  console.log('✅ Organización actualizada:')
  console.log({ id: updated.id, name: updated.name, ruc: updated.ruc, email: updated.email })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



