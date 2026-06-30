// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Router } from '@angular/router';
import { AudioService } from '@app/core/services/audio.service';
import { EventBusService } from '@app/core/services/event-bus.service';
import { GameLoopService } from '@app/core/services/game-loop.service';
import { GameStateService } from '@app/core/services/game-state.service';
import { PlanetUnlockService } from '@app/core/systems/planet-unlock.service';
import { ResearchArcService } from '@app/core/systems/research-arc.service';
import { GameShellComponent } from './game-shell.component';

describe('GameShellComponent', () => {
  const interactionLockedSignal = signal(false);

  const mockGameLoop = {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(() => interactionLockedSignal.set(true)),
    resume: vi.fn(() => interactionLockedSignal.set(false)),
  };

  const mockGameState = {
    interactionLocked: interactionLockedSignal.asReadonly(),
    ensureInitialised: vi.fn(),
    getPlanetUnlockState: vi.fn(() => ({ status: 'unlocked' })),
  };

  const mockRouter = { navigate: vi.fn(() => Promise.resolve(true)) };

  const mockEventBus = {
    planetSelected$: new Subject<string>(),
    researchHubRequested$: new Subject<void>(),
    researchHubFocusRequested$: new Subject<{ nodeId?: string | null }>(),
    lockedPlanetSelected$: new Subject<unknown>(),
  };

  function setup(): GameShellComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: GameLoopService, useValue: mockGameLoop },
        { provide: GameStateService, useValue: mockGameState },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: AudioService, useValue: { initialise: vi.fn() } },
        { provide: Router, useValue: mockRouter },
        { provide: PlanetUnlockService, useValue: {} },
        { provide: ResearchArcService, useValue: {} },
      ],
    });
    return TestBed.runInInjectionContext(() => new GameShellComponent());
  }

  beforeEach(() => {
    interactionLockedSignal.set(false);
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('opening the pause menu pauses the loop and opens the overlay', () => {
    const component = setup();

    component.openPauseMenu();

    expect(mockGameLoop.pause).toHaveBeenCalledOnce();
    expect(component.isPauseMenuOpen()).toBe(true);
  });

  it('closing the pause menu resumes by default', () => {
    const component = setup();
    component.openPauseMenu();

    component.closePauseMenu();

    expect(mockGameLoop.resume).toHaveBeenCalledOnce();
    expect(component.isPauseMenuOpen()).toBe(false);
  });

  it('returning to title closes without resuming and navigates home', () => {
    const component = setup();
    component.openPauseMenu();

    component.returnToTitle();

    expect(mockGameLoop.resume).not.toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('completed pause loads reassert the pause lock and keep the menu open', () => {
    const component = setup();
    interactionLockedSignal.set(false);

    component.handlePauseLoadCompleted();

    expect(mockGameLoop.pause).toHaveBeenCalledOnce();
    expect(component.isPauseMenuOpen()).toBe(true);
  });
});
