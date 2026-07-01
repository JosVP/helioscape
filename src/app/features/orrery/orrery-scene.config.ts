import type { OrreryVisualEffectsConfig, PlanetOrreryConfig } from './orrery-scene.types';

export const DEFAULT_ORRERY_CAMERA_CONFIG = {
  position: {
    x: 10,
    y: 9.7,
    z: 18,
  },
  lookAt: {
    x: 0,
    y: 0,
    z: 0,
  },
  orthographicViewHeight: 16.3,
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
  terminatorSoftness: 0.4,
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
    size: 3,
    intensity: 1,
    textureSize: 256,
  },
  atmosphereGlow: {
    enabled: true,
    thickness: 1,
    intensity: 4,
  },
};

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
    orreryRadius: 15.8,
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
