import type { ResearchHexSide, ResearchPixelPoint } from '@app/core/models';

const SQRT_3 = Math.sqrt(3);

export function axialToPixel(q: number, r: number, size: number, gap: number): ResearchPixelPoint {
  const spacing = size + gap;
  return {
    x: spacing * SQRT_3 * (q + r / 2),
    y: spacing * 1.5 * r,
  };
}

export function hexAnchor(center: ResearchPixelPoint, side: ResearchHexSide, size: number): ResearchPixelPoint {
  switch (side) {
    case 'top':
      return { x: center.x, y: center.y - size };
    case 'upper-right':
      return { x: center.x + (SQRT_3 / 2) * size, y: center.y - size / 2 };
    case 'lower-right':
      return { x: center.x + (SQRT_3 / 2) * size, y: center.y + size / 2 };
    case 'bottom':
      return { x: center.x, y: center.y + size };
    case 'lower-left':
      return { x: center.x - (SQRT_3 / 2) * size, y: center.y + size / 2 };
    case 'upper-left':
      return { x: center.x - (SQRT_3 / 2) * size, y: center.y - size / 2 };
  }
}