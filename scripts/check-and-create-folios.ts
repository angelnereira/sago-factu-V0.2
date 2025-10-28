import { prismaServer as prisma } from '@/lib/prisma-server';

async function checkAndCreateFolios() {
  try {
    console.log('🔍 Verificando estado de folios...');

    // 1. Verificar organizaciones
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true, ruc: true }
    });

    console.log(`📊 Organizaciones encontradas: ${organizations.length}`);
    organizations.forEach(org => {
      console.log(`   - ${org.name} (${org.ruc}) - ID: ${org.id}`);
    });

    if (organizations.length === 0) {
      console.log('❌ No hay organizaciones. Creando organización de prueba...');
      
      const testOrg = await prisma.organization.create({
        data: {
          name: 'Empresa Demo S.A.',
          ruc: '123456789',
          dv: '01',
          email: 'demo@empresa.com',
          address: 'Calle Principal 123, Ciudad',
          phone: '+507-1234-5678',
          isActive: true,
        }
      });
      
      console.log(`✅ Organización creada: ${testOrg.name} (ID: ${testOrg.id})`);
      organizations.push(testOrg);
    }

    // 2. Verificar pools de folios
    const folioPools = await prisma.folioPool.findMany({
      include: { assignments: true }
    });

    console.log(`📊 Pools de folios encontrados: ${folioPools.length}`);
    folioPools.forEach(pool => {
      console.log(`   - ${pool.batchNumber}: ${pool.totalFolios} folios, ${pool.availableFolios} disponibles`);
      console.log(`     Asignaciones: ${pool.assignments.length}`);
    });

    // 3. Verificar asignaciones de folios
    const folioAssignments = await prisma.folioAssignment.findMany({
      include: { 
        folioPool: true,
        organization: true 
      }
    });

    console.log(`📊 Asignaciones de folios encontradas: ${folioAssignments.length}`);
    folioAssignments.forEach(assignment => {
      const available = assignment.assignedAmount - assignment.consumedAmount;
      console.log(`   - ${assignment.organization.name}: ${assignment.assignedAmount} asignados, ${assignment.consumedAmount} consumidos, ${available} disponibles`);
    });

    // 4. Si no hay folios, crear algunos de prueba
    if (folioPools.length === 0 || folioAssignments.length === 0) {
      console.log('⚠️  No hay folios disponibles. Creando folios de prueba...');
      
      const timestamp = Date.now();
      const quantity = 100;
      const folioStart = `${timestamp}`.padStart(8, '0');
      const folioEnd = `${timestamp + quantity - 1}`.padStart(8, '0');
      
      // Crear pool de folios
      const folioPool = await prisma.folioPool.create({
        data: {
          batchNumber: `DEMO-BATCH-${timestamp}`,
          totalFolios: quantity,
          availableFolios: quantity,
          purchaseAmount: 0, // Folios de prueba gratuitos
          folioStart,
          folioEnd,
          hkaInvoiceNumber: `DEMO-INV-${timestamp}`,
          isActive: true,
        }
      });

      console.log(`✅ Pool de folios creado: ${folioPool.batchNumber}`);

      // Crear asignaciones para cada organización
      for (const org of organizations) {
        const assignment = await prisma.folioAssignment.create({
          data: {
            organizationId: org.id,
            folioPoolId: folioPool.id,
            assignedAmount: Math.floor(quantity / organizations.length) || 50,
            consumedAmount: 0,
            alertThreshold: 20,
            alertSent: false,
            assignedBy: 'system',
            notes: 'Folios de prueba creados automáticamente',
          }
        });

        console.log(`✅ Asignación creada para ${org.name}: ${assignment.assignedAmount} folios`);
      }
    }

    // 5. Verificación final
    const finalAssignments = await prisma.folioAssignment.findMany({
      include: { 
        folioPool: true,
        organization: true 
      }
    });

    console.log('\n📋 Estado final de folios:');
    finalAssignments.forEach(assignment => {
      const available = assignment.assignedAmount - assignment.consumedAmount;
      console.log(`   ✅ ${assignment.organization.name}: ${available} folios disponibles`);
    });

    console.log('\n🎉 Verificación de folios completada exitosamente!');

  } catch (error) {
    console.error('❌ Error verificando folios:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkAndCreateFolios()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

export { checkAndCreateFolios };
