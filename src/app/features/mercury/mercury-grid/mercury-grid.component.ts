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
import type { MercuryMiningLocation, MercurySlot } from '@app/core/services/data.service';
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
// Grid constants — 128×128 fully playable game grid.
//
// The camera is clamped to an inner 64×64 zone (VIEW_OFFSET … VIEW_LAST) so
// the viewport corners always land on real gameplay tiles.  The outer 32-tile
// buffer on every side is never reachable by camera scroll, but every tile in
// the full 128×128 grid is a valid build target.
// ---------------------------------------------------------------------------

const GRID_COLS = 128;
const GRID_ROWS = 128;
const ORIGIN_Y  = 80;

// Inner 64×64 camera-accessible zone centred in the 128×128 grid.
const VIEW_OFFSET = 32;                          // inner zone starts at col/row 32
const VIEW_SIZE   = 64;                          // inner zone is 64×64 tiles
const VIEW_LAST   = VIEW_OFFSET + VIEW_SIZE - 1; // = 95

// Horizontal half-span of the inner zone (identical to the old 64×64 grid span).
const VIEW_HALF_W = (VIEW_SIZE + VIEW_SIZE - 2) / 2 * HALF_W;  // 63 × 32 = 2016 px

// Draw-space Y of the top vertex of the northernmost inner tile (32,32).
const VIEW_TOP_Y    = ORIGIN_Y + (VIEW_OFFSET + VIEW_OFFSET - 1) * HALF_H; // 1088 px
// Draw-space Y of the bottom vertex of the southernmost inner tile (95,95).
const VIEW_BOTTOM_Y = ORIGIN_Y + (VIEW_LAST + VIEW_LAST + 1) * HALF_H;     // 3136 px

// Render grid = full 128×128 (no extra filler border needed; the 32-tile buffer
// around the inner zone is more than enough to fill any viewport corner).
const RENDER_COLS = GRID_COLS;
const RENDER_ROWS = GRID_ROWS;

/** Default 2×2 footprint used when a building has no footprint defined. */
const DEFAULT_FOOTPRINT: readonly [number, number][] = [[0,0],[1,0],[0,1],[1,1]];

// ---------------------------------------------------------------------------
// Terrain types & colours
// ---------------------------------------------------------------------------

type TerrainType = 'polar' | 'flat' | 'crater_rim' | 'crater';

const TERRAIN_COLORS: Record<TerrainType, { fill: string; stroke: string }> = {
  polar:      { fill: '#5a7a9a', stroke: '#4a6a8a' },
  flat:       { fill: '#c4a46b', stroke: '#b09050' },
  crater_rim: { fill: '#9a8870', stroke: '#8a7860' },
  crater:     { fill: '#2a3550', stroke: '#1a2540' },
};

/** Special-slot overlay tints drawn over reserved tile types. */
const SLOT_TINTS: Partial<Record<string, string>> = {
  mining_location: '#ffcc44',
  refinery:        '#88bbff',
  solar_array:     '#ffee88',
  mass_driver:     '#ff8844',
  fusion_reactor:  '#cc44ff',
};

// Pre-sorted tile list (back → front). Computed once at module load.
interface TilePos { col: number; row: number; }
const ALL_TILES: TilePos[] = sortByDepth(
  Array.from({ length: RENDER_ROWS }, (_, row) =>
    Array.from({ length: RENDER_COLS }, (_, col) => ({ col, row }))
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

  // ---------------------------------------------------------------------------
  // Inputs / outputs
  // ---------------------------------------------------------------------------

  readonly selectedBuildingId = input<string | null>(null);

  /** Emitted on tile click. Includes terrain type and slotId for parent use. */
  readonly tileClicked = output<{
    col: number;
    row: number;
    hasBuilding: boolean;
    terrain: string;
    slotId: string | null;
  }>();

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------

  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  // Injected to ensure the service is initialised (manages build queue ticks).
  readonly _mercuryBuild = inject(MercuryBuildService);
  private readonly eventBus = inject(EventBusService);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // Canvas internals
  // ---------------------------------------------------------------------------

  private ctx!: CanvasRenderingContext2D;
  private rafId = 0;
  private hoverTile: TilePos | null = null;

  // ---------------------------------------------------------------------------
  // Viewport + pan state (RTS camera)
  // ---------------------------------------------------------------------------

  /** Current viewport pixel dimensions — updated by ResizeObserver. */
  private viewW = 0;
  private viewH = 0;

  /** Pan offset: positive = map content moves right/down. */
  private panX = 0;
  private panY = 0;

  /** Last known mouse viewport-pixel position for edge-scroll detection. */
  private edgeScrollX = -Infinity;
  private edgeScrollY = -Infinity;

  private static readonly EDGE_ZONE  = 200;  // px from edge that activates scroll
  private static readonly EDGE_SPEED = 10;   // px per RAF frame

  private resizeObserver: ResizeObserver | null = null;

  /** Slot lookup by position key `"${col},${row}"`. Built in ngAfterViewInit. */
  private slotByPos = new Map<string, MercurySlot>();
  /** Mining location lookup by slotId. Built in ngAfterViewInit. */
  private miningBySlotId = new Map<string, MercuryMiningLocation>();

  /** Image cache: buildingId → HTMLImageElement. */
  private readonly imageCache = new Map<string, HTMLImageElement>();
  /** Flash animation: `"${col},${row}"` → timestamp of placement. */
  private readonly freshlyPlaced = new Map<string, number>();

  // Bound event handlers for cleanup.
  private readonly onMouseMoveBound = this.onMouseMove.bind(this);
  private readonly onClickBound = this.onClick.bind(this);
  private readonly onMouseLeaveBound = this.onMouseLeave.bind(this);
  private readonly onKeyDownBound = this.onKeyDown.bind(this);

  // ---------------------------------------------------------------------------
  // Template-facing signals
  // ---------------------------------------------------------------------------

  private readonly _hoveredTileInfo = signal<{
    col: number;
    row: number;
    terrain: TerrainType;
    buildingName: string | null;
    slotId: string | null;
  } | null>(null);
  readonly hoveredTileInfo = this._hoveredTileInfo.asReadonly();

  /** Non-null when hovering a mining_location slot. Drives the ore tooltip. */
  private readonly _hoveredMiningLocation = signal<MercuryMiningLocation | null>(null);
  readonly hoveredMiningLocation = this._hoveredMiningLocation.asReadonly();

  private readonly _announcementText = signal('');
  readonly announcementText = this._announcementText.asReadonly();

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

    // Build slot lookup maps from loaded data.
    const mapData = this.data.getMercuryMapData();
    if (mapData) {
      for (const slot of mapData.slots) {
        this.slotByPos.set(`${slot.col},${slot.row}`, slot);
      }
      for (const mine of mapData.miningLocations) {
        this.miningBySlotId.set(mine.slotId, mine);
      }
    }

    // Resize observer keeps canvas pixel dimensions in sync with CSS display size.
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          this.viewW = canvas.width;
          this.viewH = canvas.height;
          this.clampPan();
        }
      }
    });
    this.resizeObserver.observe(canvas);

    // Bootstrap from current size immediately (before first ResizeObserver tick).
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      this.viewW = canvas.width;
      this.viewH = canvas.height;
    }

    // Start pan centred on the inner 64×64 zone.
    this.panX = 0;
    const innerCenterY = Math.floor((VIEW_TOP_Y + VIEW_BOTTOM_Y) / 2);
    this.panY = this.viewH > 0
      ? Math.floor(this.viewH / 2) - innerCenterY
      : -innerCenterY;
    this.clampPan();

    canvas.addEventListener('mousemove', this.onMouseMoveBound);
    canvas.addEventListener('mouseleave', this.onMouseLeaveBound);
    canvas.addEventListener('click', this.onClickBound);
    canvas.addEventListener('keydown', this.onKeyDownBound);

    this.eventBus.mercuryBuildCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { /* RAF loop handles next frame automatically */ });

    this.rafId = requestAnimationFrame(() => this.renderLoop());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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

  private clampPan(): void {
    // Horizontal: keep inner zone's left/right vertices within the viewport.
    const maxPanX = Math.max(0, VIEW_HALF_W - this.viewW / 2);
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));

    // Vertical: clamp so camera only shows the inner VIEW_SIZE×VIEW_SIZE zone.
    //   lo = panY that puts inner zone BOTTOM at screen bottom (max pan up).
    //   hi = panY that puts inner zone TOP    at screen top    (max pan down).
    const lo = this.viewH - VIEW_BOTTOM_Y;
    const hi = -VIEW_TOP_Y;
    if (lo >= hi) {
      // Inner zone fits entirely in viewport — centre it.
      this.panY = Math.round((lo + hi) / 2);
    } else {
      this.panY = Math.max(lo, Math.min(hi, this.panY));
    }
  }

  // ---------------------------------------------------------------------------
  // Edge-scroll
  // ---------------------------------------------------------------------------

  /**
   * Called every RAF frame. When the mouse is within EDGE_ZONE pixels of a
   * viewport edge the camera drifts toward that edge at EDGE_SPEED px/frame.
   * Does nothing during drag-pan (drag takes priority).
   */
  private applyEdgeScroll(): void {
    if (!isFinite(this.edgeScrollX)) return;

    const zone  = MercuryGridComponent.EDGE_ZONE;
    const hSpeed = MercuryGridComponent.EDGE_SPEED;
    const vSpeed = MercuryGridComponent.EDGE_SPEED / 1.5; // tile height is half the width, so slow vertical scroll a bit to keep perceived speed consistent in both axes.
    let moved = false;

    
    if (this.edgeScrollX < zone)              { this.panX += hSpeed; moved = true; }
    if (this.edgeScrollX > this.viewW - zone) { this.panX -= hSpeed; moved = true; }
    if (this.edgeScrollY < zone)              { this.panY += vSpeed; moved = true; }
    if (this.edgeScrollY > this.viewH - zone) { this.panY -= vSpeed; moved = true; }

    if (moved) {
      this.clampPan();
      // Re-evaluate the hovered tile since the pan changed without a mouse-move event.
      if (isFinite(this.edgeScrollX) && isFinite(this.edgeScrollY)) {
        this.updateHoverFromScreenPos(this.edgeScrollX, this.edgeScrollY);
      }
    }
  }

  private renderLoop(timestamp = 0): void {
    this.applyEdgeScroll();
    this.drawFrame(timestamp);
    this.rafId = requestAnimationFrame((ts) => this.renderLoop(ts));
  }

  private drawFrame(timestamp: number): void {
    const vw = this.viewW;
    const vh = this.viewH;
    if (vw === 0 || vh === 0) return;

    // Read all signals ONCE at the top of the frame — never mid-render.
    const buildings = this.gameState.mercuryBuildings();
    const selectedId = this.selectedBuildingId();
    const reducedMotion = this.settings.reducedMotion();

    // The tile (0,0) top-vertex is always drawn at (vw/2, ORIGIN_Y) in draw-space.
    // ctx.translate(panX, panY) shifts the entire drawn scene, so the screen position
    // of tile (0,0) is (vw/2 + panX, ORIGIN_Y + panY).
    const originX = vw / 2;

    // Fill background before drawing tiles — avoids a transparent/black flash when
    // the canvas is resized between RAF frames.
    this.ctx.fillStyle = '#1a1520';
    this.ctx.fillRect(0, 0, vw, vh);

    // Apply pan translation for the scene.
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);

    // Draw all tiles back→front (includes border tiles that cover viewport corners)
    for (const { col, row } of ALL_TILES) {
      const terrain = this.getTerrainAt(col, row);
      const building = this.buildingAtTile(col, row, buildings);
      this.drawTile(col, row, terrain, building, originX, timestamp, reducedMotion);
    }

    // Draw placement flash overlays
    if (!reducedMotion) {
      for (const [key, flashTime] of this.freshlyPlaced) {
        const elapsed = timestamp - flashTime;
        if (elapsed >= 800) { this.freshlyPlaced.delete(key); continue; }
        const [fc, fr] = key.split(',').map(Number);
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

    // Workers stub (see TODO.md)
    this.drawWorkers();

    // Hover preview
    if (selectedId !== null && this.hoverTile !== null) {
      this.drawHoverPreview(this.hoverTile, selectedId, buildings, originX, timestamp, reducedMotion);
    }

    this.ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Terrain resolution
  // ---------------------------------------------------------------------------

  /**
   * Returns the terrain type for a tile.
   * Crater overrides only apply within the 64×64 game grid.
   * For rows outside the game grid (border tiles), the row is clamped to the
   * nearest edge before looking up terrain rules — this naturally extends polar
   * ice bands beyond rows 0 and 63 without needing extra JSON entries.
   */
  private getTerrainAt(col: number, row: number): TerrainType {
    const mapData = this.data.getMercuryMapData();
    if (!mapData) return 'flat';

    // Crater overrides: only valid within the playable game grid.
    if (isInBounds(col, row, GRID_COLS, GRID_ROWS)) {
      for (const ov of mapData.craterOverrides) {
        if (col >= ov.colMin && col <= ov.colMax && row >= ov.rowMin && row <= ov.rowMax) {
          return 'crater';
        }
      }
    }

    // Clamp row to game-grid range so terrain bands extend naturally into the border.
    const effectiveRow = Math.max(0, Math.min(GRID_ROWS - 1, row));
    for (const rule of mapData.terrainRules) {
      if (effectiveRow >= rule.rowMin && effectiveRow <= rule.rowMax) {
        return rule.type as TerrainType;
      }
    }
    return 'flat';
  }

  // ---------------------------------------------------------------------------
  // Slot helpers
  // ---------------------------------------------------------------------------

  private getSlotAt(col: number, row: number): MercurySlot | null {
    return this.slotByPos.get(`${col},${row}`) ?? null;
  }

  private getFootprint(buildingId: string): readonly [number, number][] {
    const building = this.data.getMercuryBuilding(buildingId);
    return (building?.footprint as [number, number][] | undefined) ?? DEFAULT_FOOTPRINT;
  }

  private getFootprintTiles(anchorCol: number, anchorRow: number, buildingId: string): TilePos[] {
    return this.getFootprint(buildingId).map(([dc, dr]) => ({ col: anchorCol + dc, row: anchorRow + dr }));
  }

  /** Returns true if the anchor + footprint tiles are a valid placement. */
  private isValidPlacement(anchorCol: number, anchorRow: number, buildingId: string, buildings: PlacedBuilding[]): boolean {
    const buildingDef = this.data.getMercuryBuilding(buildingId);
    if (!buildingDef) return false;

    const tiles = this.getFootprintTiles(anchorCol, anchorRow, buildingId);

    // All tiles must be in-bounds.
    if (tiles.some(t => !isInBounds(t.col, t.row, GRID_COLS, GRID_ROWS))) return false;

    // All tiles must be unoccupied.
    if (tiles.some(t => this.buildingAtTile(t.col, t.row, buildings) !== undefined)) return false;

    // Check slot type compatibility for the anchor tile.
    const slot = this.getSlotAt(anchorCol, anchorRow);
    const terrain = this.getTerrainAt(anchorCol, anchorRow);
    const allowedSlotType = buildingDef.allowedSlotType;

    if (slot?.reserved) {
      // Reserved slot: ONLY the designated building type may go here.
      if (allowedSlotType) return allowedSlotType === slot.slotType;
      return buildingDef.placementRule === slot.slotType;
    }

    if (slot?.slotType === 'mining_location') return false; // Can't build on a mine marker.

    // Non-reserved tile: check terrain/slot compatibility.
    if (allowedSlotType === 'any') return true;
    if (allowedSlotType) {
      // Must not be placing a reserved-only building (e.g. fusion_reactor) on a free tile.
      const reservedTypes = ['fusion_reactor', 'mass_driver', 'refinery'];
      if (reservedTypes.includes(allowedSlotType)) return false;
      return terrain === allowedSlotType || allowedSlotType === 'any';
    }

    return buildingDef.placementRule === 'any' || buildingDef.placementRule === terrain;
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

    // Draw slot tint overlay for special reserved tiles.
    const slot = this.getSlotAt(col, row);
    if (slot) {
      const tint = SLOT_TINTS[slot.slotType];
      if (tint && !building) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.18;
        drawTileDiamond(this.ctx, x, y, tint);
        this.ctx.restore();
        // Small marker dot at slot centre
        this.ctx.save();
        this.ctx.globalAlpha = 0.55;
        this.ctx.fillStyle = tint;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    if (building) {
      this.drawBuildingSprite(x, y, building);
      if (building.status === 'building') {
        const progress = building.totalBuildYears > 0
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
      const spritePath = `/assets/svg/buildings/${key.replaceAll('_', '-')}.svg`;
      img = new Image();
      this.imageCache.set(key, img);
      img.src = spritePath;
    }

    if (!img.complete || img.naturalWidth === 0) {
      this.ctx.save();
      this.ctx.fillStyle = '#888888';
      this.ctx.fillRect(cx - 12, cy - 28, 24, 28);
      this.ctx.restore();
      return;
    }

    // Sprite for a 2×2 building: draw centred over the footprint.
    // The visual centre of [[0,0],[1,0],[0,1],[1,1]] in screen space is
    // offset +HALF_W horizontally and +HALF_H vertically from anchor screen pos.
    const footprintCx = cx + HALF_W;
    const footprintCy = cy + HALF_H;
    this.ctx.drawImage(img, footprintCx - 32, footprintCy - 64, 64, 64);
  }

  private drawConstructionOverlay(
    cx: number,
    cy: number,
    progress: number,
    timestamp: number,
    reducedMotion: boolean,
  ): void {
    // Centre over the 2×2 footprint (same offset as sprite)
    const barCx = cx + HALF_W;
    const barCy = cy + HALF_H + 8;
    const barW = 48;
    const barH = 6;
    const barX = barCx - barW / 2;
    const barY = barCy;

    this.ctx.save();

    if (!reducedMotion) {
      const pulse = Math.sin(timestamp / 400) * 0.12;
      this.ctx.globalAlpha = 0.18 + pulse;
      this.ctx.fillStyle = '#f5a623';
      this.ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    }

    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this.ctx.fillRect(barX, barY, barW, barH);

    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = '#c8861e';
    this.ctx.fillRect(barX, barY, barW * progress, barH);

    if (progress > 0 && progress < 1) {
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillStyle = '#e8a030';
      this.ctx.fillRect(barX + barW * progress - 1, barY, 2, barH);
    }

    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(barX, barY, barW, barH);

    this.ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Hover preview (covers all footprint tiles)
  // ---------------------------------------------------------------------------

  private drawHoverPreview(
    tile: TilePos,
    selectedId: string,
    buildings: PlacedBuilding[],
    originX: number,
    timestamp: number,
    reducedMotion: boolean,
  ): void {
    const valid = this.isValidPlacement(tile.col, tile.row, selectedId, buildings);
    const fillColor = valid ? '#44ff88' : '#ff4444';
    const fpTiles = this.getFootprintTiles(tile.col, tile.row, selectedId);

    this.ctx.save();

    for (const t of fpTiles) {
      if (!isInBounds(t.col, t.row, GRID_COLS, GRID_ROWS)) continue;
      const { x, y } = toScreen(t.col, t.row, originX, ORIGIN_Y);
      this.ctx.globalAlpha = 0.45;
      drawTileDiamond(this.ctx, x, y, fillColor);

      // Outline each footprint tile
      const breathe = reducedMotion ? 0 : Math.sin(timestamp / 450) * 0.12;
      this.ctx.globalAlpha = (valid ? 0.7 : 0.5) + breathe;
      this.ctx.strokeStyle = fillColor;
      this.ctx.lineWidth = valid ? 1.5 : 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x,           y - HALF_H - 2);
      this.ctx.lineTo(x + HALF_W + 2, y);
      this.ctx.lineTo(x,           y + HALF_H + 2);
      this.ctx.lineTo(x - HALF_W - 2, y);
      this.ctx.closePath();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Workers stub
  // ---------------------------------------------------------------------------

  // NOTE: see TODO.md — worker signal not yet in GameStateService.
  private drawWorkers(): void { /* no-op until Block 9.6 */ }

  // ---------------------------------------------------------------------------
  // Building lookup (footprint-aware)
  // ---------------------------------------------------------------------------

  /**
   * Returns the placed building that occupies (col, row), considering all
   * footprint tiles — not just the anchor.
   */
  private buildingAtTile(col: number, row: number, buildings: PlacedBuilding[]): PlacedBuilding | undefined {
    return buildings.find(b => {
      const fp = this.getFootprint(b.buildingId);
      return fp.some(([dc, dr]) => b.col + dc === col && b.row + dr === row);
    });
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private onMouseMove(e: MouseEvent): void {
    // Always track position so edge-scroll knows where the mouse is.
    this.edgeScrollX = e.offsetX;
    this.edgeScrollY = e.offsetY;
    this.updateHoverFromScreenPos(e.offsetX, e.offsetY);
  }

  /** Recalculate the hovered tile from a viewport pixel position. */
  private updateHoverFromScreenPos(screenX: number, screenY: number): void {
    const originX = this.viewW / 2;
    // Convert viewport pixel → draw-space by subtracting pan offset.
    const { col, row } = toGrid(screenX - this.panX, screenY - this.panY, originX, ORIGIN_Y);
    if (!isInBounds(col, row, GRID_COLS, GRID_ROWS)) {
      this.hoverTile = null;
      this._hoveredTileInfo.set(null);
      this._hoveredMiningLocation.set(null);
      return;
    }
    this.hoverTile = { col, row };
    const terrain = this.getTerrainAt(col, row);
    const slot = this.getSlotAt(col, row);
    const building = this.buildingAtTile(col, row, this.gameState.mercuryBuildings());
    const buildingName = building
      ? (this.data.getMercuryBuilding(building.buildingId)?.displayName ?? null)
      : null;
    this._hoveredTileInfo.set({ col, row, terrain, buildingName, slotId: slot?.id ?? null });

    // Update mining location tooltip signal.
    const mine = slot?.slotType === 'mining_location'
      ? (this.miningBySlotId.get(slot.id) ?? null)
      : null;
    this._hoveredMiningLocation.set(mine);
  }

  private onMouseLeave(): void {
    this.edgeScrollX = -Infinity;
    this.edgeScrollY = -Infinity;
    this.hoverTile = null;
    this._hoveredTileInfo.set(null);
    this._hoveredMiningLocation.set(null);
  }

  private onClick(e: MouseEvent): void {
    const originX = this.viewW / 2;
    const { col, row } = toGrid(e.offsetX - this.panX, e.offsetY - this.panY, originX, ORIGIN_Y);
    if (!isInBounds(col, row, GRID_COLS, GRID_ROWS)) return;

    const buildings = this.gameState.mercuryBuildings();
    const existing = this.buildingAtTile(col, row, buildings);
    const terrain = this.getTerrainAt(col, row);
    const slot = this.getSlotAt(col, row);

    if (existing) {
      this.tileClicked.emit({ col, row, hasBuilding: true, terrain, slotId: slot?.id ?? null });
      return;
    }

    const selectedId = this.selectedBuildingId();
    if (selectedId !== null && this.isValidPlacement(col, row, selectedId, buildings)) {
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
        // Flash all footprint tiles
        const fpTiles = this.getFootprintTiles(col, row, selectedId);
        const now = performance.now();
        for (const t of fpTiles) {
          this.freshlyPlaced.set(`${t.col},${t.row}`, now);
        }
        this._announcementText.set(
          `${buildingData.displayName} construction started at column ${col - VIEW_OFFSET + 1}, row ${row - VIEW_OFFSET + 1}.`,
        );
      }
    }

    this.tileClicked.emit({ col, row, hasBuilding: false, terrain, slotId: slot?.id ?? null });
  }

  private onKeyDown(e: KeyboardEvent): void {
    const moves: Record<string, { dc: number; dr: number }> = {
      ArrowLeft:  { dc: -1, dr:  0 },
      ArrowRight: { dc:  1, dr:  0 },
      ArrowUp:    { dc:  0, dr: -1 },
      ArrowDown:  { dc:  0, dr:  1 },
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      const current = this.hoverTile ?? { col: Math.floor((VIEW_OFFSET + VIEW_LAST) / 2), row: Math.floor((VIEW_OFFSET + VIEW_LAST) / 2) };
      const next = {
        col: Math.max(VIEW_OFFSET, Math.min(VIEW_LAST, current.col + move.dc)),
        row: Math.max(VIEW_OFFSET, Math.min(VIEW_LAST, current.row + move.dr)),
      };
      this.hoverTile = next;
      const terrain = this.getTerrainAt(next.col, next.row);
      const slot = this.getSlotAt(next.col, next.row);
      const building = this.buildingAtTile(next.col, next.row, this.gameState.mercuryBuildings());
      const buildingName = building
        ? (this.data.getMercuryBuilding(building.buildingId)?.displayName ?? null)
        : null;
      this._hoveredTileInfo.set({ col: next.col, row: next.row, terrain, buildingName, slotId: slot?.id ?? null });
      const mine = slot?.slotType === 'mining_location'
        ? (this.miningBySlotId.get(slot.id) ?? null)
        : null;
      this._hoveredMiningLocation.set(mine);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.hoverTile) {
        // Synthesise a click at keyboard cursor position.
        const { col, row } = this.hoverTile;
        const buildings = this.gameState.mercuryBuildings();
        const existing = this.buildingAtTile(col, row, buildings);
        const terrain = this.getTerrainAt(col, row);
        const slot = this.getSlotAt(col, row);
        if (existing) {
          this.tileClicked.emit({ col, row, hasBuilding: true, terrain, slotId: slot?.id ?? null });
          return;
        }
        const selectedId = this.selectedBuildingId();
        if (selectedId !== null && this.isValidPlacement(col, row, selectedId, buildings)) {
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
            const fpTiles = this.getFootprintTiles(col, row, selectedId);
            const now = performance.now();
            for (const t of fpTiles) {
              this.freshlyPlaced.set(`${t.col},${t.row}`, now);
            }
            this._announcementText.set(
              `${buildingData.displayName} construction started at column ${col - VIEW_OFFSET + 1}, row ${row - VIEW_OFFSET + 1}.`,
            );
          }
        }
        this.tileClicked.emit({ col, row, hasBuilding: false, terrain, slotId: slot?.id ?? null });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  /** Convert an internal grid coord to the 1-based user-facing display coord. */
  displayCoord(val: number): number { return val - VIEW_OFFSET + 1; }

  terrainLabel(terrain: string): string {
    const labels: Record<string, string> = {
      polar:      'Polar Ice',
      flat:       'Sunlit Plains',
      crater_rim: 'Crater Rim',
      crater:     'Deep Crater',
    };
    return labels[terrain] ?? terrain;
  }

  slotLabel(slotType: string): string {
    const labels: Record<string, string> = {
      mining_location: 'Mining Location',
      refinery:        'Refinery Slot',
      solar_array:     'Solar Array Slot',
      mass_driver:     'Mass Driver Site',
      fusion_reactor:  'Fusion Reactor Site',
    };
    return labels[slotType] ?? slotType;
  }

  /** Returns the slotType for a slot id — called from the template. */
  getSlotType(slotId: string): string {
    const slot = this.data.getMercurySlot(slotId);
    return slot?.slotType ?? '';
  }
}

// Re-export constants for use in parent components.
export { GRID_COLS, GRID_ROWS, HALF_H, HALF_W, TILE_H, TILE_W };

