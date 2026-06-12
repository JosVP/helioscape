import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// NOTE: Stub — full research implementation is deferred to Block 7.4.
// moonTabActive input is wired here so the parent can pass it through now;
// Block 7.4 will consume it to select the Moon sub-tab automatically.
@Component({
  selector: 'app-research',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="research-stub">Research — coming soon</div>',
})
export class ResearchComponent {
  readonly planetId = input.required<string>();
  readonly moonTabActive = input<boolean>(false);
}
