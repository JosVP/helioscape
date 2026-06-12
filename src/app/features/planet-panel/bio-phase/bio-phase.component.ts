import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// NOTE: Stub — full bio-phase implementation is deferred to Block 7.5.
@Component({
  selector: 'app-bio-phase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="bio-phase-stub">Bio Phases — coming soon</div>',
})
export class BioPhaseComponent {
  readonly planetId = input.required<string>();
}
