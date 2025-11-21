import { getHKAClient } from '../soap/client';
import { ConsultarFoliosParams, ConsultarFoliosResponse } from '../soap/types';
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

        const response = await monitorHKACall('FoliosRestantes', async () => {
          return await hkaClient.invokeWithCredentials<ConsultarFoliosResponse>('FoliosRestantes', params, credentials);
        });

        console.log(`✅ Folios consultados exitosamente`);
        console.log(`   📜 Licencia: ${response.licencia}`);
        console.log(`   📅 Vigencia: ${response.fechaLicencia}`);
        console.log(`   🔢 Ciclo: ${response.ciclo} (${response.fechaCiclo})`);
        console.log(`   📊 Folios totales: ${response.foliosTotales}`);
        console.log(`   ✅ Folios disponibles: ${response.foliosTotalesDisponibles}`);
        console.log(`   📈 Folios del ciclo: ${response.foliosTotalesCiclo} (${response.foliosUtilizadosCiclo} utilizados, ${response.foliosDisponibleCiclo} disponibles)`);

        return response;
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
 * - Obtiene estadísticas de folios actuales de HKA
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

    if (!response || response.codigo !== '200') {
      console.log('⚠️  No se pudo obtener información de folios de HKA');
      return;
    }

    // Actualizar en base de datos usando Neon Data API
    // Guardamos las estadísticas agregadas de folios
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
          '1',
          ${response.foliosTotales.toString()},
          ${response.foliosTotales},
          ${response.foliosTotalesDisponibles},
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT ("organizationId", "folioStart", "folioEnd")
        DO UPDATE SET
          "totalFolios" = ${response.foliosTotales},
          "availableFolios" = ${response.foliosTotalesDisponibles},
          "isActive" = true,
          "updatedAt" = NOW()
      `;

      console.log(`✅ Sincronizados datos de folios para organización ${organizationId}`);
      console.log(`   Total: ${response.foliosTotales}, Disponibles: ${response.foliosTotalesDisponibles}`);
    } catch (dbError) {
      console.error('⚠️  Error actualizando base de datos:', dbError);
      throw dbError;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`❌ Error al sincronizar folios: ${errorMsg}`, error);
    throw error;
  }
}

