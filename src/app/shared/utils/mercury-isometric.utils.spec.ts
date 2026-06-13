import { describe, expect, it } from 'vitest';
import {
  HALF_H,
  HALF_W,
  TILE_H,
  TILE_W,
  isInBounds,
  sortByDepth,
  toGrid,
  toScreen,
} from './mercury-isometric.utils';

describe('mercury-isometric.utils', () => {
  describe('constants', () => {
    it('TILE_W is 64 and TILE_H is 32', () => {
      expect(TILE_W).toBe(64);
      expect(TILE_H).toBe(32);
    });

    it('HALF_W and HALF_H are half their respective dimensions', () => {
      expect(HALF_W).toBe(32);
      expect(HALF_H).toBe(16);
    });
  });

  describe('toScreen', () => {
    it('returns origin for tile (0, 0)', () => {
      expect(toScreen(0, 0, 400, 80)).toEqual({ x: 400, y: 80 });
    });

    it('moves right and down for col+1', () => {
      // col+1: x += HALF_W, y += HALF_H
      expect(toScreen(1, 0, 400, 80)).toEqual({ x: 432, y: 96 });
    });

    it('moves left and down for row+1', () => {
      // row+1: x -= HALF_W, y += HALF_H
      expect(toScreen(0, 1, 400, 80)).toEqual({ x: 368, y: 96 });
    });

    it('centre tile (1,1) is directly below origin', () => {
      const result = toScreen(1, 1, 400, 80);
      expect(result).toEqual({ x: 400, y: 112 });
    });
  });

  describe('toGrid (inverse of toScreen)', () => {
    it('round-trips origin tile (0, 0)', () => {
      const { x, y } = toScreen(0, 0, 400, 80);
      expect(toGrid(x, y, 400, 80)).toEqual({ col: 0, row: 0 });
    });

    it('round-trips arbitrary tile (3, 5)', () => {
      const { x, y } = toScreen(3, 5, 400, 80);
      expect(toGrid(x, y, 400, 80)).toEqual({ col: 3, row: 5 });
    });

    it('round-trips tile (6, 2)', () => {
      const { x, y } = toScreen(6, 2, 400, 80);
      expect(toGrid(x, y, 400, 80)).toEqual({ col: 6, row: 2 });
    });
  });

  describe('isInBounds', () => {
    it('returns true for a valid interior tile', () => {
      expect(isInBounds(5, 5, 12, 10)).toBe(true);
    });

    it('returns true for the top-left corner (0, 0)', () => {
      expect(isInBounds(0, 0, 12, 10)).toBe(true);
    });

    it('returns true for the bottom-right corner (11, 9)', () => {
      expect(isInBounds(11, 9, 12, 10)).toBe(true);
    });

    it('returns false for col === COLS (at boundary)', () => {
      expect(isInBounds(12, 0, 12, 10)).toBe(false);
    });

    it('returns false for row === ROWS (at boundary)', () => {
      expect(isInBounds(0, 10, 12, 10)).toBe(false);
    });

    it('returns false for negative col', () => {
      expect(isInBounds(-1, 5, 12, 10)).toBe(false);
    });

    it('returns false for negative row', () => {
      expect(isInBounds(5, -1, 12, 10)).toBe(false);
    });
  });

  describe('sortByDepth', () => {
    it('sorts tiles by col + row ascending', () => {
      const tiles = [
        { col: 3, row: 3 },
        { col: 0, row: 0 },
        { col: 1, row: 2 },
        { col: 2, row: 1 },
      ];
      const sorted = sortByDepth(tiles);
      const depths = sorted.map((t) => t.col + t.row);
      expect(depths).toEqual([0, 3, 3, 6]);
    });

    it('does not mutate the original array', () => {
      const tiles = [
        { col: 2, row: 0 },
        { col: 0, row: 1 },
      ];
      const original = [...tiles];
      sortByDepth(tiles);
      expect(tiles).toEqual(original);
    });

    it('returns empty array for empty input', () => {
      expect(sortByDepth([])).toEqual([]);
    });
  });
});
