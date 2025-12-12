/**
 * App - Main Entry Point
 * 
 * The orchestrator that wires all systems together.
 */

import '../css/style.css';

import { configManager } from './config';
import { IS_HEADER } from './config/defaults';
import { Stage } from './Stage';

// Systems
import { simulation } from './simulation/Simulation';
import { audioManager } from './audio/AudioManager';
import { Renderer } from './rendering/Renderer';
import { InputManager } from './input/InputManager';
import { uiController } from './ui/UIController';

class App {
  private trailsStage: Stage;
  private mainStage: Stage;
  private renderer: Renderer;
  private inputManager: InputManager;
  
  // State
  private simSpeed = 1;
  
  constructor() {
    // Load persisted config
    configManager.load();
    
    // Create stages
    this.trailsStage = new Stage('trails-canvas');
    this.mainStage = new Stage('main-canvas');
    
    // Create renderer
    this.renderer = new Renderer(this.trailsStage, this.mainStage);
    
    // Create input manager
    this.inputManager = new InputManager(this.mainStage);
    this.inputManager.setHandlers({
      onShellLaunch: (x, y) => {
        simulation.launchShellFromClick(x, y, this.mainStage.width, this.mainStage.height);
      },
      onSpeedChange: (speed) => {
        this.simSpeed = speed;
        this.renderer.setSimSpeed(speed);
        this.renderer.setSpeedBarOpacity(1);
        audioManager.setSimSpeed(speed);
      },
      onPauseToggle: () => configManager.togglePause(),
      onSoundToggle: () => configManager.toggleSound(),
      onMenuToggle: () => configManager.toggleMenu(),
    });
    
    // Connect audio to simulation
    simulation.setAudioCallback((type, scale) => {
      audioManager.play(type as any, scale);
    });
    
    // Initial resize
    this.handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', () => this.handleResize());
  }
  
  /**
   * Handle resize
   */
  handleResize(): void {
    const dims = this.inputManager.handleResize();
    this.renderer.resize(dims.containerW, dims.containerH);
    this.renderer.setDimensions(dims.stageW, dims.stageH);
    simulation.setStage(dims.stageW, dims.stageH);
    this.trailsStage.resize(dims.containerW, dims.containerH);
    this.mainStage.resize(dims.containerW, dims.containerH);
  }
  
  /**
   * Main update loop
   */
  update = (frameTime: number, lag: number): void => {
    if (!configManager.isRunning) return;
    
    const timeStep = frameTime * this.simSpeed;
    const speed = this.simSpeed * lag;
    
    // Fade speed bar
    this.renderer.fadeSpeedBar(lag);
    
    // Update simulation
    simulation.update(timeStep, speed);
    
    // Render
    this.renderer.render(speed);
  };
  
  /**
   * Start the application
   */
  async start(): Promise<void> {
    // Remove loading state
    uiController.removeLoadingState();
    
    // Initial render
    uiController.render(configManager.getState());
    
    // Start simulation
    configManager.togglePause(false);
    
    // Set up update loop
    this.mainStage.addEventListener('ticker', this.update);
    
    console.log('🎆 Firework Simulator loaded with class-based architecture!');
  }
  
  /**
   * Preload assets and initialize
   */
  async init(): Promise<void> {
    if (IS_HEADER) {
      await this.start();
    } else {
      uiController.setLoadingStatus('Lighting the fuse...');
      
      try {
        await audioManager.preload();
      } catch (error) {
        console.warn('Failed to preload audio:', error);
      }
      
      await this.start();
    }
  }
}

// ============================================
// Bootstrap
// ============================================

const app = new App();
app.init();

export { app };
