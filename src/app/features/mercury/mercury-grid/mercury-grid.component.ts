import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { PlacedBuilding } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { MercuryBuildService } from '@app/core/systems/mercury-build.service';
import { SettingsService } from '@app/core/services/settings.service';
import {
  HALF_H,
  HALF_W,
  TILE_H,
  TILE_W,
  drawTileDiamond,
  isInBounds,
  sortByDepth,
  toGrid,
  toScreen,
} from '@app/shared/utils/mercury-isometric.utils';

// ---------------------------------------------------------------------------
// Grid constants
// ---------------------------------------------------------------------------

const GRID_COLS = 12;
const GRID_ROWS = 10;

// NOTE: ORIGIN_Y = 80 per ARCHITECTURE.md; the build prompt suggested 60 but the
// architecture doc is canonical.
const ORIGIN_Y = 80;

// Canvas dimensions — wide enough for the full grid + one tile margin on each side.
const CANVAS_WIDTH = (GRID_COLS + 1) * TILE_W;
const CANVAS_HEIGHT = (GRID_ROWS + 2) * TILE_H * 2;

// ---------------------------------------------------------------------------
// Terrain types & colours
// ---------------------------------------------------------------------------

/** Rendering-only concept — not stored in game state. */
type TerrainType = 'polar' | 'flat' | 'crater_rim' | 'crater';

interface TerrainColor {
  fill: string;
  stroke: string;
}

const TERRAIN_COLORS: Record<TerrainType, TerrainColor> = {
  /** Permanently shadowed polar craters — cool blue-grey, ice. */
  polar: { fill: '#5a7a9a', stroke: '#4a6a8a' },
  /** Sunlit equatorial plains — warm amber-tan (~430 °C surface). */
  flat: { fill: '#c4a46b', stroke: '#b09050' },
  /** Partial shadow at crater edge — warm grey. */
  crater_rim: { fill: '#9a8870', stroke: '#8a7860' },
  /** Deep permanent shadow — cold blue-black (fusion reactor site). */
  crater: { fill: '#2a3550', stroke: '#1a2540' },
};

// ---------------------------------------------------------------------------
// Terrain map (structural geometry — not balance data, lives here in code)
// ---------------------------------------------------------------------------

/** 12×10 terrain layout. Index as TERRAIN_MAP[row][col]. */
const TERRAIN_MAP: readonly (readonly TerrainType[])[] = [
  // row 0 — polar (permanently shadowed cap)
  Array<TerrainType>(12).fill('polar'),
  // row 1 — polar
  Array<TerrainType>(12).fill('polar'),
  // rows 2–7 — flat sunlit plains
  Array<TerrainType>(12).fill('flat'),
  Array<TerrainType>(12).fill('flat'),
  Array<TerrainType>(12).fill('flat'),
  Array<TerrainType>(12).fill('flat'),
  Array<TerrainType>(12).fill('flat'),
  Array<TerrainType>(12).fill('flat'),
  // row 8 — crater rim; cols 4–8 are deep crater (fusion reactor site)
  [
    'crater_rim', 'crater_rim', 'crater_rim', 'crater_rim',
    'crater', 'crater', 'crater', 'crater', 'crater',
    'crater_rim', 'crater_rim', 'crater_rim',
  ],
  // row 9 — crater rim; cols 5–7 are deep crater (narrower opening)
  [
    'crater_rim', 'crater_rim', 'crater_rim', 'crater_rim', 'crater_rim',
    'crater', 'crater', 'crater',
    'crater_rim', 'crater_rim', 'crater_rim', 'crater_rim',
  ],
] as const;

// Flat list of all tile positions for iteration, pre-sorted by depth.
interface TilePos {
  col: number;
  row: number;
}
const ALL_TILES: TilePos[] = sortByDepth(
  Array.from({ length: GRID_ROWS }, (_, row) =>
    Array.from({ length: GRID_COLS }, (_, col) => ({ col, row })),
  ).flat(),
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-mercury-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mercury-grid.component.html',
  styleUrl: './mercury-grid.component.scss',
})
export class MercuryGridComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mercuryCanvas')
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  // Inputs/Outputs
  readonly selectedBuildingId = input<string | null>(null);
  readonly tileClicked = output<{ col: number; row: number; hasBuilding: boolean }>();

  // Services
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  // MercuryBuildService injected to ensure it is initialised (manages build queue ticks).
  // The grid itself never calls it directly — it reads results via gameState signals.
  readonly _mercuryBuild = inject(MercuryBuildService);
  private readonly eventBus = inject(EventBusService);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // Canvas internals — canvas-local state, never game state
  private ctx!: CanvasRenderingContext2D;
  private rafId = 0;
  private hoverTile: TilePos | null = null;

  /**
   * Image cache: buildingId → loaded HTMLImageElement.
   * NOTE: Sprite path is derived by convention:
   *   /assets/svg/buildings/{buildingId with underscores → hyphens}.svg
   * e.g. "mining_outpost" → "/assets/svg/buildings/mining-outpost.svg"
   */
  private readonly imageCache = new Map<string, HTMLImageElement>();

  /**
   * Tracks freshly-placed tiles for the brief placement-flash animation.
   * Key: `${col},${row}` → performance.now() at placement time.
   */
  private readonly freshlyPlaced = new Map<string, number>();

  // Bound event handlers — stored so they can be removed in ngOnDestroy.
  private readonly onMouseMoveBound = this.onMouseMove.bind(this);
  private readonly onClickBound = this.onClick.bind(this);
  private readonly onMouseLeaveBound = this.onMouseLeave.bind(this);
  private readonly onKeyDownBound = this.onKeyDown.bind(this);

  // Expose canvas size constants for the template.
  readonly canvasWidth = CANVAS_WIDTH;
  readonly canvasHeight = CANVAS_HEIGHT;

  // ---------------------------------------------------------------------------
  // Template-facing signals
  // ---------------------------------------------------------------------------

  /** Info about the currently-hovered tile, used by the status bar. */
  private readonly _hoveredTileInfo = signal<{
    col: number;
    row: number;
    terrain: TerrainType;
    buildingName: string | null;
  } | null>(null);
  readonly hoveredTileInfo = this._hoveredTileInfo.asReadonly();

  /** Text emitted into the ARIA live region on meaningful actions. */
  private readonly _announcementText = signal('');
  readonly announcementText = this._announcementText.asReadonly();

  /** Accessible label for the canvas element. */
  readonly canvasAriaLabel = computed(() =>
    this.selectedBuildingId()
      ? 'Mercury surface grid — building placement mode. Use arrow keys to move cursor, Enter to place.'
      : 'Mercury surface grid. Select a building to enter placement mode.',
  );

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    canvas.addEventListener('mousemove', this.onMouseMoveBound);
    canvas.addEventListener('mouseleave', this.onMouseLeaveBound);
    canvas.addEventListener('click', this.onClickBound);
    canvas.addEventListener('keydown', this.onKeyDownBound);

    // EventBus subscription — mercuryBuildCompleted$ fires when a build finishes.
    // The RAF loop redraws continuously, so no explicit redraw is needed; the
    // subscription exists to keep the service dependency explicit.
    this.eventBus.mercuryBuildCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // RAF already handles the next frame — no action required.
      });

    this.rafId = requestAnimationFrame(() => this.renderLoop());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.onMouseMoveBound);
      canvas.removeEventListener('mouseleave', this.onMouseLeaveBound);
      canvas.removeEventListener('click', this.onClickBound);
      canvas.removeEventListener('keydown', this.onKeyDownBound);
    }
    this.freshlyPlaced.clear();
    this.imageCache.clear();
  }

  // ---------------------------------------------------------------------------
  // RAF render loop
  // ---------------------------------------------------------------------------

  private renderLoop(timestamp = 0): void {
    this.drawFrame(timestamp);
    this.rafId = requestAnimationFrame((ts) => this.renderLoop(ts));
  }

  private drawFrame(timestamp: number): void {
    const canvas = this.canvasRef.nativeElement;
    // Read all signals ONCE at the top of the frame — never mid-render.
    const buildings = this.gameState.mercuryBuildings();
    const selectedId = this.selectedBuildingId();
    const reducedMotion = this.settings.reducedMotion();

    const originX = canvas.width / 2;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw all tiles (pre-sorted back-to-front by depth in ALL_TILES)
    for (const { col, row } of ALL_TILES) {
      const terrain = TERRAIN_MAP[row][col];
      const building = this.buildingAtTile(col, row, buildings);
      this.drawTile(col, row, terrain, building, originX, timestamp, reducedMotion);
    }

    // 2. Draw placement flash overlays (on top of tile + sprite layer)
    if (!reducedMotion) {
      for (const [key, flashTime] of this.freshlyPlaced) {
        const elapsed = timestamp - flashTime;
        if (elapsed >= 800) {
          this.freshlyPlaced.delete(key);
          continue;
        }
        const parts = key.split(',');
        const fc = Number(parts[0]);
        const fr = Number(parts[1]);
        const { x, y } = toScreen(fc, fr, originX, ORIGIN_Y);
        const alpha = (1 - elapsed / 800) * 0.55;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        drawTileDiamond(this.ctx, x, y, '#ffffff');
        this.ctx.restore();
      }
    } else {
      this.freshlyPlaced.clear();
    }

    // 3. Draw workers (stub — no mercuryWorkers signal exists yet; see TODO.md)
    this.drawWorkers();

    // 4. Draw hover preview when a building is selected and cursor is on the grid
    if (selectedId !== null && this.hoverTile !== null) {
      this.drawHoverPreview(this.hoverTile, selectedId, buildings, originX, timestamp, reducedMotion);
    }
  }

  // ---------------------------------------------------------------------------
  // Tile drawing
  // ---------------------------------------------------------------------------

  private drawTile(
    col: number,
    row: number,
    terrain: TerrainType,
    building: PlacedBuilding | undefined,
    originX: number,
    timestamp: number,
    reducedMotion: boolean,
  ): void {
    const { x, y } = toScreen(col, row, originX, ORIGIN_Y);
    const colors = TERRAIN_COLORS[terrain];
    drawTileDiamond(this.ctx, x, y, colors.fill, colors.stroke);

    if (building) {
      this.drawBuildingSprite(x, y, building);
      if (building.status === 'building') {
        const progress =
          building.totalBuildYears > 0
            ? building.buildProgressYears / building.totalBuildYears
            : 0;
        this.drawConstructionOverlay(x, y, progress, timestamp, reducedMotion);
      }
    }
  }

  private drawBuildingSprite(cx: number, cy: number, building: PlacedBuilding): void {
    const key = building.buildingId;
    let img = this.imageCache.get(key);

    if (!img) {
      // NOTE: sprite path derived by convention — underscores → hyphens.
      const spritePath = `/assets/svg/buildings/${key.replaceAll('_', '-')}.svg`;
      img = new Image();
      // Store immediately (even before load) so we don't re-create it next frame.
      this.imageCache.set(key, img);
      img.src = spritePath;
    }

    if (!img.complete || img.naturalWidth === 0) {
      // Loading in progress — draw grey placeholder rect
      this.ctx.save();
      this.ctx.fillStyle = '#888888';
      this.ctx.fillRect(cx - 12, cy - 28, 24, 28);
      this.ctx.restore();
      return;
    }

    // Draw sprite centred above the tile: 48×48 image, top-left offset so
    // it sits above the diamond's centre point.
    this.ctx.drawImage(img, cx - 24, cy - 48, 48, 48);
  }

  private drawConstructionOverlay(
    cx: number,
    cy: number,
    progress: number,
    timestamp: number,
    reducedMotion: boolean,
  ): void {
    const barW = 40;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = cy + 10;

    this.ctx.save();

    // Pulsing amber glow behind the bar (disabled with reduced-motion)
    if (!reducedMotion) {
      const pulse = Math.sin(timestamp / 400) * 0.12;
      this.ctx.globalAlpha = 0.18 + pulse;
      this.ctx.fillStyle = '#f5a623';
      this.ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    }

    // Background track
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.fillRect(barX, barY, barW, barH);

    // Progress fill — amber, capped accent colour
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = '#c8861e';
    this.ctx.fillRect(barX, barY, barW * progress, barH);

    // Bright leading edge
    if (progress > 0 && progress < 1) {
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillStyle = '#e8a030';
      this.ctx.fillRect(barX + barW * progress - 1, barY, 2, barH);
    }

    // Border
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(barX, barY, barW, barH);

    this.ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Hover preview
  // ---------------------------------------------------------------------------

  private drawHoverPreview(
    tile: TilePos,
    selectedId: string,
    buildings: PlacedBuilding[],
    originX: number,
    timestamp: number,
    reducedMotion: boolean,
  ): void {
    const building = this.data.getMercuryBuilding(selectedId);
    if (!building) return;

    const occupied = this.buildingAtTile(tile.col, tile.row, buildings);
    const terrain = TERRAIN_MAP[tile.row][tile.col];
    const valid =
      !occupied &&
      (building.placementRule === 'any' || building.placementRule === terrain);

    const { x, y } = toScreen(tile.col, tile.row, originX, ORIGIN_Y);
    const validColor = '#44ff88';
    const invalidColor = '#ff4444';
    const fillColor = valid ? validColor : invalidColor;

    this.ctx.save();

    // Solid fill preview
    this.ctx.globalAlpha = 0.45;
    drawTileDiamond(this.ctx, x, y, fillColor);

    // Breathing outer ring (valid placements only; reduced-motion uses static ring)
    const breathe = reducedMotion ? 0 : Math.sin(timestamp / 450) * 0.12;
    this.ctx.globalAlpha = (valid ? 0.7 : 0.5) + breathe;
    this.ctx.strokeStyle = fillColor;
    this.ctx.lineWidth = valid ? 1.5 : 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - HALF_H - 2);
    this.ctx.lineTo(x + HALF_W + 2, y);
    this.ctx.lineTo(x, y + HALF_H + 2);
    this.ctx.lineTo(x - HALF_W - 2, y);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Workers (stub)
  // ---------------------------------------------------------------------------

  // NOTE: No mercuryWorkers signal exists in GameStateService yet.
  // This is a stub. See docs/agents/TODO.md: MercuryGridComponent — Worker/vehicle rendering.
  private drawWorkers(): void {
    // No-op until worker state is added to GameStateService.
  }

  // ---------------------------------------------------------------------------
  // Mouse event handlers
  // ---------------------------------------------------------------------------

  private onMouseMove(e: MouseEvent): void {
    const { col, row } = toGrid(e.offsetX, e.offsetY, this.originX(), ORIGIN_Y);
    if (!isInBounds(col, row, GRID_COLS, GRID_ROWS)) {
      this.hoverTile = null;
      this._hoveredTileInfo.set(null);
      return;
    }
    this.hoverTile = { col, row };
    const terrain = TERRAIN_MAP[row][col];
    const building = this.buildingAtTile(col, row, this.gameState.mercuryBuildings());
    const buildingName = building
      ? (this.data.getMercuryBuilding(building.buildingId)?.displayName ?? null)
      : null;
    this._hoveredTileInfo.set({ col, row, terrain, buildingName });
  }

  private onMouseLeave(): void {
    this.hoverTile = null;
    this._hoveredTileInfo.set(null);
  }

  private onClick(e: MouseEvent): void {
    const { col, row } = toGrid(e.offsetX, e.offsetY, this.originX(), ORIGIN_Y);
    if (!isInBounds(col, row, GRID_COLS, GRID_ROWS)) return;

    const buildings = this.gameState.mercuryBuildings();
    const existing = this.buildingAtTile(col, row, buildings);

    if (existing) {
      this.tileClicked.emit({ col, row, hasBuilding: true });
      return;
    }

    const selectedId = this.selectedBuildingId();
    if (selectedId !== null) {
      const buildingData = this.data.getMercuryBuilding(selectedId);
      if (buildingData) {
        this.gameState.placeMercuryBuilding({
          id: crypto.randomUUID(),
          buildingId: selectedId,
          col,
          row,
          status: 'building',
          buildProgressYears: 0,
          totalBuildYears: buildingData.buildTimeYears,
        });
        // Placement flash animation
        this.freshlyPlaced.set(`${col},${row}`, performance.now());
        // ARIA live region announcement
        this._announcementText.set(
          `${buildingData.displayName} construction started at column ${col + 1}, row ${row + 1}.`,
        );
      }
    }

    this.tileClicked.emit({ col, row, hasBuilding: false });
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** Returns the first building at (col, row), or undefined if the tile is empty. */
  private buildingAtTile(
    col: number,
    row: number,
    buildings: PlacedBuilding[],
  ): PlacedBuilding | undefined {
    return buildings.find((b) => b.col === col && b.row === row);
  }

  /**
   * Returns the current canvas originX.
   * Recomputed at event-handler time (not cached) in case the canvas resizes.
   */
  private originX(): number {
    return this.canvasRef.nativeElement.width / 2;
  }

  /**
   * Keyboard navigation — arrow keys move the tile cursor;
   * Enter/Space trigger the click action at the current hoverTile.
   */
  private onKeyDown(e: KeyboardEvent): void {
    const moves: Record<string, { dc: number; dr: number }> = {
      ArrowLeft:  { dc: -1, dr:  0 },
      ArrowRight: { dc:  1, dr:  0 },
      ArrowUp:    { dc:  0, dr: -1 },
      ArrowDown:  { dc:  0, dr:  1 },
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault(); // stop page scroll
      const current = this.hoverTile ?? { col: Math.floor(GRID_COLS / 2), row: Math.floor(GRID_ROWS / 2) };
      const next = {
        col: Math.max(0, Math.min(GRID_COLS - 1, current.col + move.dc)),
        row: Math.max(0, Math.min(GRID_ROWS - 1, current.row + move.dr)),
      };
      this.hoverTile = next;
      const terrain = TERRAIN_MAP[next.row][next.col];
      const building = this.buildingAtTile(next.col, next.row, this.gameState.mercuryBuildings());
      const buildingName = building
        ? (this.data.getMercuryBuilding(building.buildingId)?.displayName ?? null)
        : null;
      this._hoveredTileInfo.set({ col: next.col, row: next.row, terrain, buildingName });
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.hoverTile) {
        // Synthesise a click at the current keyboard cursor position
        const { col, row } = this.hoverTile;
        const buildings = this.gameState.mercuryBuildings();
        const existing = this.buildingAtTile(col, row, buildings);
        if (existing) {
          this.tileClicked.emit({ col, row, hasBuilding: true });
          return;
        }
        const selectedId = this.selectedBuildingId();
        if (selectedId !== null) {
          const buildingData = this.data.getMercuryBuilding(selectedId);
          if (buildingData) {
            this.gameState.placeMercuryBuilding({
              id: crypto.randomUUID(),
              buildingId: selectedId,
              col,
              row,
              status: 'building',
              buildProgressYears: 0,
              totalBuildYears: buildingData.buildTimeYears,
            });
            this.freshlyPlaced.set(`${col},${row}`, performance.now());
            this._announcementText.set(
              `${buildingData.displayName} construction started at column ${col + 1}, row ${row + 1}.`,
            );
          }
        }
        this.tileClicked.emit({ col, row, hasBuilding: false });
      }
    }
  }

  /** Human-readable terrain label for the status bar. */
  terrainLabel(terrain: TerrainType): string {
    const labels: Record<TerrainType, string> = {
      polar: 'Polar Ice',
      flat: 'Sunlit Plains',
      crater_rim: 'Crater Rim',
      crater: 'Deep Crater',
    };
    return labels[terrain];
  }
}

// Re-export constants so the template can reference them if needed.
export { GRID_COLS, GRID_ROWS, HALF_H, HALF_W, TILE_H, TILE_W };
