/**
 * orrery-scene.builder.ts
 *
 * Pure Three.js builder functions — no Angular imports, no side effects beyond
 * mutating the passed-in scene. Kept separate so the Angular component stays
 * focused on lifecycle, signals, and event handling.
 */
import * as THREE from 'three';
import type { PlanetData } from '@app/core/models';

// ---------------------------------------------------------------------------
// Backdrop configuration (rendering-only — supplied by component from tokens)
// ---------------------------------------------------------------------------

export interface OrreryBackdropPalette {
  readonly backgroundCore: string;
  readonly backgroundEdge: string;
  readonly grid: string;
  readonly orbit: string;
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

// ---------------------------------------------------------------------------
// Orbital configuration (rendering-only — not saved, not read by services)
// ---------------------------------------------------------------------------

export interface PlanetOrreryConfig {
  /** Distance from the sun in Three.js units. */
  readonly orreryRadius: number;
  /** Orbital period relative to Earth = 1.0. Used to derive angular velocity. */
  readonly orbitalPeriod: number;
  /** Starting angle in radians, spreads planets visually at game start. */
  readonly initialAngle: number;
  /** Radius of the visible planet sphere. */
  readonly visualRadius: number;
  /** Radius of the invisible hit-area sphere used for raycasting (~2× visual). */
  readonly hitRadius: number;
}

export const PLANET_ORBITS: Record<string, PlanetOrreryConfig> = {
  mercury: { orreryRadius: 5,  orbitalPeriod: 0.241, initialAngle: Math.PI,        visualRadius: 0.35, hitRadius: 0.9 },
  venus:   { orreryRadius: 8,  orbitalPeriod: 0.615, initialAngle: Math.PI * 1.5,  visualRadius: 0.60, hitRadius: 1.3 },
  earth:   { orreryRadius: 11, orbitalPeriod: 1.000, initialAngle: 0,              visualRadius: 0.70, hitRadius: 1.4 },
  mars:    { orreryRadius: 17, orbitalPeriod: 1.881, initialAngle: Math.PI / 2,    visualRadius: 0.55, hitRadius: 1.2 },
};

/**
 * Multiplier converting (1/orbitalPeriod) into radians-per-frame at ~60 fps.
 * Tune post-playtest; has zero gameplay effect.
 */
export const ORBIT_SPEED_FACTOR = 0.0014;

const SUN_TEXTURE_PATH = '/assets/svg/planets/textures/sun-texture.svg';

type TextureSlotMap = Partial<Record<string, THREE.Texture | null>>;

const PLANET_DAY_NIGHT_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
  vUv = uv;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PLANET_DAY_NIGHT_FRAGMENT_SHADER = `
uniform sampler2D uBaseTexture;
uniform bool uHasBaseTexture;
uniform vec3 uBaseColor;
uniform vec3 uTintColor;
uniform vec3 uSunDirection;
uniform float uLitBrightness;
uniform float uShadowOpacity;
uniform vec3 uShadowTint;
uniform bool uLightingEnabled;

varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
  vec4 baseSample = uHasBaseTexture ? texture2D(uBaseTexture, vUv) : vec4(uBaseColor, 1.0);
  vec3 baseColor = baseSample.rgb * uTintColor;

  if (!uLightingEnabled) {
    gl_FragColor = linearToOutputTexel(vec4(baseColor, baseSample.a));
    return;
  }

  float sunAmount = dot(normalize(vWorldNormal), normalize(uSunDirection));
  float nightMask = step(sunAmount, 0.0);
  float litMask = 1.0 - nightMask;
  vec3 litColor = baseColor * uLitBrightness;
  vec3 shadowedColor = mix(baseColor, uShadowTint, uShadowOpacity);
  vec3 finalColor = mix(litColor, shadowedColor, nightMask);

  gl_FragColor = linearToOutputTexel(vec4(finalColor, baseSample.a));
}
`;

const PLANET_LAYER_FRAGMENT_SHADER = `
uniform sampler2D uLayerTexture;
uniform vec3 uSunDirection;
uniform float uOpacity;
uniform float uLitBrightness;
uniform float uShadowOpacity;
uniform float uLayerIntensity;
uniform bool uNightOnly;
uniform bool uLightingEnabled;

varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
  vec4 layerSample = texture2D(uLayerTexture, vUv);

  if (!uLightingEnabled) {
    gl_FragColor = linearToOutputTexel(
      vec4(layerSample.rgb * uLayerIntensity, layerSample.a * uOpacity)
    );
    return;
  }

  float sunAmount = dot(normalize(vWorldNormal), normalize(uSunDirection));
  float nightMask = step(sunAmount, 0.0);
  float visibilityMask = uNightOnly ? nightMask : 1.0;
  float brightness = uNightOnly ? 1.0 : mix(uLitBrightness, max(0.0, 1.0 - uShadowOpacity), nightMask);
  vec3 finalColor = layerSample.rgb * brightness * uLayerIntensity;
  float finalAlpha = layerSample.a * uOpacity * visibilityMask;

  gl_FragColor = linearToOutputTexel(vec4(finalColor, finalAlpha));
}
`;

const ATMOSPHERE_GLOW_VERTEX_SHADER = `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const ATMOSPHERE_GLOW_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float rim = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDirection)), 2.6);
  float alpha = rim * uIntensity;
  gl_FragColor = linearToOutputTexel(vec4(uColor * alpha, alpha));
}
`;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createSolidTexture(color: string, label: string): THREE.CanvasTexture {
  const canvas = createCanvas(1, 1);
  const context = getCanvasContext(canvas);
  if (context) {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = `${label}-fallback-texture`;
  return texture;
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try {
    return canvas.getContext('2d');
  } catch {
    return null;
  }
}

export function loadOrrerySvgTexture(texturePath: string, label: string): THREE.Texture {
  const texture = new THREE.TextureLoader().load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  texture.name = `${label}-svg-texture`;
  return texture;
}

function disposeMaterial(material: THREE.Material | readonly THREE.Material[]): void {
  const materials: readonly THREE.Material[] = Array.isArray(material) ? material : [material];
  const textureKeys: readonly string[] = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
  ];

  materials.forEach((entry) => {
    const textureBearingMaterial = entry as THREE.Material & TextureSlotMap;
    const disposedTextures = new Set<THREE.Texture>();
    const disposeTexture = (texture: THREE.Texture | null | undefined): void => {
      if (texture && !disposedTextures.has(texture)) {
        texture.dispose();
        disposedTextures.add(texture);
      }
    };

    textureKeys.forEach((key) => {
      const texture = textureBearingMaterial[key];
      disposeTexture(texture);
      textureBearingMaterial[key] = null;
    });

    if (entry instanceof THREE.ShaderMaterial) {
      Object.values(entry.uniforms).forEach((uniform) => {
        if (uniform.value instanceof THREE.Texture) {
          disposeTexture(uniform.value);
        }
      });
    }

    entry.dispose();
  });
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.NoToneMapping;
  return renderer;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
  // Slightly off-axis: shows orbital depth while planets stay clearly separated.
  camera.position.set(14, 10, 21);
  camera.lookAt(0, -4.5, 0);
  return camera;
}

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------

export function createLights(scene: THREE.Scene): void {
  // Planets are shader-lit. Keep only a minimal fill for non-shader meshes.
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));
}

// ---------------------------------------------------------------------------
// Backdrop
// ---------------------------------------------------------------------------

export function buildBackground(
  scene: THREE.Scene,
  palette: OrreryBackdropPalette
): THREE.CanvasTexture {
  const canvas = createCanvas(1024, 1024);
  const context = getCanvasContext(canvas);

  if (context) {
    const gradient = context.createRadialGradient(512, 592, 24, 512, 592, 760);
    gradient.addColorStop(0, palette.backgroundCore);
    gradient.addColorStop(0.22, palette.backgroundCore);
    gradient.addColorStop(1, palette.backgroundEdge);

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  scene.background = texture;
  return texture;
}

export function buildStarfield(
  scene: THREE.Scene,
  options: OrreryStarfieldOptions
): THREE.Points {
  const starCount = options.starCount ?? DEFAULT_ORRERY_STARFIELD_OPTIONS.starCount;
  const featureStarCount =
    options.featureStarCount ?? DEFAULT_ORRERY_STARFIELD_OPTIONS.featureStarCount;
  const radius = options.radius ?? DEFAULT_ORRERY_STARFIELD_OPTIONS.radius;
  const depth = options.depth ?? DEFAULT_ORRERY_STARFIELD_OPTIONS.depth;
  const opacity = options.opacity ?? DEFAULT_ORRERY_STARFIELD_OPTIONS.opacity;
  const totalStars = Math.max(0, starCount) + Math.max(0, featureStarCount);
  const positions = new Float32Array(totalStars * 3);
  const colors = new Float32Array(totalStars * 3);
  const random = seededRandom(0x5eed18);
  const starColor = new THREE.Color(options.palette.star);
  const featureColor = new THREE.Color(options.palette.featureStar);

  for (let index = 0; index < totalStars; index += 1) {
    const isFeature = index >= starCount;
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * radius;
    const height = (random() - 0.5) * radius * 0.38;
    const layerDepth = depth - random() * radius * 0.24;
    const color = isFeature ? featureColor : starColor;
    const positionIndex = index * 3;

    positions[positionIndex] = Math.cos(angle) * distance;
    positions[positionIndex + 1] = height;
    positions[positionIndex + 2] = Math.sin(angle) * distance + layerDepth;
    colors[positionIndex] = color.r;
    colors[positionIndex + 1] = color.g;
    colors[positionIndex + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  function createDiscTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.7, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
    }

    return new THREE.CanvasTexture(canvas);
  }

const material = new THREE.PointsMaterial({
  size: 0.2,
  transparent: true,
  opacity,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
  vertexColors: true,
  map: createDiscTexture(),
  alphaTest: 0.01,
});

const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  return points;
}

export function buildEclipticGrid(
  scene: THREE.Scene,
  orbitConfigs: Record<string, PlanetOrreryConfig>,
  options: OrreryGridOptions
): THREE.Object3D {
  const opacity = options.opacity ?? DEFAULT_ORRERY_GRID_OPTIONS.gridOpacity;
  const showRadialSpokes =
    options.showRadialSpokes ?? DEFAULT_ORRERY_GRID_OPTIONS.showRadialSpokes;
  const radialSpokeCount =
    options.radialSpokeCount ?? DEFAULT_ORRERY_GRID_OPTIONS.radialSpokeCount;
  const yOffset = options.yOffset ?? DEFAULT_ORRERY_GRID_OPTIONS.yOffset;
  const radii = Object.values(orbitConfigs)
    .map((config) => config.orreryRadius)
    .filter((radius) => radius > 0)
    .sort((a, b) => a - b);
  const outerRadius = radii.at(-1) ?? 0;
  const circleSegments = 96;
  const lineCount = radii.length * circleSegments + (showRadialSpokes ? radialSpokeCount : 0);
  const positions = new Float32Array(lineCount * 2 * 3);
  let offset = 0;

  for (const radius of radii) {
    for (let segment = 0; segment < circleSegments; segment += 1) {
      const startAngle = (segment / circleSegments) * Math.PI * 2;
      const endAngle = ((segment + 1) / circleSegments) * Math.PI * 2;
      positions[offset++] = Math.cos(startAngle) * radius;
      positions[offset++] = yOffset;
      positions[offset++] = Math.sin(startAngle) * radius;
      positions[offset++] = Math.cos(endAngle) * radius;
      positions[offset++] = yOffset;
      positions[offset++] = Math.sin(endAngle) * radius;
    }
  }

  if (showRadialSpokes && outerRadius > 0) {
    for (let spoke = 0; spoke < radialSpokeCount; spoke += 1) {
      const angle = (spoke / radialSpokeCount) * Math.PI * 2;
      positions[offset++] = 0;
      positions[offset++] = yOffset;
      positions[offset++] = 0;
      positions[offset++] = Math.cos(angle) * outerRadius;
      positions[offset++] = yOffset;
      positions[offset++] = Math.sin(angle) * outerRadius;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(options.color),
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const grid = new THREE.LineSegments(geometry, material);
  scene.add(grid);
  return grid;
}

// ---------------------------------------------------------------------------
// Sun + Dyson swarm placeholder
// ---------------------------------------------------------------------------

export interface SunObjects {
  /** The Dyson swarm material — opacity driven by dysonCoveragePercent in RAF. */
  dysonMaterial: THREE.MeshStandardMaterial;
}

export function buildSun(scene: THREE.Scene): SunObjects {
  // Visible sun sphere
  const sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: loadOrrerySvgTexture(SUN_TEXTURE_PATH, 'sun'),
    toneMapped: false,
  });
  scene.add(new THREE.Mesh(sunGeo, sunMat));

  // Dyson swarm placeholder — wireframe shell, opacity 0 at game start.
  // TODO: replace with DysonSwarm ShaderMaterial when implemented.
  const dysonGeo = new THREE.SphereGeometry(1.6, 32, 32);
  const dysonMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0,
    wireframe: true,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(dysonGeo, dysonMat));

  return { dysonMaterial: dysonMat };
}

export function buildSunGlow(
  scene: THREE.Scene,
  options: OrrerySunGlowConfig
): OrrerySunGlowObjects | null {
  if (!options.enabled || options.intensity <= 0 || options.size <= 0 || options.color === '') {
    return null;
  }

  const textureSize = Math.max(16, Math.floor(options.textureSize ?? 256));
  const canvas = createCanvas(textureSize, textureSize);
  const context = getCanvasContext(canvas);
  if (context) {
    const color = new THREE.Color(options.color);
    const colorStop = (alpha: number): string =>
      `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${alpha})`;
    const center = textureSize / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, colorStop(1));
    gradient.addColorStop(0.22, colorStop(0.82));
    gradient.addColorStop(0.72, colorStop(0.12));
    gradient.addColorStop(1, colorStop(0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, textureSize, textureSize);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = 'sun-glow-texture';
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: options.intensity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  material.name = 'sun-glow-material';
  const sprite = new THREE.Sprite(material);
  sprite.name = 'sun-glow-sprite';
  sprite.scale.set(options.size, options.size, 1);
  sprite.renderOrder = 20;
  scene.add(sprite);

  return { sprite, material, texture };
}

// ---------------------------------------------------------------------------
// Planet objects
// ---------------------------------------------------------------------------

export interface PlanetObjects {
  planetMesh: THREE.Mesh;
  planetMaterial: OrreryPlanetMaterial;
  layerObjects: readonly OrreryPlanetLayerObject[];
  hitAreaMesh: THREE.Mesh;
  orbitMaterial: THREE.MeshBasicMaterial;
}

export function buildAtmosphereGlow(
  scene: THREE.Scene,
  planetData: PlanetData,
  config: PlanetOrreryConfig,
  options: OrreryAtmosphereGlowConfig
): OrreryAtmosphereGlowObject | null {
  const staticGlow = planetData.visual.atmosphereGlow;
  const staticIntensity = staticGlow?.intensity ?? 1;
  if (!options.enabled || staticGlow?.enabled !== true || staticIntensity <= 0) {
    return null;
  }

  const thickness = Math.max(0, options.thickness);
  const geometry = new THREE.SphereGeometry(config.visualRadius * (1 + thickness), 32, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(staticGlow.color ?? planetData.initialState.atmosphereColor) },
      uIntensity: { value: staticIntensity * options.intensity },
    },
    vertexShader: ATMOSPHERE_GLOW_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_GLOW_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  }) as OrreryAtmosphereGlowMaterial;
  material.name = `${planetData.id}-atmosphere-glow-material`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${planetData.id}-atmosphere-glow`;
  mesh.userData = { planetId: planetData.id, layerKey: 'atmosphereGlow' };
  scene.add(mesh);

  return { planetId: planetData.id, mesh, material, staticIntensity };
}

export function createPlanetDayNightMaterial(
  planetData: PlanetData,
  options: OrreryDayNightLightingOptions = {},
): OrreryPlanetMaterial {
  const surfaceTexturePath = planetData.visual.layerTextures['surface'];
  const baseTexture = surfaceTexturePath
    ? loadOrrerySvgTexture(surfaceTexturePath, `${planetData.id}-surface`)
    : createSolidTexture('#ffffff', `${planetData.id}-base`);
  const uniforms: OrreryPlanetUniforms = {
    uBaseTexture: { value: baseTexture },
    uHasBaseTexture: { value: surfaceTexturePath !== undefined },
    uBaseColor: { value: new THREE.Color(planetData.visual.baseColor) },
    uTintColor: { value: new THREE.Color('#ffffff') },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uLitBrightness: {
      value: options.litSideBrightness ?? DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.litSideBrightness,
    },
    uShadowOpacity: {
      value:
        options.darkSideShadowOpacity ??
        DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.darkSideShadowOpacity,
    },
    uShadowTint: {
      value: new THREE.Color(
        options.darkSideShadowTint ?? DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.darkSideShadowTint,
      ),
    },
    uLightingEnabled: { value: options.enabled ?? DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.enabled },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PLANET_DAY_NIGHT_VERTEX_SHADER,
    fragmentShader: PLANET_DAY_NIGHT_FRAGMENT_SHADER,
  }) as OrreryPlanetMaterial;
  material.name = `${planetData.id}-day-night-material`;
  return material;
}

function createPlanetLayerMaterial(
  planetId: string,
  key: string,
  texturePath: string,
  options: OrreryDayNightLightingOptions = {},
): OrreryLayerMaterial {
  const isCityLights = key === 'cityLights';
  const uniforms: OrreryLayerUniforms = {
    uLayerTexture: { value: loadOrrerySvgTexture(texturePath, `${planetId}-${key}`) },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uOpacity: { value: 1 },
    uLitBrightness: {
      value: options.litSideBrightness ?? DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.litSideBrightness,
    },
    uShadowOpacity: {
      value:
        options.darkSideShadowOpacity ??
        DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.darkSideShadowOpacity,
    },
    uLayerIntensity: {
      value: isCityLights
        ? (options.cityLightsIntensity ?? DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.cityLightsIntensity)
        : 1,
    },
    uNightOnly: { value: isCityLights },
    uLightingEnabled: { value: options.enabled ?? DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS.enabled },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PLANET_DAY_NIGHT_VERTEX_SHADER,
    fragmentShader: PLANET_LAYER_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
  }) as OrreryLayerMaterial;
  material.name = `${planetId}-${key}-layer-material`;
  if (isCityLights) {
    material.blending = THREE.AdditiveBlending;
  }
  return material;
}

/**
 * Builds orbit ring + visible planet sphere + invisible hit-area sphere.
 * All three are added to the scene. Initial positions are set from config.initialAngle.
 */
export function buildPlanetObjects(
  scene: THREE.Scene,
  planetData: PlanetData,
  config: PlanetOrreryConfig,
  orbitStyle: OrreryOrbitStyleOptions,
): PlanetObjects {
  const baseColor = planetData.visual.baseColor;
  const startX = Math.cos(config.initialAngle) * config.orreryRadius;
  const startZ = Math.sin(config.initialAngle) * config.orreryRadius;

  // Orbit ring — static, never moved after creation.
  const ringGeo = new THREE.TorusGeometry(config.orreryRadius, 0.04, 8, 128);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(orbitStyle.color),
    transparent: true,
    opacity: orbitStyle.opacity ?? DEFAULT_ORRERY_GRID_OPTIONS.orbitOpacity,
    depthWrite: false,
  });
  // Orbit ring lies flat on the ecliptic (XZ) plane.
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  scene.add(ringMesh);

  // Visible planet sphere.
  const planetGeo = new THREE.SphereGeometry(config.visualRadius, 32, 32);
  const planetMat = createPlanetDayNightMaterial(planetData);
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.position.set(startX, 0, startZ);
  planetMesh.userData = { planetId: planetData.id };
  scene.add(planetMesh);

  const layerOrder = ['water', 'green', 'lava', 'cloud', 'cityLights'];
  const layerObjects = layerOrder
    .map((key, index): OrreryPlanetLayerObject | null => {
      const texturePath = planetData.visual.layerTextures[key];
      if (!texturePath) return null;

      const layerGeo = new THREE.SphereGeometry(config.visualRadius * (1 + (index + 1) * 0.006), 32, 32);
      const layerMat = createPlanetLayerMaterial(planetData.id, key, texturePath);
      const layerMesh = new THREE.Mesh(layerGeo, layerMat);
      layerMesh.position.set(startX, 0, startZ);
      layerMesh.renderOrder = index + 1;
      layerMesh.userData = { planetId: planetData.id, layerKey: key };
      scene.add(layerMesh);
      return { key, mesh: layerMesh, material: layerMat };
    })
    .filter((entry): entry is OrreryPlanetLayerObject => entry !== null);

  // Invisible hit-area sphere — larger than the visible sphere for easier clicking.
  const hitGeo = new THREE.SphereGeometry(config.hitRadius, 16, 16);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitAreaMesh = new THREE.Mesh(hitGeo, hitMat);
  hitAreaMesh.position.set(startX, 0, startZ);
  hitAreaMesh.userData = { planetId: planetData.id };
  scene.add(hitAreaMesh);

  return { planetMesh, planetMaterial: planetMat, layerObjects, hitAreaMesh, orbitMaterial: ringMat };
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  if (scene.background instanceof THREE.Texture) {
    scene.background.dispose();
    scene.background = null;
  }

  scene.traverse((obj) => {
    const renderObject = obj as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    renderObject.geometry?.dispose();
    if (renderObject.material) {
      disposeMaterial(renderObject.material);
    }
  });
  renderer.dispose();
}
