import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as THREE from 'three';
import type { PlanetData, PlanetVisualParams } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import {
  ORBIT_SPEED_FACTOR,
  ORRERY_STARFIELD_ROTATION_SPEED,
  PLANET_ORBITS,
  buildBackground,
  buildEclipticGrid,
  buildPlanetObjects,
  buildStarfield,
  buildSun,
  createCamera,
  createLights,
  createRenderer,
  disposeScene,
  type OrreryBackdropPalette,
  type OrreryPlanetLayerObject,
  type OrreryPlanetMaterial,
} from './orrery-scene.builder';

const ORRERY_GRID_OPACITY = 0.14;
const ORRERY_ORBIT_OPACITY = 0.12;
const EMPTY_PLANET_LAYERS: readonly OrreryPlanetLayerObject[] = [];

@Component({
  selector: 'app-orrery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orrery.component.html',
  styleUrl: './orrery.component.scss',
})
export class OrreryComponent implements AfterViewInit, OnDestroy {
  private readonly _gameState  = inject(GameStateService);
  private readonly _data       = inject(DataService);
  private readonly _eventBus   = inject(EventBusService);
  private readonly _destroyRef = inject(DestroyRef);

  @ViewChild('orreryCanvas') private readonly _canvasRef!: ElementRef<HTMLCanvasElement>;

  // ── Three.js core ──────────────────────────────────────────────────────────
  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _rafId: number | null = null;

  // ── Per-planet tracking ────────────────────────────────────────────────────
  private readonly _planetAngles   = new Map<string, number>();
  private readonly _planetMeshes   = new Map<string, THREE.Mesh>();
  private readonly _hitAreaMeshes  = new Map<string, THREE.Mesh>();
  private readonly _orbitMaterials = new Map<string, THREE.MeshBasicMaterial>();
  private readonly _planetMaterials = new Map<string, OrreryPlanetMaterial>();
  private readonly _planetLayers = new Map<string, readonly OrreryPlanetLayerObject[]>();
  private readonly _planetData = new Map<string, PlanetData>();
  private readonly _planetOrbitEntries = Object.entries(PLANET_ORBITS);

  // ── Sun / Dyson ────────────────────────────────────────────────────────────
  private _dysonMaterial!: THREE.MeshStandardMaterial;

  // ── Backdrop visuals ───────────────────────────────────────────────────────
  private _starfield: THREE.Points | null = null;
  private readonly _starfieldRotationSpeed = ORRERY_STARFIELD_ROTATION_SPEED;

  // ── Interaction state ──────────────────────────────────────────────────────
  /** Planet hovered by moving the mouse over the orrery canvas. */
  private _hoveredPlanetId: string | null = null;
  /** Planet hovered externally from PlanetsMenuComponent via EventBus. */
  private _externalHoveredPlanetId: string | null = null;

  // ── Platform observers ─────────────────────────────────────────────────────
  private _intersectionObserver: IntersectionObserver | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  // Arrow-function handlers stored as fields so removeEventListener works.
  private readonly _onClick      = (e: MouseEvent): void => this._handleClick(e);
  private readonly _onMouseMove  = (e: MouseEvent): void => this._handleMouseMove(e);
  private readonly _onMouseLeave = (): void             => this._handleMouseLeave();

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngAfterViewInit(): void {
    const canvas = this._canvasRef.nativeElement;
    const aspect = canvas.clientWidth / (canvas.clientHeight || 1);

    this._renderer = createRenderer(canvas);
    this._scene    = new THREE.Scene();
    this._camera   = createCamera(aspect);
    const backdropPalette = this._readBackdropPalette();

    buildBackground(this._scene, backdropPalette);
    this._starfield = buildStarfield(this._scene, { palette: backdropPalette });
    // buildEclipticGrid(this._scene, PLANET_ORBITS, {
    //   color: backdropPalette.grid,
    //   opacity: ORRERY_GRID_OPACITY,
    // });
    createLights(this._scene);
    this._dysonMaterial = buildSun(this._scene).dysonMaterial;

    for (const planetData of this._data.getAllPlanets()) {
      const config = PLANET_ORBITS[planetData.id];
      if (!config) continue; // guard against unknown planet ids in JSON
      this._planetData.set(planetData.id, planetData);
      const { planetMesh, planetMaterial, layerObjects, hitAreaMesh, orbitMaterial } =
        buildPlanetObjects(this._scene, planetData, config, {
          color: backdropPalette.orbit,
          opacity: ORRERY_ORBIT_OPACITY,
        });
      this._planetMeshes.set(planetData.id, planetMesh);
      this._planetMaterials.set(planetData.id, planetMaterial);
      this._planetLayers.set(planetData.id, layerObjects);
      this._hitAreaMeshes.set(planetData.id, hitAreaMesh);
      this._orbitMaterials.set(planetData.id, orbitMaterial);
      this._planetAngles.set(planetData.id, config.initialAngle);
    }

    this._setupEventListeners(canvas);
    this._setupObservers(canvas);
    this._setupBusSubscriptions();
    this._startRAF();
  }

  ngOnDestroy(): void {
    this._stopRAF();
    this._intersectionObserver?.disconnect();
    this._resizeObserver?.disconnect();

    const canvas = this._canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('click',      this._onClick);
      canvas.removeEventListener('mousemove',  this._onMouseMove);
      canvas.removeEventListener('mouseleave', this._onMouseLeave);
    }

    if (this._scene && this._renderer) {
      disposeScene(this._scene, this._renderer);
    }

    this._planetMeshes.clear();
    this._hitAreaMeshes.clear();
    this._orbitMaterials.clear();
    this._planetMaterials.clear();
    this._planetLayers.clear();
    this._planetAngles.clear();
    this._planetData.clear();
    this._starfield = null;
  }

  // ---------------------------------------------------------------------------
  // Setup helpers
  // ---------------------------------------------------------------------------

  private _setupEventListeners(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('click',      this._onClick);
    canvas.addEventListener('mousemove',  this._onMouseMove);
    canvas.addEventListener('mouseleave', this._onMouseLeave);
  }

  private _setupObservers(canvas: HTMLCanvasElement): void {
    this._intersectionObserver = new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? this._startRAF() : this._stopRAF();
    });
    this._intersectionObserver.observe(canvas);

    this._resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) this._onResize(entry.contentRect);
    });
    this._resizeObserver.observe(canvas);
  }

  private _setupBusSubscriptions(): void {
    // PlanetsMenuComponent hovered a row → highlight matching planet in orrery.
    this._eventBus.planetHovered$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((id) => { this._externalHoveredPlanetId = id; });
    // TODO: subscribe to planetSelected$ for camera zoom post-playtest.
  }

  private _readBackdropPalette(): OrreryBackdropPalette {
    const styles = getComputedStyle(document.documentElement);
    const readToken = (name: string): string => styles.getPropertyValue(name).trim();

    return {
      backgroundCore: readToken('--orrery-bg-core'),
      backgroundEdge: readToken('--orrery-bg-edge'),
      grid: readToken('--orrery-grid'),
      orbit: readToken('--orrery-orbit'),
      star: readToken('--orrery-star'),
      featureStar: readToken('--orrery-star-feature'),
    };
  }

  // ---------------------------------------------------------------------------
  // RAF loop
  // ---------------------------------------------------------------------------

  private _startRAF(): void {
    if (this._rafId !== null) return;
    this._animate();
  }

  private _stopRAF(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  private _animate(): void {
    this._rafId = requestAnimationFrame(() => this._animate());

    // ── 1. Read ALL signals into locals — never call signal getters mid-render ──
    const isPaused      = this._gameState.isPaused();
    const planetsState  = this._gameState.planets();
    const dysonCoverage = this._gameState.dysonCoveragePercent();

    // ── 2. Advance orbit angles (skip when game is paused) ────────────────────
    if (!isPaused) {
      for (const [id, config] of this._planetOrbitEntries) {
        const prev = this._planetAngles.get(id) ?? config.initialAngle;
        this._planetAngles.set(id, prev + (1 / config.orbitalPeriod) * ORBIT_SPEED_FACTOR);
      }
    }

    // ── 3. Update planet positions ────────────────────────────────────────────
    for (const [id, config] of this._planetOrbitEntries) {
      const angle = this._planetAngles.get(id) ?? config.initialAngle;
      const x = Math.cos(angle) * config.orreryRadius;
      const z = Math.sin(angle) * config.orreryRadius;
      const planetMesh = this._planetMeshes.get(id);
      planetMesh?.position.set(x, 0, z);
      const layerObjects = this._planetLayers.get(id) ?? EMPTY_PLANET_LAYERS;
      for (const layerObject of layerObjects) {
        layerObject.mesh.position.set(x, 0, z);
      }
      this._hitAreaMeshes.get(id)?.position.set(x, 0, z);

      const material = this._planetMaterials.get(id);
      const staticPlanet = this._planetData.get(id);
      if (!material || !staticPlanet) continue;

      const isLocked         = planetsState[id] === undefined;
      const isLocalHovered   = this._hoveredPlanetId === id;
      const isExternalHovered = this._externalHoveredPlanetId === id && !isLocalHovered;
      const isAnyHovered     = isLocalHovered || isExternalHovered;

      const baseHex = isLocked
        ? staticPlanet.visual.baseColor
        : (planetsState[id].visualParams.atmosphereColor ||
           staticPlanet.visual.baseColor);
      const visualParams = planetsState[id]?.visualParams;
      const rotationSpeed = visualParams?.axisSpinSpeed ?? staticPlanet.initialState.axisSpinSpeed;
      const cloudRotationSpeed =
        visualParams?.cloudRotationSpeed ?? staticPlanet.initialState.cloudRotationSpeed;
      const rotationDirection =
        visualParams?.axisRotationDirection ?? staticPlanet.initialState.axisRotationDirection;
      const cityLightsIntensity =
        visualParams?.cityLightsIntensity ?? (staticPlanet.visual.layerTextures['cityLights'] ? 1 : 0);

      if (isLocalHovered && isLocked) {
        // Locked planet hover: grey tint communicates "cannot interact".
        material.uniforms.uTintColor.value.set(0x888888);
        material.uniforms.uLitBrightness.value = 1;
      } else if (isAnyHovered) {
        material.uniforms.uTintColor.value.set('#ffffff');
        material.uniforms.uLitBrightness.value = 1.18;
      } else {
        material.uniforms.uTintColor.value.set('#ffffff');
        material.uniforms.uLitBrightness.value = 1;
      }

      material.uniforms.uBaseColor.value.set(baseHex);
      material.uniforms.uSunDirection.value.set(-x, 0, -z).normalize();
      for (const layerObject of layerObjects) {
        layerObject.material.uniforms.uSunDirection.value.copy(material.uniforms.uSunDirection.value);
        layerObject.material.uniforms.uLitBrightness.value = material.uniforms.uLitBrightness.value;
        layerObject.material.uniforms.uOpacity.value = this._getLayerOpacity(
          layerObject.key,
          visualParams,
          staticPlanet
        );
        layerObject.material.uniforms.uLayerIntensity.value =
          layerObject.key === 'cityLights' ? cityLightsIntensity : 1;
      }

      if (!isPaused && planetMesh) {
        const directionMultiplier = rotationDirection === 'retrograde' ? -1 : 1;
        const planetRotationDelta = rotationSpeed * directionMultiplier * ORBIT_SPEED_FACTOR;
        planetMesh.rotation.y += planetRotationDelta;
        for (const layerObject of layerObjects) {
          const layerRotationDelta =
            layerObject.key === 'cloud'
              ? planetRotationDelta + cloudRotationSpeed * directionMultiplier
              : planetRotationDelta;
          layerObject.mesh.rotation.y += layerRotationDelta;
        }
      }
    }

    // ── 5. Update orbit ring opacity ──────────────────────────────────────────
    for (const [id, orbitMat] of this._orbitMaterials) {
      const isHovered =
        this._hoveredPlanetId === id || this._externalHoveredPlanetId === id;
      orbitMat.opacity = isHovered ? 0.25 : 0.08;
    }

    // ── 6. Update Dyson swarm opacity ─────────────────────────────────────────
    this._dysonMaterial.opacity = (dysonCoverage / 100) * 0.4;

    // ── 7. Optional backdrop drift ────────────────────────────────────────────
    if (this._starfieldRotationSpeed !== 0 && this._starfield) {
      this._starfield.rotation.y += this._starfieldRotationSpeed;
    }

    // ── 8. Render ─────────────────────────────────────────────────────────────
    this._renderer.render(this._scene, this._camera);
  }

  private _getLayerOpacity(
    key: string,
    visualParams: PlanetVisualParams | undefined,
    staticPlanet: PlanetData
  ): number {
    if (key === 'water') return visualParams?.waterOpacity ?? 1;
    if (key === 'green') return visualParams?.greenOpacity ?? 1;
    if (key === 'lava') return visualParams?.lavaOpacity ?? 1;
    if (key === 'cloud') return visualParams?.cloudOpacity ?? (staticPlanet.id === 'earth' ? 1 : 0.85);
    if (key === 'cityLights') {
      return visualParams?.cityLightsIntensity ?? (staticPlanet.visual.layerTextures['cityLights'] ? 1 : 0);
    }
    return 1;
  }

  // ---------------------------------------------------------------------------
  // Interaction handlers
  // ---------------------------------------------------------------------------

  private _handleClick(event: MouseEvent): void {
    const canvas = this._canvasRef.nativeElement;
    this._pointer.x =  (event.offsetX / canvas.clientWidth)  * 2 - 1;
    this._pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this._camera);

    const hits = this._raycaster.intersectObjects([...this._hitAreaMeshes.values()]);
    const planetId = hits[0]?.object.userData['planetId'] as string | undefined;
    if (planetId) {
      this._eventBus.planetSelected$.next(planetId);
    }
    // TODO: smooth camera zoom transition post-playtest.
  }

  private _handleMouseMove(event: MouseEvent): void {
    const canvas = this._canvasRef.nativeElement;
    this._pointer.x =  (event.offsetX / canvas.clientWidth)  * 2 - 1;
    this._pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this._camera);

    const hits = this._raycaster.intersectObjects([...this._hitAreaMeshes.values()]);
    const newId: string | null =
      (hits[0]?.object.userData['planetId'] as string | undefined) ?? null;

    if (newId === this._hoveredPlanetId) return; // no change

    this._hoveredPlanetId = newId;
    this._eventBus.planetHovered$.next(newId);

    // Cursor feedback: locked planet → not-allowed, unlocked → pointer.
    if (newId === null) {
      canvas.style.cursor = 'default';
    } else if (this._gameState.planets()[newId] === undefined) {
      canvas.style.cursor = 'not-allowed';
    } else {
      canvas.style.cursor = 'pointer';
    }
  }

  private _handleMouseLeave(): void {
    this._hoveredPlanetId = null;
    this._eventBus.planetHovered$.next(null);
    this._canvasRef.nativeElement.style.cursor = 'default';
  }

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------

  private _onResize({ width, height }: DOMRectReadOnly): void {
    if (width === 0 || height === 0) return;
    // false = do not override CSS canvas dimensions
    this._renderer.setSize(width, height, false);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
  }

  // Raycaster pointer — reused across frames to avoid allocation.
  private readonly _raycaster = new THREE.Raycaster();
  private readonly _pointer   = new THREE.Vector2();
}
