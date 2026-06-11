import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HudComponent } from './hud.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { GameLoopService } from '@app/core/services/game-loop.service';
import { SaveService } from '@app/core/services/save.service';
import { EventBusService } from '@app/core/services/event-bus.service';

describe('HudComponent', () => {
  const autosaveSignal = signal(0);
  const gameYearSignal = signal(2025);
  const gameSpeedSignal = signal<1 | 4>(1);
  const isPausedSignal = signal(false);
  const kardashevSignal = signal(0.73);
  const isFirstPlaythroughSignal = signal(true);

  const mockGameState = {
    gameYear: gameYearSignal.asReadonly(),
    gameSpeed: gameSpeedSignal.asReadonly(),
    isPaused: isPausedSignal.asReadonly(),
    kardashevLevel: kardashevSignal.asReadonly(),
    isFirstPlaythrough: isFirstPlaythroughSignal.asReadonly(),
  };

  const mockGameLoop = {
    pause: vi.fn(),
    resume: vi.fn(),
    setSpeed: vi.fn(),
  };

  const mockSave = {
    autosaveCompleted: autosaveSignal.asReadonly(),
  };

  const mockEventBus = {
    milestoneReached$: new Subject<string>(),
  };

  function setup(): ComponentFixture<HudComponent> {
    TestBed.configureTestingModule({
      imports: [HudComponent],
      providers: [
        { provide: GameStateService, useValue: mockGameState },
        { provide: GameLoopService, useValue: mockGameLoop },
        { provide: SaveService, useValue: mockSave },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    });
    const fixture = TestBed.createComponent(HudComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    autosaveSignal.set(0);
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('autosave indicator is not visible initially', () => {
    const fixture = setup();
    expect(fixture.componentInstance.showAutosave()).toBe(false);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.hud__autosave--visible')).toBeNull();
  });

  it('autosave indicator becomes visible when autosaveCompleted signal increments', () => {
    const fixture = setup();
    autosaveSignal.set(1);
    fixture.detectChanges();
    expect(fixture.componentInstance.showAutosave()).toBe(true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.hud__autosave--visible')).not.toBeNull();
  });

  it('autosave indicator disappears after 2500 ms', async () => {
    vi.useFakeTimers();
    const fixture = setup();

    autosaveSignal.set(1);
    fixture.detectChanges();
    expect(fixture.componentInstance.showAutosave()).toBe(true);

    vi.advanceTimersByTime(2500);
    fixture.detectChanges();
    expect(fixture.componentInstance.showAutosave()).toBe(false);

    vi.useRealTimers();
  });

  it('re-triggering autosave resets the 2500 ms window', async () => {
    vi.useFakeTimers();
    const fixture = setup();

    autosaveSignal.set(1);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);

    // Second autosave before the first timer expired
    autosaveSignal.set(2);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000); // total 2000 ms since first — would have expired if not reset
    expect(fixture.componentInstance.showAutosave()).toBe(true);

    vi.advanceTimersByTime(1500); // total 2500 ms since second — now expires
    fixture.detectChanges();
    expect(fixture.componentInstance.showAutosave()).toBe(false);

    vi.useRealTimers();
  });

  it('renders YearLabel sub-component', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('app-year-label')).not.toBeNull();
  });

  it('renders KardashevBar sub-component', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('app-kardashev-bar')).not.toBeNull();
  });

  it('renders TimeControls sub-component', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('app-time-controls')).not.toBeNull();
  });
});
