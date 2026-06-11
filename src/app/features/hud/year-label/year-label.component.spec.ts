import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YearLabelComponent } from './year-label.component';
import { GameStateService } from '@app/core/services/game-state.service';

describe('YearLabelComponent', () => {
  let fixture: ComponentFixture<YearLabelComponent>;

  const gameYearSignal = signal(2087);

  const mockGameState = {
    gameYear: gameYearSignal.asReadonly(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YearLabelComponent],
      providers: [{ provide: GameStateService, useValue: mockGameState }],
    }).compileComponents();

    fixture = TestBed.createComponent(YearLabelComponent);
    fixture.detectChanges();
  });

  it('renders the formatted year', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.year-label')?.textContent?.trim()).toBe('Year 2087');
  });

  it('updates when the year signal changes', () => {
    gameYearSignal.set(2150);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.year-label')?.textContent?.trim()).toBe('Year 2150');
  });
});
