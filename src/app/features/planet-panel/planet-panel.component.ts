import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// NOTE: Stub — full planet detail panel (tech tree, research, bio-phase) is deferred to the Planet Panel block.
@Component({
  selector: 'app-planet-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PlanetPanelComponent {
  readonly planetId = input<string | null>(null);
}
