/**
 * ConfigManager - Centralized Configuration Management
 * 
 * Single source of truth for all app settings.
 * Systems subscribe to changes and react automatically.
 */

import {
  AppConfig,
  AppState,
  ComputedConfig,
  StateChangeListener,
  QualityLevel,
  QUALITY_LOW,
  QUALITY_NORMAL,
  QUALITY_HIGH,
} from './types';
import { 
  DEFAULT_STATE,
  IS_MOBILE,
  IS_DESKTOP,
  IS_HEADER,
  IS_HIGH_END_DEVICE
} from './defaults';

export class ConfigManager {
  private state: AppState;
  private listeners: Set<StateChangeListener> = new Set();
  
  constructor() {
    this.state = { ...DEFAULT_STATE };
    
    // Apply device-specific defaults directly matching main.ts logic
    if (IS_HEADER) {
      this.state.hideControls = true;
    }
    
    // Set default shell size based on device
    if (IS_DESKTOP) {
      this.state.size = 3;
    } else if (IS_HEADER) {
      this.state.size = 1.2;
    } else {
      this.state.size = 2; // Mobile default
    }
    
    // Set default quality based on device capability
    if (IS_HIGH_END_DEVICE) {
      this.state.quality = QUALITY_HIGH;
    } else {
      this.state.quality = QUALITY_NORMAL;
    }
  }
  
  // ============================================
  // State Access
  // ============================================
  
  /**
   * Get the full current state
   */
  getState(): Readonly<AppState> {
    return this.state;
  }
  
  /**
   * Get a specific config value
   */
  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }
  
  // ============================================
  // State Modification
  // ============================================
  
  /**
   * Set a single config value
   */
  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, [key]: value };
    this.notifyListeners(prevState);
    this.persist();
  }
  
  /**
   * Update multiple config values at once
   */
  update(partial: Partial<AppState>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...partial };
    this.notifyListeners(prevState);
    this.persist();
  }
  
  /**
   * Reset to default state
   */
  reset(): void {
    const prevState = { ...this.state };
    this.state = { ...DEFAULT_STATE };
    this.notifyListeners(prevState);
    this.persist();
  }
  
  // ============================================
  // Persistence
  // ============================================
  
  private STORAGE_KEY = 'cm_fireworks_data';
  
  /**
   * Load state from local storage
   */
  load(): void {
    try {
      const serializedData = localStorage.getItem(this.STORAGE_KEY);
      if (serializedData) {
        const { schemaVersion, data } = JSON.parse(serializedData);
        
        // Handle migration/validation based on schema version if needed
        // For now, we'll trust the data matches AppState structure or part of it
        if (schemaVersion === '1.2') {
          this.update({
            quality: data.quality,
            size: data.size,
            skyLighting: data.skyLighting,
            scaleFactor: data.scaleFactor
          });
          console.log(`Loaded config (schema version ${schemaVersion})`);
        }
      } 
      // Handle legacy format
      else if (localStorage.getItem('schemaVersion') === '1') {
        const sizeRaw = localStorage.getItem('configSize');
        if (sizeRaw) {
          try {
            const size = JSON.parse(sizeRaw);
            const sizeInt = parseInt(size, 10);
            if (sizeInt >= 0 && sizeInt <= 4) {
              this.update({ size: sizeInt });
            }
          } catch (e) {
            console.error('Error parsing legacy config:', e);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load config:', error);
    }
  }
  
  /**
   * Save state to local storage
   */
  persist(): void {
    try {
      // Only persist specific user-configurable fields
      const data = {
        quality: this.state.quality,
        size: this.state.size,
        skyLighting: this.state.skyLighting,
        scaleFactor: this.state.scaleFactor,
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        schemaVersion: '1.2',
        data
      }));
    } catch (error) {
      console.warn('Failed to save config:', error);
    }
  }
  
  // ============================================
  // Computed Values
  // ============================================
  
  /**
   * Get computed config values based on current state
   */
  getComputed(): ComputedConfig {
    const quality = this.state.quality;
    return {
      isLowQuality: quality === QUALITY_LOW,
      isNormalQuality: quality === QUALITY_NORMAL,
      isHighQuality: quality === QUALITY_HIGH,
      sparkDrawWidth: quality === QUALITY_HIGH ? 0.75 : 1,
    };
  }
  
  get quality(): QualityLevel {
    return this.state.quality;
  }
  
  get isLowQuality(): boolean {
    return this.state.quality === QUALITY_LOW;
  }
  
  get isNormalQuality(): boolean {
    return this.state.quality === QUALITY_NORMAL;
  }
  
  get isHighQuality(): boolean {
    return this.state.quality === QUALITY_HIGH;
  }
  
  get isRunning(): boolean {
    return !this.state.paused && !this.state.menuOpen;
  }
  
  get canPlaySound(): boolean {
    return this.state.soundEnabled && !this.state.paused;
  }
  
  // ============================================
  // Subscription System
  // ============================================
  
  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(prevState: AppState): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state, prevState);
      } catch (error) {
        console.error('ConfigManager listener error:', error);
      }
    });
  }
  
  // ============================================
  // Common Actions
  // ============================================
  
  togglePause(forcePaused?: boolean): void {
    const paused = forcePaused !== undefined ? forcePaused : !this.state.paused;
    this.set('paused', paused);
  }
  
  toggleSound(forceEnabled?: boolean): void {
    const soundEnabled = forceEnabled !== undefined ? forceEnabled : !this.state.soundEnabled;
    this.set('soundEnabled', soundEnabled);
  }
  
  toggleMenu(forceOpen?: boolean): void {
    const menuOpen = forceOpen !== undefined ? forceOpen : !this.state.menuOpen;
    this.set('menuOpen', menuOpen);
  }
  
  toggleFullscreen(forceFullscreen?: boolean): void {
    const fullscreen = forceFullscreen !== undefined ? forceFullscreen : !this.state.fullscreen;
    this.set('fullscreen', fullscreen);
  }
  
  setHelpTopic(topic: string | null): void {
    this.set('openHelpTopic', topic);
  }
}

// ============================================
// Singleton Export
// ============================================

export const configManager = new ConfigManager();
