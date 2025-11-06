// ABOUTME: Tests comprehensivos para postalCodeService
// ABOUTME: Cubre búsquedas de códigos postales mexicanos, validaciones y filtros

import { PostalCodeService } from '../postalCodeService';

describe('PostalCodeService', () => {
  describe('findByPostalCode', () => {
    it('should find postal code info', () => {
      const result = PostalCodeService.findByPostalCode('44100');

      expect(result).not.toBeNull();
      expect(result?.codigoPostal).toBe('44100');
      expect(result?.estado).toBe('Jalisco');
    });

    it('should clean non-digit characters', () => {
      const result = PostalCodeService.findByPostalCode('441-00');

      expect(result).not.toBeNull();
      expect(result?.codigoPostal).toBe('44100');
    });

    it('should return null for not found postal code', () => {
      const result = PostalCodeService.findByPostalCode('99999');

      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = PostalCodeService.findByPostalCode('');

      expect(result).toBeNull();
    });
  });

  describe('searchPostalCodes', () => {
    it('should search postal codes by partial match', () => {
      const results = PostalCodeService.searchPostalCodes('441');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.codigoPostal).toMatch(/^441/);
      });
    });

    it('should limit results', () => {
      const results = PostalCodeService.searchPostalCodes('44', 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for no matches', () => {
      const results = PostalCodeService.searchPostalCodes('99999');

      expect(results).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const results = PostalCodeService.searchPostalCodes('');

      expect(results).toEqual([]);
    });

    it('should handle special characters', () => {
      const results = PostalCodeService.searchPostalCodes('44-1');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findByCiudad', () => {
    it('should find by ciudad name', () => {
      const results = PostalCodeService.findByCiudad('Guadalajara');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.ciudad.toLowerCase()).toContain('guadalajara');
      });
    });

    it('should be case insensitive', () => {
      const results = PostalCodeService.findByCiudad('guadalajara');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should limit results', () => {
      const results = PostalCodeService.findByCiudad('Guadalajara', 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for empty string', () => {
      const results = PostalCodeService.findByCiudad('');

      expect(results).toEqual([]);
    });

    it('should handle partial matches', () => {
      const results = PostalCodeService.findByCiudad('Guad');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('findByEstado', () => {
    it('should find by estado name', () => {
      const results = PostalCodeService.findByEstado('Jalisco');

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.estado).toBe('Jalisco');
      });
    });

    it('should be case insensitive', () => {
      const results = PostalCodeService.findByEstado('jalisco');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should limit results', () => {
      const results = PostalCodeService.findByEstado('Jalisco', 10);

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array for empty string', () => {
      const results = PostalCodeService.findByEstado('');

      expect(results).toEqual([]);
    });
  });

  describe('getAllEstados', () => {
    it('should return unique estados', () => {
      const estados = PostalCodeService.getAllEstados();

      expect(estados.length).toBeGreaterThan(0);
      expect(new Set(estados).size).toBe(estados.length);
    });

    it('should return sorted estados', () => {
      const estados = PostalCodeService.getAllEstados();
      const sorted = [...estados].sort();

      expect(estados).toEqual(sorted);
    });

    it('should include known estados', () => {
      const estados = PostalCodeService.getAllEstados();

      expect(estados).toContain('Jalisco');
      expect(estados).toContain('Ciudad de México');
      expect(estados).toContain('Nuevo León');
    });
  });

  describe('getCiudadesByEstado', () => {
    it('should return ciudades for estado', () => {
      const ciudades = PostalCodeService.getCiudadesByEstado('Jalisco');

      expect(ciudades.length).toBeGreaterThan(0);
      expect(ciudades).toContain('Guadalajara');
    });

    it('should return unique ciudades', () => {
      const ciudades = PostalCodeService.getCiudadesByEstado('Jalisco');

      expect(new Set(ciudades).size).toBe(ciudades.length);
    });

    it('should return sorted ciudades', () => {
      const ciudades = PostalCodeService.getCiudadesByEstado('Jalisco');
      const sorted = [...ciudades].sort();

      expect(ciudades).toEqual(sorted);
    });

    it('should return empty array for non-existent estado', () => {
      const ciudades = PostalCodeService.getCiudadesByEstado('NonExistent');

      expect(ciudades).toEqual([]);
    });
  });

  describe('isValidMexicanPostalCode', () => {
    it('should validate correct postal codes', () => {
      expect(PostalCodeService.isValidMexicanPostalCode('44100')).toBe(true);
      expect(PostalCodeService.isValidMexicanPostalCode('01000')).toBe(true);
      expect(PostalCodeService.isValidMexicanPostalCode('64000')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(PostalCodeService.isValidMexicanPostalCode('441')).toBe(false);
      expect(PostalCodeService.isValidMexicanPostalCode('4410000')).toBe(false);
      expect(PostalCodeService.isValidMexicanPostalCode('abcde')).toBe(false);
      expect(PostalCodeService.isValidMexicanPostalCode('')).toBe(false);
    });

    it('should clean special characters before validation', () => {
      expect(PostalCodeService.isValidMexicanPostalCode('441-00')).toBe(true);
      expect(PostalCodeService.isValidMexicanPostalCode('44 100')).toBe(true);
    });
  });

  describe('formatPostalCode', () => {
    it('should format valid postal codes', () => {
      expect(PostalCodeService.formatPostalCode('44100')).toBe('44100');
      expect(PostalCodeService.formatPostalCode('01000')).toBe('01000');
    });

    it('should clean special characters', () => {
      expect(PostalCodeService.formatPostalCode('441-00')).toBe('44100');
      expect(PostalCodeService.formatPostalCode('4 4 1 0 0')).toBe('44100');
    });

    it('should return original for invalid codes', () => {
      expect(PostalCodeService.formatPostalCode('441')).toBe('441');
      expect(PostalCodeService.formatPostalCode('abc')).toBe('abc');
    });

    it('should handle empty string', () => {
      expect(PostalCodeService.formatPostalCode('')).toBe('');
    });
  });
});
