import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeControlsComponent } from './time-controls.component';
import { GameLoopService } from '@app/core/services/game-loop.service';
import { GameStateService } from '@app/core/services/game-state.service';

describe('TimeControlsComponent', () => {
  const isPausedSignal = signal(false);
  const gameSpeedSignal = signal<1 | 4>(1);
  const isFirstPlaythroughSignal = signal(true);

  const mockGameState = {
    isPaused: isPausedSignal.asReadonly(),
    gameSpeed: gameSpeedSignal.asReadonly(),
    isFirstPlaythrough: isFirstPlaythroughSignal.asReadonly(),
  };

  const mockGameLoop = {
    pause: vi.fn(),
    resume: vi.fn(),
    setSpeed: vi.fn(),
  };

  function setup(): ComponentFixture<TimeControlsComponent> {
    TestBed.configureTestingModule({
      imports: [TimeControlsComponent],
      providers: [
        { provide: GameStateService, useValue: mockGameState },
        { provide: GameLoopService, useValue: mockGameLoop },
      ],
    });
    const fixture = TestBed.createComponent(TimeControlsComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    isPausedSignal.set(false);
    gameSpeedSignal.set(1);
    isFirstPlaythroughSignal.set(true);
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('clicking pause calls gameLoop.pause() when not paused', () => {
    const fixture = setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--pause');
    btn.click();
    expect(mockGameLoop.pause).toHaveBeenCalledOnce();
    expect(mockGameLoop.resume).not.toHaveBeenCalled();
  });

  it('clicking pause calls gameLoop.resume() when already paused', () => {
    isPausedSignal.set(true);
    const fixture = setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--pause');
    btn.click();
    expect(mockGameLoop.resume).toHaveBeenCalledOnce();
    expect(mockGameLoop.pause).not.toHaveBeenCalled();
  });

  it('speed button is absent on first playthrough', () => {
    isFirstPlaythroughSignal.set(true);
    const fixture = setup();
    const speedBtn = fixture.nativeElement.querySelector('.time-controls__btn--speed');
    expect(speedBtn).toBeNull();
  });

  it('speed button is present when not first playthrough', () => {
    isFirstPlaythroughSignal.set(false);
    const fixture = setup();
    const speedBtn = fixture.nativeElement.querySelector('.time-controls__btn--speed');
    expect(speedBtn).not.toBeNull();
  });

  it('speed button label reflects current speed', () => {
    isFirstPlaythroughSignal.set(false);
    gameSpeedSignal.set(4);
    const fixture = setup();
    const speedBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--speed');
    expect(speedBtn.textContent?.trim()).toBe('4×');
  });

  it('toggleSpeed flips 1× to 4×', () => {
    isFirstPlaythroughSignal.set(false);
    gameSpeedSignal.set(1);
    const fixture = setup();
    const speedBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--speed');
    speedBtn.click();
    expect(mockGameLoop.setSpeed).toHaveBeenCalledWith(4);
  });

  it('toggleSpeed flips 4× to 1×', () => {
    isFirstPlaythroughSignal.set(false);
    gameSpeedSignal.set(4);
    const fixture = setup();
    const speedBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--speed');
    speedBtn.click();
    expect(mockGameLoop.setSpeed).toHaveBeenCalledWith(1);
  });

  it('pause button has aria-pressed=true when paused', () => {
    isPausedSignal.set(true);
    const fixture = setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--pause');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });
});
