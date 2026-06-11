import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { SettingsService } from '@app/core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly settings = inject(SettingsService);
  readonly closed = output<void>();

  onReducedMotion(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settings.set('reducedMotion', checked);
  }

  onColorblind(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settings.set('colorblindMode', checked);
  }

  onHighContrast(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settings.set('highContrast', checked);
  }

  onAutosaveInterval(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.settings.set('autosaveIntervalYears', value);
  }

  onConfirmIrreversible(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settings.set('confirmIrreversible', checked);
  }
}
