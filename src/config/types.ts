/**
 * Configuration Type Definitions
 */

// ============================================
// Quality Levels
// ============================================

export type QualityLevel = 1 | 2 | 3;

export const QUALITY_LOW: QualityLevel = 1;
export const QUALITY_NORMAL: QualityLevel = 2;
export const QUALITY_HIGH: QualityLevel = 3;

// ============================================
// Sky Lighting Levels
// ============================================

export type SkyLightingLevel = 0 | 1 | 2;

export const SKY_LIGHT_NONE: SkyLightingLevel = 0;
export const SKY_LIGHT_DIM: SkyLightingLevel = 1;
export const SKY_LIGHT_NORMAL: SkyLightingLevel = 2;

// ============================================
// Shell Types
// ============================================

export type ShellTypeName =
  | 'Random'
  | 'Crackle'
  | 'Crossette'
  | 'Crysanthemum'
  | 'Falling Leaves'
  | 'Floral'
  | 'Ghost'
  | 'Horse Tail'
  | 'Palm'
  | 'Ring'
  | 'Strobe'
  | 'Willow'
  | 'Heart'
  | 'Star';

// ============================================
// Sound Types
// ============================================

export type SoundType = 
  | 'lift'
  | 'burst'
  | 'burstSmall'
  | 'crackle'
  | 'crackleSmall';

// ============================================
// Color Definitions
// ============================================

export interface ColorPalette {
  Red: string;
  Green: string;
  Blue: string;
  Purple: string;
  Gold: string;
  White: string;
}

export interface ColorTuple {
  r: number;
  g: number;
  b: number;
}

// ============================================
// App Configuration
// ============================================

export interface AppConfig {
  // Quality
  quality: QualityLevel;
  
  // Shell settings
  shell: ShellTypeName;
  size: number;
  wordShell: boolean;
  
  // Launch settings
  autoLaunch: boolean;
  finale: boolean;
  
  // Visual settings
  skyLighting: SkyLightingLevel;
  longExposure: boolean;
  scaleFactor: number;
  
  // UI settings
  hideControls: boolean;
}

// ============================================
// App State (extends Config with runtime state)
// ============================================

export interface AppState extends AppConfig {
  paused: boolean;
  soundEnabled: boolean;
  menuOpen: boolean;
  fullscreen: boolean;
  openHelpTopic: string | null;
}

// ============================================
// Computed Config Values
// ============================================

export interface ComputedConfig {
  isLowQuality: boolean;
  isNormalQuality: boolean;
  isHighQuality: boolean;
  sparkDrawWidth: number;
}

// ============================================
// Event Callback Types
// ============================================

export type ConfigChangeListener = (config: AppConfig, prevConfig: AppConfig) => void;
export type StateChangeListener = (state: AppState, prevState: AppState) => void;

// ============================================
// Shell Options
// ============================================

export interface ShellOptions {
  shellSize: number;
  spreadSize: number;
  starCount?: number;
  starDensity?: number;
  starLife: number;
  starLifeVariation?: number;
  color?: string | string[];
  glitterColor?: string;
  glitter?: 'light' | 'medium' | 'heavy' | 'thick' | 'streamer' | 'willow';
  pistil?: boolean;
  pistilColor?: string;
  streamers?: boolean;
  crossette?: boolean;
  floral?: boolean;
  crackle?: boolean;
  fallingLeaves?: boolean;
  horsetail?: boolean;
  ring?: boolean;
  strobe?: boolean;
  strobeColor?: string;
  secondColor?: string;
  disableWord?: boolean;
  heart?: boolean;
  starShape?: boolean;
}

export type ShellFactory = (size: number) => ShellOptions;

// ============================================
// Star & Spark Options
// ============================================

export interface StarOptions {
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  life: number;
  speedOffX?: number;
  speedOffY?: number;
  size?: number;
}

export interface SparkOptions {
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  life: number;
}

// ============================================
// Input Handler Types
// ============================================

export interface InputHandlers {
  onShellLaunch: (x: number, y: number) => void;
  onSpeedChange: (speed: number) => void;
  onPauseToggle: () => void;
  onSoundToggle: () => void;
  onMenuToggle: () => void;
}

// ============================================
// Particle Instance Types
// ============================================

export interface StarInstance {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
  fullLife: number;
  size: number;
  visible: boolean;
  heavy: boolean;
  spinAngle: number;
  spinSpeed: number;
  spinRadius: number;
  sparkFreq: number;
  sparkSpeed: number;
  sparkTimer: number;
  sparkColor: string;
  sparkLife: number;
  sparkLifeVariation: number;
  strobe: boolean;
  strobeFreq?: number;
  secondColor?: string;
  transitionTime?: number;
  colorChanged?: boolean;
  updateFrame?: number;
  onDeath?: (star: StarInstance) => void;
}

export interface SparkInstance {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
}

export interface BurstFlashInstance {
  x: number;
  y: number;
  radius: number;
}

export interface HelpContentItem {
  header: string;
  body: string;
}

export type HelpContentMap = Record<string, HelpContentItem>;

export type AppNodes = Record<string, HTMLElement | null>;

export interface ColorOptions {
  limitWhite?: boolean;
  notSame?: boolean;
  notColor?: string;
}

