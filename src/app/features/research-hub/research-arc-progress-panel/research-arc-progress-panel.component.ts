import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResearchArcPanelView } from '../research-hub-view.model';

@Component({
  selector: 'app-research-arc-progress-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './research-arc-progress-panel.component.html',
  styleUrl: './research-arc-progress-panel.component.scss',
})
export class ResearchArcProgressPanelComponent {
  readonly arcs = input.required<ResearchArcPanelView[]>();
}