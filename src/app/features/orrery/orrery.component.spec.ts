// @vitest-environment jsdom

import { ElementRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlanetData, PlanetUnlockState } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { OrreryComponent } from './orrery.component';
import { ORBIT_SPEED_FACTOR } from './orrery-scene.config';
import type {
  OrreryAtmosphereGlowObject,
  OrreryBackdropPalette,
  OrreryLayerMaterial,
  OrreryOrbitMaterial,
  OrreryPlanetLayerObject,
  OrreryPlanetMaterial,
  OrrerySunGlowObjects,
  OrreryVisualEffectsConfig,
} from './orrery-scene.types';

interface ObserverFake {
  readonly observe: ReturnType<typeof vi.fn>;
  readonly disconnect: ReturnType<typeof vi.fn>;
}

interface OrreryComponentAccess {
  _canvasRef: ElementRef<HTMLCanvasElement>;
  _renderer: THREE.WebGLRenderer;
  _scene: THREE.Scene;
  _camera: THREE.PerspectiveCamera;
  _dysonMaterial: THREE.MeshStandardMaterial;
  _starfield: THREE.Points | null;
  _composer: { render: ReturnType<typeof vi.fn>; setSize: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> } | null;
  _pixelatePass: { setSize: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> } | null;
  _outputPass: { dispose: ReturnType<typeof vi.fn> } | null;
  _visualEffectsConfig: OrreryVisualEffectsConfig;
  _sunGlow: OrrerySunGlowObjects | null;
  _planetMaterials: Map<string, OrreryPlanetMaterial>;
  _planetLayers: Map<string, readonly OrreryPlanetLayerObject[]>;
  _planetMeshes: Map<string, THREE.Mesh>;
  _orbitMaterials: Map<string, OrreryOrbitMaterial>;
  _hitAreaMeshes: Map<string, THREE.Mesh>;
  _orbitHitMeshes: Map<string, THREE.Mesh>;
  _raycastTargets: THREE.Object3D[];
  _planetAngles: Map<string, number>;
  _atmosphereGlows: Map<string, OrreryAtmosphereGlowObject>;
  _planetData: Map<string, PlanetData>;
  _orbitBaseColor: string;
  _orbitHoverColor: string;
  _hoveredPlanetId: string | null;
  _externalHoveredPlanetId: string | null;
  _raycaster: THREE.Raycaster;
  _intersectionObserver: ObserverFake | null;
  _resizeObserver: ObserverFake | null;
  _readBackdropPalette(): OrreryBackdropPalette;
  _readVisualEffectsConfig(): OrreryVisualEffectsConfig;
  _handleClick(event: MouseEvent): void;
  _handleMouseMove(event: MouseEvent): void;
  _handleMouseLeave(): void;
  _onResize(rect: DOMRectReadOnly): void;
  _animate(timestampMs?: number): void;
}

function makePlanetData(id: PlanetData['id'], baseColor: string): PlanetData {
  return {
    id,
    displayName: id,
    unlock: { type: 'start_unlocked' },
    initialState: {
      atmospherePressure: 1,
      temperatureCelsius: 0,
      terraformingPhase: 0,
      axisSpinSpeed: 0.01,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0.01,
      atmosphereColor: baseColor,
      atmosphereDensity: 0,
    },
    visual: {
      baseColor,
      layerTextures: {},
      waterSpotUvs: [],
      greenSpotUvs: [],
    },
    phases: [],
  };
}

const planetUnlocksSignal = signal<Record<string, PlanetUnlockState>>({
  earth: { planetId: 'earth', status: 'unlocked', unlockedYear: 2033, firedFlags: [] },
});

function setup(): OrreryComponent {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: GameStateService,
        useValue: {
          isPaused: signal(true).asReadonly(),
          planets: signal({}).asReadonly(),
          planetUnlocks: planetUnlocksSignal.asReadonly(),
          dysonCoveragePercent: signal(0).asReadonly(),
        },
      },
      {
        provide: DataService,
        useValue: {
          getAllPlanets: () => [makePlanetData('earth', '#3a7ab8')],
          getPlanet: () => makePlanetData('earth', '#3a7ab8'),
        },
      },
      {
        provide: EventBusService,
        useValue: {
          planetHovered$: new Subject<string | null>(),
          planetSelected$: new Subject<string>(),
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() => new OrreryComponent());
}

function setupUnpaused(): OrreryComponent {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: GameStateService,
        useValue: {
          isPaused: signal(false).asReadonly(),
          planets: signal({}).asReadonly(),
          planetUnlocks: planetUnlocksSignal.asReadonly(),
          dysonCoveragePercent: signal(0).asReadonly(),
        },
      },
      {
        provide: DataService,
        useValue: {
          getAllPlanets: () => [makePlanetData('earth', '#3a7ab8')],
          getPlanet: () => makePlanetData('earth', '#3a7ab8'),
        },
      },
      {
        provide: EventBusService,
        useValue: {
          planetHovered$: new Subject<string | null>(),
          planetSelected$: new Subject<string>(),
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() => new OrreryComponent());
}

describe('OrreryComponent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    planetUnlocksSignal.set({
      earth: { planetId: 'earth', status: 'unlocked', unlockedYear: 2033, firedFlags: [] },
    });
    TestBed.resetTestingModule();
  });

  it('reads the complete backdrop palette from design tokens', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => {
        const tokens: Record<string, string> = {
          '--orrery-bg-core': ' #21180f ',
          '--orrery-bg-edge': ' #040609 ',
          '--orrery-grid': ' rgba(96, 145, 170, 0.68) ',
          '--orrery-orbit': ' #5f91aa ',
          '--orrery-orbit-hover': ' #ffbe76 ',
          '--orrery-star': ' #f4ead1 ',
          '--orrery-star-feature': ' #ffc766 ',
        };
        return tokens[name] ?? '';
      },
    } as CSSStyleDeclaration);

    const palette = access._readBackdropPalette();

    expect(getComputedStyleSpy).toHaveBeenCalledWith(document.documentElement);
    expect(palette).toEqual({
      backgroundCore: '#21180f',
      backgroundEdge: '#040609',
      grid: 'rgba(96, 145, 170, 0.68)',
      orbit: '#5f91aa',
      orbitHover: '#ffbe76',
      star: '#f4ead1',
      featureStar: '#ffc766',
    });
  });

  it('reads the sun glow color from design tokens', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => {
        const tokens: Record<string, string> = {
          '--orrery-sun-glow': ' #ffcc44 ',
          '--color-accent-glow': ' #ffbe76 ',
        };
        return tokens[name] ?? '';
      },
    } as CSSStyleDeclaration);

    const config = access._readVisualEffectsConfig();

    expect(config.sunGlow.color).toBe('#ffcc44');
    expect(config.fps).toBeNull();
    expect(config.pixelate.enabled).toBe(false);
    expect(config.pixelate.pixelSize).toBe(3);
  });

  it('skips rendering until the configured FPS interval elapses', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._visualEffectsConfig = { ...access._visualEffectsConfig, fps: 24 };

    access._animate(0);
    access._animate(10);
    access._animate(42);

    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it('keeps orbital speed while visually rendering at a lower FPS', () => {
    const component = setupUnpaused();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._planetAngles.set('earth', 0);
    access._visualEffectsConfig = { ...access._visualEffectsConfig, fps: 24 };

    access._animate(0);
    access._animate(10);
    access._animate(42);

    expect(access._planetAngles.get('earth')).toBeCloseTo(ORBIT_SPEED_FACTOR * 3.5);
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it('renders every RAF tick when the FPS cap is null', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._visualEffectsConfig = { ...access._visualEffectsConfig, fps: null };

    access._animate(0);
    access._animate(10);
    access._animate(20);

    expect(renderer.render).toHaveBeenCalledTimes(3);
  });

  it('does not rotate the starfield when rotation speed is zero', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const starfield = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = starfield;

    access._animate();

    expect(starfield.rotation.y).toBe(0);
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it('highlights only the active orbit ring during RAF', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const earthOrbitMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#5f91aa') },
        uOpacity: { value: 0.12 },
        uRadius: { value: 11 },
        uLineWidthPx: { value: 3 },
      },
    }) as OrreryOrbitMaterial;
    const marsOrbitMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#5f91aa') },
        uOpacity: { value: 0.12 },
        uRadius: { value: 17 },
        uLineWidthPx: { value: 3 },
      },
    }) as OrreryOrbitMaterial;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._orbitMaterials.set('earth', earthOrbitMaterial);
    access._orbitMaterials.set('mars', marsOrbitMaterial);
    access._hoveredPlanetId = 'earth';
    access._orbitBaseColor = '#5f91aa';
    access._orbitHoverColor = '#ffbe76';

    access._animate();

    expect(`#${earthOrbitMaterial.uniforms.uColor.value.getHexString()}`).toBe('#ffbe76');
    expect(earthOrbitMaterial.uniforms.uOpacity.value).toBe(0.5);
    expect(`#${marsOrbitMaterial.uniforms.uColor.value.getHexString()}`).toBe('#5f91aa');
    expect(marsOrbitMaterial.uniforms.uOpacity.value).toBe(0.2);
  });

  it('dims a locked hovered planet during RAF', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8));
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBaseTexture: { value: new THREE.Texture() },
        uHasBaseTexture: { value: false },
        uBaseColor: { value: new THREE.Color('#3a7ab8') },
        uTintColor: { value: new THREE.Color('#222222') },
        uSunDirection: { value: new THREE.Vector3() },
        uLitBrightness: { value: 0.5 },
        uShadowOpacity: { value: 0.5 },
        uShadowTint: { value: new THREE.Color('#000000') },
        uLightingEnabled: { value: true },
      },
    }) as OrreryPlanetMaterial;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._planetMeshes.set('earth', planetMesh);
    access._planetData.set('earth', makePlanetData('earth', '#3a7ab8'));
    access._planetMaterials.set('earth', shaderMaterial);
    access._hoveredPlanetId = 'earth';
    planetUnlocksSignal.set({
      earth: { planetId: 'earth', status: 'locked', firedFlags: [] },
    });

    access._animate();

    expect(`#${shaderMaterial.uniforms.uTintColor.value.getHexString()}`).toBe('#8a929b');
    expect(shaderMaterial.uniforms.uLitBrightness.value).toBe(0.45);
  });

  it('uses one cached target list for planet and orbit pointer resolution', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const canvas = document.createElement('canvas');
    const hitAreaMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8));
    const orbitHitMesh = new THREE.Mesh(new THREE.TorusGeometry(2, 0.2, 6, 16));
    const selected: string[] = [];
    const eventBus = TestBed.inject(EventBusService);
    eventBus.planetSelected$.subscribe((id) => selected.push(id));
    hitAreaMesh.userData = { planetId: 'earth' };
    orbitHitMesh.userData = { planetId: 'mars' };
    Object.defineProperty(canvas, 'clientWidth', { value: 100 });
    Object.defineProperty(canvas, 'clientHeight', { value: 100 });

    access._canvasRef = new ElementRef(canvas);
    access._camera = new THREE.PerspectiveCamera();
    access._raycastTargets.push(hitAreaMesh, orbitHitMesh);
    const orbitIntersection = {
      distance: 1,
      point: new THREE.Vector3(),
      object: orbitHitMesh,
    } as THREE.Intersection;
    const intersectSpy = vi
      .spyOn(access._raycaster, 'intersectObjects')
      .mockReturnValue([orbitIntersection]);

    access._handleClick(new MouseEvent('click'));

    expect(intersectSpy).toHaveBeenCalledWith(access._raycastTargets);
    expect(selected).toEqual(['mars']);
  });

  it('uses pointer cursor for locked orbit hits and clears hover on leave', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const canvas = document.createElement('canvas');
    const orbitHitMesh = new THREE.Mesh(new THREE.TorusGeometry(2, 0.2, 6, 16));
    const hovered: Array<string | null> = [];
    const eventBus = TestBed.inject(EventBusService);
    orbitHitMesh.userData = { planetId: 'mars' };
    Object.defineProperty(canvas, 'clientWidth', { value: 100 });
    Object.defineProperty(canvas, 'clientHeight', { value: 100 });
    eventBus.planetHovered$.subscribe((id) => hovered.push(id));

    access._canvasRef = new ElementRef(canvas);
    access._camera = new THREE.PerspectiveCamera();
    access._raycastTargets.push(orbitHitMesh);
    const orbitIntersection = {
      distance: 1,
      point: new THREE.Vector3(),
      object: orbitHitMesh,
    } as THREE.Intersection;
    vi.spyOn(access._raycaster, 'intersectObjects')
      .mockReturnValue([orbitIntersection]);

    access._handleMouseMove(new MouseEvent('mousemove'));
    expect(canvas.style.cursor).toBe('pointer');
    access._handleMouseLeave();

    expect(access._hoveredPlanetId).toBeNull();
    expect(hovered).toEqual(['mars', null]);
    expect(canvas.style.cursor).toBe('default');
  });

  it('renders through the composer when post-processing is active', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const composer = { render: vi.fn(), setSize: vi.fn(), dispose: vi.fn() };
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._composer = composer;

    access._animate();

    expect(composer.render).toHaveBeenCalledOnce();
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it('updates composer and pixel pass size on resize', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { setSize: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const composer = { render: vi.fn(), setSize: vi.fn(), dispose: vi.fn() };
    const pixelatePass = { setSize: vi.fn(), dispose: vi.fn() };

    access._renderer = renderer;
    access._camera = new THREE.PerspectiveCamera();
    access._composer = composer;
    access._pixelatePass = pixelatePass;

    access._onResize({ width: 320, height: 180 } as DOMRectReadOnly);

    expect(renderer.setSize).toHaveBeenCalledWith(320, 180, false);
    expect(composer.setSize).toHaveBeenCalledWith(320, 180);
    expect(pixelatePass.setSize).toHaveBeenCalledWith(320, 180);
    expect(access._camera.aspect).toBeCloseTo(320 / 180);
  });

  it('updates shader uniforms and planet rotation during RAF', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const renderer = { render: vi.fn(), dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8));
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBaseTexture: { value: new THREE.Texture() },
        uHasBaseTexture: { value: false },
        uBaseColor: { value: new THREE.Color('#3a7ab8') },
        uTintColor: { value: new THREE.Color('#ffffff') },
        uSunDirection: { value: new THREE.Vector3() },
        uLitBrightness: { value: 1 },
        uShadowOpacity: { value: 0.5 },
        uShadowTint: { value: new THREE.Color('#000000') },
        uLightingEnabled: { value: true },
      },
    }) as OrreryPlanetMaterial;
    const cloudLayerMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8));
    const cloudLayerMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uLayerTexture: { value: new THREE.Texture() },
        uSunDirection: { value: new THREE.Vector3() },
        uOpacity: { value: 0 },
        uLitBrightness: { value: 1 },
        uShadowOpacity: { value: 0.5 },
        uLayerIntensity: { value: 1 },
        uNightOnly: { value: false },
        uLightingEnabled: { value: true },
      },
    }) as OrreryLayerMaterial;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    access._renderer = renderer;
    access._scene = new THREE.Scene();
    access._camera = new THREE.PerspectiveCamera();
    access._dysonMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    access._starfield = null;
    access._planetMeshes.set('earth', planetMesh);
    access._planetData.set('earth', makePlanetData('earth', '#3a7ab8'));
    access._planetMaterials.set('earth', shaderMaterial);
    access._planetLayers.set('earth', [
      { key: 'cloud', mesh: cloudLayerMesh, material: cloudLayerMaterial },
    ]);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#000000') },
        uIntensity: { value: 0 },
      },
    }) as OrreryAtmosphereGlowObject['material'];
    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      atmosphereMaterial
    ) as OrreryAtmosphereGlowObject['mesh'];
    access._atmosphereGlows.set('earth', {
      planetId: 'earth',
      mesh: atmosphereMesh,
      material: atmosphereMaterial,
      staticIntensity: 0.85,
    });

    access._animate();

    expect(`#${shaderMaterial.uniforms.uBaseColor.value.getHexString()}`).toBe('#3a7ab8');
    expect(shaderMaterial.uniforms.uSunDirection.value.length()).toBeCloseTo(1);
    expect(cloudLayerMaterial.uniforms.uSunDirection.value.length()).toBeCloseTo(1);
    expect(atmosphereMesh.position.length()).toBeGreaterThan(0);
    expect(`#${atmosphereMaterial.uniforms.uColor.value.getHexString()}`).toBe('#3a7ab8');
    expect(atmosphereMaterial.uniforms.uIntensity.value).toBe(0);
    expect(planetMesh.rotation.y).toBe(0);
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it('disconnects observers, removes listeners, and disposes the scene on destroy', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const canvas = document.createElement('canvas');
    const removeListenerSpy = vi.spyOn(canvas, 'removeEventListener');
    const renderer = { dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const composer = { render: vi.fn(), setSize: vi.fn(), dispose: vi.fn() };
    const pixelatePass = { setSize: vi.fn(), dispose: vi.fn() };
    const outputPass = { dispose: vi.fn() };
    const scene = new THREE.Scene();
    const material = new THREE.MeshBasicMaterial();
    scene.add(new THREE.Mesh(new THREE.BufferGeometry(), material));

    access._canvasRef = new ElementRef(canvas);
    access._renderer = renderer;
    access._scene = scene;
    access._composer = composer;
    access._pixelatePass = pixelatePass;
    access._outputPass = outputPass;
    access._intersectionObserver = { observe: vi.fn(), disconnect: vi.fn() };
    access._resizeObserver = { observe: vi.fn(), disconnect: vi.fn() };

    component.ngOnDestroy();

    expect(access._intersectionObserver.disconnect).toHaveBeenCalledOnce();
    expect(access._resizeObserver.disconnect).toHaveBeenCalledOnce();
    expect(removeListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(pixelatePass.dispose).toHaveBeenCalledOnce();
    expect(outputPass.dispose).toHaveBeenCalledOnce();
    expect(composer.dispose).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
  });
});
