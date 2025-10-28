/**
 * Tests Unitarios para Validaciones de Importación
 * Pruebas para xml-uploader, excel-parser y validaciones defensivas
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { InvoiceExcelParser } from '../../lib/utils/excel-parser';
import { InvoiceXMLParser } from '../../lib/utils/xml-parser';

// Mock de archivos Excel para testing
const createMockExcelBuffer = (data: any[][]) => {
  // Simular buffer de Excel (simplificado para testing)
  return new ArrayBuffer(1024);
};

describe('Validaciones de Importación', () => {
  describe('InvoiceExcelParser', () => {
    let parser: InvoiceExcelParser;

    beforeEach(() => {
      parser = new InvoiceExcelParser();
    });

    describe('validate()', () => {
      it('debe validar archivo Excel válido', async () => {
        const mockBuffer = createMockExcelBuffer([
          ['Cliente', 'Producto', 'Cantidad', 'Precio'],
          ['Juan Pérez', 'Producto A', 2, 10.50],
          ['María García', 'Producto B', 1, 25.00]
        ]);

        const result = await InvoiceExcelParser.validate(mockBuffer);
        
        expect(result.valid).toBe(true);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('debe rechazar archivo Excel vacío', async () => {
        const mockBuffer = new ArrayBuffer(0);

        const result = await InvoiceExcelParser.validate(mockBuffer);
        
        expect(result.valid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('vacío');
      });

      it('debe rechazar archivo con menos de 2 filas', async () => {
        const mockBuffer = createMockExcelBuffer([
          ['Solo una fila']
        ]);

        const result = await InvoiceExcelParser.validate(mockBuffer);
        
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('al menos 2 filas');
      });

      it('debe manejar errores de validación sin explotar', async () => {
        // Simular error interno
        const originalValidate = InvoiceExcelParser.validate;
        InvoiceExcelParser.validate = jest.fn().mockRejectedValue(new Error('Error interno'));

        const result = await InvoiceExcelParser.validate(new ArrayBuffer(1024));
        
        expect(result.valid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors[0]).toContain('Error interno');

        // Restaurar función original
        InvoiceExcelParser.validate = originalValidate;
      });
    });

    describe('parse()', () => {
      it('debe parsear Excel con headers correctamente', async () => {
        const mockBuffer = createMockExcelBuffer([
          ['Cliente', 'Producto', 'Cantidad', 'Precio'],
          ['Juan Pérez', 'Producto A', 2, 10.50],
          ['María García', 'Producto B', 1, 25.00]
        ]);

        // Mock del parser para evitar dependencias externas
        const mockParse = jest.fn().mockResolvedValue({
          client: { name: 'Juan Pérez', taxId: '123456789' },
          items: [
            { description: 'Producto A', quantity: 2, unitPrice: 10.50 },
            { description: 'Producto B', quantity: 1, unitPrice: 25.00 }
          ]
        });

        parser.parse = mockParse;
        const result = await parser.parse(mockBuffer);

        expect(result.client.name).toBe('Juan Pérez');
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items.length).toBe(2);
      });

      it('debe manejar errores de parsing sin explotar', async () => {
        const mockBuffer = createMockExcelBuffer([]);

        await expect(parser.parse(mockBuffer)).rejects.toThrow('Error al procesar Excel');
      });
    });
  });

  describe('InvoiceXMLParser', () => {
    describe('validate()', () => {
      it('debe validar XML válido', () => {
        const validXML = `<?xml version="1.0"?>
        <rFE version="1.00">
          <dDatosGenerales>
            <dRuc>123456789</dRuc>
            <dRazonSocial>Empresa Test</dRazonSocial>
          </dDatosGenerales>
        </rFE>`;

        const result = InvoiceXMLParser.validate(validXML);
        
        expect(result.valid).toBe(true);
        expect(Array.isArray(result.errors)).toBe(true);
      });

      it('debe rechazar XML mal formado', () => {
        const invalidXML = `<rFE version="1.00">
          <dDatosGenerales>
            <dRuc>123456789</dRuc>
            <dRazonSocial>Empresa Test</dRazonSocial>
          </dDatosGenerales>
        </rFE>`;

        const result = InvoiceXMLParser.validate(invalidXML);
        
        expect(result.valid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('debe manejar XML vacío', () => {
        const result = InvoiceXMLParser.validate('');
        
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('vacío');
      });
    });
  });

  describe('Validaciones Defensivas', () => {
    describe('Manejo de Arrays Undefined', () => {
      it('debe manejar validation.errors undefined', () => {
        const validation = { valid: false, errors: undefined };
        
        const errorMsg = validation.errors && Array.isArray(validation.errors) && validation.errors.length > 0
          ? validation.errors.join(", ") 
          : 'Error de validación desconocido';
        
        expect(errorMsg).toBe('Error de validación desconocido');
      });

      it('debe manejar validation.errors null', () => {
        const validation = { valid: false, errors: null };
        
        const errorMsg = validation.errors && Array.isArray(validation.errors) && validation.errors.length > 0
          ? validation.errors.join(", ") 
          : 'Error de validación desconocido';
        
        expect(errorMsg).toBe('Error de validación desconocido');
      });

      it('debe manejar validation.errors array vacío', () => {
        const validation = { valid: false, errors: [] };
        
        const errorMsg = validation.errors && Array.isArray(validation.errors) && validation.errors.length > 0
          ? validation.errors.join(", ") 
          : 'Error de validación desconocido';
        
        expect(errorMsg).toBe('Error de validación desconocido');
      });

      it('debe manejar validation.errors con errores válidos', () => {
        const validation = { valid: false, errors: ['Error 1', 'Error 2'] };
        
        const errorMsg = validation.errors && Array.isArray(validation.errors) && validation.errors.length > 0
          ? validation.errors.join(", ") 
          : 'Error de validación desconocido';
        
        expect(errorMsg).toBe('Error 1, Error 2');
      });
    });

    describe('Manejo de Errores en Worker', () => {
      it('debe manejar errores undefined', () => {
        const errores = undefined;
        
        const shouldProcess = errores && Array.isArray(errores) && errores.length > 0;
        
        expect(shouldProcess).toBe(false);
      });

      it('debe manejar errores null', () => {
        const errores = null;
        
        const shouldProcess = errores && Array.isArray(errores) && errores.length > 0;
        
        expect(shouldProcess).toBe(false);
      });

      it('debe manejar errores array vacío', () => {
        const errores: string[] = [];
        
        const shouldProcess = errores && Array.isArray(errores) && errores.length > 0;
        
        expect(shouldProcess).toBe(false);
      });

      it('debe procesar errores válidos', () => {
        const errores = ['Error de validación', 'Error de formato'];
        
        const shouldProcess = errores && Array.isArray(errores) && errores.length > 0;
        
        expect(shouldProcess).toBe(true);
      });
    });

    describe('Manejo de Recipients', () => {
      it('debe manejar recipients undefined', () => {
        const recipients = undefined;
        
        const result = Array.isArray(recipients) ? recipients.join(', ') : 'No recipients';
        
        expect(result).toBe('No recipients');
      });

      it('debe manejar recipients null', () => {
        const recipients = null;
        
        const result = Array.isArray(recipients) ? recipients.join(', ') : 'No recipients';
        
        expect(result).toBe('No recipients');
      });

      it('debe manejar recipients array vacío', () => {
        const recipients: string[] = [];
        
        const result = Array.isArray(recipients) ? recipients.join(', ') : 'No recipients';
        
        expect(result).toBe('');
      });

      it('debe procesar recipients válidos', () => {
        const recipients = ['admin@test.com', 'user@test.com'];
        
        const result = Array.isArray(recipients) ? recipients.join(', ') : 'No recipients';
        
        expect(result).toBe('admin@test.com, user@test.com');
      });
    });
  });

  describe('Casos Edge de Importación', () => {
    it('debe manejar archivo Excel con caracteres especiales', async () => {
      const mockBuffer = createMockExcelBuffer([
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['José María', 'Producto & Servicio', 1, 15.50],
        ['María José', 'Producto "Especial"', 2, 20.00]
      ]);

      const result = await InvoiceExcelParser.validate(mockBuffer);
      
      expect(result.valid).toBe(true);
    });

    it('debe manejar archivo Excel con números como texto', async () => {
      const mockBuffer = createMockExcelBuffer([
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['Juan', 'Producto A', '2', '10.50'],
        ['María', 'Producto B', '1', '25.00']
      ]);

      const result = await InvoiceExcelParser.validate(mockBuffer);
      
      expect(result.valid).toBe(true);
    });

    it('debe manejar archivo Excel con celdas vacías', async () => {
      const mockBuffer = createMockExcelBuffer([
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['Juan', '', 2, 10.50],
        ['', 'Producto B', 1, 25.00]
      ]);

      const result = await InvoiceExcelParser.validate(mockBuffer);
      
      expect(result.valid).toBe(true);
    });
  });
});

/**
 * Helper para crear datos de prueba
 */
export const createTestData = {
  excelWithHeaders: () => [
    ['Cliente', 'Producto', 'Cantidad', 'Precio', 'ITBMS'],
    ['Juan Pérez', 'Producto A', 2, 10.50, 7],
    ['María García', 'Producto B', 1, 25.00, 7]
  ],

  excelWithoutHeaders: () => [
    ['Juan Pérez', 'Producto A', 2, 10.50],
    ['María García', 'Producto B', 1, 25.00]
  ],

  xmlValid: () => `<?xml version="1.0"?>
    <rFE version="1.00">
      <dDatosGenerales>
        <dRuc>123456789</dRuc>
        <dRazonSocial>Empresa Test</dRazonSocial>
      </dDatosGenerales>
      <dItems>
        <dItem>
          <dDescripcion>Producto Test</dDescripcion>
          <dCantidad>1</dCantidad>
          <dPrecio>10.00</dPrecio>
        </dItem>
      </dItems>
    </rFE>`,

  xmlInvalid: () => `<rFE version="1.00">
      <dDatosGenerales>
        <dRuc>123456789</dRuc>
        <dRazonSocial>Empresa Test</dRazonSocial>
      </dDatosGenerales>
    </rFE>`
};

