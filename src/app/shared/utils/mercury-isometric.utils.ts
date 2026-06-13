/**
 * mercury-isometric.utils.ts
 *
 * Pure utility functions for Mercury isometric grid coordinate math.
 * No imports. No side effects. All exports.
 *
 * Coordinate system (from ARCHITECTURE.md):
 *
 *         (0,0)   top
 *          / \
 *    col→ /   \ ←row
 *        /     \
 *   (1,0)       (0,1)
 *        \     /
 *         \   /
 *          \ /
 *         (1,1)  bottom
 *
 * toScreen: grid (col, row) → canvas pixel (x, y)
 * toGrid:   canvas pixel (x, y) → grid (col, row)  [inverse]
 */

/** Full width of an isometric tile diamond in pixels. */
export const TILE_W = 64;

/** Full height of an isometric tile diamond in pixels. */
export const TILE_H = 32;

/** Half the tile width — used in coordinate transforms. */
export const HALF_W = TILE_W / 2;

/** Half the tile height — used in coordinate transforms. */
export const HALF_H = TILE_H / 2;

/**
 * Converts grid (col, row) coordinates to canvas pixel (x, y).
 * The origin point is the top vertex of tile (0, 0).
 *
 * @param col   Column index (0-based, left to right)
 * @param row   Row index (0-based, top to bottom)
 * @param originX  Canvas x-position of the top vertex of tile (0,0)
 * @param originY  Canvas y-position of the top vertex of tile (0,0)
 * @returns Centre pixel of the tile diamond
 */
export function toScreen(
  col: number,
  row: number,
  originX: number,
  originY: number,
): { x: number; y: number } {
  return {
    x: originX + (col - row) * HALF_W,
    y: originY + (col + row) * HALF_H,
  };
}

/**
 * Converts canvas pixel (screenX, screenY) to grid (col, row) coordinates.
 * This is the exact inverse of toScreen(); use Math.round for hit detection.
 *
 * @param screenX  Canvas pixel x
 * @param screenY  Canvas pixel y
 * @param originX  Canvas x-position of the top vertex of tile (0,0)
 * @param originY  Canvas y-position of the top vertex of tile (0,0)
 * @returns Nearest grid cell (may be out-of-bounds; caller must check isInBounds)
 */
export function toGrid(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number,
): { col: number; row: number } {
  const dx = (screenX - originX) / HALF_W;
  const dy = (screenY - originY) / HALF_H;
  return {
    col: Math.round((dx + dy) / 2),
    row: Math.round((dy - dx) / 2),
  };
}

/**
 * Draws a filled isometric tile diamond centred at (cx, cy).
 * Path: top → right → bottom → left → close.
 *
 * @param ctx         2D rendering context
 * @param cx          Centre x of the diamond
 * @param cy          Centre y of the diamond
 * @param fillColor   CSS fill colour string
 * @param strokeColor Optional CSS stroke colour; no stroke drawn if omitted
 */
export function drawTileDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fillColor: string,
  strokeColor?: string,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - HALF_H);          // top
  ctx.lineTo(cx + HALF_W, cy);          // right
  ctx.lineTo(cx, cy + HALF_H);          // bottom
  ctx.lineTo(cx - HALF_W, cy);          // left
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (strokeColor !== undefined) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/**
 * Returns true if (col, row) is within the grid bounds [0, cols) × [0, rows).
 */
export function isInBounds(col: number, row: number, cols: number, rows: number): boolean {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

/**
 * Returns a new array sorted ascending by (col + row) — back-to-front draw order
 * for correct isometric depth (painter's algorithm).
 */
export function sortByDepth<T extends { col: number; row: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.col + a.row - (b.col + b.row));
}
