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
  type WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { TechNode, PendingFork } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import { ResearchService } from '@app/core/systems/research.service';
import { TechNodeCardComponent } from './tech-node-card/tech-node-card.component';
import type { NodeVisibility } from './tech-node-view.model';
import { ForkChoiceModalComponent } from './fork-choice-modal/fork-choice-modal.component';
import { TechNodeInspectorComponent } from './tech-node-inspector/tech-node-inspector.component';
import type { TechInspectorViewModel, InspectorPrerequisite } from './tech-node-inspector/tech-node-inspector.model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NodeEntry {
  readonly node: TechNode;
  readonly visibility: NodeVisibility;
  readonly interactive: boolean;
  readonly progressPercent?: number;
  readonly etaYear?: number;
  readonly isPaused?: boolean;
}

/** Ordered map of nodeId → NodeEntry, insertion order = render order. */
type ColumnStates = Map<string, NodeEntry>;
type NodeVisibilitySnapshot = ReadonlyMap<string, NodeVisibility>;

interface RectBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface LinePoint {
  readonly x: number;
  readonly y: number;
  readonly planet: string;
  readonly isVisible: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-research-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechNodeCardComponent, ForkChoiceModalComponent, TechNodeInspectorComponent],
  templateUrl: './research-hub.component.html',
  styleUrl: './research-hub.component.scss',
})
export class ResearchHubComponent implements AfterViewInit, OnDestroy {
  readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly techTreeService = inject(TechTreeService);
  private readonly researchService = inject(ResearchService);
  private readonly eventBus = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clipLineGapBetweenTreeColumns = false;

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
  private readonly researchHubNodes = [
    ...this.marsNodes,
    ...this.earthNodes,
    ...this.moonNodes,
    ...this.venusNodes,
  ];

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

  readonly selectedNodeId = signal<string | null>(null);

  readonly allVisibleEntries = computed(() => {
    const entries = new Map<string, NodeEntry>();
    for (const states of [this.marsStates(), this.earthStates(), this.moonStates(), this.venusStates()]) {
      for (const [nodeId, entry] of states) {
        entries.set(nodeId, entry);
      }
    }
    return entries;
  });

  readonly selectedEntry = computed<NodeEntry | null>(() => {
    const selectedId = this.selectedNodeId();
    const entries = this.allVisibleEntries();
    if (selectedId) return entries.get(selectedId) ?? null;
    return this._defaultSelection(entries);
  });

  readonly selectedInspectorVm = computed<TechInspectorViewModel | null>(() => {
    const entry = this.selectedEntry();
    return entry ? this._buildInspectorViewModel(entry) : null;
  });

  // ---------------------------------------------------------------------------
  // Transient completion/reveal tracking
  // ---------------------------------------------------------------------------

  readonly recentlyCompletedIds = signal<ReadonlySet<string>>(new Set());
  readonly newlyAvailableIds = signal<ReadonlySet<string>>(new Set());
  private readonly transientFeedbackDurationMs = 2000;
  private readonly _completionFeedbackTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly _revealFeedbackTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _lastVisibleSnapshot = new Map<string, NodeVisibility>();

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
    this.eventBus.researchCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((trackId) => {
        if (!this.allVisibleEntries().has(trackId)) return;
        this._markTransient(
          this.recentlyCompletedIds,
          this._completionFeedbackTimers,
          [trackId],
        );
        this._scheduleLineRedraw();
      });

    this.eventBus.techUnlocked$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ nodeId }) => {
        this._markTransient(
          this.recentlyCompletedIds,
          this._completionFeedbackTimers,
          [nodeId],
        );
        this._captureRevealFeedback(nodeId);
        this._scheduleLineRedraw();
      });
  }

  ngAfterViewInit(): void {
    // Auto-focus close button so keyboard users can immediately Escape or Tab
    this.closeBtnRef?.nativeElement.focus();

    this._resizeObserver = new ResizeObserver(() => this._scheduleLineRedraw());
    this._resizeObserver.observe(this.gridContainerRef.nativeElement);
    this._setInitialSelection();
    this._lastVisibleSnapshot = this._visibleStateSnapshot();
    this._scheduleLineRedraw();
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
    this._clearTransientTimers(this._completionFeedbackTimers);
    this._clearTransientTimers(this._revealFeedbackTimers);
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this._scheduleLineRedraw();
  }

  onTreeScroll(): void {
    this._scheduleLineRedraw();
  }

  onNodeSelect(nodeId: string): void {
    const previousId = this.selectedNodeId();
    if (previousId && previousId !== nodeId) {
      this._acknowledgeNewNode(previousId);
    }
    this.selectedNodeId.set(nodeId);
  }

  onStartSelectedNode(nodeId: string): void {
    const viewModel = this.selectedInspectorVm();
    if (!viewModel?.canStart || viewModel.node.id !== nodeId) return;
    this._acknowledgeNewNode(nodeId);
    this.researchService.startTechTrack(viewModel.node.id, viewModel.node.planet);
  }

  // ---------------------------------------------------------------------------
  // Private: column state builder
  // ---------------------------------------------------------------------------

  private _buildColumnStates(nodes: TechNode[], interactive: boolean): ColumnStates {
    const completed = this.gameState.completedTechs();
    const activeResearch = this.gameState.activeResearch();
    const currentYear = this.gameState.gameYear();
    const result = new Map<string, NodeEntry>();
    const previewFrontierIds = this._previewFrontierIds(completed, activeResearch);

    // Sort by tier (ascending), then by prerequisite depth for consistent ordering
    const sorted = [...nodes].sort((a, b) => {
      const tierDiff = (a.tier ?? 0) - (b.tier ?? 0);
      if (tierDiff !== 0) return tierDiff;
      return this._prereqDepth(a) - this._prereqDepth(b);
    });

    for (const node of sorted) {
      const activeTrack = activeResearch.find((t) => t.trackId === node.id);
      const visibility = this._getVisibility(
        node,
        completed,
        activeTrack !== undefined,
        activeTrack?.isPaused ?? false,
      );

      result.set(
        node.id,
        this._buildNodeEntry(node, visibility, interactive, activeTrack, currentYear),
      );
    }

    return result;
  }

  private _defaultSelection(entries: Map<string, NodeEntry>): NodeEntry | null {
    const ordered = [...entries.values()];
    return (
      ordered.find((entry) => entry.node.planet === 'earth' && entry.visibility === 'available') ??
      ordered.find((entry) => entry.node.planet === 'moon' && entry.visibility === 'available') ??
      ordered.find((entry) => entry.visibility === 'running') ??
      ordered.find((entry) => entry.visibility === 'completed') ??
      ordered.find((entry) => entry.node.planet === 'earth' || entry.node.planet === 'moon') ??
      ordered[0] ??
      null
    );
  }

  private _setInitialSelection(): void {
    if (this.selectedNodeId() !== null) return;
    const entry = this._defaultSelection(this.allVisibleEntries());
    if (entry) this.selectedNodeId.set(entry.node.id);
  }

  private _buildInspectorViewModel(entry: NodeEntry): TechInspectorViewModel {
    const node = entry.node;
    const currentYear = this.gameState.gameYear();
    const canStart = entry.visibility === 'available' && this.researchService.canStartTechTrack(node.id, node.planet);
    const completedYear = this.gameState.completedResearchYears()[node.id];

    return {
      node,
      visibility: entry.visibility,
      planetLabel: this._planetLabel(node.planet),
      statusLabel: this._statusLabel(entry),
      branchTag: this._branchTag(node, entry.visibility),
      prerequisites: this._prerequisitesFor(node),
      progressPercent: entry.progressPercent,
      etaYear: entry.etaYear,
      completedYear,
      startBlockedReason:
        entry.visibility === 'available' && !canStart
          ? 'All visible research slots are currently occupied.'
          : undefined,
      canStart,
    };
  }

  private _planetLabel(planetId: string): string {
    const labels: Record<string, string> = {
      earth: 'Earth',
      moon: 'Moon',
      mercury: 'Mercury',
      mars: 'Mars',
      venus: 'Venus',
    };
    return labels[planetId] ?? planetId;
  }

  private _statusLabel(entry: NodeEntry): string {
    switch (entry.visibility) {
      case 'available':
        return 'Available';
      case 'completed':
        return 'Completed';
      case 'locked':
        return 'Locked';
      case 'running':
        return 'In progress';
      case 'paused':
        return 'Paused';
      case 'post_v1':
        return 'Future research';
    }
  }

  private _branchTag(node: TechNode, visibility: NodeVisibility): 'naturalist' | 'architect' | null {
    if (visibility === 'locked') return null;
    const tagEffect = node.effects.find((effect) => effect.type === 'tag_decision');
    if (!tagEffect || tagEffect.type !== 'tag_decision') return null;
    return tagEffect.tag;
  }

  private _prerequisitesFor(node: TechNode): InspectorPrerequisite[] {
    const completed = this.gameState.completedTechs();
    const toEntry = (id: string, isSpillover: boolean): InspectorPrerequisite => ({
      id,
      label: this.data.getTechNode(id)?.displayName ?? id,
      met: completed.includes(id),
      isSpillover,
    });

    return [
      ...node.prerequisites.map((id) => toEntry(id, false)),
      ...node.spilloverPrerequisites.map((id) => toEntry(id, true)),
    ];
  }

  /**
  * Returns a real, non-preview visibility tier for a node, or null if it should
  * be locked while still remaining visible in the full graph.
   *
   * Rules:
   * - completed: node id is in completedTechs[]
   * - available: TechTreeService.canUnlock() returns true
   */
  private _getVisibility(
    node: TechNode,
    completed: string[],
    isActive: boolean,
    isPaused: boolean,
  ): NodeVisibility {
    if (node.postV1) return 'post_v1';
    if (completed.includes(node.id)) return 'completed';

    if (isActive) return isPaused ? 'paused' : 'running';

    if (this.techTreeService.canUnlock(node.planet, node.id)) return 'available';

    return 'locked';
  }

  private _buildNodeEntry(
    node: TechNode,
    visibility: NodeVisibility,
    interactive: boolean,
    activeTrack: ReturnType<typeof this.gameState.activeResearch>[number] | undefined,
    currentYear: number,
  ): NodeEntry {
    let progressPercent: number | undefined;
    let etaYear: number | undefined;
    let isPaused: boolean | undefined;

    if ((visibility === 'running' || visibility === 'paused') && activeTrack) {
      isPaused = activeTrack.isPaused;
      const elapsed = activeTrack.elapsedBeforeStart + (activeTrack.isPaused ? 0 : currentYear - activeTrack.startYear);
      progressPercent = Math.min(100, Math.round((elapsed / node.durationYears) * 100));
      if (!activeTrack.isPaused) {
        const remaining = node.durationYears - elapsed;
        etaYear = currentYear + Math.max(0, remaining);
      }
    }

    return { node, visibility, interactive, progressPercent, etaYear, isPaused };
  }

  private _previewFrontierIds(
    completed: string[],
    activeResearch: ReturnType<typeof this.gameState.activeResearch>,
  ): ReadonlySet<string> {
    const frontierIds = new Set(completed);
    for (const track of activeResearch) {
      frontierIds.add(track.trackId);
    }

    for (const node of this.researchHubNodes) {
      if (!this._isInteractivePlanet(node.planet)) continue;
      if (this.techTreeService.canUnlock(node.planet, node.id)) {
        frontierIds.add(node.id);
      }
    }

    return frontierIds;
  }

  private _hasPreviewPrerequisite(node: TechNode, previewFrontierIds: ReadonlySet<string>): boolean {
    return [...node.prerequisites, ...node.spilloverPrerequisites].some((id) =>
      previewFrontierIds.has(id),
    );
  }

  private _isInteractivePlanet(planetId: string): boolean {
    return planetId === 'earth' || planetId === 'moon';
  }

  private _visibleStateSnapshot(): Map<string, NodeVisibility> {
    return new Map(
      [...this.allVisibleEntries()].map(([nodeId, entry]) => [nodeId, entry.visibility]),
    );
  }

  private _captureRevealFeedback(completedNodeId: string): void {
    const previous = this._lastVisibleSnapshot;
    const currentEntries = this.allVisibleEntries();
    const revealedIds = this._findNewlyRevealed(previous, currentEntries, completedNodeId);
    this._markTransient(this.newlyAvailableIds, this._revealFeedbackTimers, revealedIds);
    this._lastVisibleSnapshot = this._visibleStateSnapshot();
  }

  private _acknowledgeNewNode(nodeId: string): void {
    this.newlyAvailableIds.update((current) => {
      if (!current.has(nodeId)) return current;
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
  }

  private _findNewlyRevealed(
    previous: NodeVisibilitySnapshot,
    currentEntries: ReadonlyMap<string, NodeEntry>,
    completedNodeId: string,
  ): string[] {
    const revealedIds: string[] = [];

    for (const [nodeId, entry] of currentEntries) {
      if (nodeId === completedNodeId) continue;
      if (!this._hasPreviewPrerequisite(entry.node, new Set([completedNodeId]))) continue;

      const previousVisibility = previous.get(nodeId) ?? null;
      if (this._visibilityRank(entry.visibility) > this._visibilityRank(previousVisibility)) {
        revealedIds.push(nodeId);
      }
    }

    return revealedIds;
  }

  private _visibilityRank(visibility: NodeVisibility | null): number {
    switch (visibility) {
      case null:
        return 0;
      case 'locked':
      case 'post_v1':
        return 1;
      case 'available':
      case 'running':
      case 'paused':
      case 'completed':
        return 3;
    }
  }

  private _markTransient(
    state: WritableSignal<ReadonlySet<string>>,
    timers: Map<string, ReturnType<typeof setTimeout>>,
    nodeIds: readonly string[],
  ): void {
    if (nodeIds.length === 0) return;

    state.update((current) => new Set([...current, ...nodeIds]));

    for (const nodeId of nodeIds) {
      const existingTimer = timers.get(nodeId);
      if (existingTimer) clearTimeout(existingTimer);

      const handle = setTimeout(() => {
        state.update((current) => {
          const next = new Set(current);
          next.delete(nodeId);
          return next;
        });
        timers.delete(nodeId);
      }, this.transientFeedbackDurationMs);

      timers.set(nodeId, handle);
    }
  }

  private _clearTransientTimers(timers: Map<string, ReturnType<typeof setTimeout>>): void {
    for (const handle of timers.values()) {
      clearTimeout(handle);
    }
    timers.clear();
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
    svg.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);

    const sideRail = container.querySelector<HTMLElement>('.research-hub__side-rail');
    const earthColumn = container.querySelector<HTMLElement>('.research-hub__column--earth');
    const treeColumnRects = [sideRail, earthColumn]
      .filter((el): el is HTMLElement => el !== null)
      .map((el) => this._toContainerRect(el.getBoundingClientRect(), containerRect));
    if (treeColumnRects.length === 0) return;

    const clipRects = this.clipLineGapBetweenTreeColumns
      ? treeColumnRects
      : [this._unionRects(treeColumnRects)];

    this._appendLineClip(svg, clipRects);

    // Build a map of nodeId → centre point relative to the grid container
    const centres = new Map<string, LinePoint>();
    const nodeEls = container.querySelectorAll<HTMLElement>('[data-node-id]');
    nodeEls.forEach((el) => {
      const id = el.getAttribute('data-node-id');
      if (!id) return;
      const rect = el.getBoundingClientRect();
      const viewport = this._lineViewportFor(el, sideRail, earthColumn, containerRect);
      if (!viewport) return;
      const relativeRect = this._toContainerRect(rect, containerRect);
      const rawPoint = {
        x: relativeRect.left + (relativeRect.right - relativeRect.left) / 2,
        y: relativeRect.top + (relativeRect.bottom - relativeRect.top) / 2,
      };
      const node = this.allNodesById.get(id);
      centres.set(id, {
        x: rawPoint.x,
        y: rawPoint.y,
        planet: node?.planet ?? 'earth',
        isVisible: this._rectIntersects(relativeRect, viewport),
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
        if (!source.isVisible && !target.isVisible) continue;

        const sourcePlanet = source.planet;
        const targetPlanet = entry.node.planet;
        const isCrossColumn = sourcePlanet !== targetPlanet;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this._bezierPath(source, target, isCrossColumn);
        path.setAttribute('d', d);
        path.setAttribute('clip-path', 'url(#research-hub-line-clip)');
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

  private _appendLineClip(svg: SVGElement, clipRects: RectBounds[]): void {
    const namespace = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(namespace, 'defs');
    const clipPath = document.createElementNS(namespace, 'clipPath');
    clipPath.setAttribute('id', 'research-hub-line-clip');
    clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');

    for (const rect of clipRects) {
      const clipRect = document.createElementNS(namespace, 'rect');
      clipRect.setAttribute('x', `${rect.left}`);
      clipRect.setAttribute('y', `${rect.top}`);
      clipRect.setAttribute('width', `${Math.max(0, rect.right - rect.left)}`);
      clipRect.setAttribute('height', `${Math.max(0, rect.bottom - rect.top)}`);
      clipPath.appendChild(clipRect);
    }

    defs.appendChild(clipPath);
    svg.appendChild(defs);
  }

  private _lineViewportFor(
    element: HTMLElement,
    sideRail: HTMLElement | null,
    earthColumn: HTMLElement | null,
    containerRect: DOMRect,
  ): RectBounds | null {
    const viewportElement = sideRail?.contains(element) ? sideRail : earthColumn?.contains(element) ? earthColumn : null;
    return viewportElement ? this._toContainerRect(viewportElement.getBoundingClientRect(), containerRect) : null;
  }

  private _toContainerRect(rect: DOMRect, containerRect: DOMRect): RectBounds {
    return {
      left: rect.left - containerRect.left,
      top: rect.top - containerRect.top,
      right: rect.right - containerRect.left,
      bottom: rect.bottom - containerRect.top,
    };
  }

  private _unionRects(rects: RectBounds[]): RectBounds {
    return rects.reduce((union, rect) => ({
      left: Math.min(union.left, rect.left),
      top: Math.min(union.top, rect.top),
      right: Math.max(union.right, rect.right),
      bottom: Math.max(union.bottom, rect.bottom),
    }));
  }

  private _rectIntersects(rect: RectBounds, containerRect: RectBounds): boolean {
    return (
      rect.right >= containerRect.left &&
      rect.left <= containerRect.right &&
      rect.bottom >= containerRect.top &&
      rect.top <= containerRect.bottom
    );
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
