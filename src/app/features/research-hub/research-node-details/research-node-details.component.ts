import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ResearchNodeDetailsViewModel } from '../research-hub-view.model';

@Component({
  selector: 'app-research-node-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './research-node-details.component.html',
  styleUrl: './research-node-details.component.scss',
})
export class ResearchNodeDetailsComponent {
  readonly viewModel = input<ResearchNodeDetailsViewModel | null>(null);

  readonly startRequested = output<string>();
  readonly pauseRequested = output<string>();
  readonly resumeRequested = output<string>();
  readonly prerequisiteFocused = output<string>();
}