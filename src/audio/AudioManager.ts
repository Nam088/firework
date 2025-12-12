/**
 * AudioManager - Sound System
 */

import { configManager } from '../config';
import { MyMath } from '../MyMath';
import type { SoundType } from '../config/types';

interface SoundSource {
  volume: number;
  playbackRateMin: number;
  playbackRateMax: number;
  fileNames: string[];
  buffers?: AudioBuffer[];
}

export class AudioManager {
  private baseURL = './audio/';
  private ctx: AudioContext | null = null;
  private sources: Record<SoundType, SoundSource> = {
    lift: {
      volume: 1,
      playbackRateMin: 0.85,
      playbackRateMax: 0.95,
      fileNames: ['lift1.mp3', 'lift2.mp3', 'lift3.mp3'],
    },
    burst: {
      volume: 1,
      playbackRateMin: 0.8,
      playbackRateMax: 0.9,
      fileNames: ['burst1.mp3', 'burst2.mp3'],
    },
    burstSmall: {
      volume: 0.25,
      playbackRateMin: 0.8,
      playbackRateMax: 1,
      fileNames: ['burst-sm-1.mp3', 'burst-sm-2.mp3'],
    },
    crackle: {
      volume: 0.2,
      playbackRateMin: 1,
      playbackRateMax: 1,
      fileNames: ['crackle1.mp3'],
    },
    crackleSmall: {
      volume: 0.3,
      playbackRateMin: 1,
      playbackRateMax: 1,
      fileNames: ['crackle-sm-1.mp3'],
    },
  };
  
  private lastSmallBurstTime = 0;
  private simSpeed = 1;
  
  constructor() {
    // Subscribe to config changes - mirror original handleStateChange logic
    configManager.subscribe((state, prevState) => {
      const canPlayNow = state.soundEnabled && !state.paused;
      const canPlayPrev = prevState.soundEnabled && !prevState.paused;
      
      if (canPlayNow !== canPlayPrev) {
        if (canPlayNow) {
          this.resume();
        } else {
          this.pause();
        }
      }
    });
  }
  
  /**
   * Initialize audio context
   */
  private initContext(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  /**
   * Set simulation speed (affects sound playback decision)
   */
  setSimSpeed(speed: number): void {
    this.simSpeed = speed;
  }
  
  /**
   * Preload all audio files
   */
  async preload(): Promise<void> {
    this.initContext();
    if (!this.ctx) return;
    
    const allPromises: Promise<AudioBuffer>[] = [];
    
    const checkStatus = (response: Response): Response => {
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      throw new Error(response.statusText);
    };
    
    for (const type of Object.keys(this.sources) as SoundType[]) {
      const source = this.sources[type];
      const filePromises: Promise<AudioBuffer>[] = [];
      
      for (const fileName of source.fileNames) {
        const fileURL = this.baseURL + fileName;
        const promise = fetch(fileURL)
          .then(checkStatus)
          .then((response) => response.arrayBuffer())
          .then((data) => {
            return new Promise<AudioBuffer>((resolve) => {
              this.ctx!.decodeAudioData(data, resolve);
            });
          });
        
        filePromises.push(promise);
        allPromises.push(promise);
      }
      
      Promise.all(filePromises).then((buffers) => {
        source.buffers = buffers;
      });
    }
    
    await Promise.all(allPromises);
  }
  
  /**
   * Pause all audio
   */
  pause(): void {
    this.ctx?.suspend();
  }
  
  /**
   * Resume audio
   */
  resume(): void {
    if (!this.ctx) return;
    
    // Play silent sound for iOS (bypass normal checks)
    const source = this.sources['lift'];
    if (source?.buffers) {
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0; // Silent
      const buffer = source.buffers[0];
      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      bufferSource.start(0);
    }
    
    setTimeout(() => {
      this.ctx?.resume();
    }, 250);
  }
  
  /**
   * Play a sound
   */
  play(type: SoundType, scale: number = 1): void {
    if (!this.ctx) return;
    
    // Ensure scale is valid
    scale = MyMath.clamp(scale, 0, 1);
    
    // Check if we can play sound
    if (!configManager.canPlaySound || this.simSpeed < 0.95) {
      return;
    }
    
    // Throttle small bursts
    if (type === 'burstSmall') {
      const now = Date.now();
      if (now - this.lastSmallBurstTime < 20) {
        return;
      }
      this.lastSmallBurstTime = now;
    }
    
    const source = this.sources[type];
    if (!source || !source.buffers) return;
    
    const initialVolume = source.volume;
    const initialPlaybackRate = MyMath.random(source.playbackRateMin, source.playbackRateMax);
    
    // Scale affects volume and playback rate
    const scaledVolume = initialVolume * scale;
    const scaledPlaybackRate = initialPlaybackRate * (2 - scale);
    
    // Create nodes
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = scaledVolume;
    
    const buffer = MyMath.randomChoice(source.buffers);
    const bufferSource = this.ctx.createBufferSource();
    bufferSource.playbackRate.value = scaledPlaybackRate;
    bufferSource.buffer = buffer;
    bufferSource.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    bufferSource.start(0);
  }
}

// ============================================
// Singleton Export
// ============================================

export const audioManager = new AudioManager();
