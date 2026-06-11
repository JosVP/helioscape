import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// NOTE: Stub — full planets list implementation is deferred to the Planets Panel block.
@Component({
  selector: 'app-planets-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PlanetsPanelComponent {
  readonly selectedPlanetId = input<string | null>(null);
}
