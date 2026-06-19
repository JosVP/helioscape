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

  readonly isHint = computed(() => this.visibility() === 'hint');
}
