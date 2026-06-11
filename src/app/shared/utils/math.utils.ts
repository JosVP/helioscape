/**
 * Pure utility functions for mathematical operations in Helioscape.
 * All functions are side-effect free and statically typed.
 */

/**
 * Clamps a value between a minimum and maximum.
 * @param value - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 * @param start - The start value
 * @param end - The end value
 * @param t - The interpolation factor (clamped to 0-1 internally)
 * @returns The interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  const clampedT = clamp(t, 0, 1);
  return start + (end - start) * clampedT;
}

/**
 * Returns a 0-1 value indicating where value falls between start and end.
 * @param start - The start value
 * @param end - The end value
 * @param value - The value to measure
 * @returns A 0-1 value indicating position between start and end
 */
export function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) return 0;
  return (value - start) / (end - start);
}

/**
 * Core pattern for all time-based value interpolation.
 * Uses clamp internally so values before startYear return startValue
 * and values after endYear return endValue.
 * This is the primary tool for safe save/load of visual transitions.
 * @param currentYear - The current game year
 * @param startYear - The year when the transition starts
 * @param endYear - The year when the transition ends
 * @param startValue - The value at startYear
 * @param endValue - The value at endYear
 * @returns The interpolated value at currentYear
 */
export function getValueAtYear(
  currentYear: number,
  startYear: number,
  endYear: number,
  startValue: number,
  endValue: number,
): number {
  if (currentYear <= startYear) return startValue;
  if (currentYear >= endYear) return endValue;
  const t = inverseLerp(startYear, endYear, currentYear);
  return lerp(startValue, endValue, t);
}

/**
 * Converts a hex color string to RGB components.
 * @param hex - The hex color string (with or without #)
 * @returns An object with r, g, b properties (0-255), or null if invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');

  if (cleaned.length !== 6) return null;

  const num = parseInt(cleaned, 16);

  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Lerps between two hex colours, returns hex string.
 * @param hexA - The start hex color
 * @param hexB - The end hex color
 * @param t - The interpolation factor (0-1)
 * @returns The interpolated color as a hex string
 */
export function lerpColor(hexA: string, hexB: string, t: number): string {
  const colorA = hexToRgb(hexA);
  const colorB = hexToRgb(hexB);

  if (!colorA || !colorB) return hexA;

  const r = Math.round(lerp(colorA.r, colorB.r, t));
  const g = Math.round(lerp(colorA.g, colorB.g, t));
  const b = Math.round(lerp(colorA.b, colorB.b, t));

  const toHex = (n: number): string => n.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts radians to degrees.
 * @param rad - The angle in radians
 * @returns The angle in degrees
 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Converts degrees to radians.
 * @param deg - The angle in degrees
 * @returns The angle in radians
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}
