import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import type { CultureEventChoice } from '@app/core/models';
import { CultureEventService } from '@app/core/systems/culture-event.service';

@Component({
  selector: 'app-culture-event-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './culture-event-card.component.html',
  styleUrl: './culture-event-card.component.scss',
})
export class CultureEventCardComponent {
  private readonly cultureEventService = inject(CultureEventService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly event = this.cultureEventService.currentEvent;
  readonly isVisible = this.cultureEventService.isDisplayingEvent;

  readonly paragraphs = computed(() => {
    const text = this.event()?.narratorText;
    return text ? text.split('\n\n') : [];
  });

  private readonly _focusedChoiceIndex = signal(0);
  readonly focusedChoiceIndex = this._focusedChoiceIndex.asReadonly();

  /** The element that had focus before the card opened; restored when it closes. */
  private _previousFocus: HTMLElement | null = null;

  constructor() {
    // Reset choice index and manage focus when visibility changes.
    effect(() => {
      const visible = this.isVisible();
      untracked(() => {
        if (visible) {
          this._previousFocus = document.activeElement as HTMLElement | null;
          this._focusedChoiceIndex.set(0);
          // Defer one microtask so the DOM has rendered with --visible before
          // we attempt to move focus into it.
          Promise.resolve().then(() => this._focusCard());
        } else {
          this._previousFocus?.focus();
          this._previousFocus = null;
        }
      });
    });
  }

  onContinue(): void {
    this.cultureEventService.closeCurrentEvent();
  }

  onChoice(choice: CultureEventChoice): void {
    this.cultureEventService.applyChoice(choice);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (!this.isVisible()) return;

    const choices = this.event()?.choices ?? [];

    if (e.key === 'Escape') {
      e.preventDefault();
      this.onContinue();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (choices.length === 0) {
        this.onContinue();
      } else {
        this.onChoice(choices[this._focusedChoiceIndex()]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (choices.length > 1) {
        this._focusedChoiceIndex.update((i) => (i + 1) % choices.length);
      }
    }
  }

  private _focusCard(): void {
    const card = this.elementRef.nativeElement.querySelector('[tabindex="-1"]') as HTMLElement | null;
    card?.focus({ preventScroll: true });
  }
}

