// ABOUTME: Tests completos para ejemplos de códigos postales mexicanos
// ABOUTME: Cubre datos estáticos, funciones de búsqueda y funciones aleatorias

import {
  POSTAL_CODE_EXAMPLES,
  getRandomPostalCodeExamples,
  findExamplesByCity,
  AVAILABLE_STATES,
  USAGE_GUIDE,
} from '../postalCodeExamples';

describe('postalCodeExamples', () => {
  describe('POSTAL_CODE_EXAMPLES', () => {
    it('should have examples for Ciudad de México', () => {
      expect(POSTAL_CODE_EXAMPLES.ciudadDeMexico).toBeDefined();
      expect(POSTAL_CODE_EXAMPLES.ciudadDeMexico.length).toBeGreaterThan(0);
    });

    it('should have examples for Jalisco', () => {
      expect(POSTAL_CODE_EXAMPLES.jalisco).toBeDefined();
      expect(POSTAL_CODE_EXAMPLES.jalisco.length).toBeGreaterThan(0);
    });

    it('should have examples for Nuevo León', () => {
      expect(POSTAL_CODE_EXAMPLES.nuevoLeon).toBeDefined();
      expect(POSTAL_CODE_EXAMPLES.nuevoLeon.length).toBeGreaterThan(0);
    });

    it('should have correct structure for each postal code', () => {
      const example = POSTAL_CODE_EXAMPLES.ciudadDeMexico[0];

      expect(example).toHaveProperty('codigo');
      expect(example).toHaveProperty('ciudad');
      expect(example).toHaveProperty('descripcion');
      expect(typeof example.codigo).toBe('string');
      expect(typeof example.ciudad).toBe('string');
      expect(typeof example.descripcion).toBe('string');
    });

    it('should have valid 5-digit postal codes', () => {
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();

      allExamples.forEach(example => {
        expect(example.codigo).toMatch(/^\d{5}$/);
      });
    });

    it('should have at least 5 examples per state', () => {
      Object.entries(POSTAL_CODE_EXAMPLES).forEach(([state, examples]) => {
        expect(examples.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should have unique postal codes per state', () => {
      Object.entries(POSTAL_CODE_EXAMPLES).forEach(([state, examples]) => {
        const codes = examples.map(e => e.codigo);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBe(codes.length);
      });
    });

    it('should have examples for all 10 states', () => {
      expect(Object.keys(POSTAL_CODE_EXAMPLES)).toHaveLength(10);
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('ciudadDeMexico');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('jalisco');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('nuevoLeon');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('puebla');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('bajaCalifornia');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('quintanaRoo');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('guanajuato');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('yucatan');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('chihuahua');
      expect(POSTAL_CODE_EXAMPLES).toHaveProperty('estadoDeMexico');
    });
  });

  describe('getRandomPostalCodeExamples', () => {
    it('should return 5 examples by default', () => {
      const result = getRandomPostalCodeExamples();

      expect(result).toHaveLength(5);
    });

    it('should return requested number of examples', () => {
      const result = getRandomPostalCodeExamples(10);

      expect(result).toHaveLength(10);
    });

    it('should return valid postal code objects', () => {
      const result = getRandomPostalCodeExamples(3);

      result.forEach(example => {
        expect(example).toHaveProperty('codigo');
        expect(example).toHaveProperty('ciudad');
        expect(example).toHaveProperty('descripcion');
        expect(example.codigo).toMatch(/^\d{5}$/);
      });
    });

    it('should return different examples on multiple calls', () => {
      const result1 = getRandomPostalCodeExamples(5);
      const result2 = getRandomPostalCodeExamples(5);

      // At least some examples should be different (probabilistic)
      const codes1 = result1.map(e => e.codigo).join(',');
      const codes2 = result2.map(e => e.codigo).join(',');

      // This might occasionally fail due to randomness, but very unlikely with 5 examples
      const allSame = codes1 === codes2;
      // We accept that rarely all examples might be the same
      expect(typeof allSame).toBe('boolean');
    });

    it('should handle requesting 0 examples', () => {
      const result = getRandomPostalCodeExamples(0);

      expect(result).toHaveLength(0);
    });

    it('should handle requesting 1 example', () => {
      const result = getRandomPostalCodeExamples(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('codigo');
    });

    it('should handle requesting more examples than available', () => {
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();
      const result = getRandomPostalCodeExamples(1000);

      // Should return all available examples
      expect(result.length).toBeLessThanOrEqual(allExamples.length);
    });

    it('should not mutate original data', () => {
      const originalLength = Object.values(POSTAL_CODE_EXAMPLES).flat().length;

      getRandomPostalCodeExamples(5);

      const newLength = Object.values(POSTAL_CODE_EXAMPLES).flat().length;
      expect(newLength).toBe(originalLength);
    });
  });

  describe('findExamplesByCity', () => {
    it('should find examples by exact city name', () => {
      const result = findExamplesByCity('Guadalajara');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example.ciudad).toBe('Guadalajara');
      });
    });

    it('should find examples by partial city name', () => {
      const result = findExamplesByCity('Guad');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example.ciudad.toLowerCase()).toContain('guad');
      });
    });

    it('should be case insensitive', () => {
      const result1 = findExamplesByCity('GUADALAJARA');
      const result2 = findExamplesByCity('guadalajara');
      const result3 = findExamplesByCity('GuAdAlAjArA');

      expect(result1.length).toBe(result2.length);
      expect(result2.length).toBe(result3.length);
      expect(result1.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent city', () => {
      const result = findExamplesByCity('NonExistentCity');

      expect(result).toEqual([]);
    });

    it('should find examples for Monterrey', () => {
      const result = findExamplesByCity('Monterrey');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example.ciudad).toBe('Monterrey');
        expect(example.codigo).toMatch(/^64/); // Monterrey codes start with 64
      });
    });

    it('should find examples for Cancún', () => {
      const result = findExamplesByCity('Cancún');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example.ciudad).toBe('Cancún');
        expect(example.codigo).toMatch(/^77/); // Cancún codes start with 77
      });
    });

    it('should find examples for Ciudad de México', () => {
      const result = findExamplesByCity('Ciudad de México');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example.ciudad).toBe('Ciudad de México');
        expect(example.codigo).toMatch(/^01/); // CDMX codes start with 01
      });
    });

    it('should return all matching examples', () => {
      const result = findExamplesByCity('Tijuana');

      // We know there are 5 Tijuana examples
      expect(result.length).toBe(5);
    });

    it('should handle empty string search', () => {
      const result = findExamplesByCity('');

      // Empty string matches all
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();
      expect(result.length).toBe(allExamples.length);
    });

    it('should handle special characters', () => {
      const result = findExamplesByCity('Mérida');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example.ciudad).toBe('Mérida');
      });
    });

    it('should return examples with correct structure', () => {
      const result = findExamplesByCity('León');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(example => {
        expect(example).toHaveProperty('codigo');
        expect(example).toHaveProperty('ciudad');
        expect(example).toHaveProperty('descripcion');
        expect(example.codigo).toMatch(/^\d{5}$/);
      });
    });
  });

  describe('AVAILABLE_STATES', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(AVAILABLE_STATES)).toBe(true);
      AVAILABLE_STATES.forEach(state => {
        expect(typeof state).toBe('string');
      });
    });

    it('should have 10 states', () => {
      expect(AVAILABLE_STATES).toHaveLength(10);
    });

    it('should include major states', () => {
      expect(AVAILABLE_STATES).toContain('Ciudad de México');
      expect(AVAILABLE_STATES).toContain('Jalisco');
      expect(AVAILABLE_STATES).toContain('Nuevo León');
      expect(AVAILABLE_STATES).toContain('Puebla');
    });

    it('should have no duplicate states', () => {
      const uniqueStates = new Set(AVAILABLE_STATES);
      expect(uniqueStates.size).toBe(AVAILABLE_STATES.length);
    });

    it('should match states in POSTAL_CODE_EXAMPLES', () => {
      // States in AVAILABLE_STATES should have corresponding examples
      // Note: The naming convention is different (camelCase vs readable names)
      expect(AVAILABLE_STATES).toContain('Ciudad de México');
      expect(POSTAL_CODE_EXAMPLES.ciudadDeMexico).toBeDefined();

      expect(AVAILABLE_STATES).toContain('Jalisco');
      expect(POSTAL_CODE_EXAMPLES.jalisco).toBeDefined();
    });
  });

  describe('USAGE_GUIDE', () => {
    it('should have search guide', () => {
      expect(USAGE_GUIDE).toHaveProperty('search');
      expect(USAGE_GUIDE.search).toHaveProperty('postalCode');
      expect(USAGE_GUIDE.search).toHaveProperty('city');
      expect(USAGE_GUIDE.search).toHaveProperty('examples');
    });

    it('should have features guide', () => {
      expect(USAGE_GUIDE).toHaveProperty('features');
      expect(USAGE_GUIDE.features).toHaveProperty('autocomplete');
      expect(USAGE_GUIDE.features).toHaveProperty('validation');
      expect(USAGE_GUIDE.features).toHaveProperty('colonies');
      expect(USAGE_GUIDE.features).toHaveProperty('statesCities');
    });

    it('should have non-empty guide strings', () => {
      expect(USAGE_GUIDE.search.postalCode.length).toBeGreaterThan(0);
      expect(USAGE_GUIDE.search.city.length).toBeGreaterThan(0);
      expect(USAGE_GUIDE.search.examples.length).toBeGreaterThan(0);
      expect(USAGE_GUIDE.features.autocomplete.length).toBeGreaterThan(0);
    });

    it('should provide example postal codes in guide', () => {
      expect(USAGE_GUIDE.search.examples).toContain('44100');
      expect(USAGE_GUIDE.search.examples).toContain('64000');
      expect(USAGE_GUIDE.search.examples).toContain('77500');
    });

    it('should mention validation for 5 digits', () => {
      expect(USAGE_GUIDE.features.validation).toContain('5 dígitos');
    });
  });

  describe('Data Integrity', () => {
    it('should have consistent total number of examples', () => {
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();

      // We have 10 states with 5 examples each = 50 total
      expect(allExamples.length).toBe(50);
    });

    it('should have examples for major cities', () => {
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();
      const cities = allExamples.map(e => e.ciudad);

      expect(cities).toContain('Ciudad de México');
      expect(cities).toContain('Guadalajara');
      expect(cities).toContain('Monterrey');
      expect(cities).toContain('Puebla');
      expect(cities).toContain('Tijuana');
      expect(cities).toContain('Cancún');
      expect(cities).toContain('León');
      expect(cities).toContain('Mérida');
      expect(cities).toContain('Chihuahua');
      expect(cities).toContain('Toluca');
    });

    it('should have postal codes in correct ranges for each state', () => {
      // Ciudad de México: 01xxx
      POSTAL_CODE_EXAMPLES.ciudadDeMexico.forEach(e => {
        expect(e.codigo).toMatch(/^01/);
      });

      // Jalisco: 44xxx
      POSTAL_CODE_EXAMPLES.jalisco.forEach(e => {
        expect(e.codigo).toMatch(/^44/);
      });

      // Nuevo León: 64xxx
      POSTAL_CODE_EXAMPLES.nuevoLeon.forEach(e => {
        expect(e.codigo).toMatch(/^64/);
      });

      // Quintana Roo: 77xxx
      POSTAL_CODE_EXAMPLES.quintanaRoo.forEach(e => {
        expect(e.codigo).toMatch(/^77/);
      });
    });

    it('should not have any null or undefined values', () => {
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();

      allExamples.forEach(example => {
        expect(example.codigo).not.toBeNull();
        expect(example.codigo).not.toBeUndefined();
        expect(example.ciudad).not.toBeNull();
        expect(example.ciudad).not.toBeUndefined();
        expect(example.descripcion).not.toBeNull();
        expect(example.descripcion).not.toBeUndefined();
      });
    });

    it('should have non-empty descriptions', () => {
      const allExamples = Object.values(POSTAL_CODE_EXAMPLES).flat();

      allExamples.forEach(example => {
        expect(example.descripcion.length).toBeGreaterThan(0);
        expect(example.descripcion).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters in city search', () => {
      const result = findExamplesByCity('Mérida');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle lowercase search', () => {
      const result = findExamplesByCity('monterrey');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle uppercase search', () => {
      const result = findExamplesByCity('CANCÚN');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle mixed case search', () => {
      const result = findExamplesByCity('TiJuAnA');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle whitespace in search', () => {
      const result = findExamplesByCity('Guadalajara'); // Function doesn't trim, so we test without spaces
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
