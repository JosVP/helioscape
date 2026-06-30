import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SaveSlotPanelComponent } from '@app/features/title-screen/save-slot-panel/save-slot-panel.component';
import { SettingsComponent } from '@app/features/settings/settings.component';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';

type PauseMenuView = 'menu' | 'save' | 'load' | 'settings';
type PauseConfirm = 'load' | 'title' | 'quit';

@Component({
  selector: 'app-pause-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SaveSlotPanelComponent, SettingsComponent, ConfirmDialogComponent],
  templateUrl: './pause-menu.component.html',
  styleUrl: './pause-menu.component.scss',
})
export class PauseMenuComponent implements OnDestroy {
  readonly isOpen = input<boolean>(false);

  readonly closed = output<void>();
  readonly resumeRequested = output<void>();
  readonly returnToTitleRequested = output<void>();
  readonly loadCompleted = output<void>();

  readonly activeView = signal<PauseMenuView>('menu');
  readonly pendingConfirm = signal<PauseConfirm | null>(null);

  readonly firstButton = viewChild<ElementRef<HTMLButtonElement>>('firstButton');
  readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  private previousFocus: HTMLElement | null = null;
  private keydownListenerRegistered = false;
  private readonly onDocumentKeyDownBound = this.onDocumentKeyDown.bind(this);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      untracked(() => this.syncFocusTrap(open));
    });
  }

  ngOnDestroy(): void {
    this.removeKeydownListener();
    this.restoreFocus();
  }

  onResume(): void {
    this.resetToRoot();
    this.resumeRequested.emit();
    this.closed.emit();
  }

  openSave(): void {
    this.pendingConfirm.set(null);
    this.activeView.set('save');
  }

  requestLoad(): void {
    this.pendingConfirm.set('load');
  }

  confirmLoad(): void {
    this.pendingConfirm.set(null);
    this.activeView.set('load');
  }

  openSettings(): void {
    this.pendingConfirm.set(null);
    this.activeView.set('settings');
  }

  requestReturnToTitle(): void {
    this.pendingConfirm.set('title');
  }

  confirmReturnToTitle(): void {
    this.resetToRoot();
    this.returnToTitleRequested.emit();
    this.closed.emit();
  }

  requestQuit(): void {
    this.pendingConfirm.set('quit');
  }

  confirmQuit(): void {
    this.pendingConfirm.set(null);
  }

  cancelConfirm(): void {
    this.pendingConfirm.set(null);
  }

  onChildPanelClosed(): void {
    this.resetToRoot();
    this.focusFirstControl();
  }

  onLoadCompleted(): void {
    this.loadCompleted.emit();
  }

  onEscape(): void {
    if (this.pendingConfirm() !== null) {
      this.cancelConfirm();
      return;
    }

    if (this.activeView() !== 'menu') {
      this.onChildPanelClosed();
      return;
    }

    this.onResume();
  }

  private resetToRoot(): void {
    this.activeView.set('menu');
    this.pendingConfirm.set(null);
  }

  private syncFocusTrap(open: boolean): void {
    if (open) {
      this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.addKeydownListener();
      queueMicrotask(() => this.focusFirstControl());
      return;
    }

    this.removeKeydownListener();
    this.resetToRoot();
    this.restoreFocus();
  }

  private addKeydownListener(): void {
    if (this.keydownListenerRegistered) return;
    document.addEventListener('keydown', this.onDocumentKeyDownBound);
    this.keydownListenerRegistered = true;
  }

  private removeKeydownListener(): void {
    if (!this.keydownListenerRegistered) return;
    document.removeEventListener('keydown', this.onDocumentKeyDownBound);
    this.keydownListenerRegistered = false;
  }

  private onDocumentKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.onEscape();
      return;
    }

    if (event.key !== 'Tab') return;
    this.trapFocus(event);
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.panel()?.nativeElement;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null || element === document.activeElement);

    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  private focusFirstControl(): void {
    this.firstButton()?.nativeElement.focus({ preventScroll: true });
  }

  private restoreFocus(): void {
    this.previousFocus?.focus({ preventScroll: true });
    this.previousFocus = null;
  }
}
