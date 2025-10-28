/**
 * Script de Prueba para Importación Excel
 * Prueba diferentes formatos y casos edge
 */

import { InvoiceExcelParser } from '@/lib/utils/excel-parser';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  itemsFound?: number;
  processingTime?: number;
}

class ExcelImportTester {
  private parser: InvoiceExcelParser;
  private results: TestResult[] = [];

  constructor() {
    this.parser = new InvoiceExcelParser();
  }

  /**
   * Crear archivo Excel de prueba
   */
  private async createTestExcel(data: any[][], filename: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    data.forEach((row, index) => {
      worksheet.addRow(row);
    });

    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const filePath = path.join(tempDir, filename);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }

  /**
   * Ejecutar prueba individual
   */
  private async runTest(testName: string, testData: any[][], filename: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Ejecutando: ${testName}`);
      
      // Crear archivo Excel
      const filePath = await this.createTestExcel(testData, filename);
      
      // Leer archivo como buffer
      const fileBuffer = await fs.readFile(filePath);
      
      // Validar
      const validation = await InvoiceExcelParser.validate(fileBuffer);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.errors.join(', ')}`);
      }
      
      // Parsear
      const result = await this.parser.parse(fileBuffer);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`   ✅ Éxito: ${result.items.length} items encontrados`);
      console.log(`   ⏱️  Tiempo: ${processingTime}ms`);
      
      // Limpiar archivo temporal
      await fs.unlink(filePath);
      
      return {
        testName,
        success: true,
        itemsFound: result.items.length,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      return {
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        processingTime
      };
    }
  }

  /**
   * Ejecutar todas las pruebas
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando pruebas de importación Excel...\n');

    // Test 1: Excel con headers estándar
    await this.runTest(
      'Excel con Headers Estándar',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio', 'ITBMS'],
        ['Juan Pérez', 'Producto A', 2, 10.50, 7],
        ['María García', 'Producto B', 1, 25.00, 7],
        ['Pedro López', 'Producto C', 3, 15.75, 7]
      ],
      'test-headers.xlsx'
    );

    // Test 2: Excel sin headers
    await this.runTest(
      'Excel sin Headers',
      [
        ['Juan Pérez', 'Producto A', 2, 10.50],
        ['María García', 'Producto B', 1, 25.00],
        ['Pedro López', 'Producto C', 3, 15.75]
      ],
      'test-no-headers.xlsx'
    );

    // Test 3: Excel con caracteres especiales
    await this.runTest(
      'Excel con Caracteres Especiales',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['José María & Asociados', 'Producto "Especial"', 1, 15.50],
        ['María José', 'Producto & Servicio', 2, 20.00],
        ['Pedro & Compañía', 'Producto con ñ', 1, 30.00]
      ],
      'test-special-chars.xlsx'
    );

    // Test 4: Excel con números como texto
    await this.runTest(
      'Excel con Números como Texto',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['Juan', 'Producto A', '2', '10.50'],
        ['María', 'Producto B', '1', '25.00'],
        ['Pedro', 'Producto C', '3', '15.75']
      ],
      'test-numbers-as-text.xlsx'
    );

    // Test 5: Excel con celdas vacías
    await this.runTest(
      'Excel con Celdas Vacías',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['Juan', '', 2, 10.50],
        ['', 'Producto B', 1, 25.00],
        ['María', 'Producto C', '', 15.00],
        ['Pedro', 'Producto D', 1, '']
      ],
      'test-empty-cells.xlsx'
    );

    // Test 6: Excel con muchos items
    await this.runTest(
      'Excel con Muchos Items (100)',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ...Array.from({ length: 100 }, (_, i) => [
          `Cliente ${i + 1}`,
          `Producto ${i + 1}`,
          1,
          10.00 + (i * 0.1)
        ])
      ],
      'test-many-items.xlsx'
    );

    // Test 7: Excel con formato de fecha
    await this.runTest(
      'Excel con Fechas',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio', 'Fecha'],
        ['Juan', 'Producto A', 2, 10.50, '2025-10-27'],
        ['María', 'Producto B', 1, 25.00, '2025-10-28'],
        ['Pedro', 'Producto C', 3, 15.75, '2025-10-29']
      ],
      'test-with-dates.xlsx'
    );

    // Test 8: Excel con columnas adicionales
    await this.runTest(
      'Excel con Columnas Adicionales',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio', 'ITBMS', 'Descuento', 'Total', 'Notas'],
        ['Juan', 'Producto A', 2, 10.50, 7, 0, 22.47, 'Sin notas'],
        ['María', 'Producto B', 1, 25.00, 7, 5, 26.75, 'Descuento aplicado'],
        ['Pedro', 'Producto C', 3, 15.75, 7, 10, 50.58, 'Descuento especial']
      ],
      'test-extra-columns.xlsx'
    );

    // Test 9: Excel con formato de moneda
    await this.runTest(
      'Excel con Formato de Moneda',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio'],
        ['Juan', 'Producto A', 2, '$10.50'],
        ['María', 'Producto B', 1, '$25.00'],
        ['Pedro', 'Producto C', 3, '$15.75']
      ],
      'test-currency-format.xlsx'
    );

    // Test 10: Excel con formato de porcentaje
    await this.runTest(
      'Excel con Formato de Porcentaje',
      [
        ['Cliente', 'Producto', 'Cantidad', 'Precio', 'ITBMS'],
        ['Juan', 'Producto A', 2, 10.50, '7%'],
        ['María', 'Producto B', 1, 25.00, '7%'],
        ['Pedro', 'Producto C', 3, 15.75, '7%']
      ],
      'test-percentage-format.xlsx'
    );

    this.printResults();
  }

  /**
   * Imprimir resultados
   */
  private printResults(): void {
    console.log('\n📊 RESULTADOS DE PRUEBAS\n');
    console.log('='.repeat(80));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + (r.processingTime || 0), 0);
    
    console.log(`✅ Exitosas: ${successful}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`⏱️  Tiempo total: ${totalTime}ms`);
    console.log(`📈 Promedio: ${Math.round(totalTime / this.results.length)}ms por prueba`);
    
    console.log('\n📋 DETALLE DE PRUEBAS:\n');
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const time = result.processingTime ? ` (${result.processingTime}ms)` : '';
      const items = result.itemsFound ? ` - ${result.itemsFound} items` : '';
      
      console.log(`${index + 1}. ${status} ${result.testName}${time}${items}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    if (failed === 0) {
      console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    } else {
      console.log(`⚠️  ${failed} pruebas fallaron. Revisar errores arriba.`);
    }
  }

  /**
   * Limpiar archivos temporales
   */
  async cleanup(): Promise<void> {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        if (file.endsWith('.xlsx')) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
      
      console.log('\n🧹 Archivos temporales limpiados');
    } catch (error) {
      console.log('\n⚠️  No se pudieron limpiar archivos temporales');
    }
  }
}

/**
 * Función principal
 */
async function main() {
  const tester = new ExcelImportTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Error ejecutando pruebas:', error);
  } finally {
    await tester.cleanup();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

export { ExcelImportTester, TestResult };

