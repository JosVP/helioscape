/**
 * orrery-scene.builder.ts
 *
 * Pure Three.js builder functions — no Angular imports, no side effects beyond
 * mutating the passed-in scene. Kept separate so the Angular component stays
 * focused on lifecycle, signals, and event handling.
 */
import * as THREE from 'three';

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
  camera.position.set(0, 28, 32);
  camera.lookAt(0, 0, 0);
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
    color: 0xffcc44,
    emissive: new THREE.Color(0xff9900),
    emissiveIntensity: 1.2,
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
  planetId: string,
  baseColor: string,
  config: PlanetOrreryConfig,
): PlanetObjects {
  const startX = Math.cos(config.initialAngle) * config.orreryRadius;
  const startZ = Math.sin(config.initialAngle) * config.orreryRadius;

  // Orbit ring — static, never moved after creation.
  const ringGeo = new THREE.TorusGeometry(config.orreryRadius, 0.04, 8, 128);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08,
  });
  // Orbit ring lies flat on the ecliptic (XZ) plane.
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  scene.add(ringMesh);

  // Visible planet sphere.
  const planetGeo = new THREE.SphereGeometry(config.visualRadius, 32, 32);
  const planetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseColor),
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.position.set(startX, 0, startZ);
  planetMesh.userData = { planetId };
  scene.add(planetMesh);

  // Invisible hit-area sphere — larger than the visible sphere for easier clicking.
  const hitGeo = new THREE.SphereGeometry(config.hitRadius, 16, 16);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitAreaMesh = new THREE.Mesh(hitGeo, hitMat);
  hitAreaMesh.position.set(startX, 0, startZ);
  hitAreaMesh.userData = { planetId };
  scene.add(hitAreaMesh);

  return { planetMesh, planetMaterial: planetMat, hitAreaMesh, orbitMaterial: ringMat };
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.dispose();
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => m.dispose());
    } else {
      (obj.material as THREE.Material).dispose();
    }
  });
  renderer.dispose();
}
