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

/** UI-only visibility tier for a tech node card. */
export type NodeVisibility = 'completed' | 'available' | 'hint';

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
  readonly isNew = input<boolean>(false);
  readonly planetId = input.required<string>();
  /** false for Mars/Venus read-only display nodes. */
  readonly interactive = input<boolean>(true);

  readonly nodeClicked = output<string>();

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------

  readonly displayName = computed(() =>
    this.visibility() === 'hint' ? '???' : this.node().displayName,
  );

  readonly showDetails = computed(() => this.visibility() !== 'hint');

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

  onClick(): void {
    if (!this.interactive() || this.visibility() === 'completed') return;
    this.nodeClicked.emit(this.node().id);
  }
}
