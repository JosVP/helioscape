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
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import {
  ORBIT_SPEED_FACTOR,
  PLANET_ORBITS,
  buildPlanetObjects,
  buildSun,
  createCamera,
  createLights,
  createRenderer,
  disposeScene,
} from './orrery-scene.builder';

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
  private readonly _orbitMaterials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly _planetMaterials = new Map<string, THREE.MeshStandardMaterial>();

  // ── Sun / Dyson ────────────────────────────────────────────────────────────
  private _dysonMaterial!: THREE.MeshStandardMaterial;

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

    createLights(this._scene);
    this._dysonMaterial = buildSun(this._scene).dysonMaterial;

    for (const planetData of this._data.getAllPlanets()) {
      const config = PLANET_ORBITS[planetData.id];
      if (!config) continue; // guard against unknown planet ids in JSON
      const { planetMesh, planetMaterial, hitAreaMesh, orbitMaterial } =
        buildPlanetObjects(this._scene, planetData.id, planetData.visual.baseColor, config);
      this._planetMeshes.set(planetData.id, planetMesh);
      this._planetMaterials.set(planetData.id, planetMaterial);
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
    this._planetAngles.clear();
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
      for (const [id, config] of Object.entries(PLANET_ORBITS)) {
        const prev = this._planetAngles.get(id) ?? config.initialAngle;
        this._planetAngles.set(id, prev + (1 / config.orbitalPeriod) * ORBIT_SPEED_FACTOR);
      }
    }

    // ── 3. Update planet positions ────────────────────────────────────────────
    for (const [id, config] of Object.entries(PLANET_ORBITS)) {
      const angle = this._planetAngles.get(id) ?? config.initialAngle;
      const x = Math.cos(angle) * config.orreryRadius;
      const z = Math.sin(angle) * config.orreryRadius;
      this._planetMeshes.get(id)?.position.set(x, 0, z);
      this._hitAreaMeshes.get(id)?.position.set(x, 0, z);
    }

    // ── 4. Update planet visual state ─────────────────────────────────────────
    for (const [id, mat] of this._planetMaterials) {
      const isLocked         = planetsState[id] === undefined;
      const isLocalHovered   = this._hoveredPlanetId === id;
      const isExternalHovered = this._externalHoveredPlanetId === id && !isLocalHovered;
      const isAnyHovered     = isLocalHovered || isExternalHovered;

      const baseHex = isLocked
        ? this._data.getPlanet(id).visual.baseColor
        : (planetsState[id].visualParams.atmosphereColor ||
           this._data.getPlanet(id).visual.baseColor);

      if (isLocalHovered && isLocked) {
        // Locked planet hover: grey tint communicates "cannot interact".
        mat.color.set(0x888888);
        mat.emissiveIntensity = 0;
      } else if (isAnyHovered) {
        mat.color.set(baseHex);
        mat.emissiveIntensity = 0.25;
      } else {
        mat.color.set(baseHex);
        mat.emissiveIntensity = 0;
      }
      // TODO: update ShaderMaterial uniforms when planet surface shaders are added.
    }

    // ── 5. Update orbit ring opacity ──────────────────────────────────────────
    for (const [id, orbitMat] of this._orbitMaterials) {
      const isHovered =
        this._hoveredPlanetId === id || this._externalHoveredPlanetId === id;
      orbitMat.opacity = isHovered ? 0.25 : 0.08;
    }

    // ── 6. Update Dyson swarm opacity ─────────────────────────────────────────
    this._dysonMaterial.opacity = (dysonCoverage / 100) * 0.4;

    // ── 7. Render ─────────────────────────────────────────────────────────────
    this._renderer.render(this._scene, this._camera);
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
