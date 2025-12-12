/**
 * InputManager - User input handling
 */

import { configManager } from '../config';
import { MAX_WIDTH, MAX_HEIGHT } from '../config/defaults';
import { Stage } from '../Stage';
import type { InputHandlers } from '../config/types';

export class InputManager {
  private stage: Stage;
  private stageContainer: HTMLElement | null;
  private handlers: InputHandlers | null = null;
  
  // State
  private activePointerCount = 0;
  private isUpdatingSpeed = false;
  private simSpeed = 1;
  
  // Dimensions
  private stageW = 0;
  private stageH = 0;
  
  constructor(stage: Stage) {
    this.stage = stage;
    this.stageContainer = document.querySelector('.stage-container');
    
    // Set up event listeners
    this.stage.addEventListener('pointerstart', this.handlePointerStart.bind(this));
    this.stage.addEventListener('pointerend', this.handlePointerEnd.bind(this));
    this.stage.addEventListener('pointermove', this.handlePointerMove.bind(this));
    window.addEventListener('keydown', this.handleKeydown.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * Set handlers for input events
   */
  setHandlers(handlers: InputHandlers): void {
    this.handlers = handlers;
  }
  
  /**
   * Set simulation speed (for speed bar calculations)
   */
  setSimSpeed(speed: number): void {
    this.simSpeed = speed;
  }
  
  /**
   * Get current simulation speed
   */
  getSimSpeed(): number {
    return this.simSpeed;
  }
  
  /**
   * Get stage dimensions
   */
  getDimensions(): { width: number; height: number; stageW: number; stageH: number } {
    return {
      width: this.stage.width,
      height: this.stage.height,
      stageW: this.stageW,
      stageH: this.stageH,
    };
  }
  
  /**
   * Handle resize
   */
  handleResize(): { containerW: number; containerH: number; stageW: number; stageH: number } {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const containerW = Math.min(w, MAX_WIDTH);
    const containerH = w <= 420 ? h : Math.min(h, MAX_HEIGHT);
    
    if (this.stageContainer) {
      this.stageContainer.style.width = containerW + 'px';
      this.stageContainer.style.height = containerH + 'px';
    }
    
    const scaleFactor = configManager.get('scaleFactor');
    this.stageW = containerW / scaleFactor;
    this.stageH = containerH / scaleFactor;
    
    return { containerW, containerH, stageW: this.stageW, stageH: this.stageH };
  }
  
  // ============================================
  // Event Handlers
  // ============================================
  
  private handlePointerStart(event: any): void {
    this.activePointerCount++;
    const btnSize = 50;
    
    // Check header buttons
    if (event.y < btnSize) {
      if (event.x < btnSize) {
        this.handlers?.onPauseToggle();
        return;
      }
      if (event.x > this.stage.width / 2 - btnSize / 2 && event.x < this.stage.width / 2 + btnSize / 2) {
        this.handlers?.onSoundToggle();
        return;
      }
      if (event.x > this.stage.width - btnSize) {
        this.handlers?.onMenuToggle();
        return;
      }
    }
    
    if (!configManager.isRunning) return;
    
    // Check speed bar
    if (this.updateSpeedFromEvent(event)) {
      this.isUpdatingSpeed = true;
    } else if (event.onCanvas) {
      this.handlers?.onShellLaunch(event.x, event.y);
    }
  }
  
  private handlePointerEnd(event: any): void {
    this.activePointerCount--;
    this.isUpdatingSpeed = false;
  }
  
  private handlePointerMove(event: any): void {
    if (!configManager.isRunning) return;
    
    if (this.isUpdatingSpeed) {
      this.updateSpeedFromEvent(event);
    }
  }
  
  private handleKeydown(event: KeyboardEvent): void {
    // P - toggle pause
    if (event.keyCode === 80) {
      this.handlers?.onPauseToggle();
    }
    // O - toggle menu
    else if (event.keyCode === 79) {
      this.handlers?.onMenuToggle();
    }
    // Esc - close menu
    else if (event.keyCode === 27) {
      configManager.toggleMenu(false);
    }
  }
  
  private updateSpeedFromEvent(event: any): boolean {
    if (this.isUpdatingSpeed || event.y >= this.stage.height - 44) {
      const edge = 16;
      const newSpeed = (event.x - edge) / (this.stage.width - edge * 2);
      this.simSpeed = Math.min(Math.max(newSpeed, 0), 1);
      this.handlers?.onSpeedChange(this.simSpeed);
      return true;
    }
    return false;
  }
}
