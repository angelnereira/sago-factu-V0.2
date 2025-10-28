/**
 * Script para crear monitores por defecto de HKA
 * Ejecutar una vez para inicializar el sistema
 */

import { prismaServer as prisma } from '@/lib/prisma-server';

const defaultMonitors = [
  {
    name: 'HKA - Enviar Documentos',
    description: 'Monitoreo del método Enviar para facturas, notas de crédito y débito',
    schedule: { frequency: 'hourly' },
    enabled: true,
    notifications: {
      enabled: true,
      recipients: [],
      triggers: ['test_failure', 'error', 'timeout']
    }
  },
  {
    name: 'HKA - Consultar Documentos',
    description: 'Monitoreo del método ConsultaFE para búsqueda por CUFE',
    schedule: { frequency: 'hourly' },
    enabled: true,
    notifications: {
      enabled: true,
      recipients: [],
      triggers: ['test_failure', 'error']
    }
  },
  {
    name: 'HKA - Consultar Folios',
    description: 'Monitoreo del método ConsultarFolios para verificar disponibilidad',
    schedule: { frequency: 'daily' },
    enabled: true,
    notifications: {
      enabled: true,
      recipients: [],
      triggers: ['test_failure', 'error']
    }
  },
  {
    name: 'HKA - Anular Documentos',
    description: 'Monitoreo del método AnulacionFE para cancelaciones',
    schedule: { frequency: 'hourly' },
    enabled: true,
    notifications: {
      enabled: true,
      recipients: [],
      triggers: ['test_failure', 'error']
    }
  },
  {
    name: 'HKA - Notas de Crédito',
    description: 'Monitoreo del método NotaCreditoFE para correcciones',
    schedule: { frequency: 'hourly' },
    enabled: true,
    notifications: {
      enabled: true,
      recipients: [],
      triggers: ['test_failure', 'error']
    }
  },
  {
    name: 'HKA - Notas de Débito',
    description: 'Monitoreo del método NotaDebitoFE para aumentos',
    schedule: { frequency: 'hourly' },
    enabled: true,
    notifications: {
      enabled: true,
      recipients: [],
      triggers: ['test_failure', 'error']
    }
  }
];

export async function createDefaultHKAMonitors() {
  try {
    console.log('🚀 Creando monitores por defecto para HKA...');

    // Buscar un SUPER_ADMIN para asignar como creador
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true }
    });

    if (!superAdmin) {
      throw new Error('No se encontró un SUPER_ADMIN para crear los monitores');
    }

    // Crear cada monitor
    for (const monitorData of defaultMonitors) {
      const existingMonitor = await prisma.monitor.findFirst({
        where: { name: monitorData.name }
      });

      if (!existingMonitor) {
        await prisma.monitor.create({
          data: {
            ...monitorData,
            createdBy: superAdmin.id,
          }
        });
        console.log(`✅ Monitor creado: ${monitorData.name}`);
      } else {
        console.log(`⚠️ Monitor ya existe: ${monitorData.name}`);
      }
    }

    console.log('🎉 Monitores por defecto creados exitosamente');
    return { success: true, message: 'Monitores creados' };

  } catch (error) {
    console.error('❌ Error creando monitores por defecto:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createDefaultHKAMonitors()
    .then(result => {
      console.log('Resultado:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

