import { describe, it, expect } from 'vitest';
import { GameYearPipe } from './game-year.pipe';

describe('GameYearPipe', () => {
  const pipe = new GameYearPipe();

  it('formats a positive year', () => {
    expect(pipe.transform(2087)).toBe('Year 2087');
  });

  it('formats year 0', () => {
    expect(pipe.transform(0)).toBe('Year 0');
  });

  it('formats the starting year 2025', () => {
    expect(pipe.transform(2025)).toBe('Year 2025');
  });

  it('formats a large year', () => {
    expect(pipe.transform(3200)).toBe('Year 3200');
  });
});
