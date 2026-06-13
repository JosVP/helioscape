import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { BioPhaseState, PlanetBioState } from '@app/core/models';
import type { BioPhaseDef } from '@app/core/services/data.service';
import { DataService } from '@app/core/services/data.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { BioPhaseService } from '@app/core/systems/bio-phase.service';

// ---------------------------------------------------------------------------
// View-model — exported so the template can type the @for binding
// ---------------------------------------------------------------------------

export interface BioPhaseCardVM {
  readonly index: number;
  readonly def: BioPhaseDef;
  readonly state: BioPhaseState;
  readonly progressPercent: number;
  /** Human-readable unmet requirement strings, prefixed with 🔴 in the template. */
  readonly unmetRequirements: string[];
  /** Human-readable met requirement strings, prefixed with 🟢 in the template. */
  readonly metRequirements: string[];
  /** Actions from def that have NOT yet been taken (shown as buttons). */
  readonly remainingActions: string[];
}

// ---------------------------------------------------------------------------
// Helpers — module-private
// ---------------------------------------------------------------------------

const COMPONENT_LABELS: Readonly<Record<string, string>> = {
  odn: 'ODN not built — queue in Mercury panel',
  bioreactor: 'Bioreactor not active',
  precipitationEngine: 'Precipitation engine not built',
  atmosphericCatalystShip: 'Atmospheric catalyst ship not built',
};

function buildVM(
  def: BioPhaseDef,
  index: number,
  planetBio: PlanetBioState,
  _year: number,   // read to keep computed tracking gameYear → progress bar updates
): BioPhaseCardVM {
  const state = planetBio.phases[index];
  if (!state) {
    // Should never happen unless state/def are out of sync.
    return {
      index,
      def,
      state: {
        status: 'locked',
        actionsTaken: [],
        progressYears: 0,
        durationYears: def.nominalDurationYears,
        startedYear: 0,
        completedYear: 0,
      },
      progressPercent: 0,
      unmetRequirements: [],
      metRequirements: [],
      remainingActions: [],
    };
  }

  const progressPercent = Math.min(100, (state.progressYears / state.durationYears) * 100);

  // --- Build requirement lists ---
  const unmetRequirements: string[] = [];
  const metRequirements: string[] = [];

  // 1. Previous-phase requirement
  if (index > 0) {
    const prevState = planetBio.phases[index - 1];
    if (prevState) {
      const canStartAtPercent = def.canStartAtPreviousPercent;
      if (canStartAtPercent !== undefined) {
        const prevPercent = Math.min(100, (prevState.progressYears / prevState.durationYears) * 100);
        const label = `Previous phase ${Math.round(canStartAtPercent * 100)}% complete`;
        if (prevState.status === 'complete' || prevPercent >= canStartAtPercent * 100) {
          metRequirements.push(label);
        } else {
          unmetRequirements.push(label);
        }
      } else {
        const label = 'Previous phase complete';
        if (prevState.status === 'complete') {
          metRequirements.push(label);
        } else {
          unmetRequirements.push(label);
        }
      }
    }
  }

  // 2. Component requirements
  for (const componentId of def.requiresComponents) {
    const label = COMPONENT_LABELS[componentId] ?? `${componentId} not built`;
    if (_isComponentMet(componentId, planetBio)) {
      metRequirements.push(label.replace(' not built', ' built').replace(' not active', ' active').replace(' — queue in Mercury panel', ' built'));
    } else {
      unmetRequirements.push(label);
    }
  }

  // 3. Request requirement
  if (def.requiresRequest) {
    const label = `Request sent: ${def.requiresRequest}`;
    if (planetBio.requestsSent.includes(def.requiresRequest)) {
      metRequirements.push(label);
    } else {
      unmetRequirements.push(label);
    }
  }

  const remainingActions = def.actions.filter((a) => !state.actionsTaken.includes(a));

  return { index, def, state, progressPercent, unmetRequirements, metRequirements, remainingActions };
}

function _isComponentMet(componentId: string, state: PlanetBioState): boolean {
  switch (componentId) {
    case 'odn': return state.odnBuilt;
    case 'bioreactor': return state.bioreactorBatchesActive > 0;
    case 'precipitationEngine': return state.precipitationEnginesBuilt > 0;
    case 'atmosphericCatalystShip': return state.atmosphericCatalystShipsBuilt > 0;
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-bio-phase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './bio-phase.component.html',
  styleUrl: './bio-phase.component.scss',
})
export class BioPhaseComponent {
  readonly planetId = input.required<string>();

  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly bioPhaseService = inject(BioPhaseService);

  readonly phaseVMs = computed<BioPhaseCardVM[]>(() => {
    const id = this.planetId();
    const planetBio = this.gameState.bioPhases()[id];
    const year = this.gameState.gameYear();
    if (!planetBio) return [];
    const defs = this.data.getBioPhases(id);
    return defs.map((def, i) => buildVM(def, i, planetBio, year));
  });

  applyAction(phaseIndex: number, actionId: string): void {
    this.bioPhaseService.applyAction(this.planetId(), phaseIndex, actionId);
  }

  sendRequest(requestId: string): void {
    this.bioPhaseService.sendRequest(this.planetId(), requestId);
  }

  /** Formats an action id as a readable label (snake_case → Title Case). */
  formatActionLabel(actionId: string): string {
    return actionId
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
