import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TechNodeIconComponent } from '../tech-node-icon/tech-node-icon.component';
import type { TechInspectorViewModel } from './tech-node-inspector.model';

@Component({
  selector: 'app-tech-node-inspector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechNodeIconComponent],
  templateUrl: './tech-node-inspector.component.html',
  styleUrl: './tech-node-inspector.component.scss',
})
export class TechNodeInspectorComponent {
  readonly viewModel = input<TechInspectorViewModel | null>(null);
  readonly startRequested = output<string>();

  readonly hasPrerequisites = computed(() => (this.viewModel()?.prerequisites.length ?? 0) > 0);
  readonly hasOutcomes = computed(() => (this.viewModel()?.node.outcomeSummary.length ?? 0) > 0);

  onStart(): void {
    const viewModel = this.viewModel();
    if (!viewModel?.canStart) return;
    this.startRequested.emit(viewModel.node.id);
  }
}
