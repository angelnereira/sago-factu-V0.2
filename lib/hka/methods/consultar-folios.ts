import { getHKAClient } from '../soap/client';
import { ConsultarFoliosParams, ConsultarFoliosResponse, Folio } from '../soap/types';
import { sql } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';
import { executeWithCredentials } from '../credentials-manager';
import { HKACredentials } from '../soap/types';

/**
 * Consulta los folios disponibles de una empresa en HKA
 *
 * ✅ ARQUITECTURA: Usa executeWithCredentials para obtener credenciales de forma segura
 * - Plan Simple: credenciales de HKACredential table
 * - Plan Empresarial: credenciales del secretProvider (env/vault)
 *
 * VENTAJAS SOBRE withHKACredentials():
 * - Las credenciales se pasan explícitamente a la función
 * - No modifica process.env (más seguro en contextos concurrentes)
 * - Mejor para testing (sin side-effects globales)
 */
export async function consultarFolios(
  ruc: string,
  dv: string,
  organizationId: string,
  options: { userId?: string } = {}
): Promise<ConsultarFoliosResponse> {
  try {
    console.log(`📊 Consultando folios para RUC: ${ruc}-${dv}`);
    console.log(`   Organización: ${organizationId}`);
    console.log(`   Desde: ${options.userId ? `usuario ${options.userId}` : 'organización'}`);

    // Usar executeWithCredentials para obtener credenciales de forma segura
    // sin modificar process.env
    return await executeWithCredentials(
      organizationId,
      async (credentials: HKACredentials) => {
        // Parámetros para la consulta
        const params: ConsultarFoliosParams = {
          tokenEmpresa: credentials.tokenEmpresa,
          tokenPassword: credentials.tokenPassword,
          ruc,
          dv,
        };

        // Inicializar cliente SOAP
        const hkaClient = getHKAClient();
        await hkaClient.initialize();

        // Invocar método SOAP con monitoreo
        console.log(`🔐 Credenciales resueltas (${credentials.source}), invocando ConsultarFolios...`);

        const response = await monitorHKACall('ConsultarFolios', async () => {
          return await hkaClient.invokeWithCredentials<any>('ConsultarFolios', params, credentials);
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
      },
      options
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ Error al consultar folios:`, errorMsg);
    throw error;
  }
}

/**
 * Sincroniza los folios de HKA con la base de datos local (usando Neon)
 *
 * ✅ ARQUITECTURA: Usa consultarFolios() que internamente usa executeWithCredentials
 * - Obtiene folios actuales de HKA
 * - Sincroniza estado en tabla folio_pools
 * - Mantiene historial de disponibilidad por organización
 */
export async function sincronizarFolios(
  organizationId: string,
  ruc: string,
  dv: string,
  options: { userId?: string } = {}
): Promise<void> {
  try {
    console.log(`🔄 Iniciando sincronización de folios para organización: ${organizationId}`);

    // Consultar folios en HKA usando credenciales resueltas
    const response = await consultarFolios(ruc, dv, organizationId, options);

    if (!response.folios || response.folios.length === 0) {
      console.log('⚠️  No hay folios para sincronizar en HKA');
      return;
    }

    // Actualizar en base de datos usando Neon Data API
    // Los folios se insertan o actualizan con su estado actual
    let syncedCount = 0;
    for (const folio of response.folios) {
      try {
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
        syncedCount++;
      } catch (folioError) {
        console.warn(`⚠️  Error sincronizando folio ${folio.numeroFolio}:`, folioError);
        // Continuar con otros folios
      }
    }

    console.log(`✅ Sincronizados ${syncedCount} folios para organización ${organizationId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ Error al sincronizar folios: ${errorMsg}`, error);
    throw error;
  }
}

