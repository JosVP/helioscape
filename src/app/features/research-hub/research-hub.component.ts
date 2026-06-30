import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  type WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ResearchArcDefinition, ResearchNode, ResearchTransfer } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { ResearchArcService } from '@app/core/systems/research-arc.service';
import { ResearchService } from '@app/core/systems/research.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';
import { ResearchSlotStripComponent } from '@app/shared/components/research-slot-strip/research-slot-strip.component';
import { axialToPixel } from '@app/shared/utils/hex-grid.utils';
import { ForkChoiceModalComponent } from './fork-choice-modal/fork-choice-modal.component';
import { ResearchArcProgressPanelComponent } from './research-arc-progress-panel/research-arc-progress-panel.component';
import { ResearchHexMapComponent } from './research-hex-map/research-hex-map.component';
import type {
  ResearchArcPanelView,
  ResearchMapLine,
  ResearchMapNode,
  ResearchNodeDetailsViewModel,
  ResearchNodeEntry,
  ResearchPrerequisiteView,
  NodeVisibility,
} from './research-hub-view.model';
import { ResearchNodeDetailsComponent } from './research-node-details/research-node-details.component';

type NodeVisibilitySnapshot = ReadonlyMap<string, NodeVisibility>;

@Component({
  selector: 'app-research-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ForkChoiceModalComponent,
    ResearchArcProgressPanelComponent,
    ResearchHexMapComponent,
    ResearchNodeDetailsComponent,
    ResearchSlotStripComponent,
  ],
  templateUrl: './research-hub.component.html',
  styleUrl: './research-hub.component.scss',
})
export class ResearchHubComponent implements OnDestroy {
  readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly techTreeService = inject(TechTreeService);
  private readonly researchService = inject(ResearchService);
  private readonly researchArcService = inject(ResearchArcService);
  private readonly eventBus = inject(EventBusService);
  private readonly destroyRef = inject(DestroyRef);

  readonly focusedNodeId = input<string | null>(null);
  readonly closed = output<void>();
  readonly focusHandled = output<void>();

  @ViewChild('closeBtn') private closeBtnRef?: ElementRef<HTMLButtonElement>;

  readonly layout = this.data.getResearchLayout();
  private readonly researchNodes = this.data.getAllResearchNodes();
  private readonly allNodesById = new Map<string, ResearchNode>(this.researchNodes.map((node) => [node.id, node]));

  readonly selectedNodeId = signal<string | null>(null);
  readonly recentlyCompletedIds = signal<ReadonlySet<string>>(new Set());
  readonly newlyAvailableIds = signal<ReadonlySet<string>>(new Set());
  private readonly transientFeedbackDurationMs = 2000;
  private readonly completionFeedbackTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly revealFeedbackTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private lastVisibleSnapshot = new Map<string, NodeVisibility>();

  readonly pendingFork = this.gameState.pendingFork;
  readonly showForkModal = computed(() => this.pendingFork() !== null);

  readonly entries = computed<ResearchNodeEntry[]>(() => {
    const completed = this.gameState.completedTechs();
    const activeResearch = this.gameState.activeResearch();
    const currentYear = this.gameState.gameYear();
    return this.researchNodes.map((node) => {
      const activeTrack = activeResearch.find((track) => track.trackId === node.id);
      const visibility = this.getVisibility(node, completed, activeTrack !== undefined, activeTrack?.isPaused ?? false);
      return this.buildNodeEntry(node, visibility, activeTrack, currentYear);
    });
  });

  readonly entryMap = computed(() => new Map(this.entries().map((entry) => [entry.node.id, entry])));

  readonly mapNodes = computed<ResearchMapNode[]>(() => {
    const entries = this.entryMap();
    return this.layout.nodes
      .map((layoutNode): ResearchMapNode | null => {
        const entry = entries.get(layoutNode.nodeId);
        if (!entry) return null;
        const point = axialToPixel(layoutNode.q, layoutNode.r, this.layout.hexSize, this.layout.hexGap);
        return { entry, x: point.x, y: point.y, region: layoutNode.region };
      })
      .filter((node): node is ResearchMapNode => node !== null);
  });

  readonly mapLines = computed<ResearchMapLine[]>(() => this.buildMapLines(this.mapNodes()));

  readonly selectedEntry = computed<ResearchNodeEntry | null>(() => {
    const selectedId = this.selectedNodeId();
    if (selectedId) return this.entryMap().get(selectedId) ?? null;
    return this.defaultSelection();
  });

  readonly selectedDetailsVm = computed<ResearchNodeDetailsViewModel | null>(() => {
    const entry = this.selectedEntry();
    return entry ? this.buildDetailsViewModel(entry) : null;
  });

  readonly arcPanelViews = computed<ResearchArcPanelView[]>(() => this.buildArcPanelViews());

  constructor() {
    effect(() => {
      const nodeId = this.focusedNodeId();
      if (!nodeId) return;
      this.focusNode(nodeId);
    });

    effect(() => {
      if (this.selectedNodeId() !== null) return;
      const entry = this.defaultSelection();
      if (entry) this.selectedNodeId.set(entry.node.id);
    });

    this.eventBus.researchCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nodeId) => {
        if (!this.entryMap().has(nodeId)) return;
        this.markTransient(this.recentlyCompletedIds, this.completionFeedbackTimers, [nodeId]);
      });

    this.eventBus.techUnlocked$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ nodeId }) => {
        this.markTransient(this.recentlyCompletedIds, this.completionFeedbackTimers, [nodeId]);
        this.captureRevealFeedback(nodeId);
      });

    queueMicrotask(() => {
      this.lastVisibleSnapshot = this.visibleStateSnapshot();
      this.closeBtnRef?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this.clearTransientTimers(this.completionFeedbackTimers);
    this.clearTransientTimers(this.revealFeedbackTimers);
  }

  close(): void {
    if (this.gameState.interactionLocked()) return;
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.gameState.interactionLocked()) return;
    this.close();
  }

  onNodeSelect(nodeId: string): void {
    if (this.gameState.interactionLocked()) return;
    const previousId = this.selectedNodeId();
    if (previousId && previousId !== nodeId) {
      this.acknowledgeNewNode(previousId);
    }
    this.selectedNodeId.set(nodeId);
  }

  onStartSelectedNode(nodeId: string): void {
    if (this.gameState.interactionLocked()) return;
    const entry = this.entryMap().get(nodeId);
    if (!entry || !this.researchService.canStartTechTrack(entry.node.id, entry.node.planet)) return;
    this.acknowledgeNewNode(nodeId);
    this.researchService.startTechTrack(entry.node.id, entry.node.planet);
  }

  onPauseSelectedNode(nodeId: string): void {
    if (this.gameState.interactionLocked()) return;
    this.researchService.pauseTrack(nodeId);
  }

  onResumeSelectedNode(nodeId: string): void {
    if (this.gameState.interactionLocked()) return;
    this.acknowledgeNewNode(nodeId);
    this.researchService.resumeTrack(nodeId);
  }

  focusNode(nodeId: string): void {
    if (this.gameState.interactionLocked()) return;
    if (this.entryMap().has(nodeId)) {
      this.onNodeSelect(nodeId);
    }
    this.focusHandled.emit();
  }

  private defaultSelection(): ResearchNodeEntry | null {
    const entries = this.entries();
    return (
      entries.find((entry) => entry.node.id === 'earth_launch_mercury_mission') ??
      entries.find((entry) => entry.visibility === 'running') ??
      entries.find((entry) => entry.visibility === 'available') ??
      entries[0] ??
      null
    );
  }

  private getVisibility(
    node: ResearchNode,
    completed: readonly string[],
    isActive: boolean,
    isPaused: boolean
  ): NodeVisibility {
    if (node.postV1) return 'post_v1';
    if (completed.includes(node.id)) return 'completed';
    if (isActive) return isPaused ? 'paused' : 'running';
    if (this.techTreeService.canUnlock(node.planet, node.id)) return 'available';
    return 'locked';
  }

  private buildNodeEntry(
    node: ResearchNode,
    visibility: NodeVisibility,
    activeTrack: ReturnType<typeof this.gameState.activeResearch>[number] | undefined,
    currentYear: number
  ): ResearchNodeEntry {
    let progressPercent: number | undefined;
    let etaYear: number | undefined;

    if ((visibility === 'running' || visibility === 'paused') && activeTrack) {
      const elapsed = activeTrack.elapsedBeforeStart + (activeTrack.isPaused ? 0 : currentYear - activeTrack.startYear);
      progressPercent = node.durationYears <= 0 ? 100 : Math.min(100, Math.round((elapsed / node.durationYears) * 100));
      if (!activeTrack.isPaused) {
        etaYear = currentYear + Math.max(0, node.durationYears - elapsed);
      }
    }

    return { node, visibility, progressPercent, etaYear, isPaused: activeTrack?.isPaused };
  }

  private buildMapLines(nodes: readonly ResearchMapNode[]): ResearchMapLine[] {
    const byId = new Map(nodes.map((node) => [node.entry.node.id, node]));
    const lines: ResearchMapLine[] = [];

    for (const target of nodes) {
      for (const prereqId of target.entry.node.prerequisites) {
        this.pushLine(lines, byId, prereqId, target, 'prerequisite');
      }
      for (const prereqId of target.entry.node.spilloverPrerequisites) {
        this.pushLine(lines, byId, prereqId, target, 'spillover');
      }
      for (const transfer of target.entry.node.transfersFrom ?? []) {
        this.pushLine(lines, byId, transfer.fromNodeId, target, 'transfer');
      }
    }

    return lines;
  }

  private pushLine(
    lines: ResearchMapLine[],
    byId: ReadonlyMap<string, ResearchMapNode>,
    sourceId: string,
    target: ResearchMapNode,
    kind: ResearchMapLine['kind']
  ): void {
    const source = byId.get(sourceId);
    if (!source) return;
    lines.push({
      id: `${kind}:${sourceId}->${target.entry.node.id}`,
      kind,
      fromNodeId: sourceId,
      toNodeId: target.entry.node.id,
      fromX: source.x,
      fromY: source.y,
      toX: target.x,
      toY: target.y,
      planetId: source.entry.node.planet,
    });
  }

  private buildDetailsViewModel(entry: ResearchNodeEntry): ResearchNodeDetailsViewModel {
    const activeTrack = this.gameState.activeResearch().find((track) => track.trackId === entry.node.id);
    const canStart = entry.visibility === 'available' && this.researchService.canStartTechTrack(entry.node.id, entry.node.planet);
    const canResume = entry.visibility === 'paused' && this.gameState.availableResearchSlots().length > 0;
    const activeTransfers = this.researchArcService.getActiveTransfersForNode(entry.node.id);

    return {
      entry,
      planetLabel: this.planetLabel(entry.node.planet),
      statusLabel: this.statusLabel(entry),
      branchTag: this.branchTag(entry.node, entry.visibility),
      prerequisites: this.prerequisitesFor(entry.node),
      activeTransfers,
      completedYear: this.gameState.completedResearchYears()[entry.node.id],
      canStart,
      canPause: activeTrack !== undefined && !activeTrack.isPaused,
      canResume,
      startBlockedReason:
        entry.visibility === 'available' && !canStart
          ? 'All compatible research slots are currently occupied.'
          : undefined,
    };
  }

  private buildArcPanelViews(): ResearchArcPanelView[] {
    const completed = new Set(this.gameState.completedTechs());
    const arcLog = this.gameState.arcLog();
    return this.data
      .getAllResearchArcs()
      .filter((arc) => this.isArcAvailable(arc, completed, arcLog))
      .map((definition) => {
        const findings = arcLog[definition.id] ?? [];
        const totalFindings = definition.totalFindings ?? definition.knownFindings.length;
        const isOngoing = (definition.progressMode ?? definition.type) === 'ongoing';
        const progressPercent = isOngoing
          ? 100
          : totalFindings <= 0
            ? 100
            : Math.min(100, Math.round((findings.length / totalFindings) * 100));
        return {
          definition,
          findings,
          progressPercent,
          progressText: isOngoing
            ? `Ongoing, ${findings.length} findings`
            : `${findings.length} of ${totalFindings} findings`,
          isComplete: !isOngoing && findings.length >= totalFindings,
        };
      });
  }

  private isArcAvailable(
    arc: ResearchArcDefinition,
    completed: ReadonlySet<string>,
    arcLog: Record<string, readonly unknown[]>
  ): boolean {
    if ((arcLog[arc.id]?.length ?? 0) > 0) return true;
    return (arc.unlockNodeIds ?? arc.nodeIds).some((nodeId) => completed.has(nodeId));
  }

  private planetLabel(planetId: string): string {
    const labels: Record<string, string> = {
      earth: 'Earth',
      moon: 'Moon',
      mercury: 'Mercury',
      mars: 'Mars',
      venus: 'Venus',
    };
    return labels[planetId] ?? planetId;
  }

  private statusLabel(entry: ResearchNodeEntry): string {
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

  private branchTag(node: ResearchNode, visibility: NodeVisibility): 'naturalist' | 'architect' | null {
    if (visibility === 'locked') return null;
    const tagEffect = node.effects.find((effect) => effect.type === 'tag_decision');
    return tagEffect?.type === 'tag_decision' ? tagEffect.tag : null;
  }

  private prerequisitesFor(node: ResearchNode): ResearchPrerequisiteView[] {
    const completed = this.gameState.completedTechs();
    const toEntry = (id: string, isSpillover: boolean): ResearchPrerequisiteView => ({
      id,
      label: this.allNodesById.get(id)?.displayName ?? id,
      met: completed.includes(id),
      isSpillover,
    });

    return [
      ...node.prerequisites.map((id) => toEntry(id, false)),
      ...node.spilloverPrerequisites.map((id) => toEntry(id, true)),
    ];
  }

  private captureRevealFeedback(completedNodeId: string): void {
    const previous = this.lastVisibleSnapshot;
    const currentEntries = this.entryMap();
    const revealedIds: string[] = [];

    for (const [nodeId, entry] of currentEntries) {
      if (nodeId === completedNodeId) continue;
      if (!this.hasPreviewPrerequisite(entry.node, completedNodeId)) continue;
      const previousVisibility = previous.get(nodeId) ?? null;
      if (this.visibilityRank(entry.visibility) > this.visibilityRank(previousVisibility)) {
        revealedIds.push(nodeId);
      }
    }

    this.markTransient(this.newlyAvailableIds, this.revealFeedbackTimers, revealedIds);
    this.lastVisibleSnapshot = this.visibleStateSnapshot();
  }

  private hasPreviewPrerequisite(node: ResearchNode, completedNodeId: string): boolean {
    return [...node.prerequisites, ...node.spilloverPrerequisites].includes(completedNodeId);
  }

  private visibleStateSnapshot(): Map<string, NodeVisibility> {
    return new Map([...this.entryMap()].map(([nodeId, entry]) => [nodeId, entry.visibility]));
  }

  private visibilityRank(visibility: NodeVisibility | null): number {
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

  private acknowledgeNewNode(nodeId: string): void {
    this.newlyAvailableIds.update((current) => {
      if (!current.has(nodeId)) return current;
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
  }

  private markTransient(
    state: WritableSignal<ReadonlySet<string>>,
    timers: Map<string, ReturnType<typeof setTimeout>>,
    nodeIds: readonly string[]
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

  private clearTransientTimers(timers: Map<string, ReturnType<typeof setTimeout>>): void {
    for (const handle of timers.values()) {
      clearTimeout(handle);
    }
    timers.clear();
  }
}