/**
 * Setup para Tests de Importación
 */

import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock de dependencias externas
jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    xlsx: {
      load: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
    worksheets: [],
    addWorksheet: jest.fn().mockReturnValue({
      addRow: jest.fn(),
    }),
  })),
}));

// Mock de fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
  unlink: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
}));

// Mock de path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
}));

// Setup global
beforeAll(() => {
  console.log('🧪 Configurando tests de importación...');
});

afterAll(() => {
  console.log('✅ Tests de importación completados');
});

beforeEach(() => {
  // Limpiar mocks antes de cada test
  jest.clearAllMocks();
});

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

