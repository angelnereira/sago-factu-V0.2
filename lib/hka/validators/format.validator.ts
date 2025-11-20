/**
 * HKA Format Validator
 * Valida formatos específicos de HKA (N, AN, decimales, RUC, ISO8601)
 */

import { HkaValidationError } from '../types';

export class FormatValidator {
  /**
   * Valida formato numérico N{length}
   * Ej: N10 = exactamente 10 dígitos
   */
  static validateNumeric(value: string, length: number, fieldName: string): void {
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length !== length) {
      throw new HkaValidationError(
        fieldName,
        `Must be exactly ${length} digits, got ${digitsOnly.length}`
      );
    }
  }

  /**
   * Valida formato numérico variable N..{maxLength}
   * Ej: N..10 = hasta 10 dígitos
   */
  static validateNumericVariable(value: string, maxLength: number, fieldName: string): void {
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length > maxLength) {
      throw new HkaValidationError(
        fieldName,
        `Must be at most ${maxLength} digits, got ${digitsOnly.length}`
      );
    }

    if (digitsOnly.length === 0) {
      throw new HkaValidationError(fieldName, 'Cannot be empty');
    }
  }

  /**
   * Valida formato alfanumérico AN{length}
   */
  static validateAlphanumeric(value: string, maxLength: number, fieldName: string): void {
    if (value.length > maxLength) {
      throw new HkaValidationError(
        fieldName,
        `Must be at most ${maxLength} characters, got ${value.length}`
      );
    }

    if (value.length === 0) {
      throw new HkaValidationError(fieldName, 'Cannot be empty');
    }
  }

  /**
   * Valida formato decimal N..{maxLength}/{maxDecimals}
   * Ej: N..8/2 = hasta 8 caracteres totales, 2 decimales
   */
  static validateDecimal(
    value: string,
    maxLength: number,
    maxDecimals: number,
    fieldName: string
  ): void {
    const num = parseFloat(value);

    if (isNaN(num)) {
      throw new HkaValidationError(fieldName, `Invalid decimal: ${value}`);
    }

    // Validar longitud total (sin punto decimal)
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length > maxLength) {
      throw new HkaValidationError(
        fieldName,
        `Total digits must be at most ${maxLength}, got ${digits.length}`
      );
    }

    // Validar decimales
    const parts = value.split('.');
    if (parts.length > 1 && parts[1].length > maxDecimals) {
      throw new HkaValidationError(
        fieldName,
        `Decimals must be at most ${maxDecimals}, got ${parts[1].length}`
      );
    }

    // Validar formato (punto decimal, no coma)
    if (value.includes(',')) {
      throw new HkaValidationError(fieldName, 'Must use dot (.) as decimal separator, not comma');
    }
  }

  /**
   * Valida formato RUC con guiones
   * Formatos válidos:
   * - Natural: X-XXX-XXXX (1-234-5678)
   * - Jurídica: X-XXX-XXXX o XX-XXXX-XXXXXX
   */
  static validateRUC(ruc: string, fieldName: string = 'RUC'): void {
    if (!ruc) {
      throw new HkaValidationError(fieldName, 'RUC is required');
    }

    // Debe contener guiones
    if (!ruc.includes('-')) {
      throw new HkaValidationError(fieldName, 'RUC must contain hyphens (e.g., 2-737-2342)');
    }

    // Patrones válidos
    const naturalPattern = /^\d-\d{3}-\d{4}$/; // 1-234-5678
    const juridicaPattern = /^(\d-\d{3}-\d{4}|\d{2}-\d{4}-\d{6})$/; // 2-737-2342 o 12-3456-789012

    if (!naturalPattern.test(ruc) && !juridicaPattern.test(ruc)) {
      throw new HkaValidationError(
        fieldName,
        'Invalid RUC format. Expected: X-XXX-XXXX or XX-XXXX-XXXXXX'
      );
    }
  }

  /**
   * Valida formato ISO8601 con timezone -05:00
   * Formato: YYYY-MM-DDTHH:mm:ss-05:00
   */
  static validateISO8601(dateString: string, fieldName: string): void {
    const iso8601Pattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-05:00$/;

    if (!iso8601Pattern.test(dateString)) {
      throw new HkaValidationError(
        fieldName,
        'Invalid date format. Expected: YYYY-MM-DDTHH:mm:ss-05:00'
      );
    }

    // Validar que sea fecha válida
    const dateOnly = dateString.replace(/-05:00$/, '');
    const date = new Date(dateOnly);

    if (isNaN(date.getTime())) {
      throw new HkaValidationError(fieldName, 'Invalid date');
    }
  }

  /**
   * Valida email
   */
  static validateEmail(email: string, fieldName: string = 'Email'): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      throw new HkaValidationError(fieldName, 'Invalid email format');
    }

    if (email.length > 60) {
      throw new HkaValidationError(fieldName, 'Email must be at most 60 characters');
    }
  }

  /**
   * Valida ubicación (provincia, distrito, corregimiento)
   */
  static validateUbicacion(
    ubicacion: { provincia: string; distrito: string; corregimiento: string },
    fieldPrefix: string = 'ubicacion'
  ): void {
    this.validateAlphanumeric(ubicacion.provincia, 30, `${fieldPrefix}.provincia`);
    this.validateAlphanumeric(ubicacion.distrito, 30, `${fieldPrefix}.distrito`);
    this.validateAlphanumeric(ubicacion.corregimiento, 30, `${fieldPrefix}.corregimiento`);
  }

  /**
   * Valida código de ubicación (formato: X-X-X)
   */
  static validateCodigoUbicacion(codigo: string, fieldName: string = 'codigoUbicacion'): void {
    const pattern = /^\d+-\d+-\d+$/;

    if (!pattern.test(codigo)) {
      throw new HkaValidationError(fieldName, 'Invalid format. Expected: X-X-X (e.g., 1-1-1)');
    }
  }

  /**
   * Valida que un valor esté en un conjunto de valores permitidos
   */
  static validateEnum<T extends string>(
    value: T,
    allowedValues: readonly T[],
    fieldName: string
  ): void {
    if (!allowedValues.includes(value)) {
      throw new HkaValidationError(
        fieldName,
        `Invalid value: ${value}. Allowed: ${allowedValues.join(', ')}`
      );
    }
  }

  /**
   * Valida rango numérico
   */
  static validateRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): void {
    if (value < min || value > max) {
      throw new HkaValidationError(
        fieldName,
        `Value must be between ${min} and ${max}, got ${value}`
      );
    }
  }

  /**
   * Valida que string no esté vacío
   */
  static validateNotEmpty(value: string, fieldName: string): void {
    if (!value || value.trim().length === 0) {
      throw new HkaValidationError(fieldName, 'Cannot be empty');
    }
  }

  /**
   * Valida longitud mínima
   */
  static validateMinLength(value: string, minLength: number, fieldName: string): void {
    if (value.length < minLength) {
      throw new HkaValidationError(
        fieldName,
        `Must be at least ${minLength} characters, got ${value.length}`
      );
    }
  }
}
