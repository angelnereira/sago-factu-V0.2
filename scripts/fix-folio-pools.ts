import { prismaServer as prisma } from '@/lib/prisma-server';

async function fixFolioPools() {
  try {
    console.log('🔧 Corrigiendo pools de folios...');

    // 1. Obtener todos los pools que no tienen folioStart/folioEnd
    const poolsToFix = await prisma.folioPool.findMany({
      where: {
        OR: [
          { folioStart: null },
          { folioEnd: null }
        ]
      }
    });

    console.log(`📊 Pools a corregir: ${poolsToFix.length}`);

    for (const pool of poolsToFix) {
      console.log(`\n🔧 Corrigiendo pool: ${pool.batchNumber}`);
      
      // Generar folioStart y folioEnd basado en el batchNumber
      const timestamp = Date.now();
      const folioStart = `${timestamp}`.padStart(8, '0');
      const folioEnd = `${timestamp + pool.totalFolios - 1}`.padStart(8, '0');

      await prisma.folioPool.update({
        where: { id: pool.id },
        data: {
          folioStart,
          folioEnd,
          hkaInvoiceNumber: pool.hkaInvoiceNumber || `HKA-INV-${timestamp}`,
        }
      });

      console.log(`   ✅ Rango de folios: ${folioStart} - ${folioEnd}`);
    }

    // 2. Verificar que todos los pools estén correctos
    const allPools = await prisma.folioPool.findMany({
      include: { assignments: true }
    });

    console.log('\n📋 Estado final de todos los pools:');
    allPools.forEach(pool => {
      const totalAssigned = pool.assignments.reduce((sum, a) => sum + a.assignedAmount, 0);
      const totalConsumed = pool.assignments.reduce((sum, a) => sum + a.consumedAmount, 0);
      
      console.log(`   📦 ${pool.batchNumber}:`);
      console.log(`      Rango: ${pool.folioStart} - ${pool.folioEnd}`);
      console.log(`      Total: ${pool.totalFolios}, Asignados: ${totalAssigned}, Consumidos: ${totalConsumed}`);
    });

    console.log('\n🎉 Corrección de pools completada exitosamente!');

  } catch (error) {
    console.error('❌ Error corrigiendo pools:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixFolioPools()
    .then(() => {
      console.log('✅ Script de corrección completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script de corrección:', error);
      process.exit(1);
    });
}

export { fixFolioPools };
