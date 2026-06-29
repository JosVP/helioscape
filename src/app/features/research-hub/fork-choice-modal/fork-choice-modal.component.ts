import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { ForkChoice, PendingFork, TechEffect } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { TechTreeService } from '@app/core/systems/tech-tree.service';

/** A ForkChoice annotated with pre-computed human-readable effect lines. */
export interface EnrichedChoice {
  readonly id: string;
  readonly label: string;
  readonly tag: ForkChoice['tag'];
  readonly effectSummary: readonly string[];
}

@Component({
  selector: 'app-fork-choice-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fork-choice-modal.component.html',
  styleUrl: './fork-choice-modal.component.scss',
})
export class ForkChoiceModalComponent {
  private readonly techTreeService = inject(TechTreeService);
  private readonly data = inject(DataService);

  readonly fork = input.required<PendingFork>();

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  readonly techNode = computed(() => this.data.getTechNode(this.fork().techId));

  readonly techDisplayName = computed(() => this.techNode()?.displayName ?? this.fork().techId);

  readonly enrichedChoices = computed<EnrichedChoice[]>(() => {
    const node = this.techNode();
    if (!node) return [];

    const forkEffect = node.effects.find(
      (e): e is Extract<TechEffect, { type: 'present_fork' }> => e.type === 'present_fork',
    );
    if (!forkEffect) return [];

    return forkEffect.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      tag: choice.tag,
      effectSummary: this._summariseEffects(choice.effects),
    }));
  });

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  tagLabel(tag: ForkChoice['tag']): string {
    if (tag === 'naturalist') return '🌿 Naturalist';
    if (tag === 'architect') return '⚙ Architect';
    return '';
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  // No cancel action — this is intentional: the tech has completed, a choice must be made.
  choose(choiceId: string): void {
    const f = this.fork();
    this.techTreeService.completeForkChoice(f.planetId, f.techId, choiceId);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private _summariseEffects(effects: TechEffect[]): string[] {
    const summary: string[] = [];
    for (const effect of effects) {
      switch (effect.type) {
        case 'unlock_tech': {
          const node = this.data.getTechNode(effect.target);
          summary.push(`Unlocks: ${node?.displayName ?? effect.target}`);
          break;
        }
        case 'research_time_reduction':
          summary.push(
            effect.target
              ? `Reduces future research time for ${effect.target}`
              : `Reduces future research time by ${effect.amountYears} years`,
          );
          break;
        case 'apply_terraforming_choice':
          summary.push('Applies a terraforming path choice');
          break;
        case 'apply_colonist_bonus':
          summary.push(
            effect.bonus === 'dense_living'
              ? 'Enables dense living bonus'
              : 'Enables open environment bonus',
          );
          break;
        case 'spillover_unlock':
          summary.push(`Unlocks a tech on ${effect.targetPlanet}`);
          break;
        // tag_decision is communicated through the tag chip — not surfaced here.
        // emit_event and set_flag are internal — not meaningful to the player here.
        // present_fork: nested forks are not supported.
        case 'tag_decision':
        case 'emit_event':
        case 'set_flag':
        case 'present_fork':
          break;
        default:
          break;
      }
    }
    return summary;
  }
}
