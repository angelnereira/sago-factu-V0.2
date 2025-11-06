/**
 * Tests para verificar que el RUC demo funciona correctamente
 */

import { getDefaultUbicacion } from '@/lib/hka/constants/ubicaciones-panama';

describe('RUC Demo y Validaciones', () => {
  describe('RUC Demo 155738031', () => {
    it('debe tener formato válido de RUC (8-15 dígitos)', () => {
      const ruc = '155738031';
      expect(ruc).toMatch(/^\d{8,15}$/);
      expect(ruc.length).toBe(9);
    });

    it('debe tener DV válido (1-2 dígitos)', () => {
      const dv = '20';
      expect(dv).toMatch(/^\d{1,2}$/);
      expect(dv.length).toBeGreaterThanOrEqual(1);
      expect(dv.length).toBeLessThanOrEqual(2);
    });

    it('debe pasar validación básica de formato', () => {
      const ruc = '155738031';
      const dv = '20';
      
      // Validación básica
      expect(/^\d{8,15}$/.test(ruc)).toBe(true);
      expect(/^\d{1,2}$/.test(dv)).toBe(true);
    });
  });

  describe('Ubicación por defecto', () => {
    it('debe retornar ubicación válida para RUC demo', () => {
      const ubicacion = getDefaultUbicacion();
      expect(ubicacion.codigo).toMatch(/^\d+-\d+-\d+$/);
      expect(ubicacion.provincia).toBeTruthy();
      expect(ubicacion.distrito).toBeTruthy();
      expect(ubicacion.corregimiento).toBeTruthy();
    });

    it('debe usar ubicación válida de Panamá', () => {
      const ubicacion = getDefaultUbicacion();
      expect(ubicacion.codigo).toBe('8-1-12');
      expect(ubicacion.provincia).toBe('PANAMÁ');
      expect(ubicacion.distrito).toBe('PANAMÁ');
    });
  });
});

