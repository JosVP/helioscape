import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ResearchTrack, ActiveResearchTrack } from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { ResearchService } from '@app/core/systems/research.service';
import { ResearchTrackItemComponent } from './research-track-item.component';

// ---------------------------------------------------------------------------
// View-model — exported so ResearchTrackItemComponent can type its input
// ---------------------------------------------------------------------------

export interface ResearchTrackVM {
  readonly def: ResearchTrack;
  readonly active: ActiveResearchTrack | null;
  readonly status: 'running' | 'paused' | 'available' | 'completed';
  readonly progressPercent: number;
  readonly yearsRemaining: number | null;
  readonly completionYear: number | null;
  readonly canResume: boolean;
}

// ---------------------------------------------------------------------------
// Pure helper — module-private
// ---------------------------------------------------------------------------

function buildVM(
  def: ResearchTrack,
  active: readonly ActiveResearchTrack[],
  completed: readonly string[],
  currentYear: number,
  freeCapacity: number,
): ResearchTrackVM {
  const entry = active.find((t) => t.trackId === def.id) ?? null;

  let status: ResearchTrackVM['status'];
  if (completed.includes(def.id)) {
    status = 'completed';
  } else if (entry && !entry.isPaused) {
    status = 'running';
  } else if (entry?.isPaused) {
    status = 'paused';
  } else {
    // Show as available only when the prerequisite is met.
    // Tracks whose prerequisite is not yet unlocked fall into the completed
    // bucket (greyed out) until they become available.
    // NOTE: A dedicated 'unavailable' status could be added later.
    status = completed.includes(def.prerequisiteTech) ? 'available' : 'completed';
  }

  const progressYears = entry
    ? entry.elapsedBeforeStart + (entry.isPaused ? 0 : currentYear - entry.startYear)
    : 0;
  const progressPercent = Math.min(100, (progressYears / def.durationYears) * 100);
  const yearsRemaining =
    status === 'running' || status === 'paused'
      ? Math.max(0, Math.ceil(def.durationYears - progressYears))
      : null;

  // Completion year: only meaningful when the track is actively counting down.
  const completionYear =
    status === 'running' && yearsRemaining !== null
      ? currentYear + yearsRemaining
      : null;

  // A paused track's rpCost is NOT counted in usedRpCapacity (GameStateService
  // excludes paused tracks from the sum), so freeCapacity is the true budget.
  const canResume = status === 'paused' && def.rpCost <= freeCapacity;

  return { def, active: entry, status, progressPercent, yearsRemaining, completionYear, canResume };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-research',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResearchTrackItemComponent],
  templateUrl: './research.component.html',
  styleUrl: './research.component.scss',
})
export class ResearchComponent {
  private readonly gameState       = inject(GameStateService);
  private readonly data            = inject(DataService);
  private readonly researchService = inject(ResearchService);
  private readonly eventBus        = inject(EventBusService);
  private readonly destroyRef      = inject(DestroyRef);

  readonly planetId      = input.required<string>();

  constructor() {
    // Subscribe so future side-effects (audio, toast) have a natural hook point.
    // Signals re-evaluate automatically; this just keeps the door open.
    this.eventBus.researchCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Side-effects go here in a later block.
      });
  }

  // ---------------------------------------------------------------------------
  // Track view-models — recompute every tick via activeResearch + gameYear
  // ---------------------------------------------------------------------------

  private readonly allTracks = computed<ResearchTrackVM[]>(() => {
    const defs         = this.data.getResearchTracksForPlanet(this.planetId());
    const active       = this.gameState.activeResearch();
    const completed    = this.gameState.completedTechs();
    const year         = this.gameState.gameYear();
    const freeCapacity = this.gameState.totalRpCapacity() - this.gameState.usedRpCapacity();
    return defs.map((def) => buildVM(def, active, completed, year, freeCapacity));
  });

  readonly runningTracks   = computed(() => this.allTracks().filter((t) => t.status === 'running'));
  readonly pausedTracks    = computed(() => this.allTracks().filter((t) => t.status === 'paused'));
  readonly availableTracks = computed(() => this.allTracks().filter((t) => t.status === 'available'));

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  start(trackId: string): void  { this.researchService.startTrack(trackId, this.planetId()); }
  pause(trackId: string): void  { this.researchService.pauseTrack(trackId); }
  resume(trackId: string): void { this.researchService.resumeTrack(trackId); }
}
