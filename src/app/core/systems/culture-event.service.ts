import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  CultureEvent,
  CultureEventChoice,
  CultureEventEntry,
  CultureEventHistoryEntry,
} from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pause between events when the previous one was closed normally. */
const BREATHER_MS = 1500;

/** Shorter pause when the previous event was interrupted by a priority event. */
const INTERRUPTED_BREATHER_MS = 750;

/**
 * Europa warning is queued when fewer than this many years remain before impact.
 * The window check is `<= EUROPA_WARNING_YEARS_OUT && > EUROPA_WARNING_YEARS_OUT - 1`
 * so it fires in exactly the one year it first becomes true.
 */
const EUROPA_WARNING_YEARS_OUT = 15;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * CultureEventService — narrative event queue driver.
 *
 * Holds a single piece of local ephemeral display state: `_currentEntry`
 * (which queue entry is currently showing). The queue itself
 * (`cultureEventQueue`, `cultureEventHistory`) lives in GameStateService
 * and is serialised by SaveService.
 *
 * Responsibilities:
 *  - Watch year + dyson coverage signals and queue matching events.
 *  - Subscribe to EventBus to pick up tech / milestone / terraforming / bio triggers.
 *  - Manage the display lifecycle: show → breather → show next.
 *  - Expose `currentEvent` (full CultureEvent data) and `isDisplayingEvent` to UI.
 *
 * Public API consumed by UI:
 *   readonly currentEvent: Signal<CultureEvent | null>
 *   readonly isDisplayingEvent: Signal<boolean>
 *   queueEvent(eventId, priority?)
 *   closeCurrentEvent()
 *   resumeQueueAfterLoad()   — call after SaveService.hydrate()
 */
@Injectable({ providedIn: 'root' })
export class CultureEventService {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);

  // -------------------------------------------------------------------------
  // Local ephemeral display state  (NOT persisted — queue is in GameStateService)
  // -------------------------------------------------------------------------

  private readonly _currentEntry = signal<CultureEventEntry | null>(null);

  /**
   * The full static CultureEvent definition for whatever is currently on screen.
   * Components use this to render title, text, portrait and choices.
   */
  readonly currentEvent: Signal<CultureEvent | null> = computed(() => {
    const entry = this._currentEntry();
    if (!entry) return null;
    return this.data.getCultureEvent(entry.eventId) ?? null;
  });

  readonly isDisplayingEvent: Signal<boolean> = computed(
    () => this._currentEntry() !== null,
  );

  /**
   * Queue entries that are NOT auto-show (text-only, non-priority).
   * These stay queued silently; the bell badge reflects their count.
   * Auto-show events (priority or has choices) are excluded — they are
   * displayed immediately as cards.
   */
  readonly notificationQueue: Signal<CultureEventEntry[]> = computed(() =>
    this.gameState.cultureEventQueue().filter((e) => !this._isAutoShow(e)),
  );

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor() {
    // Year-based triggers: year_reached + Europa special case
    effect(() => {
      const year = this.gameState.gameYear();
      untracked(() => {
        this._checkYearTriggers(year);
        this._checkEuropaTrigger(year);
      });
    });

    // Dyson coverage triggers — separate effect because coverage changes
    // independently from the year tick (DysonService may update it mid-tick).
    effect(() => {
      const coverage = this.gameState.dysonCoveragePercent();
      untracked(() => this._checkDysonTriggers(coverage));
    });

    // EventBus subscriptions
    this.eventBus.techUnlocked$
      .pipe(takeUntilDestroyed())
      .subscribe(({ nodeId }) => this._checkTechTriggers(nodeId));

    this.eventBus.milestoneReached$
      .pipe(takeUntilDestroyed())
      .subscribe((milestoneId) => this._checkMilestoneTriggers(milestoneId));

    this.eventBus.terraformingChoiceApplied$
      .pipe(takeUntilDestroyed())
      .subscribe(({ planetId, choiceId }) =>
        this._checkTerraformingTriggers(planetId, choiceId),
      );

    this.eventBus.bioPhaseCompleted$
      .pipe(takeUntilDestroyed())
      .subscribe(({ planetId, phaseId }) =>
        this._checkBioCompleteTriggers(planetId, phaseId),
      );

    this.eventBus.bioPhaseCollapsed$
      .pipe(takeUntilDestroyed())
      .subscribe(({ planetId }) => this._checkBioCollapseTriggers(planetId));

    this.eventBus.terraformingPhaseChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(({ planetId, phase }) =>
        this._checkTerraformingPhaseTriggers(planetId, phase),
      );
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Queues a culture event by id.
   *
   * Priority events displace whatever is currently showing: the current entry
   * is pushed back onto the queue with `wasInterrupted: true` and the priority
   * event is displayed immediately.
   *
   * Non-priority events are pushed to the back of the queue. If nothing is
   * currently displaying, the next item is shown after the normal breather.
   */
  queueEvent(eventId: string, priority: boolean = false): void {
    // Validate event exists before touching the queue.
    const eventDef = this.data.getCultureEvent(eventId);
    if (!eventDef) {
      console.warn(`[CultureEventService] queueEvent: unknown event id "${eventId}"`);
      return;
    }

    const currentYear = untracked(() => this.gameState.gameYear());

    if (priority) {
      this.gameState.addPriorityEvent(eventId, currentYear);
      // addPriorityEvent wrote the priority entry to queue[0] (synchronously).
      // Display it immediately — the current entry (if any) has been flagged
      // wasInterrupted: true and moved to queue[1] by GameStateService.
      const entry = untracked(() => this.gameState.cultureEventQueue()[0]);
      if (entry) {
        this._displayEvent(entry);
      }
    } else {
      this.gameState.addToEventQueue({
        eventId,
        queuedAtYear: currentYear,
        priority: false,
        wasInterrupted: false,
      });

      // Auto-advance only for events that should auto-show (has choices or
      // is priority). Pure text-only notifications sit in the queue silently
      // and are surfaced via the bell badge + notificationQueue signal.
      const isAutoShow = eventDef.priority || eventDef.choices.length > 0;
      if (isAutoShow && !this._currentEntry()) {
        this._tryShowNext();
      }
    }
  }

  /**
   * Dismisses the current event card.
   * Shifts the queue, then waits a breather before showing the next event.
   * The breather is shorter if this entry was interrupted by a priority event.
   */
  closeCurrentEvent(): void {
    const entry = this._currentEntry();
    if (!entry) return;

    // Capture before nulling so the breather delay is correct.
    const wasInterrupted = entry.wasInterrupted;

    // Use removeEventFromQueue so we find the entry by id regardless of its
    // position — priority re-ordering can shift entries around.
    this.gameState.removeEventFromQueue(entry.eventId);
    this._currentEntry.set(null);

    // NOTE: setTimeout in a service is acceptable here — this is a short UI
    // pacing delay, not a game-loop timer. GameLoopService owns game ticks.
    const delay = wasInterrupted ? INTERRUPTED_BREATHER_MS : BREATHER_MS;
    setTimeout(() => this._tryShowNext(), delay);
  }

  /**
   * Applies the tag effect of a choice and closes the current event.
   *
   * NOTE: choice.effects[] (tech unlocks, resource bonuses, etc.) are not yet applied —
   * pending JSON population and TechTreeService integration. See TODO.md.
   */
  applyChoice(choice: CultureEventChoice): void {
    if (choice.tag === 'naturalist') {
      this.gameState.incrementNaturalist();
    } else if (choice.tag === 'architect') {
      this.gameState.incrementArchitect();
    }
    this.closeCurrentEvent();
  }

  /**
   * Call after SaveService.hydrate() to resume a persisted event queue.
   * `_currentEntry` resets to null on every app boot; this restores the display
   * state from the restored queue.
   */
  resumeQueueAfterLoad(): void {
    const queue = untracked(() => this.gameState.cultureEventQueue());
    if (queue.length > 0) {
      setTimeout(() => this._tryShowNext(), BREATHER_MS);
    }
  }

  /**
   * Triggers the next auto-show event from the queue.
   * No-op when the queue is empty or an event is already displaying.
   */
  showNextEvent(): void {
    this._tryShowNext();
  }

  /**
   * Opens a specific notification event by id (called from the bell dropdown).
   * No-op if the event is not in the queue or a card is already showing.
   */
  showEvent(eventId: string): void {
    if (this._currentEntry()) return;
    const entry = this.gameState.cultureEventQueue().find((e) => e.eventId === eventId);
    if (!entry) return;
    this._displayEvent(entry);
  }

  // -------------------------------------------------------------------------
  // Private display helpers
  // -------------------------------------------------------------------------

  private _tryShowNext(): void {
    if (this._currentEntry()) return;
    // Skip notification-only entries — they are surfaced via the bell,
    // not auto-displayed as cards.
    const next = this.gameState.cultureEventQueue().find((e) => this._isAutoShow(e));
    if (next) {
      this._displayEvent(next);
    }
  }

  /**
   * Returns true when an event should auto-display as a card.
   * Events with choices always interrupt the player (they require a decision).
   * Priority events do too. Pure text-only events are notifications.
   */
  private _isAutoShow(entry: CultureEventEntry): boolean {
    const def = this.data.getCultureEvent(entry.eventId);
    return !!def && (entry.priority || def.choices.length > 0);
  }

  private _displayEvent(entry: CultureEventEntry): void {
    // Guard: skip if the event definition was removed from JSON.
    const eventDef = this.data.getCultureEvent(entry.eventId);
    if (!eventDef) {
      console.warn(
        `[CultureEventService] _displayEvent: event definition not found for "${entry.eventId}" — skipping`,
      );
      return;
    }

    this._currentEntry.set(entry);

    const currentYear = untracked(() => this.gameState.gameYear());

    const historyEntry: CultureEventHistoryEntry = {
      eventId: entry.eventId,
      year: currentYear,
      planetContext: this._resolvePlanetContext(eventDef),
    };
    this.gameState.recordEventHistory(historyEntry);

    this.eventBus.cultureEventTriggered$.next(entry.eventId);
  }

  /**
   * Derives a planet-context string from the event's trigger.
   * Returns the planet id for planet-specific triggers, empty string otherwise.
   */
  private _resolvePlanetContext(eventDef: CultureEvent): string {
    const t = eventDef.trigger;
    switch (t.type) {
      case 'terraforming_choice_applied':
      case 'terraforming_phase_complete':
      case 'bio_phase_complete':
      case 'bio_phase_collapsed':
        return t.planet;
      default:
        return '';
    }
  }

  /**
   * Returns true if the event has already been shown (history) or is already
   * pending in the queue. Prevents double-queueing across all trigger paths.
   */
  private _isAlreadyFired(eventId: string): boolean {
    const history = this.gameState.cultureEventHistory();
    const queue = this.gameState.cultureEventQueue();
    return (
      history.some((h) => h.eventId === eventId) ||
      queue.some((e) => e.eventId === eventId)
    );
  }

  // -------------------------------------------------------------------------
  // Trigger checkers
  // -------------------------------------------------------------------------

  private _checkTechTriggers(nodeId: string): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'tech_completed' &&
          e.trigger.techId === nodeId &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  private _checkMilestoneTriggers(milestoneId: string): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'milestone_reached' &&
          e.trigger.milestoneId === milestoneId &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  private _checkYearTriggers(year: number): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'year_reached' &&
          e.trigger.year === year &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  /**
   * Fires when dyson coverage first meets or exceeds a threshold.
   * `_isAlreadyFired` makes this idempotent across subsequent ticks.
   */
  private _checkDysonTriggers(coverage: number): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'dyson_percent_reached' &&
          coverage >= e.trigger.percent &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  /**
   * Note: CultureEventTrigger uses `planet` (not `planetId`).
   * TerraformChoiceEvent uses `planetId` — map at the call site.
   */
  private _checkTerraformingTriggers(planetId: string, choiceId: string): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'terraforming_choice_applied' &&
          e.trigger.planet === planetId &&
          e.trigger.choiceId === choiceId &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  /**
   * Note: CultureEventTrigger uses `phase` (string id).
   * BioPhaseEvent uses `phaseId` — map at the call site.
   */
  private _checkBioCompleteTriggers(planetId: string, phaseId: string): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'bio_phase_complete' &&
          e.trigger.planet === planetId &&
          e.trigger.phase === phaseId &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  private _checkBioCollapseTriggers(planetId: string): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'bio_phase_collapsed' &&
          e.trigger.planet === planetId &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  private _checkTerraformingPhaseTriggers(planetId: string, phase: number): void {
    this.data
      .getAllCultureEvents()
      .filter(
        (e) =>
          e.trigger != null &&
          e.trigger.type === 'terraforming_phase_complete' &&
          e.trigger.planet === planetId &&
          e.trigger.phase === phase &&
          !this._isAlreadyFired(e.id),
      )
      .forEach((e) => this.queueEvent(e.id, e.priority));
  }

  /**
   * Special-case Europa impact timeline trigger.
   *
   * Warning: fires in the single year when `impactYear - year` crosses from 16 to 15.
   * Impact: fires the year `year >= impactYear` for the first time.
   *
   * NOTE: TerraformingService owns the actual Europa impact effects (atmosphere
   * delta, impacted flag). CultureEventService only queues the narrative events.
   */
  private _checkEuropaTrigger(year: number): void {
    const europa = this.gameState.europaState();
    if (!europa.missionAuthorised || europa.impacted) return;

    const { impactYear } = europa;
    const yearsToImpact = impactYear - year;

    if (
      yearsToImpact <= EUROPA_WARNING_YEARS_OUT &&
      yearsToImpact > EUROPA_WARNING_YEARS_OUT - 1 &&
      !this._isAlreadyFired('ce_europa_warning')
    ) {
      this.queueEvent('ce_europa_warning', false);
    }

    if (year >= impactYear && !this._isAlreadyFired('ce_europa_impact')) {
      // NOTE: The atmospheric impact is handled by TerraformingService.
      // We only queue the narrative event here.
      this.queueEvent('ce_europa_impact', true);
    }
  }
}
