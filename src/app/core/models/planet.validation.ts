/**
 * Runtime validation utilities for planet models.
 * Provides type guards and validators to catch corrupted JSON/save data.
 */

import type {
  PlanetId,
  PlanetData,
  PlanetState,
  PlanetInitialState,
  PlanetVisualData,
  PlanetVisualParams,
  TerraformingChoice,
} from './planet.model';

/** Valid planet IDs for runtime checks */
const VALID_PLANET_IDS: readonly PlanetId[] = ['earth', 'mercury', 'mars', 'venus'] as const;

/** Validation result with error details */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Type guard for PlanetId */
export function isPlanetId(value: unknown): value is PlanetId {
  return typeof value === 'string' && VALID_PLANET_IDS.includes(value as PlanetId);
}

/** Validates hex color format (#rrggbb) */
export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Validates UV coordinates are in [0,1] range */
export function isValidUvCoordinate(uv: [number, number]): boolean {
  return (
    Array.isArray(uv) &&
    uv.length === 2 &&
    typeof uv[0] === 'number' &&
    typeof uv[1] === 'number' &&
    uv[0] >= 0 &&
    uv[0] <= 1 &&
    uv[1] >= 0 &&
    uv[1] <= 1
  );
}

/** Validates a number is in [0,1] range (for opacity, progress, etc.) */
export function isValidNormalized(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1;
}

/** Validates a number is non-negative */
export function isNonNegative(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/** Validates terraforming progress is in valid range */
export function validateProgress(progress: number): ValidationResult {
  const errors: string[] = [];

  if (typeof progress !== 'number') {
    errors.push('Progress must be a number');
  } else if (isNaN(progress)) {
    errors.push('Progress cannot be NaN');
  } else if (progress < 0) {
    errors.push(`Progress cannot be negative (got ${progress})`);
  } else if (progress > 1) {
    errors.push(`Progress cannot exceed 1.0 (got ${progress})`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validates year range is valid (start <= end) */
export function validateYearRange(startYear: number, endYear: number): ValidationResult {
  const errors: string[] = [];

  if (typeof startYear !== 'number' || isNaN(startYear)) {
    errors.push('startYear must be a valid number');
  }
  if (typeof endYear !== 'number' || isNaN(endYear)) {
    errors.push('endYear must be a valid number');
  }
  if (errors.length === 0 && startYear > endYear) {
    errors.push(`startYear (${startYear}) cannot be after endYear (${endYear})`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validates PlanetVisualParams for runtime safety */
export function validateVisualParams(params: PlanetVisualParams): ValidationResult {
  const errors: string[] = [];

  // Check normalized values (0-1 range)
  const normalizedFields: (keyof PlanetVisualParams)[] = [
    'waterOpacity',
    'greenOpacity',
    'lavaOpacity',
    'lavaHueShift',
    'cloudOpacity',
  ];

  for (const field of normalizedFields) {
    const value = params[field];
    if (typeof value === 'number' && !isValidNormalized(value)) {
      errors.push(`${field} must be in [0,1] range (got ${value})`);
    }
  }

  // Check non-negative values
  const nonNegativeFields: (keyof PlanetVisualParams)[] = [
    'waterGrowthRadius',
    'greenGrowthRadius',
    'atmosphereDensity',
    'cloudRotationSpeed',
    'axisSpinSpeed',
    'cityLightsIntensity',
  ];

  for (const field of nonNegativeFields) {
    const value = params[field];
    if (typeof value === 'number' && !isNonNegative(value)) {
      errors.push(`${field} must be non-negative (got ${value})`);
    }
  }

  // Check hex color
  if (!isValidHexColor(params.atmosphereColor)) {
    errors.push(`atmosphereColor must be valid hex color (got ${params.atmosphereColor})`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validates PlanetVisualData for runtime safety */
export function validateVisualData(data: PlanetVisualData, planetId: PlanetId): ValidationResult {
  const errors: string[] = [];

  // Validate colors
  if (!isValidHexColor(data.baseColor)) {
    errors.push(`baseColor must be valid hex color (got ${data.baseColor})`);
  }

  // Validate UV coordinates
  const validateUvArray = (uvs: [number, number][], fieldName: string) => {
    if (!Array.isArray(uvs)) {
      errors.push(`${fieldName} must be an array`);
      return;
    }
    uvs.forEach((uv, index) => {
      if (!isValidUvCoordinate(uv)) {
        errors.push(`${fieldName}[${index}] has invalid UV coordinates: [${uv}]`);
      }
    });
  };

  validateUvArray(data.waterSpotUvs, 'waterSpotUvs');
  validateUvArray(data.greenSpotUvs, 'greenSpotUvs');

  if (data.lavaSpotUvs) {
    if (planetId !== 'mars') {
      errors.push(`lavaSpotUvs should only be present on Mars (found on ${planetId})`);
    }
    validateUvArray(data.lavaSpotUvs, 'lavaSpotUvs');
  }

  if (data.lavaHueData) {
    if (planetId !== 'mars') {
      errors.push(`lavaHueData should only be present on Mars (found on ${planetId})`);
    }
    const { hotHue, cooledHue } = data.lavaHueData;
    if (typeof hotHue !== 'number' || hotHue < 0 || hotHue > 360) {
      errors.push(`lavaHueData.hotHue must be in [0,360] range (got ${hotHue})`);
    }
    if (typeof cooledHue !== 'number' || cooledHue < 0 || cooledHue > 360) {
      errors.push(`lavaHueData.cooledHue must be in [0,360] range (got ${cooledHue})`);
    }
  }

  if (data.cityLightsTexture && planetId !== 'earth') {
    errors.push(`cityLightsTexture should only be present on Earth (found on ${planetId})`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validates PlanetState for runtime safety */
export function validatePlanetState(state: PlanetState): ValidationResult {
  const errors: string[] = [];

  // Validate planet ID
  if (!isPlanetId(state.id)) {
    errors.push(`Invalid planet ID: ${state.id}`);
  }

  // Validate progress
  const progressResult = validateProgress(state.terraformingProgress);
  errors.push(...progressResult.errors);

  // Validate year range
  const yearRangeResult = validateYearRange(state.terraformStartYear, state.terraformEndYear);
  errors.push(...yearRangeResult.errors);

  // Validate non-negative numbers
  if (!isNonNegative(state.atmospherePressure)) {
    errors.push(`atmospherePressure cannot be negative (got ${state.atmospherePressure})`);
  }

  if (!isNonNegative(state.population)) {
    errors.push(`population cannot be negative (got ${state.population})`);
  }

  // Check for fractional population (warning, not error)
  if (state.population % 1 !== 0) {
    errors.push(`population should be an integer (got ${state.population})`);
  }

  // Validate phase is non-negative integer
  if (!Number.isInteger(state.terraformingPhase) || state.terraformingPhase < 0) {
    errors.push(`terraformingPhase must be non-negative integer (got ${state.terraformingPhase})`);
  }

  // Validate visualParams
  const visualParamsResult = validateVisualParams(state.visualParams);
  errors.push(...visualParamsResult.errors);

  // Check for prototype pollution in terraformingChoices
  if (state.terraformingChoices) {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    for (const key of Object.keys(state.terraformingChoices)) {
      if (dangerousKeys.includes(key)) {
        errors.push(`terraformingChoices contains dangerous key: ${key}`);
      }
    }
  }

  // Check for duplicate entries in lockedOutChoices
  if (state.lockedOutChoices) {
    const uniqueChoices = new Set(state.lockedOutChoices);
    if (uniqueChoices.size !== state.lockedOutChoices.length) {
      errors.push('lockedOutChoices contains duplicate entries');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Validates PlanetData for runtime safety */
export function validatePlanetData(data: PlanetData): ValidationResult {
  const errors: string[] = [];

  if (!isPlanetId(data.id)) {
    errors.push(`Invalid planet ID: ${data.id}`);
  }

  if (!data.displayName || typeof data.displayName !== 'string') {
    errors.push('displayName must be a non-empty string');
  }

  if (data.unlockCondition !== null && typeof data.unlockCondition !== 'string') {
    errors.push('unlockCondition must be string or null');
  }

  // Validate initialState colors
  if (!isValidHexColor(data.initialState.atmosphereColor)) {
    errors.push(
      `initialState.atmosphereColor must be valid hex color (got ${data.initialState.atmosphereColor})`,
    );
  }

  // Validate visual data
  const visualResult = validateVisualData(data.visual, data.id);
  errors.push(...visualResult.errors);

  return { valid: errors.length === 0, errors };
}

/** Sanitizes a potentially corrupted PlanetState by clamping values to safe ranges */
export function sanitizePlanetState(state: PlanetState): PlanetState {
  return {
    ...state,
    terraformingProgress: Math.max(0, Math.min(1, state.terraformingProgress)),
    atmospherePressure: Math.max(0, state.atmospherePressure),
    population: Math.max(0, Math.floor(state.population)), // Force integer, non-negative
    terraformingPhase: Math.max(0, Math.floor(state.terraformingPhase)),
    visualParams: {
      ...state.visualParams,
      waterOpacity: Math.max(0, Math.min(1, state.visualParams.waterOpacity)),
      greenOpacity: Math.max(0, Math.min(1, state.visualParams.greenOpacity)),
      lavaOpacity: Math.max(0, Math.min(1, state.visualParams.lavaOpacity)),
      lavaHueShift: Math.max(0, Math.min(1, state.visualParams.lavaHueShift)),
      cloudOpacity: Math.max(0, Math.min(1, state.visualParams.cloudOpacity)),
      waterGrowthRadius: Math.max(0, state.visualParams.waterGrowthRadius),
      greenGrowthRadius: Math.max(0, state.visualParams.greenGrowthRadius),
      atmosphereDensity: Math.max(0, state.visualParams.atmosphereDensity),
      cloudRotationSpeed: Math.max(0, state.visualParams.cloudRotationSpeed),
      axisSpinSpeed: Math.max(0, state.visualParams.axisSpinSpeed),
      cityLightsIntensity: Math.max(0, state.visualParams.cityLightsIntensity),
    },
    lockedOutChoices: [...new Set(state.lockedOutChoices)], // Remove duplicates
  };
}
