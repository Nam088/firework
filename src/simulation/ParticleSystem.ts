/**
 * ParticleSystem - Manages all particle pools (Stars, Sparks, Flashes)
 */

import { ObjectPool } from '../utils/ObjectPool';
import { configManager } from '../config';
import { COLOR, INVISIBLE, PI_2 } from '../config/defaults';
import type { StarInstance, SparkInstance, BurstFlashInstance, StarOptions, SparkOptions } from '../config/types';

// ============================================
// Color Utilities
// ============================================

const COLOR_NAMES = Object.keys(COLOR);
const COLOR_CODES = COLOR_NAMES.map((name) => COLOR[name as keyof typeof COLOR]);
const COLOR_CODES_W_INVIS = [...COLOR_CODES, INVISIBLE];

// Color tuples for sky coloring
const COLOR_TUPLES: Record<string, { r: number; g: number; b: number }> = {};
COLOR_CODES.forEach((hex) => {
  COLOR_TUPLES[hex] = {
    r: parseInt(hex.substr(1, 2), 16),
    g: parseInt(hex.substr(3, 2), 16),
    b: parseInt(hex.substr(5, 2), 16),
  };
});

export { COLOR_CODES, COLOR_CODES_W_INVIS, COLOR_TUPLES };

// ============================================
// ParticleSystem Class
// ============================================

export class ParticleSystem {
  // Object pools
  private starPool: ObjectPool<StarInstance>;
  private sparkPool: ObjectPool<SparkInstance>;
  private flashPool: ObjectPool<BurstFlashInstance>;
  
  // Active particles by color for efficient rendering
  public activeStars: Record<string, StarInstance[]> = {};
  public activeSparks: Record<string, SparkInstance[]> = {};
  public activeFlashes: BurstFlashInstance[] = [];
  
  // Physics constants
  public starAirDrag = 0.98;
  public starAirDragHeavy = 0.992;
  public sparkAirDrag = 0.9;
  
  // Rendering settings
  public sparkDrawWidth = 2;
  
  constructor() {
    // Initialize star pool
    this.starPool = new ObjectPool<StarInstance>(
      () => this.createStar(),
      (star) => this.resetStar(star)
    );
    
    // Initialize spark pool
    this.sparkPool = new ObjectPool<SparkInstance>(
      () => this.createSpark(),
      (spark) => this.resetSpark(spark)
    );
    
    // Initialize flash pool
    this.flashPool = new ObjectPool<BurstFlashInstance>(
      () => ({ x: 0, y: 0, radius: 0 }),
      () => {}
    );
    
    // Initialize color-keyed collections
    COLOR_CODES_W_INVIS.forEach((color) => {
      this.activeStars[color] = [];
      this.activeSparks[color] = [];
    });
    
    // Subscribe to config changes
    configManager.subscribe(() => {
      const computed = configManager.getComputed();
      this.sparkDrawWidth = computed.sparkDrawWidth;
    });

    // Initialize with correct width from config
    const computed = configManager.getComputed();
    this.sparkDrawWidth = computed.sparkDrawWidth;
  }
  
  // ============================================
  // Star Management
  // ============================================
  
  private createStar(): StarInstance {
    return {
      x: 0, y: 0, prevX: 0, prevY: 0,
      color: '', speedX: 0, speedY: 0,
      life: 0, fullLife: 0, size: 3,
      visible: true, heavy: false,
      spinAngle: 0, spinSpeed: 0.8, spinRadius: 0,
      sparkFreq: 0, sparkSpeed: 1, sparkTimer: 0,
      sparkColor: '', sparkLife: 750, sparkLifeVariation: 0.25,
      strobe: false,
    };
  }
  
  private resetStar(star: StarInstance): void {
    star.onDeath = undefined;
    star.secondColor = undefined;
    star.transitionTime = undefined;
    star.colorChanged = undefined;
    star.strobeFreq = undefined;
  }
  
  addStar(options: StarOptions): StarInstance {
    const star = this.starPool.acquire();
    const { x, y, color, angle, speed, life, speedOffX = 0, speedOffY = 0, size = 3 } = options;
    
    star.visible = true;
    star.heavy = false;
    star.x = x;
    star.y = y;
    star.prevX = x;
    star.prevY = y;
    star.color = color;
    star.speedX = Math.sin(angle) * speed + speedOffX;
    star.speedY = Math.cos(angle) * speed + speedOffY;
    star.life = life;
    star.fullLife = life;
    star.size = size;
    star.spinAngle = Math.random() * PI_2;
    star.spinSpeed = 0.8;
    star.spinRadius = 0;
    star.sparkFreq = 0;
    star.sparkSpeed = 1;
    star.sparkTimer = 0;
    star.sparkColor = color;
    star.sparkLife = 750;
    star.sparkLifeVariation = 0.25;
    star.strobe = false;
    
    this.activeStars[color].push(star);
    return star;
  }
  
  removeStar(star: StarInstance): void {
    const stars = this.activeStars[star.color];
    const index = stars.indexOf(star);
    if (index !== -1) {
      stars.splice(index, 1);
    }
    this.starPool.release(star);
  }
  
  // ============================================
  // Spark Management
  // ============================================
  
  private createSpark(): SparkInstance {
    return {
      x: 0, y: 0, prevX: 0, prevY: 0,
      color: '', speedX: 0, speedY: 0, life: 0,
    };
  }
  
  private resetSpark(spark: SparkInstance): void {
    // Nothing special needed
  }
  
  addSpark(options: SparkOptions): SparkInstance {
    const spark = this.sparkPool.acquire();
    const { x, y, color, angle, speed, life } = options;
    
    spark.x = x;
    spark.y = y;
    spark.prevX = x;
    spark.prevY = y;
    spark.color = color;
    spark.speedX = Math.sin(angle) * speed;
    spark.speedY = Math.cos(angle) * speed;
    spark.life = life;
    
    this.activeSparks[color].push(spark);
    return spark;
  }
  
  removeSpark(spark: SparkInstance): void {
    const sparks = this.activeSparks[spark.color];
    const index = sparks.indexOf(spark);
    if (index !== -1) {
      sparks.splice(index, 1);
    }
    this.sparkPool.release(spark);
  }
  
  // ============================================
  // Flash Management
  // ============================================
  
  addFlash(x: number, y: number, radius: number): BurstFlashInstance {
    const flash = this.flashPool.acquire();
    flash.x = x;
    flash.y = y;
    flash.radius = radius;
    this.activeFlashes.push(flash);
    return flash;
  }
  
  popFlash(): BurstFlashInstance | undefined {
    const flash = this.activeFlashes.pop();
    if (flash) {
      this.flashPool.release(flash);
    }
    return flash;
  }
  
  // ============================================
  // Update Loop
  // ============================================
  
  update(timeStep: number, speed: number, gravity: number, currentFrame: number): void {
    const starDrag = 1 - (1 - this.starAirDrag) * speed;
    const starDragHeavy = 1 - (1 - this.starAirDragHeavy) * speed;
    const sparkDrag = 1 - (1 - this.sparkAirDrag) * speed;
    const gAcc = (timeStep / 1000) * gravity;
    
    // Update stars
    COLOR_CODES_W_INVIS.forEach((color) => {
      const stars = this.activeStars[color];
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        
        // Only update each star once per frame
        if (star.updateFrame === currentFrame) continue;
        star.updateFrame = currentFrame;
        
        star.life -= timeStep;
        
        if (star.life <= 0) {
          // Star died - trigger callback and recycle
          if (star.onDeath) {
            star.onDeath(star);
          }
          stars.splice(i, 1);
          this.starPool.release(star);
        } else {
          this.updateStar(star, speed, starDrag, starDragHeavy, gAcc, timeStep);
        }
      }
      
      // Update sparks
      const sparks = this.activeSparks[color];
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.life -= timeStep;
        
        if (spark.life <= 0) {
          sparks.splice(i, 1);
          this.sparkPool.release(spark);
        } else {
          spark.prevX = spark.x;
          spark.prevY = spark.y;
          spark.x += spark.speedX * speed;
          spark.y += spark.speedY * speed;
          spark.speedX *= sparkDrag;
          spark.speedY *= sparkDrag;
          spark.speedY += gAcc;
        }
      }
    });
  }
  
  private updateStar(
    star: StarInstance,
    speed: number,
    starDrag: number,
    starDragHeavy: number,
    gAcc: number,
    timeStep: number
  ): void {
    const burnRate = Math.pow(star.life / star.fullLife, 0.5);
    const burnRateInverse = 1 - burnRate;
    
    star.prevX = star.x;
    star.prevY = star.y;
    star.x += star.speedX * speed;
    star.y += star.speedY * speed;
    
    // Apply drag
    if (!star.heavy) {
      star.speedX *= starDrag;
      star.speedY *= starDrag;
    } else {
      star.speedX *= starDragHeavy;
      star.speedY *= starDragHeavy;
    }
    star.speedY += gAcc;
    
    // Spin effect
    if (star.spinRadius) {
      star.spinAngle += star.spinSpeed * speed;
      star.x += Math.sin(star.spinAngle) * star.spinRadius * speed;
      star.y += Math.cos(star.spinAngle) * star.spinRadius * speed;
    }
    
    // Spark emission
    if (star.sparkFreq) {
      star.sparkTimer -= timeStep;
      while (star.sparkTimer < 0) {
        star.sparkTimer += star.sparkFreq * 0.75 + star.sparkFreq * burnRateInverse * 4;
        this.addSpark({
          x: star.x,
          y: star.y,
          color: star.sparkColor,
          angle: Math.random() * PI_2,
          speed: Math.random() * star.sparkSpeed * burnRate,
          life: star.sparkLife * 0.8 + Math.random() * star.sparkLifeVariation * star.sparkLife,
        });
      }
    }
    
    // Handle transitions
    if (star.transitionTime && star.life < star.transitionTime) {
      if (star.secondColor && !star.colorChanged) {
        star.colorChanged = true;
        // Move to new color array
        const oldStars = this.activeStars[star.color];
        const idx = oldStars.indexOf(star);
        if (idx !== -1) oldStars.splice(idx, 1);
        star.color = star.secondColor;
        this.activeStars[star.secondColor].push(star);
        if (star.secondColor === INVISIBLE) {
          star.sparkFreq = 0;
        }
      }
      
      if (star.strobe && star.strobeFreq) {
        star.visible = Math.floor(star.life / star.strobeFreq) % 3 === 0;
      }
    }
  }
  
  // ============================================
  // Statistics
  // ============================================
  
  getTotalStarCount(): number {
    let count = 0;
    COLOR_CODES.forEach((color) => {
      count += this.activeStars[color].length;
    });
    return count;
  }
  
  getColorBrightness(): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0;
    COLOR_CODES.forEach((color) => {
      const tuple = COLOR_TUPLES[color];
      const count = this.activeStars[color].length;
      r += tuple.r * count;
      g += tuple.g * count;
      b += tuple.b * count;
    });
    return { r, g, b };
  }
}

// ============================================
// Singleton Export
// ============================================

export const particleSystem = new ParticleSystem();
