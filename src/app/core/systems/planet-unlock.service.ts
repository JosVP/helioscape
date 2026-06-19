import { Injectable, effect, inject, untracked } from '@angular/core';
import type {
  PlanetData,
  PlanetMercuryZoneUnlockDefinition,
  PlanetPhaseUnlockDefinition,
  PlanetState,
  PlanetUnlockDefinition,
  PlanetUnlockState,
  PlanetYearUnlockDefinition,
} from '@app/core/models';
import { DataService } from '@app/core/services/data.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameStateService } from '@app/core/services/game-state.service';

@Injectable({ providedIn: 'root' })
export class PlanetUnlockService {
  private readonly gameState = inject(GameStateService);
  private readonly data = inject(DataService);
  private readonly eventBus = inject(EventBusService);

  constructor() {
    effect(() => {
      const year = this.gameState.gameYear();
      const completedTechs = this.gameState.completedTechs();
      const planets = this.gameState.planets();
      const unlocks = this.gameState.planetUnlocks();
      // Read mercurySelectedZone in the reactive block so a zone selection triggers the effect.
      const selectedZone = this.gameState.mercurySelectedZone();
      untracked(() => this.processUnlocks(year, completedTechs, planets, unlocks, selectedZone));
    });
  }

  processUnlocks(
    year: number,
    completedTechs: readonly string[],
    planets: Readonly<Record<string, PlanetState>>,
    unlocks: Readonly<Record<string, PlanetUnlockState>>,
    selectedZone: string | null = null
  ): void {
    for (const planet of this.data.getAllPlanets()) {
      const state = unlocks[planet.id];
      if (!state || state.status === 'unlocked') continue;

      switch (planet.unlock.type) {
        case 'mission':
          this.processMissionUnlock(planet, state, completedTechs, year);
          break;
        case 'phase':
          this.processPhaseUnlock(planet, state, planet.unlock, planets, unlocks, year);
          break;
        case 'year':
          this.processYearUnlock(planet, state, planet.unlock, year);
          break;
        case 'mercury_zone_selected':
          this.processZoneUnlock(planet, state, planet.unlock, selectedZone, year);
          break;
        case 'start_unlocked':
          break;
      }
    }
  }

  private processMissionUnlock(
    planet: PlanetData,
    state: PlanetUnlockState,
    completedTechs: readonly string[],
    year: number
  ): void {
    const unlock = planet.unlock;
    if (unlock.type !== 'mission') return;

    if (
      (state.status === 'locked' || state.status === 'mission_available') &&
      completedTechs.includes(unlock.missionId)
    ) {
      const arrivalYear = year + unlock.transitYears;
      this.gameState.commitPlanetMission(planet.id, unlock.missionId, year, arrivalYear);
      this.eventBus.planetTransitStarted$.next({
        planetId: planet.id,
        missionId: unlock.missionId,
        departureYear: year,
        arrivalYear,
      });
      return;
    }

    if (state.status === 'in_transit' && state.arrivalYear !== undefined && year >= state.arrivalYear) {
      this.unlockPlanetFromDefinition(planet.id, unlock, year, unlock.arrivalEventId);
    }
  }

  private processPhaseUnlock(
    planet: PlanetData,
    state: PlanetUnlockState,
    unlock: PlanetPhaseUnlockDefinition,
    planets: Readonly<Record<string, PlanetState>>,
    unlocks: Readonly<Record<string, PlanetUnlockState>>,
    year: number
  ): void {
    if (state.status !== 'locked') return;

    const sourceUnlock = unlocks[unlock.planetId];
    const sourcePlanet = planets[unlock.planetId];
    if (!sourceUnlock || !sourcePlanet || sourceUnlock.status !== 'unlocked') return;
    if (sourcePlanet.terraformingPhase < unlock.phase) return;

    const minOperationalYears = unlock.minOperationalYears ?? 0;
    const sourceUnlockedYear = sourceUnlock.unlockedYear ?? year;
    if (year - sourceUnlockedYear < minOperationalYears) return;

    this.unlockPlanetFromDefinition(planet.id, unlock, year, unlock.eventId);
  }

  private processYearUnlock(
    planet: PlanetData,
    state: PlanetUnlockState,
    unlock: PlanetYearUnlockDefinition,
    year: number
  ): void {
    if (state.status !== 'locked' || year < unlock.year) return;
    this.unlockPlanetFromDefinition(planet.id, unlock, year, unlock.eventId);
  }

  private unlockPlanetFromDefinition(
    planetId: string,
    unlock: PlanetUnlockDefinition,
    year: number,
    eventId: string | undefined
  ): void {
    this.gameState.unlockPlanet(planetId, year);
    this.eventBus.planetUnlocked$.next({ planetId, unlockedYear: year });

    if (eventId) {
      this.queueUnlockEvent(planetId, eventId, year);
    }

    if ('setFlag' in unlock && unlock.setFlag) {
      this.setUnlockFlag(planetId, unlock.setFlag);
    }
  }

  private queueUnlockEvent(planetId: string, eventId: string, year: number): void {
    const state = this.gameState.getPlanetUnlockState(planetId);
    if (!state || state.firedFlags.includes(eventId) || !this.data.getCultureEvent(eventId)) return;

    this.gameState.addToEventQueue({
      eventId,
      queuedAtYear: year,
      priority: false,
      wasInterrupted: false,
    });
    this.gameState.markPlanetUnlockFlagFired(planetId, eventId);
  }

  private setUnlockFlag(planetId: string, flag: string): void {
    const state = this.gameState.getPlanetUnlockState(planetId);
    if (!state || state.firedFlags.includes(flag)) return;

    this.gameState.setEarthFlag(flag, true);
    this.gameState.markPlanetUnlockFlagFired(planetId, flag);
  }

  private processZoneUnlock(
    planet: PlanetData,
    state: PlanetUnlockState,
    unlock: PlanetMercuryZoneUnlockDefinition,
    selectedZone: string | null,
    year: number
  ): void {
    if (state.status !== 'locked' || selectedZone === null) return;
    this.unlockPlanetFromDefinition(planet.id, unlock, year, unlock.eventId);
  }
}