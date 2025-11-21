/**
 * HKA FoliosRestantes Types
 * Actualizado según respuesta real de HKA FoliosRestantes
 */

import { HkaBaseResponse } from './common.types';

export interface FoliosRestantesResponse extends HkaBaseResponse {
  // Información de licencia
  licencia?: string;           // Código de licencia
  fechaLicencia?: string;      // Vigencia de licencia (formato: YYYY-MM-DD / YYYY-MM-DD)

  // Información de ciclo
  ciclo?: string;              // Número de ciclo actual
  fechaCiclo?: string;         // Periodo del ciclo (formato: YYYY-MM-DD / YYYY-MM-DD)

  // Folios del ciclo actual
  foliosTotalesCiclo?: number;      // Total de folios asignados en el ciclo
  foliosUtilizadosCiclo?: number;   // Folios utilizados en el ciclo
  foliosDisponibleCiclo?: number;   // Folios disponibles en el ciclo

  // Folios totales (históricos)
  foliosTotales?: number;                // Total de folios asignados históricamente
  foliosTotalesDisponibles?: number;     // Total de folios disponibles

  // Campos legacy (mantener por compatibilidad)
  foliosDisponibles?: number;       // Alias de foliosTotalesDisponibles
  foliosUsados?: number;            // Alias de foliosUtilizadosCiclo
  ultimoFolioUsado?: string;        // Último folio utilizado
  proximoFolio?: string;            // Próximo folio a utilizar
}
