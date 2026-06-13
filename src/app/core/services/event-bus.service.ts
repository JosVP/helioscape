import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type {
  TechUnlockedEvent,
  TerraformChoiceEvent,
  TerraformPhaseEvent,
  BioPhaseEvent,
  ForkPresentedEvent,
} from '@app/core/models';

/**
 * EventBusService — thin, stateless typed message bus.
 *
 * Use for one-shot cross-feature notifications where a signal is insufficient:
 * events that must be reacted to exactly once (play a sound, show a toast, etc.)
 * and carry no persistent state.
 *
 * Rules:
 *  - Emit via `.next()` at the call site; never reassign a subject.
 *  - Never subscribe here — this service only exposes subjects.
 *  - Consumers MUST use `takeUntilDestroyed()` to avoid memory leaks.
 *  - For persistent derived state, use GameStateService signals instead.
 */
@Injectable({ providedIn: 'root' })
export class EventBusService {
  /** A tech node has been unlocked on a planet. */
  readonly techUnlocked$ = new Subject<TechUnlockedEvent>();

  /** A research track has been completed. Payload: trackId. */
  readonly researchCompleted$ = new Subject<string>();

  /** A terraforming choice has been applied on a planet. */
  readonly terraformingChoiceApplied$ = new Subject<TerraformChoiceEvent>();

  /** A terraforming phase has advanced on a planet. */
  readonly terraformingPhaseChanged$ = new Subject<TerraformPhaseEvent>();

  /** A culture event has been triggered. Payload: eventId. */
  readonly cultureEventTriggered$ = new Subject<string>();

  /** A Kardashev milestone has been reached. Payload: milestoneId. */
  readonly milestoneReached$ = new Subject<string>();

  /** The Dyson sphere energy output has been updated. Payload: watts. */
  readonly dysonEnergyUpdated$ = new Subject<number>();

  /** A bio phase has become available (requirements met) on a planet. */
  readonly bioPhaseAvailable$ = new Subject<BioPhaseEvent>();

  /** A bio phase has started on a planet. */
  readonly bioPhaseStarted$ = new Subject<BioPhaseEvent>();

  /** A bio phase has completed on a planet. */
  readonly bioPhaseCompleted$ = new Subject<BioPhaseEvent>();

  /** A bio phase has collapsed on a planet. */
  readonly bioPhaseCollapsed$ = new Subject<BioPhaseEvent>();

  /** A Mercury orbital component build has completed. Payload: componentId. */
  readonly mercuryBuildCompleted$ = new Subject<string>();

  /** The active planet selection has changed. Payload: planetId. */
  readonly planetSelected$ = new Subject<string>();

  /**
   * A planet is being hovered (in the orrery canvas or the planets panel).
   * Payload: planetId, or null when the cursor leaves all planets.
   * Both OrreryComponent and PlanetsMenuComponent emit and subscribe to this.
   */
  readonly planetHovered$ = new Subject<string | null>();

  /** Player clicked the Moon row — open Earth panel at Moon/research tab. */
  readonly moonTabRequested$ = new Subject<void>();

  /** A tech fork choice is being presented to the player. */
  readonly forkPresented$ = new Subject<ForkPresentedEvent>();

  /** An autosave has completed. */
  readonly autosaveCompleted$ = new Subject<void>();

  /** The player has requested to open the Research Hub overlay. */
  readonly researchHubRequested$ = new Subject<void>();
}
