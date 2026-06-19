import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { NodeVisibility } from '../tech-node-view.model';

@Component({
  selector: 'app-tech-node-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tech-node-icon.component.html',
  styleUrl: './tech-node-icon.component.scss',
})
export class TechNodeIconComponent {
  readonly planetId = input.required<string>();
  readonly visibility = input.required<NodeVisibility>();
  readonly size = input<'compact' | 'large'>('compact');
  readonly iconPath = input<string | undefined>(undefined);
  readonly silhouetteIconPath = input<string | undefined>(undefined);

  readonly isHint = computed(() => this.visibility() === 'hint');
  readonly imagePath = computed(() => (this.isHint() ? this.silhouetteIconPath() : this.iconPath()));
}
