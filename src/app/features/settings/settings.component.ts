import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { SettingsService } from '@app/core/services/settings.service';

interface Tab {
  id: 'audio' | 'video' | 'accessibility' | 'gameplay';
  label: string;
}

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

  readonly tabs: readonly Tab[] = [
    { id: 'audio', label: 'Audio' },
    { id: 'video', label: 'Video' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'gameplay', label: 'Gameplay' },
  ];

  readonly activeTab = signal<Tab['id']>('audio');
  readonly resetConfirming = signal(false);

  /** Format 0.0–1.0 as percentage string for volume labels. */
  pct(val: number): string {
    return `${Math.round(val * 100)}%`;
  }

  // ─── Audio ────────────────────────────────────────────────────────────────

  onMasterVolume(event: Event): void {
    this.settings.set('masterVolume', +(event.target as HTMLInputElement).value);
  }

  onMusicVolume(event: Event): void {
    this.settings.set('musicVolume', +(event.target as HTMLInputElement).value);
  }

  onSfxVolume(event: Event): void {
    this.settings.set('sfxVolume', +(event.target as HTMLInputElement).value);
  }

  // ─── Video ────────────────────────────────────────────────────────────────

  onFullscreen(event: Event): void {
    this.settings.set('fullscreen', (event.target as HTMLInputElement).checked);
  }

  onVSync(event: Event): void {
    this.settings.set('vsync', (event.target as HTMLInputElement).checked);
  }

  onUiScale(event: Event): void {
    this.settings.set('uiScale', +(event.target as HTMLSelectElement).value);
  }

  // ─── Accessibility ────────────────────────────────────────────────────────

  onTextSize(event: Event): void {
    this.settings.set('textSizeMultiplier', +(event.target as HTMLSelectElement).value);
  }

  onColorblind(event: Event): void {
    this.settings.set('colorblindMode', (event.target as HTMLInputElement).checked);
  }

  onReducedMotion(event: Event): void {
    this.settings.set('reducedMotion', (event.target as HTMLInputElement).checked);
  }

  onHighContrast(event: Event): void {
    this.settings.set('highContrast', (event.target as HTMLInputElement).checked);
  }

  // ─── Gameplay ─────────────────────────────────────────────────────────────

  onAutosaveInterval(event: Event): void {
    this.settings.set('autosaveIntervalYears', +(event.target as HTMLSelectElement).value);
  }

  onConfirmIrreversible(event: Event): void {
    this.settings.set('confirmIrreversible', (event.target as HTMLInputElement).checked);
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  onResetClick(): void {
    this.resetConfirming.set(true);
  }

  onResetConfirm(): void {
    this.settings.resetToDefaults();
    this.resetConfirming.set(false);
  }

  onResetCancel(): void {
    this.resetConfirming.set(false);
  }
}
