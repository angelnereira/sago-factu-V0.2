/**
 * Validador exhaustivo de XML antes de envío a HKA
 * Garantiza que todos los campos críticos cumplan con requisitos HKA
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const RucSchema = z.object({
  tipoRuc: z.enum(['1', '2', '3', '4']).describe('1=Natural, 2=Jurídica, 3=Gobierno, 4=Extranjero'),
  ruc: z.string()
    .min(10, 'RUC debe tener mínimo 10 caracteres')
    .max(20, 'RUC debe tener máximo 20 caracteres')
    .refine(val => val.trim() !== '', 'RUC no puede estar vacío'),
  dv: z.string()
    .length(2, 'DV debe tener exactamente 2 dígitos')
    .regex(/^\d{2}$/, 'DV debe ser numérico')
});

const UbicacionSchema = z.object({
  dCodUbi: z.string()
    .regex(/^\d-\d+-\d+$/, 'Código ubicación formato incorrecto (ej: 8-1-12)')
    .refine(val => val !== '0-0-0' && val !== '1-1-1', 'Código ubicación no puede ser genérico (0-0-0 o 1-1-1)'),
  dCorreg: z.string()
    .min(3, 'Corregimiento mínimo 3 caracteres')
    .max(50)
    .refine(val => val.trim() !== '', 'Corregimiento no puede estar vacío'),
  dDistr: z.string()
    .min(3, 'Distrito mínimo 3 caracteres')
    .max(50)
    .refine(val => val.trim() !== '', 'Distrito no puede estar vacío'),
  dProv: z.string()
    .min(3, 'Provincia mínimo 3 caracteres')
    .max(50)
    .refine(val => val.trim() !== '', 'Provincia no puede estar vacío')
});

const EmisorSchema = z.object({
  ruc: RucSchema,
  nombre: z.string()
    .min(5, 'Nombre emisor mínimo 5 caracteres')
    .max(100)
    .refine(val => val.trim() !== '', 'Nombre no puede estar vacío'),
  direccion: z.string()
    .min(10, 'Dirección mínimo 10 caracteres')
    .max(200)
    .refine(val => val.trim() !== '', 'Dirección no puede estar vacía'),
  ubicacion: UbicacionSchema,
  codigoSucursal: z.string()
    .regex(/^\d{4}$/, 'Código sucursal debe ser 4 dígitos'),
  puntoFacturacion: z.string()
    .regex(/^\d{3}$/, 'Punto facturación debe ser 3 dígitos')
});

const ReceptorSchema = z.object({
  tipoCliente: z.enum(['01', '02', '03']).describe('01=Contribuyente, 02=Consumidor Final, 03=Extranjero'),
  ruc: RucSchema.optional(), // Solo obligatorio si tipoCliente = '01'
  nombre: z.string()
    .min(3, 'Nombre receptor mínimo 3 caracteres')
    .max(100)
    .refine(val => val.trim() !== '', 'Nombre no puede estar vacío'),
  direccion: z.string()
    .min(10, 'Dirección mínimo 10 caracteres')
    .max(200)
    .refine(val => val.trim() !== '', 'Dirección no puede estar vacía'),
  ubicacion: UbicacionSchema.optional() // Obligatorio solo si es Contribuyente
});

const ItemSchema = z.object({
  secuencia: z.number().int().positive(),
  descripcion: z.string()
    .min(5, 'Descripción mínimo 5 caracteres')
    .max(200)
    .refine(val => val.trim() !== '', 'Descripción no puede estar vacía'),
  codigo: z.string()
    .min(1)
    .max(50),
  cantidad: z.number()
    .positive('Cantidad debe ser positiva')
    .refine(val => val > 0, 'Cantidad debe ser mayor a 0'),
  precioUnitario: z.number()
    .nonnegative('Precio no puede ser negativo')
    .refine(val => !isNaN(val), 'Precio debe ser número válido'),
  valorTotal: z.number()
    .positive('Valor total debe ser positivo')
    .refine(val => !isNaN(val), 'Valor total debe ser número válido')
});

const FacturaSchema = z.object({
  ambiente: z.enum(['1', '2']).describe('1=Producción, 2=Demo'),
  tipoDocumento: z.enum(['01', '04', '05']).describe('01=Factura, 04=NC, 05=ND'),
  numeroDocumento: z.string()
    .regex(/^\d{9}$/, 'Número documento debe ser 9 dígitos'),
  fecha: z.string()
    .refine(
      val => {
        try {
          const date = new Date(val);
          return !isNaN(date.getTime()) && (val.includes('-05:00') || val.includes('Z'));
        } catch {
          return false;
        }
      },
      'Fecha debe ser ISO 8601 con zona horaria de Panamá (-05:00)'
    ),
  emisor: EmisorSchema,
  receptor: ReceptorSchema,
  items: z.array(ItemSchema)
    .min(1, 'Debe haber al menos 1 item')
    .max(1000, 'Máximo 1000 items permitidos')
});

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  criticalFields: {
    field: string;
    value: any;
    issue: string;
  }[];
}

/**
 * Valida que el XML cumple con todos los requisitos HKA
 */
export async function validateFacturaForHKA(
  facturaData: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    criticalFields: []
  };

  try {
    // Validación con Zod
    const validation = FacturaSchema.safeParse(facturaData);
    
    if (!validation.success) {
      result.isValid = false;
      validation.error.errors.forEach(err => {
        result.errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }

    // VALIDACIONES CRÍTICAS ADICIONALES

    // 1. Validar que ubicaciones no usen valores por defecto genéricos
    const ubicacionesProblematicas = ['1-1-1', '0-0-0', '1-0-0'];
    
    if (facturaData.emisor?.ubicacion?.dCodUbi && 
        ubicacionesProblematicas.includes(facturaData.emisor.ubicacion.dCodUbi)) {
      result.warnings.push(
        `Código ubicación emisor "${facturaData.emisor.ubicacion.dCodUbi}" es genérico. ` +
        `HKA demo puede rechazarlo. Usar ubicación real de prueba.`
      );
    }

    // 2. Validar RUC del emisor contra lista de RUCs válidos en demo
    const rucsValidosDemo = [
      '155738031-2-2023', // RUC de prueba HKA demo proporcionado
      '155161841-2-2019', // RUC demo adicional documentado
    ];

    if (facturaData.ambiente === '2' && facturaData.emisor?.ruc?.ruc) {
      if (!rucsValidosDemo.includes(facturaData.emisor.ruc.ruc)) {
        result.criticalFields.push({
          field: 'emisor.ruc.ruc',
          value: facturaData.emisor.ruc.ruc,
          issue: 'RUC no está en lista de RUCs válidos para ambiente demo. ' +
                 'HKA demo requiere RUCs pre-registrados. Contactar HKA para obtener RUC de prueba.'
        });
      }
    }

    // 3. Validar que no haya campos vacíos que se convertirán en tags vacíos
    const camposOpcionales = [
      'emisor.correo',
      'emisor.telefono',
      'receptor.correo',
      'receptor.telefono'
    ];

    const checkEmptyFields = (obj: any, prefix: string = '') => {
      Object.keys(obj || {}).forEach(key => {
        const value = obj[key];
        const fullPath = prefix ? `${prefix}.${key}` : key;
        
        if (value === '' || value === null || value === undefined) {
          if (!camposOpcionales.includes(fullPath)) {
            result.errors.push(
              `Campo "${fullPath}" está vacío. HKA rechaza campos vacíos en tags obligatorios.`
            );
            result.isValid = false;
          }
        } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          checkEmptyFields(value, fullPath);
        }
      });
    };

    checkEmptyFields(facturaData);

    // 4. Validar totales
    if (facturaData.items && facturaData.totales) {
      const totalItems = facturaData.items.reduce(
        (sum: number, item: any) => sum + (item.valorTotal || 0),
        0
      );
      const totalFactura = facturaData.totales?.total || 0;

      if (Math.abs(totalItems - totalFactura) > 0.01) {
        result.errors.push(
          `Suma de items (${totalItems.toFixed(2)}) no coincide con total factura (${totalFactura.toFixed(2)})`
        );
        result.isValid = false;
      }
    }

    // 5. Validar fecha no sea futura
    if (facturaData.fecha) {
      try {
        const fechaFactura = new Date(facturaData.fecha);
        const ahora = new Date();
        
        if (fechaFactura > ahora) {
          result.errors.push('Fecha de factura no puede ser futura');
          result.isValid = false;
        }
      } catch (error) {
        // Error ya capturado en validación Zod
      }
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Error en validación: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

/**
 * Valida XML string antes de enviar
 */
export function validateXMLStructure(xmlString: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    criticalFields: []
  };

  try {
    // 1. Verificar que es XML válido básico
    if (!xmlString.includes('<rFE') || !xmlString.includes('</rFE>')) {
      result.isValid = false;
      result.errors.push('XML no contiene elemento raíz rFE');
      return result;
    }

    // 2. Verificar namespace correcto
    if (!xmlString.includes('xmlns="http://dgi-fep.mef.gob.pa"')) {
      result.warnings.push(
        `Namespace puede ser incorrecto. Debería ser "http://dgi-fep.mef.gob.pa"`
      );
    }

    // 3. Buscar tags vacíos que HKA rechaza
    const emptyTagsRegex = /<([^>]+)><\/\1>|<([^>]+)\/>/g;
    const emptyTags: string[] = [];
    let match;
    
    while ((match = emptyTagsRegex.exec(xmlString)) !== null) {
      const rawTag = (match[1] || match[2] || "").trim();
      if (!rawTag) continue;

      const tagName = rawTag.split(/\s+/)[0];

      // Ignorar tags de namespaces externos (ej: ds:*) que pueden ser self-closing según estándar XMLDSig
      if (tagName.startsWith("ds:")) {
        continue;
      }
      
      // Ignorar tags que pueden estar vacíos según especificación
      const tagsOpcionalesVacios = [
        'dCoordEm', 'dCorreoEm', 'dTfnEm', 'dCorreoRec', 'dTfnRec',
        'dInfoFE', 'dNombComer'
      ];

      if (!tagsOpcionalesVacios.includes(tagName)) {
        emptyTags.push(rawTag);
        result.criticalFields.push({
          field: rawTag,
          value: '',
          issue: 'Tag XML vacío detectado. HKA lo rechaza.'
        });
      }
    }

    if (emptyTags.length > 0) {
      result.isValid = false;
      result.errors.push(
        `Tags vacíos encontrados (${emptyTags.length}): ${emptyTags.join(', ')}. ` +
        `HKA rechaza tags con contenido vacío.`
      );
    }

    // 4. Verificar presencia de campos obligatorios usando regex
    const camposObligatorios = [
      { name: 'dVerForm', pattern: /<dVerForm>[^<]+<\/dVerForm>/ },
      { name: 'dId', pattern: /<dId>[^<]+<\/dId>/ },
      { name: 'iAmb', pattern: /<iAmb>[^<]+<\/iAmb>/ },
      { name: 'iTpEmis', pattern: /<iTpEmis>[^<]+<\/iTpEmis>/ },
      { name: 'dFechaCont', pattern: /<dFechaCont>[^<]+<\/dFechaCont>/ },
      { name: 'iDoc', pattern: /<iDoc>[^<]+<\/iDoc>/ },
      { name: 'dNroDF', pattern: /<dNroDF>[^<]+<\/dNroDF>/ },
      { name: 'dPtoFacDF', pattern: /<dPtoFacDF>[^<]+<\/dPtoFacDF>/ },
      { name: 'dSeg', pattern: /<dSeg>[^<]+<\/dSeg>/ },
      { name: 'dTipoRuc (Emisor)', pattern: /<gRucEmi>[\s\S]*?<dTipoRuc>[^<]+<\/dTipoRuc>/ },
      { name: 'dRuc (Emisor)', pattern: /<gRucEmi>[\s\S]*?<dRuc>[^<]+<\/dRuc>/ },
      { name: 'dDV (Emisor)', pattern: /<gRucEmi>[\s\S]*?<dDV>[^<]+<\/dDV>/ },
      { name: 'dNombEm', pattern: /<dNombEm>[^<]+<\/dNombEm>/ },
      { name: 'dDirecEm', pattern: /<dDirecEm>[^<]+<\/dDirecEm>/ },
      { name: 'dCodUbi (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dCodUbi>[^<]+<\/dCodUbi>/ },
      { name: 'dCorreg (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dCorreg>[^<]+<\/dCorreg>/ },
      { name: 'dDistr (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dDistr>[^<]+<\/dDistr>/ },
      { name: 'dProv (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dProv>[^<]+<\/dProv>/ },
      { name: 'iTipoRec', pattern: /<iTipoRec>[^<]+<\/iTipoRec>/ },
      { name: 'dNombRec', pattern: /<dNombRec>[^<]+<\/dNombRec>/ },
      { name: 'dDirecRec', pattern: /<dDirecRec>[^<]+<\/dDirecRec>/ },
      { name: 'dSecItem', pattern: /<dSecItem>[^<]+<\/dSecItem>/ },
      { name: 'dDescProd', pattern: /<dDescProd>[^<]+<\/dDescProd>/ },
      { name: 'dCodProd', pattern: /<dCodProd>[^<]+<\/dCodProd>/ },
      { name: 'dTotNeto', pattern: /<dTotNeto>[^<]+<\/dTotNeto>/ },
      { name: 'dVTot', pattern: /<dVTot>[^<]+<\/dVTot>/ },
    ];

    const camposFaltantes: string[] = [];
    camposObligatorios.forEach(campo => {
      if (!campo.pattern.test(xmlString)) {
        camposFaltantes.push(campo.name);
      }
    });

    if (camposFaltantes.length > 0) {
      result.isValid = false;
      result.errors.push(
        `Campos obligatorios faltantes: ${camposFaltantes.join(', ')}`
      );
    }

    // 5. Validar que campos críticos no tengan valores vacíos
    const camposCriticos = [
      { name: 'dRuc (Emisor)', pattern: /<gRucEmi>[\s\S]*?<dRuc>([^<]+)<\/dRuc>/ },
      { name: 'dDV (Emisor)', pattern: /<gRucEmi>[\s\S]*?<dDV>([^<]+)<\/dDV>/ },
      { name: 'dNombEm', pattern: /<dNombEm>([^<]+)<\/dNombEm>/ },
      { name: 'dDirecEm', pattern: /<dDirecEm>([^<]+)<\/dDirecEm>/ },
      { name: 'dCodUbi (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dCodUbi>([^<]+)<\/dCodUbi>/ },
      { name: 'dCorreg (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dCorreg>([^<]+)<\/dCorreg>/ },
      { name: 'dDistr (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dDistr>([^<]+)<\/dDistr>/ },
      { name: 'dProv (Emisor)', pattern: /<gUbiEmi>[\s\S]*?<dProv>([^<]+)<\/dProv>/ },
      { name: 'dNombRec', pattern: /<dNombRec>([^<]+)<\/dNombRec>/ },
      { name: 'dDirecRec', pattern: /<dDirecRec>([^<]+)<\/dDirecRec>/ },
      { name: 'dDescProd', pattern: /<dDescProd>([^<]+)<\/dDescProd>/ },
    ];

    const camposVacios: string[] = [];
    camposCriticos.forEach(campo => {
      const match = xmlString.match(campo.pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        if (value === '' || value === 'null' || value === 'undefined') {
          camposVacios.push(campo.name);
          result.criticalFields.push({
            field: campo.name,
            value: value,
            issue: 'Campo crítico tiene valor vacío o inválido'
          });
        }
      }
    });

    if (camposVacios.length > 0) {
      result.isValid = false;
      result.errors.push(
        `Campos críticos con valores vacíos: ${camposVacios.join(', ')}`
      );
    }

    // 6. Validar códigos de ubicación problemáticos
    const codigoUbiMatch = xmlString.match(/<gUbiEmi>[\s\S]*?<dCodUbi>([^<]+)<\/dCodUbi>/);
    if (codigoUbiMatch && codigoUbiMatch[1]) {
      const codigoUbi = codigoUbiMatch[1].trim();
      if (codigoUbi === '1-1-1' || codigoUbi === '0-0-0') {
        result.warnings.push(
          `Código de ubicación emisor "${codigoUbi}" es genérico. HKA demo puede rechazarlo.`
        );
      }
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Error validando XML: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

/**
 * Genera reporte detallado de validación
 */
export function generateValidationReport(result: ValidationResult): string {
  let report = '\n';
  report += '═'.repeat(80) + '\n';
  report += '  REPORTE DE VALIDACIÓN XML PARA HKA\n';
  report += '═'.repeat(80) + '\n\n';

  report += `Estado: ${result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n\n`;

  if (result.errors.length > 0) {
    report += '❌ ERRORES CRÍTICOS:\n';
    report += '─'.repeat(80) + '\n';
    result.errors.forEach((error, i) => {
      report += `${i + 1}. ${error}\n`;
    });
    report += '\n';
  }

  if (result.warnings.length > 0) {
    report += '⚠️  ADVERTENCIAS:\n';
    report += '─'.repeat(80) + '\n';
    result.warnings.forEach((warning, i) => {
      report += `${i + 1}. ${warning}\n`;
    });
    report += '\n';
  }

  if (result.criticalFields.length > 0) {
    report += '🔴 CAMPOS CRÍTICOS CON PROBLEMAS:\n';
    report += '─'.repeat(80) + '\n';
    result.criticalFields.forEach((field, i) => {
      report += `${i + 1}. Campo: "${field.field}"\n`;
      report += `   Valor: "${field.value}"\n`;
      report += `   Problema: ${field.issue}\n\n`;
    });
  }

  report += '═'.repeat(80) + '\n';

  return report;
}

