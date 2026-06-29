import { describe, expect, it } from 'vitest';
import { axialToPixel, hexAnchor } from './hex-grid.utils';

describe('hex-grid utilities', () => {
  it('converts axial origin to pixel origin', () => {
    expect(axialToPixel(0, 0, 38, 12)).toEqual({ x: 0, y: 0 });
  });

  it('converts axial coordinates using pointy-top spacing plus authored gap', () => {
    const point = axialToPixel(2, -2, 38, 12);

    expect(point.x).toBeCloseTo(50 * Math.sqrt(3));
    expect(point.y).toBe(-150);
  });

  it('returns side anchors around a hex center', () => {
    const center = { x: 10, y: 20 };

    expect(hexAnchor(center, 'top', 8)).toEqual({ x: 10, y: 12 });
    expect(hexAnchor(center, 'bottom', 8)).toEqual({ x: 10, y: 28 });
    expect(hexAnchor(center, 'upper-right', 8).x).toBeCloseTo(10 + 4 * Math.sqrt(3));
    expect(hexAnchor(center, 'lower-left', 8).x).toBeCloseTo(10 - 4 * Math.sqrt(3));
  });
});