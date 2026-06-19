import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { TechNode, PendingFork } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import { ResearchService } from '@app/core/systems/research.service';
import {
  TechNodeCardComponent,
  type NodeVisibility,
} from './tech-node-card/tech-node-card.component';
import { ForkChoiceModalComponent } from './fork-choice-modal/fork-choice-modal.component';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NodeEntry {
  readonly node: TechNode;
  readonly visibility: NodeVisibility;
  readonly interactive: boolean;
  readonly progressPercent?: number;
  readonly etaYear?: number;
}

/** Ordered map of nodeId → NodeEntry, insertion order = render order. */
type ColumnStates = Map<string, NodeEntry>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-research-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechNodeCardComponent, ForkChoiceModalComponent],
  templateUrl: './research-hub.component.html',
  styleUrl: './research-hub.component.scss',
})
export class ResearchHubComponent implements AfterViewInit, OnDestroy {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly techTreeService = inject(TechTreeService);
  private readonly researchService = inject(ResearchService);
  private readonly eventBus = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);

  readonly closed = output<void>();

  // ---------------------------------------------------------------------------
  // View refs for SVG line drawing
  // ---------------------------------------------------------------------------

  @ViewChild('gridContainer') private gridContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('svgOverlay') private svgOverlayRef!: ElementRef<SVGElement>;
  @ViewChild('closeBtn') private closeBtnRef!: ElementRef<HTMLButtonElement>;

  // ---------------------------------------------------------------------------
  // Static data (loaded once — DataService is immutable post-init)
  // ---------------------------------------------------------------------------

  private readonly marsNodes = this.data.getTechNodesForPlanet('mars');
  private readonly earthNodes = this.data.getTechNodesForPlanet('earth');
  private readonly moonNodes = this.data.getTechNodesForPlanet('moon');
  private readonly venusNodes = this.data.getTechNodesForPlanet('venus');

  // All nodes indexed by ID for fast prerequisite lookups
  private readonly allNodesById = new Map<string, TechNode>(
    [...this.marsNodes, ...this.earthNodes, ...this.moonNodes, ...this.venusNodes,
      ...this.data.getTechNodesForPlanet('mercury')]
      .map((n) => [n.id, n]),
  );

  // ---------------------------------------------------------------------------
  // Reactive column states
  // ---------------------------------------------------------------------------

  readonly marsStates = computed(() => this._buildColumnStates(this.marsNodes, false));
  readonly earthStates = computed(() => this._buildColumnStates(this.earthNodes, true));
  readonly moonStates = computed(() => this._buildColumnStates(this.moonNodes, true));
  readonly venusStates = computed(() => this._buildColumnStates(this.venusNodes, false));

  // Nodes grouped by tier for bottom-to-top visual layout (tier 1 = bottom row)
  readonly marsTierRows = computed(() => this._buildTierRows(this.marsStates()));
  readonly earthTierRows = computed(() => this._buildTierRows(this.earthStates()));
  readonly moonTierRows = computed(() => this._buildTierRows(this.moonStates()));
  readonly venusTierRows = computed(() => this._buildTierRows(this.venusStates()));

  // ---------------------------------------------------------------------------
  // "New" badge tracking
  // ---------------------------------------------------------------------------

  readonly newlyUnlockedIds = signal<ReadonlySet<string>>(new Set());
  private readonly _newBadgeTimers: ReturnType<typeof setTimeout>[] = [];

  // ---------------------------------------------------------------------------
  // Fork modal
  // ---------------------------------------------------------------------------

  readonly pendingFork = this.gameState.pendingFork;

  readonly showForkModal = computed(() => {
    const f = this.pendingFork();
    return f !== null && (f.planetId === 'earth' || f.planetId === 'moon');
  });

  // ---------------------------------------------------------------------------
  // SVG line redraw
  // ---------------------------------------------------------------------------

  private _resizeObserver: ResizeObserver | null = null;
  private _lineRedrawScheduled = false;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  constructor() {
    this.eventBus.techUnlocked$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ nodeId }) => {
        this.newlyUnlockedIds.update((s) => new Set([...s, nodeId]));
        const handle = setTimeout(() => {
          this.newlyUnlockedIds.update((s) => {
            const next = new Set(s);
            next.delete(nodeId);
            return next;
          });
        }, 2000);
        this._newBadgeTimers.push(handle);
        this._scheduleLineRedraw();
      });
  }

  ngAfterViewInit(): void {
    // Auto-focus close button so keyboard users can immediately Escape or Tab
    this.closeBtnRef?.nativeElement.focus();

    this._resizeObserver = new ResizeObserver(() => this._scheduleLineRedraw());
    this._resizeObserver.observe(this.gridContainerRef.nativeElement);
    this._scheduleLineRedraw();
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
    this._newBadgeTimers.forEach(clearTimeout);
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  onNodeClick(nodeId: string, planetId: string): void {
    this.researchService.startTechTrack(nodeId, planetId);
    // researchCompleted$ → techUnlocked$ will fire when done → badge + redraw
  }

  // ---------------------------------------------------------------------------
  // Private: column state builder
  // ---------------------------------------------------------------------------

  private _buildColumnStates(nodes: TechNode[], interactive: boolean): ColumnStates {
    const completed = this.gameState.completedTechs();
    const activeResearch = this.gameState.activeResearch();
    const currentYear = this.gameState.gameYear();
    const result = new Map<string, NodeEntry>();

    // Sort by tier (ascending), then by prerequisite depth for consistent ordering
    const sorted = [...nodes].sort((a, b) => {
      const tierDiff = (a.tier ?? 0) - (b.tier ?? 0);
      if (tierDiff !== 0) return tierDiff;
      return this._prereqDepth(a) - this._prereqDepth(b);
    });

    for (const node of sorted) {
      const activeTrack = activeResearch.find((t) => t.trackId === node.id);
      const visibility = this._getVisibility(node, completed, interactive, activeTrack !== undefined);
      if (visibility === null) continue;

      let progressPercent: number | undefined;
      let etaYear: number | undefined;

      if (visibility === 'in_progress' && activeTrack && !activeTrack.isPaused) {
        const elapsed = activeTrack.elapsedBeforeStart + (currentYear - activeTrack.startYear);
        progressPercent = Math.min(100, Math.round((elapsed / node.durationYears) * 100));
        const remaining = node.durationYears - elapsed;
        etaYear = currentYear + Math.max(0, remaining);
      }

      result.set(node.id, { node, visibility, interactive, progressPercent, etaYear });
    }

    return result;
  }

  /**
   * Returns the visibility tier for a node, or null if it should be hidden.
   *
   * Rules:
   * - completed: node id is in completedTechs[]
   * - available: TechTreeService.canUnlock() returns true
   * - hint: not completed/available, but at least one direct prereq or spilloverPrereq
   *         is in completedTechs[]
   * - null (hidden): all other cases
   *
   * For non-interactive columns (Mars/Venus): completed and hint nodes are shown.
   * Available nodes in those columns are shown as hint (they aren't clickable anyway).
   */
  private _getVisibility(
    node: TechNode,
    completed: string[],
    interactive: boolean,
    isActive: boolean,
  ): NodeVisibility | null {
    if (completed.includes(node.id)) return 'completed';

    if (isActive) return 'in_progress';

    if (interactive) {
      if (this.techTreeService.canUnlock(node.planet, node.id)) {
        // Check RP capacity
        const hasCapacity =
          this.gameState.usedRpCapacity() + node.rpCost <= this.gameState.totalRpCapacity();
        return hasCapacity ? 'available' : 'needs_capacity';
      }
    }

    // Hint: at least one prereq (direct or spillover) is completed
    const allPrereqs = [...node.prerequisites, ...node.spilloverPrerequisites];
    if (allPrereqs.some((id) => completed.includes(id))) {
      return 'hint';
    }

    return null; // hidden
  }

  /**
   * Groups column states into rows by prerequisite depth (derived tier).
   * Nodes with no prereqs are depth 0 (bottom row); nodes that depend on them
   * are depth 1 (one row above), and so on.
   *
   * The CSS `flex-direction: column-reverse` on the container makes depth-0
   * appear at the visual bottom, which matches the "oldest first, at the bottom"
   * reading direction.
   */
  private _buildTierRows(states: ColumnStates): NodeEntry[][] {
    const byDepth = new Map<number, NodeEntry[]>();
    for (const entry of states.values()) {
      const depth = this._prereqDepth(entry.node);
      const list = byDepth.get(depth) ?? [];
      list.push(entry);
      byDepth.set(depth, list);
    }
    return [...byDepth.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, entries]) => entries);
  }

  /** Rough depth estimate for sort order — counts direct prerequisites recursively (max depth 5). */
  private _prereqDepth(node: TechNode, depth = 0): number {
    if (depth >= 5 || node.prerequisites.length === 0) return depth;
    const parentDepths = node.prerequisites.map((id) => {
      const parent = this.allNodesById.get(id);
      return parent ? this._prereqDepth(parent, depth + 1) : depth + 1;
    });
    return Math.max(...parentDepths);
  }

  // ---------------------------------------------------------------------------
  // Private: SVG lines
  // ---------------------------------------------------------------------------

  private _scheduleLineRedraw(): void {
    if (this._lineRedrawScheduled) return;
    this._lineRedrawScheduled = true;
    requestAnimationFrame(() => {
      this._lineRedrawScheduled = false;
      this._drawLines();
    });
  }

  private _drawLines(): void {
    const svg = this.svgOverlayRef?.nativeElement;
    const container = this.gridContainerRef?.nativeElement;
    if (!svg || !container) return;

    // Clear existing lines
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const containerRect = container.getBoundingClientRect();

    // Build a map of nodeId → centre point relative to the grid container
    const centres = new Map<string, { x: number; y: number; planet: string }>();
    const nodeEls = container.querySelectorAll<HTMLElement>('[data-node-id]');
    nodeEls.forEach((el) => {
      const id = el.getAttribute('data-node-id');
      if (!id) return;
      const rect = el.getBoundingClientRect();
      const node = this.allNodesById.get(id);
      centres.set(id, {
        x: rect.left - containerRect.left + rect.width / 2 + container.scrollLeft,
        y: rect.top - containerRect.top + rect.height / 2 + container.scrollTop,
        planet: node?.planet ?? 'earth',
      });
    });

    // Draw lines for all visible nodes' prerequisites
    const allStates = [
      ...this.marsStates(),
      ...this.earthStates(),
      ...this.moonStates(),
      ...this.venusStates(),
    ];

    for (const [nodeId, entry] of allStates) {
      const target = centres.get(nodeId);
      if (!target) continue;

      const allPrereqs = [
        ...entry.node.prerequisites.map((id) => ({ id, spillover: false })),
        ...entry.node.spilloverPrerequisites.map((id) => ({ id, spillover: true })),
      ];

      for (const { id: prereqId, spillover } of allPrereqs) {
        const source = centres.get(prereqId);
        if (!source) continue; // source node not visible — skip line

        const sourcePlanet = source.planet;
        const targetPlanet = entry.node.planet;
        const isCrossColumn = sourcePlanet !== targetPlanet;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this._bezierPath(source, target, isCrossColumn);
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute(
          'stroke',
          `var(--color-${sourcePlanet}, var(--color-accent))`,
        );
        path.setAttribute('stroke-width', isCrossColumn || spillover ? '1' : '1.5');
        path.setAttribute('stroke-opacity', isCrossColumn ? '0.5' : '0.4');
        if (isCrossColumn || spillover) {
          path.setAttribute('stroke-dasharray', '6 4');
        }
        svg.appendChild(path);
      }
    }
  }

  private _bezierPath(
    source: { x: number; y: number },
    target: { x: number; y: number },
    horizontal: boolean,
  ): string {
    if (horizontal) {
      // Horizontal S-curve: source exits right, target enters left
      const midX = (source.x + target.x) / 2;
      return `M ${source.x},${source.y} C ${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
    } else {
      // Vertical S-curve: source exits bottom, target enters top
      const midY = (source.y + target.y) / 2;
      return `M ${source.x},${source.y} C ${source.x},${midY} ${target.x},${midY} ${target.x},${target.y}`;
    }
  }
}
