// @vitest-environment jsdom

import { ElementRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlanetData } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { OrreryComponent } from './orrery.component';
import type {
  OrreryBackdropPalette,
  OrreryLayerMaterial,
  OrreryPlanetLayerObject,
  OrreryPlanetMaterial,
} from './orrery-scene.builder';

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
  _planetMaterials: Map<string, OrreryPlanetMaterial>;
  _planetLayers: Map<string, readonly OrreryPlanetLayerObject[]>;
  _planetMeshes: Map<string, THREE.Mesh>;
  _planetData: Map<string, PlanetData>;
  _intersectionObserver: ObserverFake | null;
  _resizeObserver: ObserverFake | null;
  _readBackdropPalette(): OrreryBackdropPalette;
  _animate(): void;
}

function makePlanetData(id: PlanetData['id'], baseColor: string): PlanetData {
  return {
    id,
    displayName: id,
    unlockCondition: null,
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

function setup(): OrreryComponent {
  TestBed.configureTestingModule({
    imports: [OrreryComponent],
    providers: [
      {
        provide: GameStateService,
        useValue: {
          isPaused: signal(true).asReadonly(),
          planets: signal({}).asReadonly(),
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

  return TestBed.createComponent(OrreryComponent).componentInstance;
}

describe('OrreryComponent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
      star: '#f4ead1',
      featureStar: '#ffc766',
    });
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

    access._animate();

    expect(`#${shaderMaterial.uniforms.uBaseColor.value.getHexString()}`).toBe('#3a7ab8');
    expect(shaderMaterial.uniforms.uSunDirection.value.length()).toBeCloseTo(1);
    expect(cloudLayerMaterial.uniforms.uSunDirection.value.length()).toBeCloseTo(1);
    expect(planetMesh.rotation.y).toBe(0);
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it('disconnects observers, removes listeners, and disposes the scene on destroy', () => {
    const component = setup();
    const access = component as unknown as OrreryComponentAccess;
    const canvas = document.createElement('canvas');
    const removeListenerSpy = vi.spyOn(canvas, 'removeEventListener');
    const renderer = { dispose: vi.fn() } as unknown as THREE.WebGLRenderer;
    const scene = new THREE.Scene();
    const material = new THREE.MeshBasicMaterial();
    scene.add(new THREE.Mesh(new THREE.BufferGeometry(), material));

    access._canvasRef = new ElementRef(canvas);
    access._renderer = renderer;
    access._scene = scene;
    access._intersectionObserver = { observe: vi.fn(), disconnect: vi.fn() };
    access._resizeObserver = { observe: vi.fn(), disconnect: vi.fn() };

    component.ngOnDestroy();

    expect(access._intersectionObserver.disconnect).toHaveBeenCalledOnce();
    expect(access._resizeObserver.disconnect).toHaveBeenCalledOnce();
    expect(removeListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(renderer.dispose).toHaveBeenCalledOnce();
  });
});
