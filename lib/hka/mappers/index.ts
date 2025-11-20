/**
 * HKA Mappers - Entry Point
 * Re-exports de mappers bidireccionales
 */

export { DomainToHkaMapper } from './domain-to-hka.mapper';
export { HkaToDomainMapper } from './hka-to-domain.mapper';

export type {
  EmissionResult,
  DocumentStatus,
  CancellationResult,
  DownloadResult,
  EmailStatus,
  FolioBalance,
  RucValidation,
} from './hka-to-domain.mapper';
