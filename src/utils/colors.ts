/**
 * Color utilities for the Firework Simulator
 */

import { COLOR, INVISIBLE } from '../config';
import type { ColorOptions, ColorTuple } from '../config';

// ============================================
// Color Code Arrays
// ============================================

export const COLOR_NAMES = Object.keys(COLOR);
export const COLOR_CODES = COLOR_NAMES.map((colorName) => COLOR[colorName]);

// Invisible stars need an identifier even though they won't be rendered - physics still applies
export const COLOR_CODES_W_INVIS = [...COLOR_CODES, INVISIBLE];

// Color code indexes for fast lookup
export const COLOR_CODE_INDEXES = COLOR_CODES_W_INVIS.reduce(
  (obj: Record<string, number>, code: string, i: number) => {
    obj[code] = i;
    return obj;
  },
  {}
);

// Color tuples mapped by hex code for RGB values
export const COLOR_TUPLES: Record<string, ColorTuple> = {};
COLOR_CODES.forEach((hex: string) => {
  COLOR_TUPLES[hex] = {
    r: parseInt(hex.substr(1, 2), 16),
    g: parseInt(hex.substr(3, 2), 16),
    b: parseInt(hex.substr(5, 2), 16),
  };
});

// ============================================
// Color Functions
// ============================================

/**
 * Get a random color from the color palette
 */
export function randomColorSimple(): string {
  return COLOR_CODES[(Math.random() * COLOR_CODES.length) | 0];
}

// Track last color to avoid repeats when needed
let lastColor: string;

/**
 * Get a random color with custom options
 */
export function randomColor(options?: ColorOptions): string {
  const notSame = options?.notSame;
  const notColor = options?.notColor;
  const limitWhite = options?.limitWhite;
  let color = randomColorSimple();

  // Limit white from being randomly selected too often
  if (limitWhite && color === COLOR.White && Math.random() < 0.6) {
    color = randomColorSimple();
  }

  if (notSame) {
    while (color === lastColor) {
      color = randomColorSimple();
    }
  } else if (notColor) {
    while (color === notColor) {
      color = randomColorSimple();
    }
  }

  lastColor = color;
  return color;
}

/**
 * Returns either white or gold color randomly
 */
export function whiteOrGold(): string {
  return Math.random() < 0.5 ? COLOR.Gold : COLOR.White;
}

/**
 * Make pistil color based on shell color
 */
export function makePistilColor(shellColor: string): string {
  return shellColor === COLOR.White || shellColor === COLOR.Gold
    ? randomColor({ notColor: shellColor })
    : whiteOrGold();
}
