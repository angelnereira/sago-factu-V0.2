import { getHKAClient } from '../soap/client';
import { ConsultarFoliosParams, ConsultarFoliosResponse, Folio } from '../soap/types';
import { sql } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';
import { withHKACredentials } from '../credentials-manager';

/**
 * Consulta los folios disponibles de una empresa en HKA
 */
export async function consultarFolios(
  ruc: string,
  dv: string,
  organizationId: string,
  options: { userId?: string } = {}
): Promise<ConsultarFoliosResponse> {
  return withHKACredentials(
    organizationId,
    async () => {
      try {
        const hkaClient = getHKAClient();
        await hkaClient.initialize();
        const credentials = hkaClient.getCredentials();

        // Parámetros para la consulta
        const params: ConsultarFoliosParams = {
          tokenEmpresa: credentials.tokenEmpresa,
          tokenPassword: credentials.tokenPassword,
          ruc,
          dv,
        };

        console.log(`📊 Consultando folios para RUC: ${ruc}-${dv}`);

        // Invocar método SOAP con monitoreo
        const response = await monitorHKACall('ConsultarFolios', async () => {
          return await hkaClient.invoke<any>('ConsultarFolios', params);
        });

        // Procesar respuesta
        const folios: Folio[] = response.folios || [];
        
        // Contar estados
        const totalDisponibles = folios.filter(f => f.estado === 'DISPONIBLE').length;
        const totalAsignados = folios.filter(f => f.estado === 'ASIGNADO').length;
        const totalUtilizados = folios.filter(f => f.estado === 'UTILIZADO').length;

        console.log(`✅ Folios consultados: ${folios.length} total`);
        console.log(`   📦 Disponibles: ${totalDisponibles}`);
        console.log(`   📝 Asignados: ${totalAsignados}`);
        console.log(`   ✔️  Utilizados: ${totalUtilizados}`);

        return {
          dCodRes: response.dCodRes,
          dMsgRes: response.dMsgRes,
          dVerApl: response.dVerApl,
          dFecProc: response.dFecProc,
          folios,
          totalDisponibles,
          totalAsignados,
          totalUtilizados,
        };
      } catch (error) {
        console.error('❌ Error al consultar folios:', error);
        throw error;
      }
    },
    options
  );
}

/**
 * Sincroniza los folios de HKA con la base de datos local (usando Neon)
 */
export async function sincronizarFolios(
  organizationId: string,
  ruc: string,
  dv: string,
  options: { userId?: string } = {}
): Promise<void> {
  try {
    console.log(`🔄 Iniciando sincronización de folios para organización: ${organizationId}`);
    
    // Consultar folios en HKA
    const response = await consultarFolios(ruc, dv, organizationId, options);

    if (!response.folios || response.folios.length === 0) {
      console.log('⚠️  No hay folios para sincronizar');
      return;
    }

    // Actualizar en base de datos usando Neon Data API
    for (const folio of response.folios) {
      await sql`
        INSERT INTO "folio_pools" (
          id,
          "organizationId",
          "folioStart",
          "folioEnd",
          "totalFolios",
          "availableFolios",
          "isActive",
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${organizationId},
          ${folio.numeroFolio},
          ${folio.numeroFolio},
          1,
          ${folio.estado === 'DISPONIBLE' ? 1 : 0},
          ${folio.estado !== 'ANULADO'},
          NOW(),
          NOW()
        )
        ON CONFLICT ("organizationId", "folioStart", "folioEnd")
        DO UPDATE SET
          "availableFolios" = ${folio.estado === 'DISPONIBLE' ? 1 : 0},
          "isActive" = ${folio.estado !== 'ANULADO'},
          "updatedAt" = NOW()
      `;
    }

    console.log(`✅ Sincronizados ${response.folios.length} folios para organización ${organizationId}`);
  } catch (error) {
    console.error('❌ Error al sincronizar folios:', error);
    throw error;
  }
}

