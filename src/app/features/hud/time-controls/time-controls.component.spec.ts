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

  it('clicking 1× calls setSpeed(1)', () => {
    const fixture = setup();
    const btns: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.time-controls__btn--speed');
    btns[0].click(); // 1× is always the first speed button
    expect(mockGameLoop.setSpeed).toHaveBeenCalledWith(1);
  });

  it('4× button is hidden on first playthrough', () => {
    isFirstPlaythroughSignal.set(true);
    const fixture = setup();
    const speedBtns: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.time-controls__btn--speed');
    expect(speedBtns.length).toBe(1);
  });

  it('4× button is visible when not first playthrough', () => {
    isFirstPlaythroughSignal.set(false);
    const fixture = setup();
    fixture.detectChanges();
    const speedBtns: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.time-controls__btn--speed');
    expect(speedBtns.length).toBe(2);
  });

  it('4× button click calls setSpeed(4)', () => {
    isFirstPlaythroughSignal.set(false);
    const fixture = setup();
    fixture.detectChanges();
    const speedBtns: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.time-controls__btn--speed');
    speedBtns[1].click();
    expect(mockGameLoop.setSpeed).toHaveBeenCalledWith(4);
  });

  it('active speed button has --active class', () => {
    gameSpeedSignal.set(1);
    const fixture = setup();
    const speedBtns: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.time-controls__btn--speed');
    expect(speedBtns[0].classList.contains('time-controls__btn--active')).toBe(true);
  });

  it('pause button has aria-pressed=true when paused', () => {
    isPausedSignal.set(true);
    const fixture = setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.time-controls__btn--pause');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });
});
