import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// NOTE: Stub — full pause menu (settings, save, quit) is deferred to the Pause Menu block.
@Component({
  selector: 'app-pause-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PauseMenuComponent {
  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();
}
