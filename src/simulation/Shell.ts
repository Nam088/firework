/**
 * Shell Class - Firework that launches and bursts
 */

import { configManager } from '../config';
import { COLOR, INVISIBLE, PI_2 } from '../config/defaults';
import { particleSystem } from './ParticleSystem';
import { randomColor } from './ShellSystem';
import type { ShellOptions, StarInstance } from '../config/types';

// Forward declaration for audio
let playSound: (type: string, scale?: number) => void = () => {};

export function setAudioCallback(callback: typeof playSound): void {
  playSound = callback;
}

// Forward declaration for effects
let crossetteEffect: (star: StarInstance) => void = () => {};
let floralEffect: (star: StarInstance) => void = () => {};
let fallingLeavesEffect: (star: StarInstance) => void = () => {};
let crackleEffect: (star: StarInstance) => void = () => {};

export function setEffectCallbacks(effects: {
  crossette: typeof crossetteEffect;
  floral: typeof floralEffect;
  fallingLeaves: typeof fallingLeavesEffect;
  crackle: typeof crackleEffect;
}): void {
  crossetteEffect = effects.crossette;
  floralEffect = effects.floral;
  fallingLeavesEffect = effects.fallingLeaves;
  crackleEffect = effects.crackle;
}

// Forward declaration for burst helpers
let createBurst: (count: number, factory: (angle: number, speed: number) => void, startAngle?: number, arcLength?: number) => void = () => {};
let createParticleArc: (start: number, arcLength: number, count: number, randomness: number, factory: (angle: number) => void) => void = () => {};
let createWordBurst: (word: string, factory: (point: { x: number; y: number }, color: string, strobe: boolean, strobeColor: string) => void, x: number, y: number) => void = () => {};
let createHeartBurst: (count: number, factory: (x: number, y: number) => void) => void = () => {};
let createStarBurst: (count: number, factory: (x: number, y: number) => void) => void = () => {};
let randomWord: () => string = () => '';

export function setBurstHelpers(helpers: {
  createBurst: typeof createBurst;
  createParticleArc: typeof createParticleArc;
  createWordBurst: typeof createWordBurst;
  createHeartBurst: typeof createHeartBurst;
  createStarBurst: typeof createStarBurst;
  randomWord: typeof randomWord;
}): void {
  createBurst = helpers.createBurst;
  createParticleArc = helpers.createParticleArc;
  createWordBurst = helpers.createWordBurst;
  createHeartBurst = helpers.createHeartBurst;
  createStarBurst = helpers.createStarBurst;
  randomWord = helpers.randomWord;
}

// MyMath import
import { MyMath } from '../MyMath';

/**
 * Shell class - represents a firework shell
 */
export class Shell implements ShellOptions {
  shellSize: number;
  spreadSize: number;
  starCount: number;
  starLife: number;
  starLifeVariation: number;
  color: string | string[];
  glitterColor: string;
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
  disableWord: boolean;
  heart?: boolean; // Added
  starShape?: boolean; // Added
  comet: StarInstance | null = null;
  
  // Stage dimensions (injected)
  private stageW: number = 0;
  private stageH: number = 0;
  
  constructor(options: ShellOptions) {
    this.shellSize = options.shellSize || 1;
    this.spreadSize = options.spreadSize;
    this.starLife = options.starLife;
    this.starLifeVariation = options.starLifeVariation || 0.125;
    this.color = options.color || randomColor();
    this.glitterColor = options.glitterColor || (typeof this.color === 'string' ? this.color : this.color[0]);
    this.disableWord = options.disableWord || false;
    
    // Copy optional properties
    this.glitter = options.glitter;
    this.pistil = options.pistil;
    this.pistilColor = options.pistilColor;
    this.streamers = options.streamers;
    this.crossette = options.crossette;
    this.floral = options.floral;
    this.crackle = options.crackle;
    this.fallingLeaves = options.fallingLeaves;
    this.horsetail = options.horsetail;
    this.ring = options.ring;
    this.strobe = options.strobe;
    this.strobeColor = options.strobeColor;
    this.secondColor = options.secondColor;
    
    // Calculate star count
    if (options.starCount) {
      this.starCount = options.starCount;
    } else {
      const density = options.starDensity || 1;
      const scaledSize = this.spreadSize / 54;
      this.starCount = Math.max(6, scaledSize * scaledSize * density);
    }
  }
  
  /**
   * Set stage dimensions for launch calculations
   */
  setStage(width: number, height: number): void {
    this.stageW = width;
    this.stageH = height;
  }
  
  /**
   * Launch the shell
   */
  launch(position: number, launchHeight: number): void {
    const quality = configManager.quality;
    const isHighQuality = configManager.isHighQuality;
    
    const width = this.stageW;
    const height = this.stageH;
    const hpad = 60;
    const vpad = 50;
    const minHeightPercent = 0.45;
    const minHeight = height - height * minHeightPercent;
    
    const launchX = position * (width - hpad * 2) + hpad;
    const launchY = height;
    const burstY = minHeight - launchHeight * (minHeight - vpad);
    
    const launchDistance = launchY - burstY;
    const launchVelocity = Math.pow(launchDistance * 0.04, 0.64);
    
    const comet = particleSystem.addStar({
      x: launchX,
      y: launchY,
      color: typeof this.color === 'string' && this.color !== 'random' ? this.color : COLOR.White,
      angle: Math.PI,
      speed: launchVelocity * (this.horsetail ? 1.2 : 1),
      life: launchVelocity * (this.horsetail ? 100 : 400),
    });
    
    this.comet = comet;
    comet.heavy = true;
    comet.spinRadius = MyMath.random(0.32, 0.85);
    comet.sparkFreq = 32 / quality;
    if (isHighQuality) comet.sparkFreq = 8;
    comet.sparkLife = 320;
    comet.sparkLifeVariation = 3;
    
    if (this.glitter === 'willow' || this.fallingLeaves) {
      comet.sparkFreq = 20 / quality;
      comet.sparkSpeed = 0.5;
      comet.sparkLife = 500;
    }
    if (this.color === INVISIBLE) {
      comet.sparkColor = COLOR.Gold;
    }
    
    if (Math.random() > 0.4 && !this.horsetail) {
      comet.secondColor = INVISIBLE;
      comet.transitionTime = Math.pow(Math.random(), 1.5) * 700 + 500;
    }
    
    comet.onDeath = () => this.burst(comet.x, comet.y);
    
    playSound('lift');
  }
  
  /**
   * Burst the shell at position
   */
  burst(x: number, y: number): void {
    const quality = configManager.quality;
    const isHighQuality = configManager.isHighQuality;
    const speed = this.spreadSize / 96;
    
    let color: string | undefined;
    let onDeath: ((star: StarInstance) => void) | undefined;
    let sparkFreq: number | undefined;
    let sparkSpeed: number | undefined;
    let sparkLife: number | undefined;
    let sparkLifeVariation = 0.25;
    let playedDeathSound = false;
    
    // Set death effects
    if (this.crossette) {
      onDeath = (star) => {
        if (!playedDeathSound) {
          playSound('crackleSmall');
          playedDeathSound = true;
        }
        crossetteEffect(star);
      };
    }
    if (this.crackle) {
      onDeath = (star) => {
        if (!playedDeathSound) {
          playSound('crackle');
          playedDeathSound = true;
        }
        crackleEffect(star);
      };
    }
    if (this.floral) onDeath = floralEffect;
    if (this.fallingLeaves) onDeath = fallingLeavesEffect;
    
    // Glitter settings
    if (this.glitter === 'light') {
      sparkFreq = 400; sparkSpeed = 0.3; sparkLife = 300; sparkLifeVariation = 2;
    } else if (this.glitter === 'medium') {
      sparkFreq = 200; sparkSpeed = 0.44; sparkLife = 700; sparkLifeVariation = 2;
    } else if (this.glitter === 'heavy') {
      sparkFreq = 80; sparkSpeed = 0.8; sparkLife = 1400; sparkLifeVariation = 2;
    } else if (this.glitter === 'thick') {
      sparkFreq = 16; sparkSpeed = isHighQuality ? 1.65 : 1.5; sparkLife = 1400; sparkLifeVariation = 3;
    } else if (this.glitter === 'streamer') {
      sparkFreq = 32; sparkSpeed = 1.05; sparkLife = 620; sparkLifeVariation = 2;
    } else if (this.glitter === 'willow') {
      sparkFreq = 120; sparkSpeed = 0.34; sparkLife = 1400; sparkLifeVariation = 3.8;
    }
    
    if (sparkFreq) sparkFreq = sparkFreq / quality;
    
    // Star factory
    const starFactory = (angle: number, speedMult: number) => {
      const standardInitialSpeed = this.spreadSize / 1800;
      
      const star = particleSystem.addStar({
        x,
        y,
        color: color || randomColor(),
        angle,
        speed: speedMult * speed,
        life: this.starLife + Math.random() * this.starLife * this.starLifeVariation,
        speedOffX: this.horsetail ? this.comet?.speedX : 0,
        speedOffY: this.horsetail ? this.comet?.speedY : -standardInitialSpeed,
      });
      
      if (this.secondColor) {
        star.transitionTime = this.starLife * (Math.random() * 0.05 + 0.32);
        star.secondColor = this.secondColor;
      }
      
      if (this.strobe) {
        star.transitionTime = this.starLife * (Math.random() * 0.08 + 0.46);
        star.strobe = true;
        star.strobeFreq = Math.random() * 20 + 40;
        if (this.strobeColor) star.secondColor = this.strobeColor;
      }
      
      star.onDeath = onDeath;
      
      if (this.glitter && sparkFreq) {
        star.sparkFreq = sparkFreq;
        star.sparkSpeed = sparkSpeed!;
        star.sparkLife = sparkLife!;
        star.sparkLifeVariation = sparkLifeVariation;
        star.sparkColor = this.glitterColor;
        star.sparkTimer = Math.random() * star.sparkFreq;
      }
    };
    
    // Create burst pattern
    if (typeof this.color === 'string') {
      if (this.color === 'random') {
        color = undefined;
      } else {
        color = this.color;
      }
      
      if (this.ring) {
        const ringStartAngle = Math.random() * Math.PI;
        const ringSquash = Math.pow(Math.random(), 2) * 0.85 + 0.15;
        
        createParticleArc(0, PI_2, this.starCount, 0, (angle: number) => {
          const initSpeedX = Math.sin(angle) * speed * ringSquash;
          const initSpeedY = Math.cos(angle) * speed;
          
          const newSpeed = MyMath.pointDist(0, 0, initSpeedX, initSpeedY);
          const newAngle = MyMath.pointAngle(0, 0, initSpeedX, initSpeedY) + ringStartAngle;
          
          const star = particleSystem.addStar({
            x, y, color: color!, angle: newAngle, speed: newSpeed,
            life: this.starLife + Math.random() * this.starLife * this.starLifeVariation,
          });
          
          if (this.glitter && sparkFreq) {
            star.sparkFreq = sparkFreq;
            star.sparkSpeed = sparkSpeed!;
            star.sparkLife = sparkLife!;
            star.sparkLifeVariation = sparkLifeVariation;
            star.sparkColor = this.glitterColor;
            star.sparkTimer = Math.random() * star.sparkFreq;
          }
        });
      } else if (this.heart) {
        createHeartBurst(this.starCount, (bx, by) => {
          const angle = Math.atan2(by, bx);
          const dist = Math.sqrt(bx * bx + by * by);
          // Scale speed based on distance. 
          // Simulation.ts output is now normalized to ~1.0. 
          // Previous scaling of 0.15 was too small because coordinates are already small.
          // Using dist directly will map max radius to normal shell speed.
          starFactory(angle, dist); 
        });
      } else if (this.starShape) {
        createStarBurst(this.starCount, (bx, by) => {
          const angle = Math.atan2(by, bx);
          const dist = Math.sqrt(bx * bx + by * by);
          starFactory(angle, dist); 
        });
      } else {
        createBurst(this.starCount, starFactory);
      }
    } else if (Array.isArray(this.color)) {
      if (Math.random() < 0.5) {
        const start = Math.random() * Math.PI;
        color = this.color[0];
        createBurst(this.starCount, starFactory, start, Math.PI);
        color = this.color[1];
        createBurst(this.starCount, starFactory, start + Math.PI, Math.PI);
      } else {
        color = this.color[0];
        createBurst(this.starCount / 2, starFactory);
        color = this.color[1];
        createBurst(this.starCount / 2, starFactory);
      }
    }
    
    // Word burst
    if (!this.disableWord && configManager.get('wordShell')) {
      if (Math.random() < 0.1 && Math.random() < 0.5) {
        createWordBurst(randomWord(), (point: any, starColor: string) => {
          particleSystem.addSpark({
            x: point.x, y: point.y,
            color: starColor,
            angle: Math.random() * PI_2,
            speed: Math.pow(Math.random(), 0.15) * 1.4,
            life: this.starLife + Math.random() * this.starLife * this.starLifeVariation + 1000,
          });
        }, x, y);
      }
    }
    
    // Pistil
    if (this.pistil) {
      const innerShell = new Shell({
        shellSize: this.shellSize,
        spreadSize: this.spreadSize * 0.5,
        starLife: this.starLife * 0.6,
        starLifeVariation: this.starLifeVariation,
        starDensity: 1.4,
        color: this.pistilColor,
        glitter: 'light',
        disableWord: true,
        glitterColor: this.pistilColor === COLOR.Gold ? COLOR.Gold : COLOR.White,
      });
      innerShell.setStage(this.stageW, this.stageH);
      innerShell.burst(x, y);
    }
    
    // Streamers
    if (this.streamers) {
      const innerShell = new Shell({
        shellSize: this.shellSize,
        spreadSize: this.spreadSize * 0.9,
        starLife: this.starLife * 0.8,
        starLifeVariation: this.starLifeVariation,
        starCount: Math.floor(Math.max(6, this.spreadSize / 45)),
        color: COLOR.White,
        disableWord: true,
        glitter: 'streamer',
      });
      innerShell.setStage(this.stageW, this.stageH);
      innerShell.burst(x, y);
    }
    
    // Burst flash
    particleSystem.addFlash(x, y, this.spreadSize / 4);
    
    // Play burst sound
    if (this.comet) {
      const selectedSize = configManager.get('size');
      const maxDiff = 2;
      const sizeDiff = Math.min(maxDiff, selectedSize - this.shellSize);
      const soundScale = (1 - sizeDiff / maxDiff) * 0.3 + 0.7;
      playSound('burst', soundScale);
    }
  }
}
