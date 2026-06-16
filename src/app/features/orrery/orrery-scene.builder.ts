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
  earth:   { orreryRadius: 11, orbitalPeriod: 1.000, initialAngle: 0,              visualRadius: 0.70, hitRadius: 1.4 },
  mercury: { orreryRadius: 5,  orbitalPeriod: 0.241, initialAngle: Math.PI,        visualRadius: 0.35, hitRadius: 0.9 },
  mars:    { orreryRadius: 17, orbitalPeriod: 1.881, initialAngle: Math.PI / 2,    visualRadius: 0.55, hitRadius: 1.2 },
  venus:   { orreryRadius: 8,  orbitalPeriod: 0.615, initialAngle: Math.PI * 1.5,  visualRadius: 0.60, hitRadius: 1.3 },
};

/**
 * Multiplier converting (1/orbitalPeriod) into radians-per-frame at ~60 fps.
 * Tune post-playtest; has zero gameplay effect.
 */
export const ORBIT_SPEED_FACTOR = 0.0014;

const SUN_TEXTURE_PATH = '/assets/svg/planets/textures/sun-texture.svg';

type TextureSlotMap = Partial<Record<string, THREE.Texture | null>>;

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
    textureKeys.forEach((key) => {
      const texture = textureBearingMaterial[key];
      if (texture && !disposedTextures.has(texture)) {
        texture.dispose();
        disposedTextures.add(texture);
      }
      textureBearingMaterial[key] = null;
    });
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  return renderer;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
  // Slightly off-axis: shows orbital depth while planets stay clearly separated.
  camera.position.set(14.4, 18, 25);
  camera.lookAt(0, -4, 0);
  return camera;
}

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------

export function createLights(scene: THREE.Scene): void {
  // Very dim fill — scene is dark space, sun provides the key light.
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));

  // Warm directional from sun position (origin) outward.
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
  sun.position.set(0, 5, 0);
  scene.add(sun);
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
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xff9900),
    emissiveIntensity: 1.2,
    map: loadOrrerySvgTexture(SUN_TEXTURE_PATH, 'sun'),
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

// ---------------------------------------------------------------------------
// Planet objects
// ---------------------------------------------------------------------------

export interface PlanetObjects {
  planetMesh: THREE.Mesh;
  planetMaterial: THREE.MeshStandardMaterial;
  hitAreaMesh: THREE.Mesh;
  orbitMaterial: THREE.MeshStandardMaterial;
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
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(orbitStyle.color),
    transparent: true,
    opacity: orbitStyle.opacity ?? DEFAULT_ORRERY_GRID_OPTIONS.orbitOpacity,
  });
  // Orbit ring lies flat on the ecliptic (XZ) plane.
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  scene.add(ringMesh);

  // Visible planet sphere.
  const planetGeo = new THREE.SphereGeometry(config.visualRadius, 32, 32);
  const texture = planetData.visual.orreryTexturePath
    ? loadOrrerySvgTexture(planetData.visual.orreryTexturePath, planetData.id)
    : null;
  const planetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(texture ? '#ffffff' : baseColor),
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
    map: texture,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.position.set(startX, 0, startZ);
  planetMesh.userData = { planetId: planetData.id };
  scene.add(planetMesh);

  // Invisible hit-area sphere — larger than the visible sphere for easier clicking.
  const hitGeo = new THREE.SphereGeometry(config.hitRadius, 16, 16);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitAreaMesh = new THREE.Mesh(hitGeo, hitMat);
  hitAreaMesh.position.set(startX, 0, startZ);
  hitAreaMesh.userData = { planetId: planetData.id };
  scene.add(hitAreaMesh);

  return { planetMesh, planetMaterial: planetMat, hitAreaMesh, orbitMaterial: ringMat };
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
