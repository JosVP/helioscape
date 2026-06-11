import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SaveService } from '@app/core/services/save.service';
import type { SlotInfo } from '@app/core/services/save.service';
import { SaveSlotPanelComponent, SaveSlotMode } from './save-slot-panel/save-slot-panel.component';
import { SettingsComponent } from '../settings/settings.component';

interface RecentSlot {
  slot: number;
  info: SlotInfo;
}

@Component({
  selector: 'app-title-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SaveSlotPanelComponent, SettingsComponent],
  templateUrl: './title-screen.component.html',
  styleUrl: './title-screen.component.scss',
})
export class TitleScreenComponent implements AfterViewInit {
  private readonly saveService = inject(SaveService);
  private readonly router = inject(Router);

  // Async-resolved save state — start false so Continue is hidden until we know.
  private readonly _hasSave = signal(false);
  private readonly _mostRecentSlot = signal<RecentSlot | null>(null);

  // Overlay visibility
  readonly showSavePanel = signal(false);
  readonly saveMode = signal<SaveSlotMode>('LOAD');
  readonly showSettings = signal(false);

  // CSS initial-load animation trigger
  readonly loaded = signal(false);

  // Public readonly projections used in the template
  readonly hasSave = this._hasSave.asReadonly();
  readonly mostRecentSlot = this._mostRecentSlot.asReadonly();

  constructor() {
    this.saveService.hasSave().then((has) => this._hasSave.set(has));

    this.saveService.getAllSlotInfos().then((infos) => {
      const occupied = infos
        .map((info, slot) => ({ slot, info }))
        .filter((pair) => pair.info.exists);
      if (occupied.length === 0) return;
      const recent = occupied.reduce((a, b) =>
        (a.info.saveTimestamp ?? 0) >= (b.info.saveTimestamp ?? 0) ? a : b
      );
      this._mostRecentSlot.set(recent);
    });
  }

  ngAfterViewInit(): void {
    // Defer one microtask so Angular has painted the initial frame, making the
    // opacity 0 → 1 transition visible rather than skipped.
    Promise.resolve().then(() => this.loaded.set(true));
  }

  onNewGame(): void {
    if (this._hasSave()) {
      this.saveMode.set('NEW_GAME');
      this.showSavePanel.set(true);
    } else {
      this.router.navigate(['/game'], { queryParams: { slot: 1 } });
    }
  }

  onContinue(): void {
    const recent = this._mostRecentSlot();
    if (!recent) return;
    // Fire-and-forget: GameShellComponent reads the hydrated state on arrival.
    // NOTE: a loading spinner would be a nice addition in a later block.
    this.saveService.load(recent.slot).then(() => {
      this.router.navigate(['/game']);
    });
  }

  onLoadGame(): void {
    this.saveMode.set('LOAD');
    this.showSavePanel.set(true);
  }

  onOptions(): void {
    this.showSettings.set(true);
  }

  onQuit(): void {
    // NOTE: window.close() is blocked by browsers unless the page was script-opened.
    // Tauri will provide a proper app.exit() — wire that up in the Tauri integration block.
    window.close();
  }

  onPanelClosed(): void {
    this.showSavePanel.set(false);
  }

  onSettingsClosed(): void {
    this.showSettings.set(false);
  }
}
