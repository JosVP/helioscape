import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { CultureEventService } from './culture-event.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import type {
  CultureEvent,
  CultureEventEntry,
  CultureEventHistoryEntry,
  EuropaState,
} from '@app/core/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCultureEvent(overrides: Partial<CultureEvent> = {}): CultureEvent {
  return {
    id: 'ce_test',
    title: 'Test Event',
    narratorText: 'Test narrator text.',
    portrait: '/assets/svg/portraits/ce_test.svg',
    choices: [],
    tags: [],
    trigger: { type: 'year_reached', year: 2040 },
    priority: false,
    ...overrides,
  };
}

function makeCultureEventEntry(overrides: Partial<CultureEventEntry> = {}): CultureEventEntry {
  return {
    eventId: 'ce_test',
    queuedAtYear: 2040,
    priority: false,
    wasInterrupted: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeGameStateFake(opts: {
  gameYear?: number;
  queue?: CultureEventEntry[];
  history?: CultureEventHistoryEntry[];
  europaState?: EuropaState;
  dysonCoveragePercent?: number;
} = {}) {
  const gameYearSignal = signal<number>(opts.gameYear ?? 2033);
  const queueSignal = signal<CultureEventEntry[]>(opts.queue ?? []);
  const historySignal = signal<CultureEventHistoryEntry[]>(opts.history ?? []);
  const europaSignal = signal<EuropaState>(
    opts.europaState ?? { missionAuthorised: false, impactYear: 0, impacted: false, lifeConfirmed: false },
  );
  const dysonCoverageSignal = signal<number>(opts.dysonCoveragePercent ?? 0);

  return {
    gameYear: gameYearSignal.asReadonly(),
    cultureEventQueue: queueSignal.asReadonly(),
    cultureEventHistory: historySignal.asReadonly(),
    europaState: europaSignal.asReadonly(),
    dysonCoveragePercent: dysonCoverageSignal.asReadonly(),

    // Test write helpers
    _setYear: (y: number) => gameYearSignal.set(y),
    _setQueue: (q: CultureEventEntry[]) => queueSignal.set(q),
    _setHistory: (h: CultureEventHistoryEntry[]) => historySignal.set(h),
    _setEuropa: (e: EuropaState) => europaSignal.set(e),
    _setDysonCoverage: (pct: number) => dysonCoverageSignal.set(pct),

    // Mutation spies
    addToEventQueue: vi.fn((entry: CultureEventEntry) => {
      queueSignal.update((q) => [...q, entry]);
    }),
    addPriorityEvent: vi.fn((eventId: string, queuedAtYear: number) => {
      queueSignal.update((queue) => {
        const priorityEntry: CultureEventEntry = {
          eventId,
          queuedAtYear,
          priority: true,
          wasInterrupted: false,
        };
        if (queue.length === 0) return [priorityEntry];
        const [current, ...rest] = queue;
        return [priorityEntry, { ...current, wasInterrupted: true }, ...rest];
      });
    }),
    shiftEventQueue: vi.fn(() => {
      queueSignal.update((q) => q.slice(1));
    }),
    removeEventFromQueue: vi.fn((eventId: string) => {
      queueSignal.update((q) => q.filter((entry) => entry.eventId !== eventId));
    }),
    recordEventHistory: vi.fn((entry: CultureEventHistoryEntry) => {
      historySignal.update((h) => [...h, entry]);
    }),
    incrementNaturalist: vi.fn(),
    incrementArchitect: vi.fn(),
  };
}

function makeDataFake(events: CultureEvent[] = []) {
  return {
    getCultureEvent: vi.fn((id: string) => events.find((e) => e.id === id)),
    getAllCultureEvents: vi.fn(() => events),
  };
}

function makeEventBusFake() {
  return {
    techUnlocked$: new Subject<{ planetId: string; nodeId: string }>(),
    milestoneReached$: new Subject<string>(),
    terraformingChoiceApplied$: new Subject<{ planetId: string; choiceId: string }>(),
    terraformingPhaseChanged$: new Subject<{ planetId: string; phase: number }>(),
    bioPhaseCompleted$: new Subject<{ planetId: string; phaseId: string }>(),
    bioPhaseCollapsed$: new Subject<{ planetId: string; phaseId: string }>(),
    cultureEventTriggered$: new Subject<string>(),
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

type GameStateFake = ReturnType<typeof makeGameStateFake>;
type DataFake = ReturnType<typeof makeDataFake>;
type EventBusFake = ReturnType<typeof makeEventBusFake>;

function setup(
  opts: Parameters<typeof makeGameStateFake>[0] = {},
  events: CultureEvent[] = [],
): { service: CultureEventService; gameState: GameStateFake; data: DataFake; eventBus: EventBusFake } {
  const gameState = makeGameStateFake(opts);
  const data = makeDataFake(events);
  const eventBus = makeEventBusFake();

  TestBed.configureTestingModule({
    providers: [
      CultureEventService,
      { provide: DataService, useValue: data },
      { provide: GameStateService, useValue: gameState },
      { provide: EventBusService, useValue: eventBus },
    ],
  });

  const service = TestBed.inject(CultureEventService);
  return { service, gameState, data, eventBus };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CultureEventService', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // queueEvent — normal path
  // -------------------------------------------------------------------------

  describe('queueEvent (normal, non-priority)', () => {
    it('adds entry to back of queue when no event is currently displaying', () => {
      const event = makeCultureEvent({
        id: 'ce_a',
        choices: [{ id: 'c1', label: 'Continue', tag: '', effects: [] }],
      });
      const { service, gameState } = setup({ gameYear: 2040 }, [event]);

      service.queueEvent('ce_a');

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_a', priority: false, wasInterrupted: false }),
      );
    });

    it('does not call addToEventQueue when eventId is unknown', () => {
      const { service, gameState } = setup({}, []);

      service.queueEvent('ce_nonexistent');

      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
    });

    it('shows the event immediately when queue was empty and nothing is displaying', () => {
      const event = makeCultureEvent({
        id: 'ce_a',
        choices: [{ id: 'c1', label: 'Continue', tag: '', effects: [] }],
      });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup({ gameYear: 2040, queue: [] }, [event]);

      // Simulate GameStateService adding to queue when addToEventQueue is called
      gameState.addToEventQueue.mockImplementation((e: CultureEventEntry) => {
        gameState._setQueue([e]);
      });

      service.queueEvent('ce_a');

      expect(service.currentEvent()).toEqual(event);
      expect(service.isDisplayingEvent()).toBe(true);
    });

    it('does not show next when something is already displaying', () => {
      const eventA = makeCultureEvent({ id: 'ce_a' });
      const eventB = makeCultureEvent({ id: 'ce_b' });
      // Simulate ce_a already in queue and displaying
      const existingEntry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup(
        { gameYear: 2040, queue: [existingEntry] },
        [eventA, eventB],
      );

      // Manually display ce_a so _currentEntry is set
      gameState.addToEventQueue.mockImplementation(() => {});
      // Force first display
      gameState._setQueue([existingEntry]);
      (service as any)._displayEvent(existingEntry);

      // The service should now be displaying ce_a
      // Queue ce_b — it should NOT jump to front
      service.queueEvent('ce_b');
      expect(service.currentEvent()?.id).toBe('ce_a');
    });
  });

  // -------------------------------------------------------------------------
  // queueEvent — priority path
  // -------------------------------------------------------------------------

  describe('queueEvent (priority)', () => {
    it('calls addPriorityEvent and displays the new event immediately', () => {
      const priorityEvent = makeCultureEvent({ id: 'ce_priority', priority: true });
      const { service, gameState } = setup({ gameYear: 2050 }, [priorityEvent]);

      // Simulate addPriorityEvent placing it at front of queue
      gameState.addPriorityEvent.mockImplementation((_eventId: string, _year: number) => {
        gameState._setQueue([makeCultureEventEntry({ eventId: 'ce_priority', priority: true })]);
      });

      service.queueEvent('ce_priority', true);

      expect(gameState.addPriorityEvent).toHaveBeenCalledWith('ce_priority', 2050);
      expect(service.currentEvent()?.id).toBe('ce_priority');
      expect(service.isDisplayingEvent()).toBe(true);
    });

    it('flags displaced event as wasInterrupted via GameStateService', () => {
      const normalEvent = makeCultureEvent({ id: 'ce_normal' });
      const priorityEvent = makeCultureEvent({ id: 'ce_priority', priority: true });
      const normalEntry = makeCultureEventEntry({ eventId: 'ce_normal' });

      const { service, gameState } = setup(
        { gameYear: 2050, queue: [normalEntry] },
        [normalEvent, priorityEvent],
      );

      // Display the normal event first
      gameState._setQueue([normalEntry]);
      TestBed.flushEffects();

      // Now queue a priority event — GameStateService.addPriorityEvent handles the
      // wasInterrupted flag; verify it was called
      service.queueEvent('ce_priority', true);

      expect(gameState.addPriorityEvent).toHaveBeenCalledWith('ce_priority', 2050);
    });
  });

  // -------------------------------------------------------------------------
  // closeCurrentEvent
  // -------------------------------------------------------------------------

  describe('closeCurrentEvent', () => {
    it('does nothing when no event is displaying', () => {
      const { service, gameState } = setup({}, []);

      service.closeCurrentEvent();

      expect(gameState.removeEventFromQueue).not.toHaveBeenCalled();
    });

    it('shifts the queue and clears current entry immediately', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup({ gameYear: 2040, queue: [entry] }, [event]);

      (service as any)._currentEntry.set(entry);

      service.closeCurrentEvent();

      expect(gameState.removeEventFromQueue).toHaveBeenCalledWith('ce_a');
      expect(service.isDisplayingEvent()).toBe(false);
      expect(service.currentEvent()).toBeNull();
    });

    it('passes BREATHER_MS delay to setTimeout for normal events', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a', wasInterrupted: false });
      const { service } = setup({ gameYear: 2040, queue: [entry] }, [event]);
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      (service as any)._currentEntry.set(entry);
      service.closeCurrentEvent();

      const calls = setTimeoutSpy.mock.calls;
      expect(calls.some(([, delay]) => delay === 1500)).toBe(true);

      setTimeoutSpy.mockRestore();
    });

    it('passes INTERRUPTED_BREATHER_MS delay to setTimeout for interrupted events', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a', wasInterrupted: true });
      const { service } = setup({ gameYear: 2040, queue: [entry] }, [event]);
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      (service as any)._currentEntry.set(entry);
      service.closeCurrentEvent();

      const calls = setTimeoutSpy.mock.calls;
      expect(calls.some(([, delay]) => delay === 750)).toBe(true);

      setTimeoutSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // resumeQueueAfterLoad
  // -------------------------------------------------------------------------

  describe('resumeQueueAfterLoad', () => {
    it('does nothing when queue is empty', () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      const { service } = setup({ queue: [] }, []);

      service.resumeQueueAfterLoad();

      // No timer should be scheduled for _tryShowNext
      expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 1500)).toBe(false);
      expect(service.isDisplayingEvent()).toBe(false);

      setTimeoutSpy.mockRestore();
    });

    it('schedules _tryShowNext after BREATHER_MS when queue is non-empty', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      const { service, gameState } = setup({ queue: [entry] }, [event]);

      gameState._setQueue([entry]);
      service.resumeQueueAfterLoad();

      expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 1500)).toBe(true);

      setTimeoutSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // _isAlreadyFired guard — deduplication
  // -------------------------------------------------------------------------

  describe('deduplication guard', () => {
    it('does not re-queue a year_reached event on a second year tick with same year', () => {
      const event = makeCultureEvent({
        id: 'ce_year',
        trigger: { type: 'year_reached', year: 2040 },
      });
      const { service, gameState } = setup({ gameYear: 2040 }, [event]);

      gameState.addToEventQueue.mockImplementation((e: CultureEventEntry) => {
        gameState._setQueue([e]);
        // simulate history recording
        gameState._setHistory([{ eventId: e.eventId, year: 2040, planetContext: '' }]);
      });

      TestBed.flushEffects(); // triggers year effect → _checkYearTriggers(2040)

      const callCountAfterFirst = (gameState.addToEventQueue as ReturnType<typeof vi.fn>).mock.calls.length;

      // Simulate same year tick again (shouldn't happen in practice but tests guard)
      gameState._setYear(2040);
      TestBed.flushEffects();

      expect(gameState.addToEventQueue).toHaveBeenCalledTimes(callCountAfterFirst);
    });

    it('does not re-queue a dyson event once it is in history', () => {
      const event = makeCultureEvent({
        id: 'ce_dyson_10',
        trigger: { type: 'dyson_percent_reached', percent: 10 },
      });
      const { service, gameState } = setup({ dysonCoveragePercent: 0 }, [event]);

      gameState.addToEventQueue.mockImplementation((e: CultureEventEntry) => {
        gameState._setQueue([e]);
        gameState._setHistory([{ eventId: e.eventId, year: 2040, planetContext: '' }]);
      });

      // First threshold crossing
      gameState._setDysonCoverage(10);
      TestBed.flushEffects();

      const callCountAfterFirst = (gameState.addToEventQueue as ReturnType<typeof vi.fn>).mock.calls.length;

      // Coverage increases further — should not re-fire
      gameState._setDysonCoverage(15);
      TestBed.flushEffects();

      expect(gameState.addToEventQueue).toHaveBeenCalledTimes(callCountAfterFirst);
    });
  });

  // -------------------------------------------------------------------------
  // Trigger checkers — EventBus
  // -------------------------------------------------------------------------

  describe('_checkTechTriggers', () => {
    it('queues matching event when tech is unlocked', () => {
      const event = makeCultureEvent({
        id: 'ce_tech',
        trigger: { type: 'tech_completed', techId: 'earth_fusion_ignition_theory' },
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.techUnlocked$.next({ planetId: 'earth', nodeId: 'earth_fusion_ignition_theory' });

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_tech' }),
      );
    });

    it('does not queue events for a different tech id', () => {
      const event = makeCultureEvent({
        id: 'ce_tech',
        trigger: { type: 'tech_completed', techId: 'earth_fusion_ignition_theory' },
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.techUnlocked$.next({ planetId: 'earth', nodeId: 'some_other_tech' });

      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
    });
  });

  describe('_checkMilestoneTriggers', () => {
    it('queues matching event on milestoneReached$', () => {
      const event = makeCultureEvent({
        id: 'ce_type1',
        trigger: { type: 'milestone_reached', milestoneId: 'type_1' },
        priority: true,
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.milestoneReached$.next('type_1');

      expect(gameState.addPriorityEvent).toHaveBeenCalledWith('ce_type1', expect.any(Number));
    });
  });

  describe('_checkTerraformingTriggers', () => {
    it('queues matching event when terraforming choice is applied', () => {
      const event = makeCultureEvent({
        id: 'ce_shade_mirror',
        trigger: {
          type: 'terraforming_choice_applied',
          planet: 'venus',
          choiceId: 'venus_orbital_shade_mirror',
        },
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.terraformingChoiceApplied$.next({
        planetId: 'venus',
        choiceId: 'venus_orbital_shade_mirror',
      });

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_shade_mirror' }),
      );
    });

    it('does not queue when planet does not match', () => {
      const event = makeCultureEvent({
        id: 'ce_shade_mirror',
        trigger: {
          type: 'terraforming_choice_applied',
          planet: 'venus',
          choiceId: 'venus_orbital_shade_mirror',
        },
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.terraformingChoiceApplied$.next({
        planetId: 'mars',
        choiceId: 'venus_orbital_shade_mirror',
      });

      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
    });
  });

  describe('_checkBioCompleteTriggers', () => {
    it('queues event when bio phase completes on matching planet + phase', () => {
      const event = makeCultureEvent({
        id: 'ce_bio_mars_1',
        trigger: { type: 'bio_phase_complete', planet: 'mars', phase: 'pioneer' },
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.bioPhaseCompleted$.next({ planetId: 'mars', phaseId: 'pioneer' });

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_bio_mars_1' }),
      );
    });
  });

  describe('_checkBioCollapseTriggers', () => {
    it('queues event when bio phase collapses on matching planet', () => {
      const event = makeCultureEvent({
        id: 'ce_bio_collapse',
        trigger: { type: 'bio_phase_collapsed', planet: 'mars' },
      });
      const { service, gameState, eventBus } = setup({}, [event]);

      eventBus.bioPhaseCollapsed$.next({ planetId: 'mars', phaseId: 'pioneer' });

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_bio_collapse' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // _checkDysonTriggers
  // -------------------------------------------------------------------------

  describe('_checkDysonTriggers', () => {
    it('queues event when coverage first meets the threshold', () => {
      const event = makeCultureEvent({
        id: 'ce_dyson_10',
        trigger: { type: 'dyson_percent_reached', percent: 10 },
      });
      const { service, gameState } = setup({ dysonCoveragePercent: 0 }, [event]);

      gameState._setDysonCoverage(10);
      TestBed.flushEffects();

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_dyson_10' }),
      );
    });

    it('does not queue when coverage is below threshold', () => {
      const event = makeCultureEvent({
        id: 'ce_dyson_10',
        trigger: { type: 'dyson_percent_reached', percent: 10 },
      });
      const { service, gameState } = setup({ dysonCoveragePercent: 0 }, [event]);

      gameState._setDysonCoverage(9);
      TestBed.flushEffects();

      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // _checkEuropaTrigger
  // -------------------------------------------------------------------------

  describe('_checkEuropaTrigger', () => {
    const authorisedEuropa = (impactYear: number): EuropaState => ({
      missionAuthorised: true,
      impactYear,
      impacted: false,
      lifeConfirmed: false,
    });

    it('does nothing when mission not authorised', () => {
      const { service, gameState } = setup({ gameYear: 2085 }, [
        makeCultureEvent({ id: 'ce_europa_warning' }),
      ]);
      TestBed.flushEffects();
      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
    });

    it('queues warning exactly when 15 years remain', () => {
      const warningEvent = makeCultureEvent({ id: 'ce_europa_warning' });
      const { service, gameState } = setup(
        {
          gameYear: 2085,
          europaState: authorisedEuropa(2100),
        },
        [warningEvent],
      );

      TestBed.flushEffects(); // year 2085 → 15 years out → queue warning

      expect(gameState.addToEventQueue).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_europa_warning' }),
      );
    });

    it('does not queue warning at 16 years out', () => {
      const warningEvent = makeCultureEvent({ id: 'ce_europa_warning' });
      const { service, gameState } = setup(
        {
          gameYear: 2084,
          europaState: authorisedEuropa(2100),
        },
        [warningEvent],
      );

      TestBed.flushEffects(); // 16 years out

      expect(gameState.addToEventQueue).not.toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'ce_europa_warning' }),
      );
    });

    it('queues priority impact event at impact year', () => {
      const impactEvent = makeCultureEvent({ id: 'ce_europa_impact', priority: true });
      const { service, gameState } = setup(
        {
          gameYear: 2100,
          europaState: authorisedEuropa(2100),
        },
        [impactEvent],
      );

      TestBed.flushEffects();

      expect(gameState.addPriorityEvent).toHaveBeenCalledWith(
        'ce_europa_impact',
        expect.any(Number),
      );
    });

    it('does nothing when already impacted', () => {
      const impactEvent = makeCultureEvent({ id: 'ce_europa_impact', priority: true });
      const { service, gameState } = setup(
        {
          gameYear: 2100,
          europaState: {
            missionAuthorised: true,
            impactYear: 2100,
            impacted: true,
            lifeConfirmed: false,
          },
        },
        [impactEvent],
      );

      TestBed.flushEffects();

      expect(gameState.addToEventQueue).not.toHaveBeenCalled();
      expect(gameState.addPriorityEvent).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // _displayEvent — missing definition guard
  // -------------------------------------------------------------------------

  describe('_displayEvent — missing event definition', () => {
    it('does not set _currentEntry when event definition is missing from DataService', () => {
      // empty events list — no definitions
      const { service, gameState } = setup({ gameYear: 2040, queue: [] }, []);

      // Directly inject an entry with an unknown id into the queue
      gameState._setQueue([makeCultureEventEntry({ eventId: 'ce_ghost' })]);
      // Try to show it
      (service as any)._tryShowNext();

      expect(service.isDisplayingEvent()).toBe(false);
      expect(service.currentEvent()).toBeNull();
      expect(gameState.recordEventHistory).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // currentEvent computed — resolves full definition
  // -------------------------------------------------------------------------

  describe('currentEvent computed', () => {
    it('returns null when nothing is displaying', () => {
      const { service } = setup({}, []);
      expect(service.currentEvent()).toBeNull();
    });

    it('returns the full CultureEvent when an entry is displaying', () => {
      const event = makeCultureEvent({ id: 'ce_a', title: 'Hello World' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup({ queue: [entry] }, [event]);

      gameState._setQueue([entry]);
      (service as any)._displayEvent(entry);

      expect(service.currentEvent()).toEqual(event);
    });
  });

  // -------------------------------------------------------------------------
  // applyChoice
  // -------------------------------------------------------------------------

  describe('applyChoice', () => {
    function makeChoice(tag: 'naturalist' | 'architect' | ''): import('@app/core/models').CultureEventChoice {
      return { id: 'c1', label: 'Test', tag, effects: [] };
    }

    it('calls incrementNaturalist and closes when tag is naturalist', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup({ gameYear: 2040, queue: [entry] }, [event]);
      const incrementNaturalistSpy = vi.spyOn(gameState, 'incrementNaturalist' as never);

      (service as any)._currentEntry.set(entry);
      service.applyChoice(makeChoice('naturalist'));

      expect(incrementNaturalistSpy).toHaveBeenCalledOnce();
      expect(gameState.removeEventFromQueue).toHaveBeenCalledWith('ce_a');
      expect(service.isDisplayingEvent()).toBe(false);
    });

    it('calls incrementArchitect and closes when tag is architect', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup({ gameYear: 2040, queue: [entry] }, [event]);
      const incrementArchitectSpy = vi.spyOn(gameState, 'incrementArchitect' as never);

      (service as any)._currentEntry.set(entry);
      service.applyChoice(makeChoice('architect'));

      expect(incrementArchitectSpy).toHaveBeenCalledOnce();
      expect(gameState.removeEventFromQueue).toHaveBeenCalledWith('ce_a');
      expect(service.isDisplayingEvent()).toBe(false);
    });

    it('calls neither increment when tag is empty string and still closes', () => {
      const event = makeCultureEvent({ id: 'ce_a' });
      const entry = makeCultureEventEntry({ eventId: 'ce_a' });
      const { service, gameState } = setup({ gameYear: 2040, queue: [entry] }, [event]);
      const incrementNaturalistSpy = vi.spyOn(gameState, 'incrementNaturalist' as never);
      const incrementArchitectSpy = vi.spyOn(gameState, 'incrementArchitect' as never);

      (service as any)._currentEntry.set(entry);
      service.applyChoice(makeChoice(''));

      expect(incrementNaturalistSpy).not.toHaveBeenCalled();
      expect(incrementArchitectSpy).not.toHaveBeenCalled();
      expect(gameState.removeEventFromQueue).toHaveBeenCalledWith('ce_a');
    });
  });
});
