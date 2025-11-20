/**
 * HKA Common Types
 * Tipos base compartidos por todos los métodos
 */

export interface HkaCredentials {
  tokenEmpresa: string;
  tokenPassword: string;
  environment: 'DEMO' | 'PROD';
}

export interface HkaBaseResponse {
  codigo: string; // '200' = success, '100' = processing, '4xx' = error
  resultado: string; // 'OK' | 'ERROR'
  mensaje: string;
}

export interface HkaErrorResponse extends HkaBaseResponse {
  codigo: string; // !== '200'
  resultado: 'ERROR';
  mensaje: string;
  detalles?: string[];
}

export class HkaBusinessError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: string[]
  ) {
    super(`HKA Business Error [${code}]: ${message}`);
    this.name = 'HkaBusinessError';
  }
}

export class HkaHttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(`HKA HTTP Error [${statusCode}]: ${message}`);
    this.name = 'HkaHttpError';
  }
}

export class HkaTimeoutError extends Error {
  constructor(message: string = 'HKA request timeout') {
    super(message);
    this.name = 'HkaTimeoutError';
  }
}

export class HkaConnectionError extends Error {
  constructor(message: string = 'Cannot connect to HKA service') {
    super(message);
    this.name = 'HkaConnectionError';
  }
}

export class HkaValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(`Validation Error [${field}]: ${message}`);
    this.name = 'HkaValidationError';
  }
}
