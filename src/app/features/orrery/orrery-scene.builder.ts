/**
 * orrery-scene.builder.ts
 *
 * Pure Three.js builder functions — no Angular imports, no side effects beyond
 * mutating the passed-in scene. Kept separate so the Angular component stays
 * focused on lifecycle, signals, and event handling.
 */
import * as THREE from 'three';
import type { PlanetData } from '@app/core/models';
import {
  DEFAULT_ORRERY_CAMERA_CONFIG,
  DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS,
  DEFAULT_ORRERY_GRID_OPTIONS,
  DEFAULT_ORRERY_STARFIELD_OPTIONS,
  ORRERY_ASSET_PATHS,
  ORRERY_ORBIT_RING_CONFIG,
} from './orrery-scene.config';
import type {
  OrreryAtmosphereGlowConfig,
  OrreryAtmosphereGlowMaterial,
  OrreryAtmosphereGlowObject,
  OrreryBackdropPalette,
  OrreryDayNightLightingOptions,
  OrreryGridOptions,
  OrreryLayerMaterial,
  OrreryLayerUniforms,
  OrreryOrbitMaterial,
  OrreryOrbitStyleOptions,
  OrreryPlanetLayerObject,
  OrreryPlanetMaterial,
  OrreryPlanetUniforms,
  OrreryStarfieldOptions,
  OrrerySunGlowConfig,
  OrrerySunGlowObjects,
  PlanetObjects,
  PlanetOrreryConfig,
  SunObjects,
} from './orrery-scene.types';

export {
  DEFAULT_ORRERY_DAY_NIGHT_LIGHTING_OPTIONS,
  DEFAULT_ORRERY_GRID_OPTIONS,
  DEFAULT_ORRERY_STARFIELD_OPTIONS,
  DEFAULT_ORRERY_VISUAL_EFFECTS_CONFIG,
  ORBIT_SPEED_FACTOR,
  ORRERY_STARFIELD_ROTATION_SPEED,
  PLANET_ORBITS,
} from './orrery-scene.config';
export type {
  OrreryAtmosphereGlowConfig,
  OrreryAtmosphereGlowMaterial,
  OrreryAtmosphereGlowObject,
  OrreryAtmosphereGlowUniforms,
  OrreryBackdropObjects,
  OrreryBackdropPalette,
  OrreryDayNightLightingOptions,
  OrreryGridOptions,
  OrreryLayerMaterial,
  OrreryLayerUniforms,
  OrreryOrbitMaterial,
  OrreryOrbitStyleOptions,
  OrreryOrbitUniforms,
  OrreryPlanetLayerObject,
  OrreryPlanetMaterial,
  OrreryPlanetUniforms,
  OrreryPixelateConfig,
  OrreryStarfieldOptions,
  OrrerySunGlowConfig,
  OrrerySunGlowObjects,
  OrreryVisualEffectsConfig,
  PlanetObjects,
  PlanetOrreryConfig,
  SunObjects,
} from './orrery-scene.types';

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

const ORBIT_RING_VERTEX_SHADER = `
varying vec2 vLocalPosition;

void main() {
  vLocalPosition = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ORBIT_RING_FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uRadius;
uniform float uLineWidthPx;

varying vec2 vLocalPosition;

void main() {
  float distanceFromSun = length(vLocalPosition);
  float signedDistance = abs(distanceFromSun - uRadius);
  float pixelWidth = max(fwidth(distanceFromSun), 0.0001);
  float halfLineWidth = max(uLineWidthPx * 0.5 * pixelWidth, pixelWidth);
  float alpha = 1.0 - smoothstep(halfLineWidth, halfLineWidth + pixelWidth, signedDistance);

  if (alpha <= 0.001) discard;

  gl_FragColor = linearToOutputTexel(vec4(uColor, alpha * uOpacity));
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
  const { x: positionX, y: positionY, z: positionZ } = DEFAULT_ORRERY_CAMERA_CONFIG.position;
  const { x: lookAtX, y: lookAtY, z: lookAtZ } = DEFAULT_ORRERY_CAMERA_CONFIG.lookAt;
  camera.position.set(positionX, positionY, positionZ);
  camera.lookAt(lookAtX, lookAtY, lookAtZ);
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

export function buildSun(scene: THREE.Scene): SunObjects {
  // Visible sun sphere
  const sunGeo = new THREE.SphereGeometry(1.2, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: loadOrrerySvgTexture(ORRERY_ASSET_PATHS.sunTexture, 'sun'),
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
  const ringGeo = new THREE.RingGeometry(
    config.orreryRadius - ORRERY_ORBIT_RING_CONFIG.geometryWidth / 2,
    config.orreryRadius + ORRERY_ORBIT_RING_CONFIG.geometryWidth / 2,
    ORRERY_ORBIT_RING_CONFIG.segments
  );
  const ringMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(orbitStyle.color) },
      uOpacity: { value: orbitStyle.opacity ?? DEFAULT_ORRERY_GRID_OPTIONS.orbitOpacity },
      uRadius: { value: config.orreryRadius },
      uLineWidthPx: { value: ORRERY_ORBIT_RING_CONFIG.lineWidthPx },
    },
    vertexShader: ORBIT_RING_VERTEX_SHADER,
    fragmentShader: ORBIT_RING_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }) as OrreryOrbitMaterial;
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.userData = { planetId: planetData.id, interactionKind: 'orbit' };
  scene.add(ringMesh);

  const orbitHitGeo = new THREE.TorusGeometry(
    config.orreryRadius,
    ORRERY_ORBIT_RING_CONFIG.hitTubeRadius,
    6,
    96
  );
  const orbitHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  const orbitHitMesh = new THREE.Mesh(orbitHitGeo, orbitHitMat);
  orbitHitMesh.rotation.x = Math.PI / 2;
  orbitHitMesh.userData = { planetId: planetData.id, interactionKind: 'orbit-hit' };
  scene.add(orbitHitMesh);

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

  return {
    orbitMesh: ringMesh,
    planetMesh,
    planetMaterial: planetMat,
    layerObjects,
    hitAreaMesh,
    orbitHitMesh,
    orbitMaterial: ringMat,
  };
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
