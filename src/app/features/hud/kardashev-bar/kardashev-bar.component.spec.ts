import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KardashevBarComponent } from './kardashev-bar.component';
import { GameStateService } from '@app/core/services/game-state.service';
import { EventBusService } from '@app/core/services/event-bus.service';

describe('KardashevBarComponent', () => {
  const kardashevLevelSignal = signal(0.73);
  const milestoneReached$ = new Subject<string>();

  const mockGameState = {
    kardashevLevel: kardashevLevelSignal.asReadonly(),
  };

  const mockEventBus = {
    milestoneReached$,
  };

  function setup(): ComponentFixture<KardashevBarComponent> {
    TestBed.configureTestingModule({
      imports: [KardashevBarComponent],
      providers: [
        { provide: GameStateService, useValue: mockGameState },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    });
    const fixture = TestBed.createComponent(KardashevBarComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    kardashevLevelSignal.set(0.73);
    TestBed.resetTestingModule();
  });

  it('barPercent is 0 % at minimum Kardashev level (0.73)', async () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    expect(component.barPercent()).toBe(0);
  });

  it('barPercent is 100 % at maximum Kardashev level (2.0)', async () => {
    kardashevLevelSignal.set(2.0);
    const fixture = setup();
    const component = fixture.componentInstance;
    expect(component.barPercent()).toBeCloseTo(100, 1);
  });

  it('barPercent is ~50 % at mid-point', async () => {
    kardashevLevelSignal.set(0.73 + 1.27 / 2);
    const fixture = setup();
    const component = fixture.componentInstance;
    expect(component.barPercent()).toBeCloseTo(50, 1);
  });

  it('barPercent clamps to 0 below base', async () => {
    kardashevLevelSignal.set(0.5);
    const fixture = setup();
    expect(fixture.componentInstance.barPercent()).toBe(0);
  });

  it('barPercent clamps to 100 above max', async () => {
    kardashevLevelSignal.set(2.5);
    const fixture = setup();
    expect(fixture.componentInstance.barPercent()).toBe(100);
  });

  it('levelDisplay shows K prefix and two decimal places', async () => {
    kardashevLevelSignal.set(1.234);
    const fixture = setup();
    expect(fixture.componentInstance.levelDisplay()).toBe('K 1.23');
  });

  it('levelDisplay shows K prefix at base level', async () => {
    const fixture = setup();
    expect(fixture.componentInstance.levelDisplay()).toBe('K 0.73');
  });

  it('sets pulsingMarker when milestoneReached$ emits', async () => {
    const fixture = setup();
    milestoneReached$.next('type_1');
    fixture.detectChanges();
    expect(fixture.componentInstance.pulsingMarker()).toBe('type_1');
  });

  it('clears pulsingMarker after 2 s', async () => {
    vi.useFakeTimers();
    const fixture = setup();
    milestoneReached$.next('type_1');
    fixture.detectChanges();
    expect(fixture.componentInstance.pulsingMarker()).toBe('type_1');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(fixture.componentInstance.pulsingMarker()).toBeNull();
    vi.useRealTimers();
  });

  it('sets --bar-width CSS custom property on the host element', async () => {
    const fixture = setup();
    const hostStyle = (fixture.nativeElement as HTMLElement).style.getPropertyValue('--bar-width');
    expect(hostStyle).toBe('0%');
  });
});
