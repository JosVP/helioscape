/**
 * Comprehensive tests for planet models covering edge cases and failure modes.
 * Tests both the model interfaces and validation utilities.
 */

import { describe, it, expect } from 'vitest';
import type {
  PlanetId,
  PlanetData,
  PlanetState,
  PlanetVisualParams,
  PlanetVisualData,
  TerraformingChoice,
} from './planet.model';
import {
  isPlanetId,
  isValidHexColor,
  isValidUvCoordinate,
  isValidNormalized,
  isNonNegative,
  validateProgress,
  validateYearRange,
  validateVisualParams,
  validateVisualData,
  validatePlanetState,
  validatePlanetData,
  sanitizePlanetState,
} from './planet.validation';

describe('PlanetId validation', () => {
  it('should accept valid planet IDs', () => {
    expect(isPlanetId('earth')).toBe(true);
    expect(isPlanetId('mercury')).toBe(true);
    expect(isPlanetId('mars')).toBe(true);
    expect(isPlanetId('venus')).toBe(true);
  });

  it('should reject invalid planet IDs from corrupted save', () => {
    expect(isPlanetId('europa')).toBe(false);
    expect(isPlanetId('titan')).toBe(false);
    expect(isPlanetId('marss')).toBe(false); // typo
    expect(isPlanetId('Mars')).toBe(false); // case-sensitive
    expect(isPlanetId('')).toBe(false);
    expect(isPlanetId(null)).toBe(false);
    expect(isPlanetId(undefined)).toBe(false);
    expect(isPlanetId(123)).toBe(false);
  });
});

describe('Hex color validation', () => {
  it('should accept valid hex colors', () => {
    expect(isValidHexColor('#ff6347')).toBe(true);
    expect(isValidHexColor('#000000')).toBe(true);
    expect(isValidHexColor('#FFFFFF')).toBe(true);
    expect(isValidHexColor('#abc123')).toBe(true);
  });

  it('should reject colors missing hash prefix', () => {
    expect(isValidHexColor('ff6347')).toBe(false);
  });

  it('should reject invalid hex formats', () => {
    expect(isValidHexColor('#ff634')).toBe(false); // too short
    expect(isValidHexColor('#ff63477')).toBe(false); // too long
    expect(isValidHexColor('#gggggg')).toBe(false); // invalid chars
    expect(isValidHexColor('red')).toBe(false); // color name
    expect(isValidHexColor('')).toBe(false);
    expect(isValidHexColor('#')).toBe(false);
  });
});

describe('UV coordinate validation', () => {
  it('should accept valid UV coordinates in [0,1] range', () => {
    expect(isValidUvCoordinate([0, 0])).toBe(true);
    expect(isValidUvCoordinate([1, 1])).toBe(true);
    expect(isValidUvCoordinate([0.5, 0.5])).toBe(true);
    expect(isValidUvCoordinate([0, 1])).toBe(true);
  });

  it('should reject UV coordinates outside [0,1] range', () => {
    expect(isValidUvCoordinate([0.5, 2.8])).toBe(false); // v > 1
    expect(isValidUvCoordinate([-0.1, 0.5])).toBe(false); // u < 0
    expect(isValidUvCoordinate([1.5, 0.5])).toBe(false); // u > 1
  });

  it('should reject malformed UV coordinates', () => {
    expect(isValidUvCoordinate([0.5] as any)).toBe(false); // missing v
    expect(isValidUvCoordinate([0.5, 0.5, 0] as any)).toBe(false); // too many
    expect(isValidUvCoordinate('0.5,0.5' as any)).toBe(false); // wrong type
    expect(isValidUvCoordinate(null as any)).toBe(false);
  });
});

describe('Normalized value validation (0-1 range)', () => {
  it('should accept values in [0,1] range', () => {
    expect(isValidNormalized(0)).toBe(true);
    expect(isValidNormalized(1)).toBe(true);
    expect(isValidNormalized(0.5)).toBe(true);
    expect(isValidNormalized(0.0001)).toBe(true);
    expect(isValidNormalized(0.9999)).toBe(true);
  });

  it('should reject values outside [0,1] range', () => {
    expect(isValidNormalized(-0.1)).toBe(false);
    expect(isValidNormalized(1.1)).toBe(false);
    expect(isValidNormalized(2)).toBe(false);
  });

  it('should reject NaN and non-numbers', () => {
    expect(isValidNormalized(NaN)).toBe(false);
    expect(isValidNormalized(Infinity)).toBe(false);
    expect(isValidNormalized('0.5' as any)).toBe(false);
  });
});

describe('Progress validation', () => {
  it('should accept valid progress values', () => {
    const result = validateProgress(0.5);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject negative progress', () => {
    const result = validateProgress(-0.1);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Progress cannot be negative (got -0.1)');
  });

  it('should reject progress > 1.0', () => {
    const result = validateProgress(1.5);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Progress cannot exceed 1.0 (got 1.5)');
  });

  it('should handle boundary case: progress exactly 1.0', () => {
    const result = validateProgress(1.0);
    expect(result.valid).toBe(true);
  });

  it('should handle boundary case: progress exactly 0.0', () => {
    const result = validateProgress(0.0);
    expect(result.valid).toBe(true);
  });

  it('should reject NaN progress', () => {
    const result = validateProgress(NaN);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Progress cannot be NaN');
  });
});

describe('Year range validation', () => {
  it('should accept valid year ranges', () => {
    const result = validateYearRange(2100, 2200);
    expect(result.valid).toBe(true);
  });

  it('should reject inverted year ranges (start > end)', () => {
    const result = validateYearRange(2500, 2400);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('startYear (2500) cannot be after endYear (2400)');
  });

  it('should accept equal start and end years', () => {
    const result = validateYearRange(2100, 2100);
    expect(result.valid).toBe(true);
  });

  it('should reject NaN years', () => {
    const result = validateYearRange(NaN, 2200);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('startYear must be a valid number');
  });
});

describe('PlanetVisualParams validation', () => {
  const validParams: PlanetVisualParams = {
    waterGrowthRadius: 0.5,
    waterOpacity: 0.8,
    greenGrowthRadius: 0.3,
    greenOpacity: 0.6,
    lavaOpacity: 0,
    lavaHueShift: 0,
    cloudOpacity: 0.4,
    atmosphereDensity: 0.5,
    atmosphereColor: '#87ceeb',
    cloudRotationSpeed: 0.01,
    axisSpinSpeed: 0.02,
    cityLightsIntensity: 0.9,
  };

  it('should accept valid visual params', () => {
    const result = validateVisualParams(validParams);
    expect(result.valid).toBe(true);
  });

  it('should reject opacity values outside [0,1] range', () => {
    const params = { ...validParams, waterOpacity: 1.5 };
    const result = validateVisualParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('waterOpacity must be in [0,1] range (got 1.5)');
  });

  it('should reject negative growth radius', () => {
    const params = { ...validParams, waterGrowthRadius: -0.1 };
    const result = validateVisualParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('waterGrowthRadius must be non-negative (got -0.1)');
  });

  it('should reject invalid hex color', () => {
    const params = { ...validParams, atmosphereColor: 'blue' };
    const result = validateVisualParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('atmosphereColor must be valid hex color (got blue)');
  });

  it('should reject NaN values', () => {
    const params = { ...validParams, lavaHueShift: NaN };
    const result = validateVisualParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('lavaHueShift');
  });
});

describe('PlanetVisualData validation', () => {
  const validMarsVisual: PlanetVisualData = {
    baseColor: '#cd5c5c',
    layerTextures: { base: '/assets/mars_base.png' },
    waterSpotUvs: [[0.5, 0.5]],
    greenSpotUvs: [[0.3, 0.7]],
    lavaSpotUvs: [[0.8, 0.2]],
    lavaHueData: { hotHue: 0, cooledHue: 20 },
  };

  it('should accept valid Mars visual data', () => {
    const result = validateVisualData(validMarsVisual, 'mars');
    expect(result.valid).toBe(true);
  });

  it('should warn when Mars-specific fields appear on Venus', () => {
    const result = validateVisualData(validMarsVisual, 'venus');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('lavaSpotUvs should only be present on Mars (found on venus)');
    expect(result.errors).toContain('lavaHueData should only be present on Mars (found on venus)');
  });

  it('should warn when Earth-specific fields appear on Mars', () => {
    const earthVisual: PlanetVisualData = {
      ...validMarsVisual,
      cityLightsTexture: '/assets/city_lights.png',
    };
    const result = validateVisualData(earthVisual, 'mars');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'cityLightsTexture should only be present on Earth (found on mars)',
    );
  });

  it('should reject UV coordinates outside [0,1] range', () => {
    const visual = {
      ...validMarsVisual,
      waterSpotUvs: [[0.5, 2.8]] as [number, number][],
    };
    const result = validateVisualData(visual, 'mars');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('waterSpotUvs[0] has invalid UV coordinates');
  });

  it('should reject invalid base color', () => {
    const visual = { ...validMarsVisual, baseColor: 'red' };
    const result = validateVisualData(visual, 'mars');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('baseColor must be valid hex color (got red)');
  });

  it('should handle empty UV arrays', () => {
    const visual = {
      ...validMarsVisual,
      waterSpotUvs: [],
    };
    const result = validateVisualData(visual, 'mars');
    expect(result.valid).toBe(true); // Empty is valid, just no spots
  });
});

describe('PlanetState validation', () => {
  const validState: PlanetState = {
    id: 'mars',
    atmospherePressure: 0.008,
    temperatureCelsius: -60,
    terraformingPhase: 1,
    terraformingProgress: 0.5,
    terraformingChoices: {
      mars_polar_detonation: { active: true, startedYear: 2100, permanent: false },
    },
    lockedOutChoices: [],
    population: 1000,
    hasBiodome: true,
    visualParams: {
      waterGrowthRadius: 0.5,
      waterOpacity: 0.8,
      greenGrowthRadius: 0.3,
      greenOpacity: 0.6,
      lavaOpacity: 0,
      lavaHueShift: 0,
      cloudOpacity: 0.4,
      atmosphereDensity: 0.5,
      atmosphereColor: '#cd853f',
      cloudRotationSpeed: 0.01,
      axisSpinSpeed: 0.02,
      cityLightsIntensity: 0,
    },
    terraformStartYear: 2100,
    terraformEndYear: 2200,
  };

  it('should accept valid planet state', () => {
    const result = validatePlanetState(validState);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid planet ID', () => {
    const state = { ...validState, id: 'europa' as PlanetId };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid planet ID: europa');
  });

  it('should reject negative atmosphere pressure from underflow', () => {
    const state = { ...validState, atmospherePressure: -5 };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('atmospherePressure cannot be negative (got -5)');
  });

  it('should reject fractional population', () => {
    const state = { ...validState, population: 127.3 };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('population should be an integer (got 127.3)');
  });

  it('should reject negative population', () => {
    const state = { ...validState, population: -5 };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('population cannot be negative (got -5)');
  });

  it('should allow hasBiodome true with zero population (inconsistent but not invalid)', () => {
    const state = { ...validState, population: 0, hasBiodome: true };
    const result = validatePlanetState(state);
    // Structure is valid even if logically inconsistent
    expect(result.valid).toBe(true);
  });

  it('should reject inverted year range', () => {
    const state = { ...validState, terraformStartYear: 2500, terraformEndYear: 2400 };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('startYear (2500) cannot be after endYear (2400)');
  });

  it('should reject fractional terraforming phase', () => {
    const state = { ...validState, terraformingPhase: 1.5 };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('terraformingPhase must be non-negative integer (got 1.5)');
  });

  it('should detect prototype pollution in terraformingChoices', () => {
    const state = {
      ...validState,
      terraformingChoices: {
        mars_polar_detonation: { active: true, startedYear: 2100, permanent: false },
        __proto__: { active: true, startedYear: 2100, permanent: false },
      } as any,
    };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('terraformingChoices contains dangerous key: __proto__');
  });

  it('should detect duplicates in lockedOutChoices', () => {
    const state = {
      ...validState,
      lockedOutChoices: ['mars_magnetic_umbrella', 'mars_magnetic_umbrella'],
    };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('lockedOutChoices contains duplicate entries');
  });

  it('should detect invalid visual params within state', () => {
    const state = {
      ...validState,
      visualParams: {
        ...validState.visualParams,
        waterOpacity: 1.5, // Out of range
      },
    };
    const result = validatePlanetState(state);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('waterOpacity must be in [0,1] range');
  });
});

describe('PlanetData validation', () => {
  const validData: PlanetData = {
    id: 'mars',
    displayName: 'Mars',
    unlockCondition: 'mercury_phase_2',
    initialState: {
      atmospherePressure: 0.006,
      temperatureCelsius: -63,
      terraformingPhase: 0,
      axisSpinSpeed: 0.015,
      cloudRotationSpeed: 0,
      atmosphereColor: '#ffcba4',
      atmosphereDensity: 0.01,
    },
    visual: {
      baseColor: '#cd5c5c',
      layerTextures: { base: '/assets/mars_base.png' },
      waterSpotUvs: [[0.5, 0.5]],
      greenSpotUvs: [[0.3, 0.7]],
      lavaSpotUvs: [[0.8, 0.2]],
      lavaHueData: { hotHue: 0, cooledHue: 20 },
    },
  };

  it('should accept valid planet data', () => {
    const result = validatePlanetData(validData);
    expect(result.valid).toBe(true);
  });

  it('should accept null unlockCondition for Earth', () => {
    const earthVisual: PlanetVisualData = {
      baseColor: '#4169e1',
      layerTextures: { base: '/assets/earth_base.png' },
      waterSpotUvs: [[0.5, 0.5]],
      greenSpotUvs: [[0.3, 0.7]],
      cityLightsTexture: '/assets/city_lights.png',
    };
    const data = {
      ...validData,
      id: 'earth' as PlanetId,
      unlockCondition: null,
      visual: earthVisual,
    };
    const result = validatePlanetData(data);
    expect(result.valid).toBe(true);
  });

  it('should reject empty displayName', () => {
    const data = { ...validData, displayName: '' };
    const result = validatePlanetData(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('displayName must be a non-empty string');
  });

  it('should cascade validation to visual data', () => {
    const data = {
      ...validData,
      visual: {
        ...validData.visual,
        baseColor: 'red', // Invalid
      },
    };
    const result = validatePlanetData(data);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('baseColor must be valid hex color');
  });
});

describe('sanitizePlanetState', () => {
  it('should clamp terraformingProgress to [0,1] range', () => {
    const state: PlanetState = {
      id: 'mars',
      atmospherePressure: 0.008,
      temperatureCelsius: -60,
      terraformingPhase: 1,
      terraformingProgress: 1.5, // Out of range
      terraformingChoices: {},
      lockedOutChoices: [],
      population: 1000,
      hasBiodome: true,
      visualParams: {} as PlanetVisualParams,
      terraformStartYear: 2100,
      terraformEndYear: 2200,
    };

    const sanitized = sanitizePlanetState(state);
    expect(sanitized.terraformingProgress).toBe(1.0);
  });

  it('should floor fractional population to integer', () => {
    const state: PlanetState = {
      id: 'mars',
      atmospherePressure: 0.008,
      temperatureCelsius: -60,
      terraformingPhase: 1,
      terraformingProgress: 0.5,
      terraformingChoices: {},
      lockedOutChoices: [],
      population: 127.3,
      hasBiodome: true,
      visualParams: {} as PlanetVisualParams,
      terraformStartYear: 2100,
      terraformEndYear: 2200,
    };

    const sanitized = sanitizePlanetState(state);
    expect(sanitized.population).toBe(127);
  });

  it('should clamp negative atmospherePressure to zero', () => {
    const state: PlanetState = {
      id: 'venus',
      atmospherePressure: -5,
      temperatureCelsius: 460,
      terraformingPhase: 2,
      terraformingProgress: 0.3,
      terraformingChoices: {},
      lockedOutChoices: [],
      population: 0,
      hasBiodome: false,
      visualParams: {} as PlanetVisualParams,
      terraformStartYear: 2200,
      terraformEndYear: 2300,
    };

    const sanitized = sanitizePlanetState(state);
    expect(sanitized.atmospherePressure).toBe(0);
  });

  it('should remove duplicate entries from lockedOutChoices', () => {
    const state: PlanetState = {
      id: 'mars',
      atmospherePressure: 0.008,
      temperatureCelsius: -60,
      terraformingPhase: 1,
      terraformingProgress: 0.5,
      terraformingChoices: {},
      lockedOutChoices: ['choice_a', 'choice_b', 'choice_a', 'choice_c', 'choice_b'],
      population: 1000,
      hasBiodome: true,
      visualParams: {} as PlanetVisualParams,
      terraformStartYear: 2100,
      terraformEndYear: 2200,
    };

    const sanitized = sanitizePlanetState(state);
    expect(sanitized.lockedOutChoices).toEqual(['choice_a', 'choice_b', 'choice_c']);
  });

  it('should clamp all visual param opacities to [0,1]', () => {
    const state: PlanetState = {
      id: 'mars',
      atmospherePressure: 0.008,
      temperatureCelsius: -60,
      terraformingPhase: 1,
      terraformingProgress: 0.5,
      terraformingChoices: {},
      lockedOutChoices: [],
      population: 1000,
      hasBiodome: true,
      visualParams: {
        waterGrowthRadius: 0.5,
        waterOpacity: 1.8, // Out of range
        greenGrowthRadius: 0.3,
        greenOpacity: -0.2, // Out of range
        lavaOpacity: 0.5,
        lavaHueShift: 1.5, // Out of range
        cloudOpacity: 0.4,
        atmosphereDensity: 0.5,
        atmosphereColor: '#cd853f',
        cloudRotationSpeed: 0.01,
        axisSpinSpeed: 0.02,
        cityLightsIntensity: 0,
      },
      terraformStartYear: 2100,
      terraformEndYear: 2200,
    };

    const sanitized = sanitizePlanetState(state);
    expect(sanitized.visualParams.waterOpacity).toBe(1.0);
    expect(sanitized.visualParams.greenOpacity).toBe(0);
    expect(sanitized.visualParams.lavaHueShift).toBe(1.0);
  });
});

describe('Edge case scenarios', () => {
  it('scenario: progress exactly 1.0 at save boundary', () => {
    const state: PlanetState = {
      ...validState,
      terraformingProgress: 1.0, // Exactly at boundary
    };

    const result = validatePlanetState(state);
    expect(result.valid).toBe(true);
    expect(state.terraformingProgress).toBe(1.0);
  });

  it('scenario: year range with equal start and end (instant transition)', () => {
    const result = validateYearRange(2100, 2100);
    expect(result.valid).toBe(true);
  });

  it('scenario: very large terraformingChoices Record (performance)', () => {
    const manyChoices: Record<string, TerraformingChoice> = {};
    for (let i = 0; i < 100; i++) {
      manyChoices[`choice_${i}`] = { active: true, startedYear: 2100 + i, permanent: false };
    }

    const state: PlanetState = {
      ...validState,
      terraformingChoices: manyChoices,
    };

    const startTime = performance.now();
    const result = validatePlanetState(state);
    const duration = performance.now() - startTime;

    expect(result.valid).toBe(true);
    expect(duration).toBeLessThan(10); // Should validate in < 10ms
  });
});
