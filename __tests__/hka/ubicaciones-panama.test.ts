/**
 * Tests para el catálogo de ubicaciones de Panamá
 */

import {
  getDefaultUbicacion,
  findUbicacion,
  isValidUbicacion,
  getUbicacionOrDefault,
  getProvincias,
  getDistritos,
  getCorregimientos,
} from '@/lib/hka/constants/ubicaciones-panama';

describe('Ubicaciones Panamá', () => {
  describe('getDefaultUbicacion', () => {
    it('debe retornar ubicación por defecto válida', () => {
      const ubicacion = getDefaultUbicacion();
      expect(ubicacion).toBeDefined();
      expect(ubicacion.codigo).toBe('8-1-12');
      expect(ubicacion.provincia).toBe('PANAMÁ');
      expect(ubicacion.distrito).toBe('PANAMÁ');
      expect(ubicacion.corregimiento).toBe('SAN FRANCISCO');
    });
  });

  describe('findUbicacion', () => {
    it('debe encontrar ubicación por código válido', () => {
      const ubicacion = findUbicacion('8-1-12');
      expect(ubicacion).toBeDefined();
      expect(ubicacion?.codigo).toBe('8-1-12');
      expect(ubicacion?.provincia).toBe('PANAMÁ');
    });

    it('debe retornar null para código inválido', () => {
      const ubicacion = findUbicacion('99-99-99');
      expect(ubicacion).toBeNull();
    });
  });

  describe('isValidUbicacion', () => {
    it('debe validar código válido', () => {
      expect(isValidUbicacion('8-1-12')).toBe(true);
      expect(isValidUbicacion('8-1-1')).toBe(true);
      expect(isValidUbicacion('3-1-1')).toBe(true);
    });

    it('debe invalidar código inválido', () => {
      expect(isValidUbicacion('99-99-99')).toBe(false);
      expect(isValidUbicacion('invalid')).toBe(false);
      expect(isValidUbicacion('')).toBe(false);
    });
  });

  describe('getUbicacionOrDefault', () => {
    it('debe retornar ubicación encontrada si código es válido', () => {
      const ubicacion = getUbicacionOrDefault('8-1-12');
      expect(ubicacion.codigo).toBe('8-1-12');
    });

    it('debe retornar ubicación por defecto si código es null', () => {
      const ubicacion = getUbicacionOrDefault(null);
      expect(ubicacion.codigo).toBe('8-1-12');
    });

    it('debe retornar ubicación por defecto si código es undefined', () => {
      const ubicacion = getUbicacionOrDefault(undefined);
      expect(ubicacion.codigo).toBe('8-1-12');
    });

    it('debe retornar ubicación por defecto si código es inválido', () => {
      const ubicacion = getUbicacionOrDefault('99-99-99');
      expect(ubicacion.codigo).toBe('8-1-12');
    });
  });

  describe('getProvincias', () => {
    it('debe retornar lista de provincias', () => {
      const provincias = getProvincias();
      expect(provincias).toBeInstanceOf(Array);
      expect(provincias.length).toBeGreaterThan(0);
      expect(provincias).toContain('PANAMÁ');
      expect(provincias).toContain('COLÓN');
      expect(provincias).toContain('CHIRIQUÍ');
    });
  });

  describe('getDistritos', () => {
    it('debe retornar distritos de una provincia', () => {
      const distritos = getDistritos('PANAMÁ');
      expect(distritos).toBeInstanceOf(Array);
      expect(distritos.length).toBeGreaterThan(0);
      expect(distritos).toContain('PANAMÁ');
      expect(distritos).toContain('SAN MIGUELITO');
    });

    it('debe retornar array vacío para provincia inexistente', () => {
      const distritos = getDistritos('PROVINCIA_INEXISTENTE');
      expect(distritos).toBeInstanceOf(Array);
      expect(distritos.length).toBe(0);
    });
  });

  describe('getCorregimientos', () => {
    it('debe retornar corregimientos de un distrito', () => {
      const corregimientos = getCorregimientos('PANAMÁ', 'PANAMÁ');
      expect(corregimientos).toBeInstanceOf(Array);
      expect(corregimientos.length).toBeGreaterThan(0);
      expect(corregimientos).toContain('SAN FRANCISCO');
      expect(corregimientos).toContain('SAN FELIPE');
    });

    it('debe retornar array vacío para distrito inexistente', () => {
      const corregimientos = getCorregimientos('PANAMÁ', 'DISTRITO_INEXISTENTE');
      expect(corregimientos).toBeInstanceOf(Array);
      expect(corregimientos.length).toBe(0);
    });
  });
});

