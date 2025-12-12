/**
 * Renderer - Canvas drawing system
 * FIXED: Updated to match original main.ts rendering logic
 */

import { configManager } from '../config';
import { COLOR, PI_2, SKY_LIGHT_NONE } from '../config/defaults';
import { Stage } from '../Stage';
import { particleSystem, COLOR_CODES, COLOR_CODES_W_INVIS, COLOR_TUPLES } from '../simulation/ParticleSystem';

export class Renderer {
  private trailsStage: Stage;
  private mainStage: Stage;
  
  // Stage dimensions
  private stageW: number = 0;
  private stageH: number = 0;
  
  // Speed bar
  private speedBarOpacity: number = 0;
  private simSpeed: number = 1;
  
  // Sky colors
  private currentSkyColor = { r: 0, g: 0, b: 0 };
  private targetSkyColor = { r: 0, g: 0, b: 0 };
  
  // Canvas container for sky color
  private canvasContainer: HTMLElement | null = null;
  
  constructor(trailsStage: Stage, mainStage: Stage) {
    this.trailsStage = trailsStage;
    this.mainStage = mainStage;
    this.canvasContainer = document.querySelector('.canvas-container');
  }
  
  /**
   * Set stage dimensions
   */
  setDimensions(width: number, height: number): void {
    this.stageW = width;
    this.stageH = height;
  }
  
  /**
   * Set simulation speed
   */
  setSimSpeed(speed: number): void {
    this.simSpeed = speed;
  }
  
  /**
   * Set speed bar opacity
   */
  setSpeedBarOpacity(opacity: number): void {
    this.speedBarOpacity = opacity;
  }
  
  /**
   * Fade speed bar
   */
  fadeSpeedBar(lag: number): void {
    if (!configManager.get('menuOpen') && this.speedBarOpacity !== 0) {
      this.speedBarOpacity -= lag / 30;
      if (this.speedBarOpacity < 0) {
        this.speedBarOpacity = 0;
      }
    }
  }
  
  /**
   * Resize stages
   */
  resize(width: number, height: number): void {
    this.trailsStage.resize(width, height);
    this.mainStage.resize(width, height);
  }
  
  /**
   * Main render function
   */
  render(speed: number): void {
    const { dpr } = this.mainStage;
    const trailsCtx = this.trailsStage.ctx;
    const mainCtx = this.mainStage.ctx;
    const isLowQuality = configManager.isLowQuality;
    const scaleFactor = configManager.get('scaleFactor');
    
    // Color sky if enabled
    if (configManager.get('skyLighting') !== SKY_LIGHT_NONE) {
      this.colorSky(speed);
    }
    
    // Scale for DPI and custom scale factor (matching main.ts)
    trailsCtx.scale(dpr * scaleFactor, dpr * scaleFactor);
    mainCtx.scale(dpr * scaleFactor, dpr * scaleFactor);
    
    // Fade trails
    trailsCtx.globalCompositeOperation = 'source-over';
    const fadeAlpha = configManager.get('longExposure') ? 0.0025 : 0.175 * speed;
    trailsCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    trailsCtx.fillRect(0, 0, this.stageW, this.stageH);
    
    // Clear main canvas
    mainCtx.clearRect(0, 0, this.stageW, this.stageH);
    
    // Draw burst flashes with radial gradient (matching main.ts)
    this.renderFlashes(trailsCtx);
    
    // Draw stars
    trailsCtx.globalCompositeOperation = 'lighten';
    this.renderStars(trailsCtx, mainCtx, isLowQuality);
    
    // Draw sparks
    this.renderSparks(trailsCtx);
    
    // Draw speed bar
    if (this.speedBarOpacity > 0) {
      const speedBarHeight = 6;
      mainCtx.globalAlpha = this.speedBarOpacity;
      mainCtx.fillStyle = COLOR.Blue;
      mainCtx.fillRect(0, this.stageH - speedBarHeight, this.stageW * this.simSpeed, speedBarHeight);
      mainCtx.globalAlpha = 1;
    }
    
    // Reset transforms
    trailsCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  
  /**
   * Render burst flashes with radial gradient (matching main.ts exactly)
   */
  private renderFlashes(trailsCtx: CanvasRenderingContext2D): void {
    while (particleSystem.activeFlashes.length > 0) {
      const flash = particleSystem.popFlash();
      if (!flash) break;
      
      const x = flash.x;
      const y = flash.y;
      const radius = flash.radius;
      
      // Create radial gradient exactly like main.ts
      const burstGradient = trailsCtx.createRadialGradient(x, y, 0, x, y, radius);
      burstGradient.addColorStop(0.024, 'rgba(255, 255, 255, 1)');
      burstGradient.addColorStop(0.125, 'rgba(255, 160, 20, 0.2)');
      burstGradient.addColorStop(0.32, 'rgba(255, 140, 20, 0.11)');
      burstGradient.addColorStop(1, 'rgba(255, 120, 20, 0)');
      
      trailsCtx.fillStyle = burstGradient;
      trailsCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
  
  /**
   * Render stars with trails
   */
  private renderStars(trailsCtx: CanvasRenderingContext2D, mainCtx: CanvasRenderingContext2D, isLowQuality: boolean): void {
    trailsCtx.lineWidth = 3;
    trailsCtx.lineCap = isLowQuality ? 'square' : 'round';
    mainCtx.strokeStyle = '#fff';
    mainCtx.lineWidth = 1;
    mainCtx.beginPath();
    
    COLOR_CODES.forEach((color) => {
      const stars = particleSystem.activeStars[color];
      
      trailsCtx.strokeStyle = color;
      trailsCtx.beginPath();
      
      stars.forEach((star) => {
        if (star.visible) {
          trailsCtx.lineWidth = star.size;
          trailsCtx.moveTo(star.x, star.y);
          trailsCtx.lineTo(star.prevX, star.prevY);
          mainCtx.moveTo(star.x, star.y);
          mainCtx.lineTo(star.x - star.speedX * 1.6, star.y - star.speedY * 1.6);
        }
      });
      
      trailsCtx.stroke();
    });
    
    mainCtx.stroke();
  }
  
  /**
   * Render sparks
   */
  private renderSparks(trailsCtx: CanvasRenderingContext2D): void {
    trailsCtx.lineWidth = particleSystem.sparkDrawWidth;
    trailsCtx.lineCap = 'butt';
    
    COLOR_CODES.forEach((color) => {
      const sparks = particleSystem.activeSparks[color];
      
      trailsCtx.strokeStyle = color;
      trailsCtx.beginPath();
      
      sparks.forEach((spark) => {
        trailsCtx.moveTo(spark.x, spark.y);
        trailsCtx.lineTo(spark.prevX, spark.prevY);
      });
      
      trailsCtx.stroke();
    });
  }
  
  /**
   * Color the sky based on active fireworks
   */
  private colorSky(speed: number): void {
    const skyLighting = configManager.get('skyLighting') as number;
    const maxSkySaturation = skyLighting * 15;
    const maxStarCount = 500;
    
    const totalStarCount = particleSystem.getTotalStarCount();
    const brightness = particleSystem.getColorBrightness();
    
    const intensity = Math.pow(Math.min(1, totalStarCount / maxStarCount), 0.3);
    const maxColorComponent = Math.max(1, brightness.r, brightness.g, brightness.b);
    
    this.targetSkyColor.r = (brightness.r / maxColorComponent) * maxSkySaturation * intensity;
    this.targetSkyColor.g = (brightness.g / maxColorComponent) * maxSkySaturation * intensity;
    this.targetSkyColor.b = (brightness.b / maxColorComponent) * maxSkySaturation * intensity;
    
    const colorChange = 10;
    this.currentSkyColor.r += ((this.targetSkyColor.r - this.currentSkyColor.r) / colorChange) * speed;
    this.currentSkyColor.g += ((this.targetSkyColor.g - this.currentSkyColor.g) / colorChange) * speed;
    this.currentSkyColor.b += ((this.targetSkyColor.b - this.currentSkyColor.b) / colorChange) * speed;
    
    if (this.canvasContainer) {
      this.canvasContainer.style.backgroundColor = `rgb(${this.currentSkyColor.r | 0}, ${this.currentSkyColor.g | 0}, ${this.currentSkyColor.b | 0})`;
    }
  }
}
