import * as THREE from 'three';

export interface OrreryBackdropPalette {
  readonly backgroundCore: string;
  readonly backgroundEdge: string;
  readonly grid: string;
  readonly orbit: string;
  readonly orbitHover: string;
  readonly star: string;
  readonly featureStar: string;
}

export interface OrreryStarfieldOptions {
  readonly palette: OrreryBackdropPalette;
  readonly starCount?: number;
  readonly featureStarCount?: number;
  readonly radius?: number;
  readonly depth?: number;
  readonly opacity?: number;
}

export interface OrreryGridOptions {
  readonly color: string;
  readonly opacity?: number;
  readonly showRadialSpokes?: boolean;
  readonly radialSpokeCount?: number;
  readonly yOffset?: number;
}

export interface OrreryOrbitStyleOptions {
  readonly color: string;
  readonly opacity?: number;
}

export interface OrreryDayNightLightingOptions {
  readonly enabled?: boolean;
  readonly litSideBrightness?: number;
  readonly darkSideShadowOpacity?: number;
  readonly darkSideShadowTint?: string;
  readonly cityLightsIntensity?: number;
}

export interface OrreryPixelateConfig {
  readonly enabled: boolean;
  readonly pixelSize: number;
}

export interface OrrerySunGlowConfig {
  readonly enabled: boolean;
  /** Resolved CSS token color. */
  readonly color: string;
  readonly size: number;
  readonly intensity: number;
  readonly textureSize?: number;
}

export interface OrreryAtmosphereGlowConfig {
  readonly enabled: boolean;
  readonly thickness: number;
  readonly intensity: number;
}

export interface OrreryVisualEffectsConfig {
  /** Target render/update FPS for the visual scene; null keeps browser-native RAF cadence. */
  readonly fps: number | null;
  readonly pixelate: OrreryPixelateConfig;
  readonly sunGlow: OrrerySunGlowConfig;
  readonly atmosphereGlow: OrreryAtmosphereGlowConfig;
}

export interface OrreryPlanetUniforms {
  readonly [key: string]: THREE.IUniform<unknown>;
  readonly uBaseTexture: THREE.IUniform<THREE.Texture>;
  readonly uHasBaseTexture: THREE.IUniform<boolean>;
  readonly uBaseColor: THREE.IUniform<THREE.Color>;
  readonly uTintColor: THREE.IUniform<THREE.Color>;
  readonly uSunDirection: THREE.IUniform<THREE.Vector3>;
  readonly uLitBrightness: THREE.IUniform<number>;
  readonly uShadowOpacity: THREE.IUniform<number>;
  readonly uShadowTint: THREE.IUniform<THREE.Color>;
  readonly uLightingEnabled: THREE.IUniform<boolean>;
}

export type OrreryPlanetMaterial = THREE.ShaderMaterial & { uniforms: OrreryPlanetUniforms };

export interface OrreryLayerUniforms {
  readonly [key: string]: THREE.IUniform<unknown>;
  readonly uLayerTexture: THREE.IUniform<THREE.Texture>;
  readonly uSunDirection: THREE.IUniform<THREE.Vector3>;
  readonly uOpacity: THREE.IUniform<number>;
  readonly uLitBrightness: THREE.IUniform<number>;
  readonly uShadowOpacity: THREE.IUniform<number>;
  readonly uLayerIntensity: THREE.IUniform<number>;
  readonly uNightOnly: THREE.IUniform<boolean>;
  readonly uLightingEnabled: THREE.IUniform<boolean>;
}

export type OrreryLayerMaterial = THREE.ShaderMaterial & { uniforms: OrreryLayerUniforms };

export interface OrreryAtmosphereGlowUniforms {
  readonly [key: string]: THREE.IUniform<unknown>;
  readonly uColor: THREE.IUniform<THREE.Color>;
  readonly uIntensity: THREE.IUniform<number>;
}

export type OrreryAtmosphereGlowMaterial = THREE.ShaderMaterial & {
  uniforms: OrreryAtmosphereGlowUniforms;
};

export interface OrreryOrbitUniforms {
  readonly [key: string]: THREE.IUniform<unknown>;
  readonly uColor: THREE.IUniform<THREE.Color>;
  readonly uOpacity: THREE.IUniform<number>;
  readonly uRadius: THREE.IUniform<number>;
  readonly uLineWidthPx: THREE.IUniform<number>;
}

export type OrreryOrbitMaterial = THREE.ShaderMaterial & { uniforms: OrreryOrbitUniforms };

export interface OrreryPlanetLayerObject {
  readonly key: string;
  readonly mesh: THREE.Mesh;
  readonly material: OrreryLayerMaterial;
}

export interface OrrerySunGlowObjects {
  readonly sprite: THREE.Sprite;
  readonly material: THREE.SpriteMaterial;
  readonly texture: THREE.CanvasTexture;
}

export interface OrreryAtmosphereGlowObject {
  readonly planetId: string;
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, OrreryAtmosphereGlowMaterial>;
  readonly material: OrreryAtmosphereGlowMaterial;
  readonly staticIntensity: number;
}

export interface OrreryBackdropObjects {
  readonly backgroundTexture: THREE.CanvasTexture;
  readonly starfield: THREE.Points;
  readonly eclipticGrid: THREE.Object3D;
}

export interface PlanetOrreryConfig {
  /** Distance from the sun in Three.js units. */
  readonly orreryRadius: number;
  /** Orbital period relative to Earth = 1.0. Used to derive angular velocity. */
  readonly orbitalPeriod: number;
  /** Starting angle in radians, spreads planets visually at game start. */
  readonly initialAngle: number;
  /** Radius of the visible planet sphere. */
  readonly visualRadius: number;
  /** Radius of the invisible hit-area sphere used for raycasting (~2x visual). */
  readonly hitRadius: number;
}

export interface SunObjects {
  /** The Dyson swarm material — opacity driven by dysonCoveragePercent in RAF. */
  readonly dysonMaterial: THREE.MeshStandardMaterial;
}

export interface PlanetObjects {
  readonly orbitMesh: THREE.Mesh<THREE.RingGeometry, OrreryOrbitMaterial>;
  readonly planetMesh: THREE.Mesh;
  readonly planetMaterial: OrreryPlanetMaterial;
  readonly layerObjects: readonly OrreryPlanetLayerObject[];
  readonly hitAreaMesh: THREE.Mesh;
  readonly orbitHitMesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  readonly orbitMaterial: OrreryOrbitMaterial;
}