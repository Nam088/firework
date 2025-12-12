/**
 * ShellSystem - Shell Factory Registry
 * 
 * Manages shell type factories and provides shell creation.
 * FIXED: Updated to match original main.ts logic exactly.
 */

import { configManager } from '../config';
import { COLOR, INVISIBLE, PI_2 } from '../config/defaults';
import type { ShellOptions, ShellFactory, ShellTypeName } from '../config/types';

// ============================================
// Color Utilities (matching main.ts exactly)
// ============================================

const COLOR_NAMES = Object.keys(COLOR) as (keyof typeof COLOR)[];

function randomColorSimple(): string {
  return COLOR[COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)]];
}

interface RandomColorOptions {
  limitWhite?: boolean;
  notSame?: boolean;
  notColor?: string;
}

function randomColor(options?: RandomColorOptions): string {
  const notSame = options?.notSame;
  const notColor = options?.notColor;
  const limitWhite = options?.limitWhite;
  let color = randomColorSimple();

  // Limit white to 12% of the time
  if (limitWhite && color === COLOR.White && Math.random() < 0.88) {
    color = randomColorSimple();
  }

  if (notSame) {
    return randomColorSimple();
  } else if (notColor) {
    if (color === notColor) {
      color = randomColorSimple();
    }
    return color;
  } else {
    return color;
  }
}

function whiteOrGold(): string {
  return Math.random() < 0.5 ? COLOR.Gold : COLOR.White;
}

function makePistilColor(shellColor: string | string[]): string {
  const color = typeof shellColor === 'string' ? shellColor : shellColor[0];
  return color === COLOR.White || color === COLOR.Gold
    ? randomColor()
    : whiteOrGold();
}

// ============================================
// Quality flags (accessed via configManager)
// ============================================

function getIsLowQuality(): boolean {
  return configManager.isLowQuality;
}

function getIsHighQuality(): boolean {
  return configManager.isHighQuality;
}

// ============================================
// Shell Factory Functions (matching main.ts)
// ============================================

const crysanthemumShell: ShellFactory = (size = 1) => {
  const glitter = Math.random() < 0.25;
  const singleColor = Math.random() < 0.72;
  const color = singleColor 
    ? randomColor({ limitWhite: true }) 
    : [randomColor(), randomColor({ notSame: true })];
  const pistil = singleColor && Math.random() < 0.42;
  const pistilColor = pistil ? makePistilColor(color) : undefined;
  const secondColor = singleColor && (Math.random() < 0.2 || (typeof color === 'string' && color === COLOR.White)) 
    ? (pistilColor || randomColor({ notColor: typeof color === 'string' ? color : color[0], limitWhite: true })) 
    : undefined;
  const streamers = !pistil && color !== COLOR.White && Math.random() < 0.42;
  
  let starDensity = glitter ? 1.1 : 1.25;
  if (getIsLowQuality()) starDensity *= 0.8;
  if (getIsHighQuality()) starDensity = 1.2;

  return {
    shellSize: size,
    spreadSize: 300 + size * 100,
    starLife: 900 + size * 200,
    starDensity,
    color,
    secondColor,
    glitter: glitter ? 'light' : undefined,
    glitterColor: whiteOrGold(),
    pistil,
    pistilColor,
    streamers,
  };
};

const ghostShell: ShellFactory = (size = 1) => {
  // Extend crysanthemum shell
  const shell = crysanthemumShell(size);
  // Ghost effect can be fast, so extend star life
  shell.starLife = (shell.starLife || 900) * 1.5;
  // Ensure we always have a single color other than white
  const ghostColor = randomColor({ notColor: COLOR.White });
  // Always use streamers, and sometimes a pistil
  shell.streamers = true;
  const pistil = Math.random() < 0.42;
  const pistilColor = pistil ? makePistilColor(ghostColor) : undefined;
  // Ghost effect - transition from invisible to chosen color
  shell.color = INVISIBLE;
  shell.secondColor = ghostColor;
  shell.pistil = pistil;
  shell.pistilColor = pistilColor;
  // We don't want glitter to be spewed by invisible stars
  shell.glitter = undefined;

  return shell;
};

const strobeShell: ShellFactory = (size = 1) => {
  const color = randomColor({ limitWhite: true });
  return {
    shellSize: size,
    spreadSize: 280 + size * 92,
    starLife: 1100 + size * 200,
    starLifeVariation: 0.4,
    starDensity: 1.1,
    color,
    glitter: 'light',
    glitterColor: COLOR.White,
    strobe: true,
    strobeColor: Math.random() < 0.5 ? COLOR.White : undefined,
    pistil: Math.random() < 0.5,
    pistilColor: makePistilColor(color),
  };
};

const palmShell: ShellFactory = (size = 1) => {
  const color = randomColor();
  const thick = Math.random() < 0.5;
  return {
    shellSize: size,
    color,
    spreadSize: 250 + size * 75,
    starDensity: thick ? 0.15 : 0.4,
    starLife: 1800 + size * 200,
    glitter: thick ? 'thick' : 'heavy',
  };
};

const ringShell: ShellFactory = (size = 1) => {
  const color = randomColor();
  const pistil = Math.random() < 0.75;
  return {
    shellSize: size,
    ring: true,
    color,
    spreadSize: 300 + size * 100,
    starLife: 900 + size * 200,
    starCount: 2.2 * PI_2 * (size + 1),
    pistil,
    pistilColor: makePistilColor(color),
    glitter: !pistil ? 'light' : undefined,
    glitterColor: color === COLOR.Gold ? COLOR.Gold : COLOR.White,
    streamers: Math.random() < 0.3,
  };
};

const crossetteShell: ShellFactory = (size = 1) => {
  const color = randomColor({ limitWhite: true });
  return {
    shellSize: size,
    spreadSize: 300 + size * 100,
    starLife: 750 + size * 160,
    starLifeVariation: 0.4,
    starDensity: 0.85,
    color,
    crossette: true,
    pistil: Math.random() < 0.5,
    pistilColor: makePistilColor(color),
  };
};

const floralShell: ShellFactory = (size = 1) => {
  // More variety in color selection like original
  let color: string | string[];
  if (Math.random() < 0.65) {
    color = 'random';
  } else if (Math.random() < 0.15) {
    color = randomColor();
  } else {
    color = [randomColor(), randomColor({ notSame: true })];
  }
  
  return {
    shellSize: size,
    spreadSize: 300 + size * 120,
    starDensity: 0.12,
    starLife: 500 + size * 50,
    starLifeVariation: 0.5,
    color,
    floral: true,
  };
};

const fallingLeavesShell: ShellFactory = (size = 1) => ({
  shellSize: size,
  color: INVISIBLE,
  spreadSize: 300 + size * 120,
  starDensity: 0.12,
  starLife: 500 + size * 50,
  starLifeVariation: 0.5,
  glitter: 'medium',
  glitterColor: COLOR.Gold,
  fallingLeaves: true,
});

const willowShell: ShellFactory = (size = 1) => ({
  shellSize: size,
  spreadSize: 300 + size * 100,
  starDensity: 0.6,
  starLife: 3000 + size * 300,
  glitter: 'willow',
  glitterColor: COLOR.Gold,
  color: INVISIBLE,
});

const crackleShell: ShellFactory = (size = 1) => {
  // favor gold
  const color = Math.random() < 0.75 ? COLOR.Gold : randomColor();
  return {
    shellSize: size,
    spreadSize: 380 + size * 75,
    starDensity: getIsLowQuality() ? 0.65 : 1,
    starLife: 600 + size * 100,
    starLifeVariation: 0.32,
    glitter: 'light',
    glitterColor: COLOR.Gold,
    color,
    crackle: true,
    pistil: Math.random() < 0.65,
    pistilColor: makePistilColor(color),
  };
};

const horsetailShell: ShellFactory = (size = 1) => {
  const color = randomColor();
  return {
    shellSize: size,
    horsetail: true,
    color,
    spreadSize: 250 + size * 38,
    starDensity: 0.9,
    starLife: 2500 + size * 300,
    glitter: 'medium',
    glitterColor: Math.random() < 0.5 ? whiteOrGold() : color,
    // Add strobe effect to white horsetails, to make them more interesting
    strobe: color === COLOR.White,
  };
};

const heartShell: ShellFactory = (size = 1) => ({
  shellSize: size,
  spreadSize: 300 + size * 100,
  starLife: 1000 + size * 200,
  starLifeVariation: 0.5,
  starDensity: 1.2,
  color: COLOR.Red,
  glitter: 'light',
  glitterColor: COLOR.Gold,
  heart: true,
});

const starShell: ShellFactory = (size = 1) => ({
  shellSize: size,
  spreadSize: 300 + size * 100,
  starLife: 1000 + size * 200,
  starLifeVariation: 0.5,
  starDensity: 1.2,
  color: COLOR.Gold,
  glitter: 'light',
  glitterColor: COLOR.White,
  starShape: true,
});

// ============================================
// ShellSystem Class
// ============================================

export class ShellSystem {
  private types: Map<ShellTypeName, ShellFactory> = new Map();
  private typeNames: ShellTypeName[] = [];
  
  // Blacklist for "fast" shells
  private fastShellBlacklist: ShellTypeName[] = ['Falling Leaves', 'Floral', 'Willow'];
  
  constructor() {
    // Register all shell types
    this.register('Crysanthemum', crysanthemumShell);
    this.register('Ghost', ghostShell);
    this.register('Strobe', strobeShell);
    this.register('Palm', palmShell);
    this.register('Ring', ringShell);
    this.register('Crossette', crossetteShell);
    this.register('Floral', floralShell);
    this.register('Falling Leaves', fallingLeavesShell);
    this.register('Willow', willowShell);
    this.register('Crackle', crackleShell);
    this.register('Horse Tail', horsetailShell);
    this.register('Heart', heartShell);
    this.register('Star', starShell);
  }
  
  /**
   * Register a shell factory
   */
  register(name: ShellTypeName, factory: ShellFactory): void {
    this.types.set(name, factory);
    if (name !== 'Random') {
      this.typeNames.push(name);
    }
  }
  
  /**
   * Get a shell factory by name
   */
  getFactory(name: ShellTypeName): ShellFactory | undefined {
    return this.types.get(name);
  }
  
  /**
   * Create shell options
   */
  createOptions(type: ShellTypeName, size: number): ShellOptions {
    if (type === 'Random') {
      return this.createRandomOptions(size);
    }
    
    const factory = this.types.get(type);
    if (!factory) {
      throw new Error(`Unknown shell type: ${type}`);
    }
    return factory(size);
  }
  
  /**
   * Get a random shell name (matching main.ts logic)
   */
  getRandomTypeName(): ShellTypeName {
    // Favor crysanthemum 50% of the time
    if (Math.random() < 0.5) {
      return 'Crysanthemum';
    }
    // Otherwise pick from other shells (excluding Random at index 0)
    return this.typeNames[Math.floor(Math.random() * this.typeNames.length)];
  }
  
  /**
   * Create random shell options
   */
  createRandomOptions(size: number): ShellOptions {
    const typeName = this.getRandomTypeName();
    const factory = this.types.get(typeName)!;
    return factory(size);
  }
  
  /**
   * Get a fast shell factory (excludes slow variants)
   */
  getFastFactory(): ShellFactory {
    const selectedShell = configManager.get('shell');
    const isRandom = selectedShell === 'Random';
    
    let typeName: ShellTypeName = isRandom ? this.getRandomTypeName() : selectedShell;
    
    if (isRandom) {
      while (this.fastShellBlacklist.includes(typeName)) {
        typeName = this.getRandomTypeName();
      }
    }
    
    return this.types.get(typeName)!;
  }
  
  /**
   * Get shell options based on current config
   */
  getConfiguredOptions(size: number): ShellOptions {
    const selectedShell = configManager.get('shell');
    return this.createOptions(selectedShell, size);
  }
  
  /**
   * Get all type names
   */
  getTypeNames(): ShellTypeName[] {
    return ['Random', ...this.typeNames];
  }
}

// ============================================
// Singleton Export
// ============================================

export const shellSystem = new ShellSystem();

// Re-export utilities
export { randomColor, randomColorSimple, whiteOrGold, makePistilColor };
