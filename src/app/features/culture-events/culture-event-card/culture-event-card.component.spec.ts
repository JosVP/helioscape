import { TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CultureEventCardComponent } from './culture-event-card.component';
import { CultureEventService } from '@app/core/systems/culture-event.service';
import { GameStateService } from '@app/core/services/game-state.service';
import type { CultureEvent, CultureEventChoice } from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CultureEvent> = {}): CultureEvent {
  return {
    id: 'ce_test',
    title: 'Test Event',
    narratorText: 'First paragraph.\n\nSecond paragraph.',
    portrait: '/assets/svg/portraits/ce_test.svg',
    choices: [],
    tags: [],
    trigger: { type: 'year_reached', year: 2040 },
    priority: false,
    ...overrides,
  };
}

function makeChoice(tag: 'naturalist' | 'architect' | '' = ''): CultureEventChoice {
  return { id: 'c1', label: 'Test Choice', tag, effects: [] };
}

// ---------------------------------------------------------------------------
// Fake service
// ---------------------------------------------------------------------------

function makeFakeService(event: CultureEvent | null = null) {
  const currentEventSignal = signal<CultureEvent | null>(event);
  const isDisplayingSignal = signal<boolean>(event !== null);

  return {
    currentEvent: currentEventSignal.asReadonly(),
    isDisplayingEvent: isDisplayingSignal.asReadonly(),
    closeCurrentEvent: vi.fn(),
    applyChoice: vi.fn(),
    // test helpers
    _setEvent: (ev: CultureEvent | null) => {
      currentEventSignal.set(ev);
      isDisplayingSignal.set(ev !== null);
    },
  };
}

type FakeService = ReturnType<typeof makeFakeService>;

function setup(event: CultureEvent | null = null): {
  fixture: ReturnType<typeof TestBed.createComponent<CultureEventCardComponent>>;
  component: CultureEventCardComponent;
  fakeSvc: FakeService;
  interactionLockedSignal: WritableSignal<boolean>;
} {
  const fakeSvc = makeFakeService(event);
  const interactionLockedSignal = signal(false);

  TestBed.configureTestingModule({
    imports: [CultureEventCardComponent],
    providers: [
      { provide: CultureEventService, useValue: fakeSvc },
      { provide: GameStateService, useValue: { interactionLocked: interactionLockedSignal.asReadonly() } },
    ],
  });

  const fixture = TestBed.createComponent(CultureEventCardComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, fakeSvc, interactionLockedSignal };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CultureEventCardComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // ── Visibility ────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('does not have card-overlay--visible class when no event is active', () => {
      const { fixture } = setup(null);
      const host = fixture.nativeElement as HTMLElement;
      const overlay = host.querySelector('.card-overlay');
      expect(overlay?.classList.contains('card-overlay--visible')).toBe(false);
    });

    it('has card-overlay--visible class when an event is active', () => {
      const { fixture } = setup(makeEvent());
      const host = fixture.nativeElement as HTMLElement;
      const overlay = host.querySelector('.card-overlay');
      expect(overlay?.classList.contains('card-overlay--visible')).toBe(true);
    });
  });

  // ── Continue button (no choices) ──────────────────────────────────────────

  describe('continue button', () => {
    it('renders a Continue button when event has no choices', () => {
      const { fixture } = setup(makeEvent({ choices: [] }));
      const btn = (fixture.nativeElement as HTMLElement).querySelector('.card-overlay__btn--continue');
      expect(btn).not.toBeNull();
      expect(btn?.textContent?.trim()).toBe('Continue');
    });

    it('does not render choice buttons when choices array is empty', () => {
      const { fixture } = setup(makeEvent({ choices: [] }));
      const btns = (fixture.nativeElement as HTMLElement).querySelectorAll('.card-overlay__btn:not(.card-overlay__btn--continue)');
      expect(btns.length).toBe(0);
    });

    it('calls closeCurrentEvent when Continue is clicked', () => {
      const { fixture, fakeSvc } = setup(makeEvent({ choices: [] }));
      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.card-overlay__btn--continue');
      btn?.click();
      expect(fakeSvc.closeCurrentEvent).toHaveBeenCalledOnce();
    });

    it('does not close the event while interactions are locked', () => {
      const { component, fakeSvc, interactionLockedSignal } = setup(makeEvent({ choices: [] }));
      interactionLockedSignal.set(true);

      component.onContinue();

      expect(fakeSvc.closeCurrentEvent).not.toHaveBeenCalled();
    });
  });

  // ── Choice buttons ────────────────────────────────────────────────────────

  describe('choice buttons', () => {
    it('renders one button per choice when choices are present', () => {
      const choices = [makeChoice('naturalist'), { ...makeChoice('architect'), id: 'c2', label: 'Build' }];
      const { fixture } = setup(makeEvent({ choices }));
      const btns = (fixture.nativeElement as HTMLElement).querySelectorAll('.card-overlay__btn:not(.card-overlay__btn--continue)');
      expect(btns.length).toBe(2);
    });

    it('does not render Continue button when choices are present', () => {
      const { fixture } = setup(makeEvent({ choices: [makeChoice()] }));
      const continueBtn = (fixture.nativeElement as HTMLElement).querySelector('.card-overlay__btn--continue');
      expect(continueBtn).toBeNull();
    });

    it('calls applyChoice with the clicked choice', () => {
      const choice = makeChoice('naturalist');
      const { fixture, fakeSvc } = setup(makeEvent({ choices: [choice] }));
      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.card-overlay__btn');
      btn?.click();
      expect(fakeSvc.applyChoice).toHaveBeenCalledWith(choice);
    });

    it('does not apply choices while interactions are locked', () => {
      const choice = makeChoice('naturalist');
      const { component, fakeSvc, interactionLockedSignal } = setup(makeEvent({ choices: [choice] }));
      interactionLockedSignal.set(true);

      component.onChoice(choice);

      expect(fakeSvc.applyChoice).not.toHaveBeenCalled();
    });
  });

  // ── Narrator paragraphs ───────────────────────────────────────────────────

  describe('narrator paragraphs', () => {
    it('splits narratorText on double newline into separate <p> elements', () => {
      const { component, fixture } = setup(makeEvent({ narratorText: 'Para one.\n\nPara two.' }));
      fixture.detectChanges();
      const paras = (fixture.nativeElement as HTMLElement).querySelectorAll('.card-overlay__narrator p');
      expect(paras.length).toBe(2);
      expect(paras[0].textContent?.trim()).toBe('Para one.');
      expect(paras[1].textContent?.trim()).toBe('Para two.');
    });
  });

  // ── Keyboard: Enter/Space ─────────────────────────────────────────────────

  describe('keyboard — Enter/Space with no choices', () => {
    it('calls closeCurrentEvent on Enter when no choices', () => {
      const { component, fakeSvc } = setup(makeEvent({ choices: [] }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(fakeSvc.closeCurrentEvent).toHaveBeenCalledOnce();
    });

    it('calls closeCurrentEvent on Space when no choices', () => {
      const { component, fakeSvc } = setup(makeEvent({ choices: [] }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
      expect(fakeSvc.closeCurrentEvent).toHaveBeenCalledOnce();
    });

    it('does nothing on Enter when event is not visible', () => {
      const { component, fakeSvc } = setup(null);
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(fakeSvc.closeCurrentEvent).not.toHaveBeenCalled();
    });

    it('does nothing on Enter while interactions are locked', () => {
      const { component, fakeSvc, interactionLockedSignal } = setup(makeEvent({ choices: [] }));
      interactionLockedSignal.set(true);

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(fakeSvc.closeCurrentEvent).not.toHaveBeenCalled();
    });
  });

  // ── Keyboard: Tab cycles choices ─────────────────────────────────────────

  describe('keyboard — Tab cycling', () => {
    it('advances focusedChoiceIndex on Tab', () => {
      const choices = [makeChoice(), { ...makeChoice(), id: 'c2' }];
      const { component } = setup(makeEvent({ choices }));
      expect(component.focusedChoiceIndex()).toBe(0);
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.focusedChoiceIndex()).toBe(1);
    });

    it('wraps focusedChoiceIndex back to 0 after last choice', () => {
      const choices = [makeChoice(), { ...makeChoice(), id: 'c2' }];
      const { component } = setup(makeEvent({ choices }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.focusedChoiceIndex()).toBe(0);
    });

    it('does not advance when only one choice', () => {
      const { component } = setup(makeEvent({ choices: [makeChoice()] }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.focusedChoiceIndex()).toBe(0);
    });
  });

  // ── Keyboard: Enter with choices confirms focused ─────────────────────────

  describe('keyboard — Enter with choices', () => {
    it('calls applyChoice with the focused choice on Enter', () => {
      const c1 = makeChoice('naturalist');
      const c2: CultureEventChoice = { id: 'c2', label: 'Build', tag: 'architect', effects: [] };
      const { component, fakeSvc } = setup(makeEvent({ choices: [c1, c2] }));

      // Tab once to focus c2
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(fakeSvc.applyChoice).toHaveBeenCalledWith(c2);
    });
  });

  // ── focusedChoiceIndex resets on new event ────────────────────────────────

  describe('focusedChoiceIndex reset', () => {
    it('resets to 0 when a new event arrives after Tab navigation', () => {
      const choices = [makeChoice(), { ...makeChoice(), id: 'c2' }];
      const { component, fakeSvc, fixture } = setup(makeEvent({ choices }));

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.focusedChoiceIndex()).toBe(1);

      // Simulate a new event arriving
      fakeSvc._setEvent(makeEvent({ id: 'ce_new', choices }));
      TestBed.flushEffects();

      expect(component.focusedChoiceIndex()).toBe(0);
    });
  });
});
