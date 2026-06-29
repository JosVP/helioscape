import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { TechNode } from '@app/core/models';
import { TechNodeIconComponent } from '../tech-node-icon/tech-node-icon.component';
import type { NodeVisibility } from '../tech-node-view.model';

@Component({
  selector: 'app-tech-node-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechNodeIconComponent],
  templateUrl: './tech-node-card.component.html',
  styleUrl: './tech-node-card.component.scss',
})
export class TechNodeCardComponent {
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

  readonly displayName = computed(() => this.node().displayName);
  readonly isInProgress = computed(() => this.visibility() === 'running' || this.visibility() === 'paused');
  readonly isSelectable    = computed(() => this.interactive());

  readonly ariaLabel = computed(() => {
    if (!this.isSelectable()) return null;
    const suffix = this.isCompletionRecent()
      ? ', recently completed'
      : this.isRevealRecent()
        ? ', newly available'
        : '';
    return `Select research node: ${this.node().displayName}${suffix}`;
  });

  /** Branch tag derived from effects — naturalist, architect, or none. */
  readonly branchTag = computed<'naturalist' | 'architect' | null>(() => {
    const tagEffect = this.node().effects.find((e) => e.type === 'tag_decision');
    if (!tagEffect || tagEffect.type !== 'tag_decision') return null;
    return tagEffect.tag;
  });

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
