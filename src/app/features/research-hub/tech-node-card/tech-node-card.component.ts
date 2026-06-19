import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { TechNode } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { TechNodeIconComponent } from '../tech-node-icon/tech-node-icon.component';
import type { NodeVisibility } from '../tech-node-view.model';

/** A prerequisite entry shown in the tooltip. */
export interface PrereqEntry {
  readonly id: string;
  readonly label: string;
  readonly met: boolean;
  readonly isSpillover: boolean;
}

@Component({
  selector: 'app-tech-node-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechNodeIconComponent],
  templateUrl: './tech-node-card.component.html',
  styleUrl: './tech-node-card.component.scss',
})
export class TechNodeCardComponent {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);

  // ---------------------------------------------------------------------------
  // Inputs / outputs
  // ---------------------------------------------------------------------------

  readonly node = input.required<TechNode>();
  readonly visibility = input.required<NodeVisibility>();
  readonly isCompletionRecent = input<boolean>(false);
  readonly isRevealRecent = input<boolean>(false);
  readonly planetId = input.required<string>();
  /** false for Mars/Venus read-only display nodes. */
  readonly interactive = input<boolean>(true);
  /** Percent complete (0–100). Only provided when visibility is 'in_progress'. */
  readonly progressPercent = input<number | undefined>(undefined);
  /** ETA completion year. Only provided when visibility is 'in_progress'. */
  readonly etaYear = input<number | undefined>(undefined);
  /** True when this card is selected in the inspector. */
  readonly selected = input<boolean>(false);

  readonly nodeSelected = output<string>();

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  readonly displayName = computed(() =>
    this.visibility() === 'hint' ? '???' : this.node().displayName,
  );

  readonly showDetails = computed(() => this.visibility() !== 'hint');

  readonly isInProgress    = computed(() => this.visibility() === 'in_progress');
  readonly isNeedsCapacity = computed(() => this.visibility() === 'needs_capacity');
  readonly isSelectable    = computed(() => this.interactive());

  readonly ariaLabel = computed(() => {
    if (!this.isSelectable()) return null;
    const suffix = this.isCompletionRecent()
      ? ', recently completed'
      : this.isRevealRecent()
        ? ', newly available'
        : '';
    return this.visibility() === 'hint'
      ? `Select locked technology clue${suffix}`
      : `Select technology: ${this.node().displayName}${suffix}`;
  });

  /** Branch tag derived from effects — naturalist, architect, or none. */
  readonly branchTag = computed<'naturalist' | 'architect' | null>(() => {
    if (this.visibility() === 'hint') return null;
    const tagEffect = this.node().effects.find((e) => e.type === 'tag_decision');
    if (!tagEffect || tagEffect.type !== 'tag_decision') return null;
    return tagEffect.tag;
  });

  /**
   * Prerequisite entries for the tooltip — only computed when showDetails() is true
   * (hint nodes show no tooltip details).
   */
  readonly prereqSummary = computed<PrereqEntry[]>(() => {
    if (!this.showDetails()) return [];
    const completed = this.gameState.completedTechs();
    const node = this.node();

    const directEntries: PrereqEntry[] = node.prerequisites.map((id) => {
      const prereqNode = this.data.getTechNode(id);
      return {
        id,
        label: prereqNode?.displayName ?? id,
        met: completed.includes(id),
        isSpillover: false,
      };
    });

    const spilloverEntries: PrereqEntry[] = node.spilloverPrerequisites.map((id) => {
      const prereqNode = this.data.getTechNode(id);
      return {
        id,
        label: prereqNode?.displayName ?? id,
        met: completed.includes(id),
        isSpillover: true,
      };
    });

    return [...directEntries, ...spilloverEntries];
  });

  readonly showTooltip = computed(
    () => this.showDetails() && this.prereqSummary().length > 0,
  );

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  onSelect(): void {
    if (!this.isSelectable()) return;
    this.nodeSelected.emit(this.node().id);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect();
  }
}
