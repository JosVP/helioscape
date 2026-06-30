// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameLoopService } from './game-loop.service';
import { GameStateService } from './game-state.service';

describe('GameLoopService', () => {
  const gameSpeedSignal = signal<1 | 4>(1);
  const isPausedSignal = signal(false);
  const mockGameState = {
    gameSpeed: gameSpeedSignal.asReadonly(),
    isPaused: isPausedSignal.asReadonly(),
    setPaused: vi.fn((paused: boolean) => isPausedSignal.set(paused)),
    setSpeed: vi.fn((speed: 1 | 4) => gameSpeedSignal.set(speed)),
    advanceYear: vi.fn(),
  };

  function setup(): GameLoopService {
    TestBed.configureTestingModule({
      providers: [
        GameLoopService,
        { provide: GameStateService, useValue: mockGameState },
      ],
    });
    return TestBed.inject(GameLoopService);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    gameSpeedSignal.set(1);
    isPausedSignal.set(false);
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('advances years after start at the current cadence', () => {
    const service = setup();

    service.start();
    vi.advanceTimersByTime(1000);

    expect(mockGameState.advanceYear).toHaveBeenCalledTimes(1);
  });

  it('pause stops scheduled year advancement and marks state paused', () => {
    const service = setup();

    service.start();
    vi.advanceTimersByTime(400);
    service.pause();
    vi.advanceTimersByTime(2000);

    expect(mockGameState.setPaused).toHaveBeenCalledWith(true);
    expect(isPausedSignal()).toBe(true);
    expect(mockGameState.advanceYear).not.toHaveBeenCalled();
  });

  it('resume restarts from the saved remaining tick time', () => {
    const service = setup();

    service.start();
    vi.advanceTimersByTime(400);
    service.pause();
    service.resume();
    vi.advanceTimersByTime(599);
    expect(mockGameState.advanceYear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockGameState.setPaused).toHaveBeenLastCalledWith(false);
    expect(mockGameState.advanceYear).toHaveBeenCalledTimes(1);
  });

  it('repeated resume calls do not create duplicate timers', () => {
    const service = setup();

    service.resume();
    service.resume();
    vi.advanceTimersByTime(1000);

    expect(mockGameState.advanceYear).toHaveBeenCalledTimes(1);
  });

  it('does not advance on a tick while state remains paused', () => {
    const service = setup();
    isPausedSignal.set(true);

    service.start();
    vi.advanceTimersByTime(1000);

    expect(mockGameState.advanceYear).not.toHaveBeenCalled();
  });
});
