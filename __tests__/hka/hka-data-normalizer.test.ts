import {
  DECIMAL_PRECISION,
  NORMALIZER_EXAMPLES,
  normalizeCantidad,
  normalizeCustomerData,
  normalizeDecimal,
  normalizeInvoiceItem,
  normalizePrecioItem,
  normalizePrecioTotal,
  normalizePrecioUnitario,
  normalizeString,
  normalizeTasa,
  validateDecimalFormat,
} from '@/lib/hka/data-normalizer';

describe('HKA Data Normalizer', () => {
  describe('normalizeDecimal', () => {
    it('formatea números con la precisión requerida', () => {
      expect(normalizeDecimal(1, 4)).toBe('1.0000');
      expect(normalizeDecimal(26.724547, 6)).toBe('26.724547');
      expect(normalizeDecimal('26.52', 2)).toBe('26.52');
    });

    it('maneja valores nulos segun configuración', () => {
      expect(normalizeDecimal(null, 2)).toBe('0.00');
      expect(normalizeDecimal(undefined, 4, true)).toBeNull();
    });

    it('limpia strings con separadores y espacios', () => {
      expect(normalizeDecimal(' 1,234.5678 ', 4)).toBe('1234.5678');
    });
  });

  describe('normalizeCantidad', () => {
    it('garantiza mínimo de 1.0000', () => {
      expect(normalizeCantidad(1)).toBe('1.0000');
      expect(normalizeCantidad(0)).toBe('1.0000');
      expect(normalizeCantidad('2.5')).toBe('2.5000');
    });
  });

  describe('normalizePrecioUnitario / Item / Total', () => {
    it('aplica precisión correcta', () => {
      expect(normalizePrecioUnitario(26.724547)).toBe('26.724547');
      expect(normalizePrecioItem(26.52)).toBe('26.52');
      expect(normalizePrecioTotal(1234)).toBe('1234.00');
    });
  });

  describe('normalizeString', () => {
    it('retorna null para valores vacíos cuando se permite', () => {
      expect(normalizeString(null)).toBeNull();
      expect(normalizeString('NaN')).toBeNull();
    });

    it('retorna string limpio', () => {
      expect(normalizeString(' Texto ')).toBe('Texto');
    });
  });

  describe('normalizeInvoiceItem', () => {
    it('normaliza datos reales del Excel compartido', () => {
      const rawItem = {
        DESCRIPCION: 'Servicio de soporte técnico',
        CODIGO: 'SRV-001',
        UNIDADMEDIDA: '',
        CANTIDAD: 1,
        PRECIO_UNITARIO: 26.724547,
        PRECIO_UNITARIO_DESCUENTO: 0,
        PRECIO_ITEM: 26.52,
        PRECIOACARREO: null,
        PRECIOSEGURO: undefined,
        TASA_ITBMS: 7,
      };

      const normalized = normalizeInvoiceItem(rawItem);

      expect(normalized.descripcion).toBe('Servicio de soporte técnico');
      expect(normalized.codigo).toBe('SRV-001');
      expect(normalized.unidadMedida).toBeNull();
      expect(normalized.cantidad).toBe('1.0000');
      expect(normalized.precioUnitario).toBe('26.724547');
      expect(normalized.precioItem).toBe('26.52');
      expect(normalized.tasaItbms).toBe('7.00');
    });
  });

  describe('normalizeCustomerData', () => {
    it('normaliza datos de cliente con campos vacíos', () => {
      const rawCustomer = {
        TIPO_CLIENTE_FE: '2',
        TIPO_CONTRIBUYENTE: null,
        NUMERO_RUC: '155738031',
        DV: null,
        RAZON_SOCIAL: 'FINANCIERA PIGSA S.A',
        Direccion: '934X+W75, Central y, C. 10, Colón',
        TELEFONO: null,
        CODIGO_UBICACION: '1-1-1',
        PROVINCIA: '1',
        DISTRITO: null,
        CORREGIMIENTO: null,
        PAIS: null,
        CORREO_ELECTRONICO: 'facturas@finanpigsa.com',
      };

      const normalized = normalizeCustomerData(rawCustomer);

      expect(normalized.numeroRuc).toBe('155738031');
      expect(normalized.dv).toBeNull();
      expect(normalized.razonSocial).toBe('FINANCIERA PIGSA S.A');
      expect(normalized.direccion).toBe('934X+W75, Central y, C. 10, Colón');
      expect(normalized.telefono).toBeNull();
      expect(normalized.codigoUbicacion).toBe('1-1-1');
      expect(normalized.provincia).toBe(1);
      expect(normalized.distrito).toBe('N/A');
      expect(normalized.pais).toBe('PA');
      expect(normalized.correoElectronico).toBe('facturas@finanpigsa.com');
    });
  });

  describe('validateDecimalFormat', () => {
    it('valida precisión decimal', () => {
      expect(validateDecimalFormat('1.0000', DECIMAL_PRECISION.CANTIDAD)).toBe(true);
      expect(validateDecimalFormat('26.724547', DECIMAL_PRECISION.PRECIO_UNITARIO)).toBe(true);
      expect(validateDecimalFormat('26.72454', DECIMAL_PRECISION.PRECIO_UNITARIO)).toBe(false);
    });
  });

  it('expone ejemplos útiles', () => {
    expect(NORMALIZER_EXAMPLES.cantidad).toBe('1.0000');
    expect(NORMALIZER_EXAMPLES.precioUnitario).toBe('26.724547');
    expect(NORMALIZER_EXAMPLES.stringNull).toBeNull();
  });
});


