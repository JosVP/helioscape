import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlanetPanelComponent } from './planet-panel.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { DataService } from '@app/core/services/data.service';
import type { PlanetState, PlanetData } from '@app/core/models';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makePlanetState(overrides: Partial<PlanetState> = {}): PlanetState {
  return {
    id: 'earth',
    atmospherePressure: 1.0,
    temperatureCelsius: 15,
    terraformingPhase: 0,
    terraformingProgress: 0,
    terraformingChoices: {},
    lockedOutChoices: [],
    population: 1_000_000,
    hasBiodome: false,
    visualParams: {} as PlanetState['visualParams'],
    terraformStartYear: 2033,
    terraformEndYear: 2133,
    ...overrides,
  } as PlanetState;
}

function makePlanetData(id: string, phases: { displayName: string; description: string }[]): PlanetData {
  return {
    id: id as PlanetData['id'],
    displayName: id.charAt(0).toUpperCase() + id.slice(1),
    unlockCondition: id === 'earth' ? null : 'some_tech',
    initialState: {
      atmospherePressure: 0,
      temperatureCelsius: 0,
      terraformingPhase: 0,
      axisSpinSpeed: 1,
      axisRotationDirection: 'prograde',
      cloudRotationSpeed: 0,
      atmosphereColor: '#000000',
      atmosphereDensity: 0,
    },
    visual: { baseColor: '#000000', layerTextures: {}, waterSpotUvs: [], greenSpotUvs: [] },
    phases,
  };
}

const EARTH_PHASES = [
  { displayName: 'Industrial Age', description: 'We are mastering the fundamentals.' },
  { displayName: 'Space Age', description: 'We have broken free of gravity.' },
];
const MARS_PHASES = [
  { displayName: 'Barren', description: 'Mars is a frozen desert.' },
  { displayName: 'Flourishing', description: 'Life takes root.' },
];

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const planetsSignal = signal<Record<string, PlanetState>>({});

const planetDataMap: Record<string, PlanetData> = {
  earth: makePlanetData('earth', EARTH_PHASES),
  mars:  makePlanetData('mars',  MARS_PHASES),
};

const mockGameState = { planets: planetsSignal.asReadonly() };
const mockData = {
  getPlanet: (id: string) => {
    const p = planetDataMap[id];
    if (!p) throw new Error(`Unknown planet in test: ${id}`);
    return p;
  },
};

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

function setup(): ComponentFixture<PlanetPanelComponent> {
  TestBed.configureTestingModule({
    imports: [PlanetPanelComponent],
    providers: [
      { provide: GameStateService, useValue: mockGameState },
      { provide: DataService, useValue: mockData },
    ],
  });
  const fixture = TestBed.createComponent(PlanetPanelComponent);
  fixture.detectChanges();
  return fixture;
}

beforeEach(() => {
  planetsSignal.set({});
  TestBed.resetTestingModule();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlanetPanelComponent', () => {
  // ── Visibility ──────────────────────────────────────────────────────────

  it('does not have .is-open on the host when planetId is null', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('is-open')).toBe(false);
  });

  it('adds .is-open on the host when planetId is set', () => {
    planetsSignal.set({ earth: makePlanetState({ id: 'earth' }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('is-open')).toBe(true);
  });

  // ── Locked planet ────────────────────────────────────────────────────────

  it('shows locked message when planetId is set but no runtime state exists', () => {
    // mars not in planetsSignal → locked
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'mars');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.planet-panel__locked')).not.toBeNull();
    expect(el.querySelector('.planet-panel__tabs')).toBeNull();
  });

  it('does not show locked message when planet is unlocked', () => {
    planetsSignal.set({ earth: makePlanetState({ id: 'earth' }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.planet-panel__locked')).toBeNull();
    expect(el.querySelector('.planet-panel__tabs')).not.toBeNull();
  });

  // ── Header ───────────────────────────────────────────────────────────────

  it('shows phase name and description from planet data', () => {
    planetsSignal.set({ earth: makePlanetState({ id: 'earth', terraformingPhase: 0 }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.planet-panel__phase-name')?.textContent?.trim()).toBe('Industrial Age');
    expect(el.querySelector('.planet-panel__phase-desc')?.textContent?.trim()).toContain('fundamentals');
  });

  // ── Tabs ─────────────────────────────────────────────────────────────────

  it('defaults to tech-tree tab', () => {
    planetsSignal.set({ earth: makePlanetState({ id: 'earth' }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('tech-tree');
  });

  it('Moon tab is present only for Earth', () => {
    planetsSignal.set({
      earth: makePlanetState({ id: 'earth' }),
      mars:  makePlanetState({ id: 'mars' }),
    });
    const earthFixture = setup();
    earthFixture.componentRef.setInput('planetId', 'earth');
    earthFixture.detectChanges();
    const earthEl = earthFixture.nativeElement as HTMLElement;
    const earthTabs = Array.from(earthEl.querySelectorAll('.planet-panel__tabs button')).map(
      (b) => b.textContent?.trim(),
    );
    expect(earthTabs).toContain('Moon');

    TestBed.resetTestingModule();
    const marsFixture = setup();
    marsFixture.componentRef.setInput('planetId', 'mars');
    marsFixture.detectChanges();
    const marsEl = marsFixture.nativeElement as HTMLElement;
    const marsTabs = Array.from(marsEl.querySelectorAll('.planet-panel__tabs button')).map(
      (b) => b.textContent?.trim(),
    );
    expect(marsTabs).not.toContain('Moon');
  });

  // ── Close output ─────────────────────────────────────────────────────────

  it('emits closed output when close button is clicked', () => {
    planetsSignal.set({ earth: makePlanetState({ id: 'earth' }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const closeBtn = fixture.nativeElement.querySelector('.planet-panel__close') as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalledOnce();
  });

  // ── initial-load class ───────────────────────────────────────────────────

  it('adds .initial-load class immediately on open and removes it after 800ms', () => {
    vi.useFakeTimers();
    planetsSignal.set({ earth: makePlanetState({ id: 'earth' }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    // Should be present immediately
    expect(host.classList.contains('initial-load')).toBe(true);

    // Advance past the 800ms window
    vi.advanceTimersByTime(800);
    fixture.detectChanges();
    expect(host.classList.contains('initial-load')).toBe(false);
  });

  it('clears the initial-load timeout on destroy (no leak)', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    planetsSignal.set({ earth: makePlanetState({ id: 'earth' }) });
    const fixture = setup();
    fixture.componentRef.setInput('planetId', 'earth');
    fixture.detectChanges();

    fixture.destroy();
    expect(clearSpy).toHaveBeenCalled();
  });
});
