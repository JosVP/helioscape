import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// NOTE: Stub — full tech-tree implementation is deferred to Block 7.2.
@Component({
  selector: 'app-tech-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="tech-tree-stub">Tech Tree — coming soon</div>',
})
export class TechTreeComponent {
  readonly planetId = input.required<string>();
}
