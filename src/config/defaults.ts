/**
 * Default Configuration Values
 */

import {
  AppConfig,
  AppState,
  QUALITY_LOW,
  QUALITY_NORMAL,
  QUALITY_HIGH,
  SKY_LIGHT_NONE,
  SKY_LIGHT_DIM,
  SKY_LIGHT_NORMAL,
} from './types';

// Re-export constants for convenience
export { QUALITY_LOW, QUALITY_NORMAL, QUALITY_HIGH, SKY_LIGHT_NONE, SKY_LIGHT_DIM, SKY_LIGHT_NORMAL };

// ============================================
// Device Detection
// ============================================

export const IS_MOBILE = window.innerWidth <= 640;
export const IS_DESKTOP = window.innerWidth > 800;
export const IS_HEADER = IS_DESKTOP && window.innerHeight < 300;

export const IS_HIGH_END_DEVICE = (() => {
  const hwConcurrency = navigator.hardwareConcurrency;
  if (!hwConcurrency) return false;
  const minCount = window.innerWidth <= 1024 ? 4 : 8;
  return hwConcurrency >= minCount;
})();

// ============================================
// Canvas Limits
// ============================================

export const MAX_WIDTH = 7680;  // 8K
export const MAX_HEIGHT = 4320;

// ============================================
// Physics Constants
// ============================================

export const GRAVITY = 0.9;  // pixels/second² acceleration
export const PI_2 = Math.PI * 2;
export const PI_HALF = Math.PI * 0.5;

// ============================================
// Colors
// ============================================

export const COLOR = {
  Red: '#ff0043',
  Green: '#14fc56',
  Blue: '#1e7fff',
  Purple: '#e60aff',
  Gold: '#ffbf36',
  White: '#ffffff',
} as const;

export const INVISIBLE = '_INVISIBLE_';

// ============================================
// Default Scale Factor
// ============================================

export function getDefaultScaleFactor(): number {
  if (IS_MOBILE) return 0.9;
  if (IS_HEADER) return 0.75;
  return 1;
}

// ============================================
// Default App Config
// ============================================

export const DEFAULT_CONFIG: AppConfig = {
  quality: QUALITY_HIGH,
  shell: 'Random',
  size: 3,
  wordShell: true,
  autoLaunch: true,
  finale: true,
  skyLighting: SKY_LIGHT_NORMAL,
  longExposure: false,
  scaleFactor: getDefaultScaleFactor(),
  hideControls: false,
};

// ============================================
// Default App State
// ============================================

export const DEFAULT_STATE: AppState = {
  ...DEFAULT_CONFIG,
  paused: true,
  soundEnabled: false,
  menuOpen: false,
  fullscreen: false,
  openHelpTopic: null,
};
