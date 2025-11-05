/**
 * Tests para el validador XML de HKA
 */

import {
  validateXMLStructure,
  generateValidationReport,
} from '@/lib/hka/validators/xml-validator';

describe('XML Validator', () => {
  const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dVerForm>1.00</dVerForm>
  <dId>FE0120000155596713-2-2015-5900012019052800055000155650121566749040</dId>
  <gDGen>
    <iAmb>2</iAmb>
    <iTpEmis>01</iTpEmis>
    <dFechaCont>2025-01-15T10:30:00-05:00</dFechaCont>
    <iDoc>01</iDoc>
    <dNroDF>000001234</dNroDF>
    <dPtoFacDF>001</dPtoFacDF>
    <dSeg>123456789</dSeg>
    <gEmis>
      <gRucEmi>
        <dTipoRuc>2</dTipoRuc>
        <dRuc>155738031</dRuc>
        <dDV>2</dDV>
      </gRucEmi>
      <dNombEm>EMPRESA TEST S.A.</dNombEm>
      <dDirecEm>Calle 50, Panama</dDirecEm>
      <gUbiEmi>
        <dCodUbi>8-1-12</dCodUbi>
        <dCorreg>SAN FRANCISCO</dCorreg>
        <dDistr>PANAMÁ</dDistr>
        <dProv>PANAMÁ</dProv>
      </gUbiEmi>
    </gEmis>
    <gDatRec>
      <iTipoRec>01</iTipoRec>
      <gRucRec>
        <dTipoRuc>2</dTipoRuc>
        <dRuc>123456789</dRuc>
        <dDV>01</dDV>
      </gRucRec>
      <dNombRec>CLIENTE TEST</dNombRec>
      <dDirecRec>Avenida Balboa, Panama</dDirecRec>
      <gUbiRec>
        <dCodUbi>8-1-12</dCodUbi>
        <dCorreg>SAN FRANCISCO</dCorreg>
        <dDistr>PANAMÁ</dDistr>
        <dProv>PANAMÁ</dProv>
      </gUbiRec>
    </gDatRec>
  </gDGen>
  <gItem>
    <dSecItem>1</dSecItem>
    <dDescProd>Producto de prueba</dDescProd>
    <dCodProd>PROD-001</dCodProd>
    <cUnidad>und</cUnidad>
    <dCantCodInt>1.00</dCantCodInt>
    <gPrecios>
      <dPrUnit>100.00</dPrUnit>
      <dPrUnitDesc>100.00</dPrUnitDesc>
      <dPrItem>100.00</dPrItem>
      <dValTotItem>115.00</dValTotItem>
    </gPrecios>
    <gITBMSItem>
      <dTasaITBMS>02</dTasaITBMS>
      <dValITBMS>15.00</dValITBMS>
    </gITBMSItem>
  </gItem>
  <gTot>
    <dTotNeto>100.00</dTotNeto>
    <dTotITBMS>15.00</dTotITBMS>
    <dVTot>115.00</dVTot>
  </gTot>
</rFE>`;

  describe('validateXMLStructure', () => {
    it('debe validar XML válido correctamente', () => {
      const result = validateXMLStructure(validXML);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe detectar XML sin elemento raíz rFE', () => {
      const invalidXML = '<otro>test</otro>';
      const result = validateXMLStructure(invalidXML);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('XML no contiene elemento raíz rFE')
      );
    });

    it('debe detectar campos obligatorios faltantes', () => {
      const invalidXML = '<rFE xmlns="http://dgi-fep.mef.gob.pa"><dVerForm>1.00</dVerForm></rFE>';
      const result = validateXMLStructure(invalidXML);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe detectar tags vacíos', () => {
      const invalidXML = validXML.replace(
        '<dNombEm>EMPRESA TEST S.A.</dNombEm>',
        '<dNombEm></dNombEm>'
      );
      const result = validateXMLStructure(invalidXML);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('vacío'))).toBe(true);
    });

    it('debe detectar valores "null" o "undefined" como texto', () => {
      const invalidXML = validXML.replace(
        '<dRuc>155738031</dRuc>',
        '<dRuc>null</dRuc>'
      );
      const result = validateXMLStructure(invalidXML);
      // La validación debería detectar esto
      const hasNullValues = result.criticalFields.some(
        f => f.value === 'null' || f.value === 'undefined'
      );
      expect(hasNullValues || result.errors.some(e => e.includes('null'))).toBe(true);
    });

    it('debe detectar código de ubicación genérico problemático', () => {
      const invalidXML = validXML.replace(
        '<dCodUbi>8-1-12</dCodUbi>',
        '<dCodUbi>1-1-1</dCodUbi>'
      );
      const result = validateXMLStructure(invalidXML);
      expect(result.warnings.some(w => w.includes('genérico'))).toBe(true);
    });
  });

  describe('generateValidationReport', () => {
    it('debe generar reporte para resultado válido', () => {
      const result = validateXMLStructure(validXML);
      const report = generateValidationReport(result);
      expect(report).toContain('VÁLIDO');
      expect(report).toContain('═');
    });

    it('debe generar reporte con errores', () => {
      const invalidXML = '<rFE></rFE>';
      const result = validateXMLStructure(invalidXML);
      const report = generateValidationReport(result);
      expect(report).toContain('INVÁLIDO');
      expect(report).toContain('ERRORES CRÍTICOS');
    });

    it('debe incluir warnings en el reporte', () => {
      const xmlWithWarning = validXML.replace(
        '<dCodUbi>8-1-12</dCodUbi>',
        '<dCodUbi>1-1-1</dCodUbi>'
      );
      const result = validateXMLStructure(xmlWithWarning);
      const report = generateValidationReport(result);
      expect(report).toContain('ADVERTENCIAS');
    });
  });
});

