import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { ResearchLayoutData } from '@app/core/models';
import { axialToPixel } from '@app/shared/utils/hex-grid.utils';
import { ResearchHexTileComponent } from '../research-hex-tile/research-hex-tile.component';
import type { ResearchMapLine, ResearchMapNode, ResearchNodeEntry } from '../research-hub-view.model';

interface DragState {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly originX: number;
  readonly originY: number;
}

interface ResearchRegionMarker {
  readonly id: string;
  readonly displayName: string;
  readonly x: number;
  readonly y: number;
}

@Component({
  selector: 'app-research-hex-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResearchHexTileComponent],
  templateUrl: './research-hex-map.component.html',
  styleUrl: './research-hex-map.component.scss',
})
export class ResearchHexMapComponent implements AfterViewInit, OnDestroy {
  readonly nodes = input.required<ResearchMapNode[]>();
  readonly lines = input.required<ResearchMapLine[]>();
  readonly layout = input.required<ResearchLayoutData>();
  readonly selectedNodeId = input<string | null>(null);
  readonly recentlyCompletedIds = input<ReadonlySet<string>>(new Set());
  readonly newlyAvailableIds = input<ReadonlySet<string>>(new Set());

  readonly nodeSelected = output<string>();

  @ViewChild('viewport') private viewportRef?: ElementRef<HTMLElement>;

  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly isDragging = signal(false);
  private dragState: DragState | null = null;
  private lastAutoCenteredNodeId: string | null = null;
  private resizeObserver: ResizeObserver | null = null;

  readonly bounds = computed(() => this._boundsFor(this.nodes()));
  readonly viewBox = computed(() => {
    const bounds = this.bounds();
    return `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`;
  });
  readonly regionMarkers = computed<ResearchRegionMarker[]>(() =>
    this.layout().regions.map((region) => {
      const point = axialToPixel(region.anchor.q, region.anchor.r, this.layout().hexSize, this.layout().hexGap);
      return { id: region.id, displayName: region.displayName, x: point.x, y: point.y };
    })
  );

  readonly mapTransform = computed(() => `translate3d(${this.panX()}px, ${this.panY()}px, 0)`);

  constructor() {
    effect(() => {
      const selectedId = this.selectedNodeId();
      if (!selectedId || !this.viewportRef) return;
      if (selectedId === this.lastAutoCenteredNodeId) return;
      this.lastAutoCenteredNodeId = selectedId;
      untracked(() => this.centerNode(selectedId));
    });
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => {
      const selectedId = this.selectedNodeId();
      if (selectedId) this.centerNode(selectedId);
    });
    if (this.viewportRef) {
      this.resizeObserver.observe(this.viewportRef.nativeElement);
    }

    const selectedId = this.selectedNodeId();
    if (selectedId) {
      this.lastAutoCenteredNodeId = selectedId;
      this.centerNode(selectedId);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  centerNode(nodeId: string): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    const node = this.nodes().find((candidate) => candidate.entry.node.id === nodeId);
    if (!node) return;
    this.panX.set(viewport.clientWidth / 2 - node.x);
    this.panY.set(viewport.clientHeight / 2 - node.y);
  }

  onPointerDown(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('button')) return;
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    viewport.setPointerCapture(event.pointerId);
    this.dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: this.panX(),
      originY: this.panY(),
    };
    this.isDragging.set(true);
  }

  onPointerMove(event: PointerEvent): void {
    const drag = this.dragState;
    if (!drag || drag.pointerId !== event.pointerId) return;
    this.panX.set(drag.originX + event.clientX - drag.startX);
    this.panY.set(drag.originY + event.clientY - drag.startY);
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragState?.pointerId !== event.pointerId) return;
    this.viewportRef?.nativeElement.releasePointerCapture(event.pointerId);
    this.dragState = null;
    this.isDragging.set(false);
  }

  onTileSelected(nodeId: string): void {
    this.nodeSelected.emit(nodeId);
  }

  lineClass(line: ResearchMapLine): string {
    const selectedId = this.selectedNodeId();
    const focused = selectedId === line.fromNodeId || selectedId === line.toNodeId;
    const distance = Math.hypot(line.toX - line.fromX, line.toY - line.fromY);
    return [
      'research-hex-map__line',
      `research-hex-map__line--${line.kind}`,
      focused ? 'research-hex-map__line--focused' : '',
      !focused && line.kind !== 'prerequisite' ? 'research-hex-map__line--contextual' : '',
      !focused && distance > 700 ? 'research-hex-map__line--long' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  linePath(line: ResearchMapLine): string {
    const dx = line.toX - line.fromX;
    const dy = line.toY - line.fromY;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return `M ${line.fromX} ${line.fromY} L ${line.toX} ${line.toY}`;

    const bend = line.kind === 'transfer' ? 0.18 : line.kind === 'spillover' ? 0.12 : 0.08;
    const direction = line.kind === 'transfer' ? -1 : 1;
    const controlX = (line.fromX + line.toX) / 2 + (-dy / distance) * distance * bend * direction;
    const controlY = (line.fromY + line.toY) / 2 + (dx / distance) * distance * bend * direction;
    return `M ${line.fromX} ${line.fromY} Q ${controlX} ${controlY} ${line.toX} ${line.toY}`;
  }

  trackRegion(_index: number, marker: ResearchRegionMarker): string {
    return marker.id;
  }

  trackNode(_index: number, node: ResearchMapNode): string {
    return node.entry.node.id;
  }

  trackLine(_index: number, line: ResearchMapLine): string {
    return line.id;
  }

  private _boundsFor(nodes: readonly ResearchMapNode[]): { minX: number; minY: number; width: number; height: number } {
    if (nodes.length === 0) return { minX: -400, minY: -300, width: 800, height: 600 };
    const padding = 180;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }
}