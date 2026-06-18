import type { OrreryVisualEffectsConfig, PlanetOrreryConfig } from './orrery-scene.types';

export const DEFAULT_ORRERY_STARFIELD_OPTIONS = {
  starCount: 320,
  featureStarCount: 8,
  radius: 78,
  depth: -34,
  opacity: 0.82,
} as const;

export const DEFAULT_ORRERY_GRID_OPTIONS = {
  gridOpacity: 0.14,
  orbitOpacity: 0.12,
  showRadialSpokes: true,
  radialSpokeCount: 12,
  yOffset: -0.035,
} as const;

export const DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS = {
  enabled: true,
  litSideBrightness: 1.0,
  darkSideShadowOpacity: 0.9,
  darkSideShadowTint: '#000000',
  cityLightsIntensity: 1.0,
} as const;

export const DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG: OrreryVisualEffectsConfig = {
  fps: null,
  pixelate: {
    enabled: false,
    pixelSize: 3,
  },
  sunGlow: {
    enabled: true,
    color: '',
    size: 15,
    intensity: 0.4,
    textureSize: 256,
  },
  atmosphereGlow: {
    enabled: false,
    thickness: 0.1,
    intensity: 0.75,
  },
};

export const ORRERY_STARFIELD_ROTATION_SPEED = 0;

export const PLANET_ORBITS: Record<string, PlanetOrreryConfig> = {
  mercury: {
    orreryRadius: 5,
    orbitalPeriod: 0.241,
    initialAngle: Math.PI,
    visualRadius: 0.35,
    hitRadius: 0.9,
  },
  venus: {
    orreryRadius: 8,
    orbitalPeriod: 0.615,
    initialAngle: Math.PI * 1.5,
    visualRadius: 0.6,
    hitRadius: 1.3,
  },
  earth: {
    orreryRadius: 11,
    orbitalPeriod: 1.0,
    initialAngle: 0,
    visualRadius: 0.7,
    hitRadius: 1.4,
  },
  mars: {
    orreryRadius: 17,
    orbitalPeriod: 1.881,
    initialAngle: Math.PI / 2,
    visualRadius: 0.55,
    hitRadius: 1.2,
  },
};

/**
 * Multiplier converting (1/orbitalPeriod) into radians-per-frame at ~60 fps.
 * Tune post-playtest; has zero gameplay effect.
 */
export const ORBIT_SPEED_FACTOR = 0.0014;

export const ORRERY_ASSET_PATHS = {
  sunTexture: '/assets/svg/planets/textures/sun-texture.svg',
} as const;

export const ORRERY_ORBIT_RING_CONFIG = {
  segments: 160,
  geometryWidth: 0.9,
  lineWidthPx: 2,
  hitTubeRadius: 0.28,
} as const;
