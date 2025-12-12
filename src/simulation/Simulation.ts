/**
 * Simulation - Main game logic coordinator
 * 
 * Orchestrates particles, shells, and sequences.
 */

import { configManager } from '../config';
import { GRAVITY, IS_DESKTOP, IS_HEADER, PI_2, PI_HALF, INVISIBLE, COLOR } from '../config/defaults';
import { particleSystem, COLOR_CODES } from './ParticleSystem';
import { shellSystem, randomColor } from './ShellSystem';
import { Shell, setAudioCallback, setBurstHelpers, setEffectCallbacks } from './Shell';
import { MyMath } from '../MyMath';
import type { StarInstance } from '../config/types';

export class Simulation {
  // Stage dimensions
  private stageW: number = 0;
  private stageH: number = 0;
  
  // Frame tracking
  private currentFrame: number = 0;
  private autoLaunchTime: number = 0;
  
  // Sequence state
  private isFirstSeq: boolean = true;
  private finaleCount: number = 32;
  private currentFinaleCount: number = 0;
  
  // Sequence cooldowns
  private seqSmallBarrageCooldown: number = 15000;
  private seqSmallBarrageLastCalled: number = Date.now();
  
  // Audio callback for effects
  private audioCallback: (type: string, scale?: number) => void = () => {};
  
  constructor() {
    // Set up burst helpers for Shell class
    setBurstHelpers({
      createBurst: this.createBurst.bind(this),
      createParticleArc: this.createParticleArc.bind(this),
      createWordBurst: this.createWordBurst.bind(this),
      createHeartBurst: this.createHeartBurst.bind(this),
      createStarBurst: this.createStarBurst.bind(this),
      randomWord: this.randomWord.bind(this),
    });
    
    // Set up effects
    setEffectCallbacks({
      crossette: this.crossetteEffect.bind(this),
      floral: this.floralEffect.bind(this),
      fallingLeaves: this.fallingLeavesEffect.bind(this),
      crackle: this.crackleEffect.bind(this),
    });
  }
  
  /**
   * Set audio callback for Shell class
   */
  setAudioCallback(callback: (type: string, scale?: number) => void): void {
    this.audioCallback = callback;
    setAudioCallback(callback);
  }
  
  /**
   * Update stage dimensions
   */
  setStage(width: number, height: number): void {
    this.stageW = width;
    this.stageH = height;
  }
  
  // ============================================
  // Main Update Loop
  // ============================================
  
  /**
   * Update simulation state
   */
  update(timeStep: number, speed: number): void {
    this.currentFrame++;
    
    // Auto launch
    if (configManager.get('autoLaunch')) {
      this.autoLaunchTime -= timeStep;
      if (this.autoLaunchTime <= 0) {
        this.autoLaunchTime = this.startSequence() * 1.25;
      }
    }
    
    // Update particles
    particleSystem.update(timeStep, speed, GRAVITY, this.currentFrame);
  }
  
  // ============================================
  // Shell Launching
  // ============================================
  
  /**
   * Get random shell size with position
   */
  getRandomShellSize(): { size: number; x: number; height: number } {
    const baseSize = configManager.get('size');
    const maxVariance = Math.min(2.5, baseSize);
    const variance = Math.random() * maxVariance;
    const size = baseSize - variance;
    const height = maxVariance === 0 ? Math.random() : 1 - variance / maxVariance;
    const centerOffset = Math.random() * (1 - height * 0.65) * 0.5;
    const x = Math.random() < 0.5 ? 0.5 - centerOffset : 0.5 + centerOffset;
    
    return {
      size,
      x: this.fitShellPositionH(x),
      height: this.fitShellPositionV(height),
    };
  }
  
  private fitShellPositionH(position: number): number {
    const edge = 0.18;
    return (1 - edge * 2) * position + edge;
  }
  
  private fitShellPositionV(position: number): number {
    return position * 0.75;
  }
  
  /**
   * Launch shell from user click
   */
  launchShellFromClick(x: number, y: number, stageWidth: number, stageHeight: number): void {
    const size = configManager.get('size');
    const shell = new Shell(shellSystem.getConfiguredOptions(size));
    shell.setStage(this.stageW, this.stageH);
    shell.launch(x / stageWidth, 1 - y / stageHeight);
  }
  
  /**
   * Launch a configured shell
   */
  launchShell(x: number, height: number, size: number): void {
    const shell = new Shell(shellSystem.getConfiguredOptions(size));
    shell.setStage(this.stageW, this.stageH);
    shell.launch(x, height);
  }
  
  // ============================================
  // Sequences
  // ============================================
  
  /**
   * Start a random sequence
   */
  startSequence(): number {
    if (this.isFirstSeq) {
      this.isFirstSeq = false;
      if (IS_HEADER) {
        return this.seqTwoRandom();
      } else {
        const shell = new Shell(shellSystem.createOptions('Crysanthemum', configManager.get('size')));
        shell.setStage(this.stageW, this.stageH);
        shell.launch(0.5, 0.5);
        return 2400;
      }
    }
    
    if (configManager.get('finale')) {
      this.seqRandomFastShell();
      if (this.currentFinaleCount < this.finaleCount) {
        this.currentFinaleCount++;
        return 170;
      } else {
        this.currentFinaleCount = 0;
        return 6000;
      }
    }
    
    const rand = Math.random();
    
    if (rand < 0.08 && Date.now() - this.seqSmallBarrageLastCalled > this.seqSmallBarrageCooldown) {
      return this.seqSmallBarrage();
    }
    
    if (rand < 0.1) return this.seqPyramid();
    if (rand < 0.6 && !IS_HEADER) return this.seqRandomShell();
    if (rand < 0.8) return this.seqTwoRandom();
    return this.seqTriple();
  }
  
  private seqRandomShell(): number {
    const size = this.getRandomShellSize();
    const shell = new Shell(shellSystem.getConfiguredOptions(size.size));
    shell.setStage(this.stageW, this.stageH);
    shell.launch(size.x, size.height);
    
    let extraDelay = shell.starLife;
    if (shell.fallingLeaves) extraDelay = 4600;
    
    return 900 + Math.random() * 600 + extraDelay;
  }
  
  private seqRandomFastShell(): number {
    const size = this.getRandomShellSize();
    const shell = new Shell(shellSystem.getFastFactory()(size.size));
    shell.setStage(this.stageW, this.stageH);
    shell.launch(size.x, size.height);
    return 900 + Math.random() * 600 + shell.starLife;
  }
  
  private seqTwoRandom(): number {
    const size1 = this.getRandomShellSize();
    const size2 = this.getRandomShellSize();
    const shell1 = new Shell(shellSystem.getConfiguredOptions(size1.size));
    const shell2 = new Shell(shellSystem.getConfiguredOptions(size2.size));
    shell1.setStage(this.stageW, this.stageH);
    shell2.setStage(this.stageW, this.stageH);
    
    const leftOffset = Math.random() * 0.2 - 0.1;
    const rightOffset = Math.random() * 0.2 - 0.1;
    
    shell1.launch(0.3 + leftOffset, size1.height);
    setTimeout(() => shell2.launch(0.7 + rightOffset, size2.height), 100);
    
    let extraDelay = Math.max(shell1.starLife, shell2.starLife);
    if (shell1.fallingLeaves || shell2.fallingLeaves) extraDelay = 4600;
    
    return 900 + Math.random() * 600 + extraDelay;
  }
  
  private seqTriple(): number {
    const shellFactory = shellSystem.getFastFactory();
    const baseSize = configManager.get('size');
    const smallSize = Math.max(0, baseSize - 1.25);
    
    const shell1 = new Shell(shellFactory(baseSize));
    shell1.setStage(this.stageW, this.stageH);
    shell1.launch(0.5 + Math.random() * 0.08 - 0.04, 0.7);
    
    setTimeout(() => {
      const shell = new Shell(shellFactory(smallSize));
      shell.setStage(this.stageW, this.stageH);
      shell.launch(0.2 + Math.random() * 0.08 - 0.04, 0.1);
    }, 1000 + Math.random() * 400);
    
    setTimeout(() => {
      const shell = new Shell(shellFactory(smallSize));
      shell.setStage(this.stageW, this.stageH);
      shell.launch(0.8 + Math.random() * 0.08 - 0.04, 0.1);
    }, 1000 + Math.random() * 400);
    
    return 4000;
  }
  
  private seqPyramid(): number {
    const barrageCountHalf = IS_DESKTOP ? 7 : 4;
    const largeSize = configManager.get('size');
    const smallSize = Math.max(0, largeSize - 3);
    
    let count = 0;
    let delay = 0;
    
    while (count <= barrageCountHalf) {
      const currentCount = count;
      const currentDelay = delay;
      
      if (currentCount === barrageCountHalf) {
        setTimeout(() => {
          const shell = new Shell(shellSystem.getConfiguredOptions(largeSize));
          shell.setStage(this.stageW, this.stageH);
          shell.launch(0.5, 0.75);
        }, currentDelay);
      } else {
        const offset = (currentCount / barrageCountHalf) * 0.5;
        setTimeout(() => {
          const shell = new Shell(shellSystem.getConfiguredOptions(smallSize));
          shell.setStage(this.stageW, this.stageH);
          const height = offset <= 0.5 ? offset / 0.5 : (1 - offset) / 0.5;
          shell.launch(offset, height * 0.42);
        }, currentDelay);
        setTimeout(() => {
          const shell = new Shell(shellSystem.getConfiguredOptions(smallSize));
          shell.setStage(this.stageW, this.stageH);
          const height = (1 - offset) <= 0.5 ? (1 - offset) / 0.5 : (offset) / 0.5;
          shell.launch(1 - offset, height * 0.42);
        }, currentDelay + Math.random() * 30 + 30);
      }
      
      count++;
      delay += 200;
    }
    
    return 3400 + barrageCountHalf * 250;
  }
  
  private seqSmallBarrage(): number {
    this.seqSmallBarrageLastCalled = Date.now();
    const barrageCount = IS_DESKTOP ? 11 : 5;
    const shellSize = Math.max(0, configManager.get('size') - 2);
    
    let count = 0;
    let delay = 0;
    
    while (count < barrageCount) {
      const currentDelay = delay;
      
      if (count === 0) {
        const shell = new Shell(shellSystem.getConfiguredOptions(shellSize));
        shell.setStage(this.stageW, this.stageH);
        shell.launch(0.5, ((Math.cos(0.5 * 5 * Math.PI + PI_HALF) + 1) / 2) * 0.75);
        count += 1;
      } else {
        const offset = (count + 1) / barrageCount / 2;
        setTimeout(() => {
          const shell = new Shell(shellSystem.getConfiguredOptions(shellSize));
          shell.setStage(this.stageW, this.stageH);
          const height = (Math.cos((0.5 + offset) * 5 * Math.PI + PI_HALF) + 1) / 2;
          shell.launch(0.5 + offset, height * 0.75);
        }, currentDelay);
        setTimeout(() => {
          const shell = new Shell(shellSystem.getConfiguredOptions(shellSize));
          shell.setStage(this.stageW, this.stageH);
          const height = (Math.cos((0.5 - offset) * 5 * Math.PI + PI_HALF) + 1) / 2;
          shell.launch(0.5 - offset, height * 0.75);
        }, currentDelay + Math.random() * 30 + 30);
        count += 2;
      }
      delay += 200;
    }
    
    return 3400 + barrageCount * 120;
  }
  
  // ============================================
  // Burst Helpers
  // ============================================
  
  createParticleArc(
    start: number,
    arcLength: number,
    count: number,
    randomness: number,
    factory: (angle: number) => void
  ): void {
    const angleDelta = arcLength / count;
    const end = start + arcLength - angleDelta * 0.5;
    
    if (end > start) {
      for (let angle = start; angle < end; angle += angleDelta) {
        factory(angle + Math.random() * angleDelta * randomness);
      }
    } else {
      for (let angle = start; angle > end; angle += angleDelta) {
        factory(angle + Math.random() * angleDelta * randomness);
      }
    }
  }
  
  createBurst(
    count: number,
    factory: (angle: number, speedMult: number) => void,
    startAngle: number = 0,
    arcLength: number = PI_2
  ): void {
    const R = 0.5 * Math.sqrt(count / Math.PI);
    const C = 2 * R * Math.PI;
    const C_HALF = C / 2;
    
    for (let i = 0; i <= C_HALF; i++) {
      const ringAngle = (i / C_HALF) * PI_HALF;
      const ringSize = Math.cos(ringAngle);
      const partsPerFullRing = C * ringSize;
      const partsPerArc = partsPerFullRing * (arcLength / PI_2);
      
      const angleInc = PI_2 / partsPerFullRing;
      const angleOffset = Math.random() * angleInc + startAngle;
      const maxRandomAngleOffset = angleInc * 0.33;
      
      for (let j = 0; j < partsPerArc; j++) {
        const randomAngleOffset = Math.random() * maxRandomAngleOffset;
        const angle = angleInc * j + angleOffset + randomAngleOffset;
        factory(angle, ringSize);
      }
    }
  }
  
  createWordBurst(
    wordText: string,
    factory: (point: { x: number; y: number }, color: string, strobe: boolean, strobeColor: string) => void,
    center_x: number,
    center_y: number
  ): void {
    const fontSize = Math.floor(Math.random() * 70 + 60);
    const map = MyMath.literalLattice(wordText, 3, 'Gabriola,华文琥珀', fontSize + 'px');
    if (!map) return;
    
    const dcenterX = map.width / 2;
    const dcenterY = map.height / 2;
    const color = randomColor();
    const strobed = Math.random() < 0.5;
    const strobeColor = strobed ? randomColor() : color;
    
    for (let i = 0; i < map.points.length; i++) {
      const point = map.points[i];
      factory(
        { x: center_x + (point.x - dcenterX), y: center_y + (point.y - dcenterY) },
        color,
        strobed,
        strobeColor
      );
    }
  }
  
  randomWord(): string {
    const words = [
      'Glow', 'Spark', 'Fire', 'Light', 'Star', 'Burst', 'Pop', 'Boom',
      '2025', 'Wow', 'Cool', 'Yay', 'Fun', 'Love', 'Happy', 'Dream'
    ];
    return words[Math.floor(Math.random() * words.length)];
  }

  createHeartBurst(
    count: number,
    factory: (x: number, y: number) => void
  ): void {
    const layerCount = Math.floor(count / 14) || 1;
    
    for (let layer = 0; layer < layerCount; layer++) {
      // Normalize radius: inner layers are smaller, outer layer is size 1.0
      // Avoid radius 0 for the first layer
      const radius = 0.25 + (layer / layerCount) * 0.75;
      const angleCount = Math.floor((radius * count) / layerCount * 2.5) + 10;
      const angleInc = PI_2 / angleCount;
      
      for (let i = 0; i < angleCount; i++) {
        const angle = i * angleInc;
        // Heart parametric equation from: http://mathworld.wolfram.com/HeartCurve.html
        // Max X is 16, Max Y is ~17. Normalize to ~1.0
        const scale = radius * 0.06; 
        const x = 16 * Math.pow(Math.sin(angle), 3) * scale;
        const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * scale;
        
        factory(x, y);
      }
    }
  }
  
  createStarBurst(
    count: number,
    factory: (x: number, y: number) => void
  ): void {
    const points = 5;
    const layerCount = Math.floor(count / 14) || 1;
    const innerOuterRatio = 0.5;
    
    for (let layer = 0; layer < layerCount; layer++) {
      const radius = 0.3 + (layer / layerCount) * 0.7;
      const pointsPerLayer = Math.floor((radius * count) / layerCount * 3) + 10;
      
      for (let i = 0; i < pointsPerLayer; i++) {
        const angle = (i / pointsPerLayer) * PI_2;
        const segmentAngle = PI_2 / points;
        const segmentProgress = (angle % segmentAngle) / segmentAngle;
        
        let r = 1;
        if (segmentProgress < 0.5) {
            const p = segmentProgress * 2;
            r = (1 - p) * 1.0 + p * innerOuterRatio;
        } else {
            const p = (segmentProgress - 0.5) * 2;
            r = (1 - p) * innerOuterRatio + p * 1.0;
        }
        
        const finalX = Math.sin(angle) * r * radius;
        const finalY = -Math.cos(angle) * r * radius;
        
        factory(finalX, finalY);
      }
    }
  }
  
  // ============================================
  // Effects
  // ============================================
  
  crossetteEffect(star: StarInstance): void {
    const startAngle = Math.random() * PI_HALF;
    this.createParticleArc(startAngle, PI_2, 4, 0.5, (angle: number) => {
      particleSystem.addStar({
        x: star.x, y: star.y,
        color: star.color,
        angle,
        speed: Math.random() * 0.6 + 0.75,
        life: 600,
      });
    });
  }
  
  floralEffect(star: StarInstance): void {
    const quality = configManager.quality;
    const count = 12 + 6 * quality;
    this.createBurst(count, (angle: number, speedMult: number) => {
      particleSystem.addStar({
        x: star.x, y: star.y,
        color: star.color,
        angle,
        speed: speedMult * 2.4,
        life: 1000 + Math.random() * 300,
        speedOffX: star.speedX,
        speedOffY: star.speedY,
      });
    });
    particleSystem.addFlash(star.x, star.y, 46);
    this.audioCallback('burstSmall');
  }
  
  fallingLeavesEffect(star: StarInstance): void {
    this.createBurst(7, (angle: number, speedMult: number) => {
      const newStar = particleSystem.addStar({
        x: star.x, y: star.y,
        color: INVISIBLE,
        angle,
        speed: speedMult * 2.4,
        life: 2400 + Math.random() * 600,
        speedOffX: star.speedX,
        speedOffY: star.speedY,
      });
      
      newStar.sparkColor = COLOR.Gold;
      newStar.sparkFreq = 144 / configManager.quality;
      newStar.sparkSpeed = 0.28;
      newStar.sparkLife = 750;
      newStar.sparkLifeVariation = 3.2;
    });
    particleSystem.addFlash(star.x, star.y, 46);
    this.audioCallback('burstSmall');
  }
  
  crackleEffect(star: StarInstance): void {
    const count = configManager.isHighQuality ? 32 : 16;
    this.createParticleArc(0, PI_2, count, 1.8, (angle: number) => {
      particleSystem.addSpark({
        x: star.x, y: star.y,
        color: COLOR.Gold,
        angle,
        speed: Math.pow(Math.random(), 0.45) * 2.4,
        life: 300 + Math.random() * 200,
      });
    });
  }
}

// ============================================
// Singleton Export
// ============================================

export const simulation = new Simulation();
