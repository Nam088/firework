/*
  Copyright © 2022 Nam088. All rights reserved.
  Github: https://github.com/Nam088/firework
  Gitee: https://gitee.com/Nam088/firework
  This project is licensed under Apache-2.0.
*/

// Type definitions
export type TickerCallback = (frameTime: number, lag: number) => void;

export interface PointerEvent {
  type: string;
  x: number;
  y: number;
  onCanvas?: boolean;
}

export interface StageListeners {
  resize: Array<() => void>;
  pointerstart: Array<(event: PointerEvent) => void>;
  pointermove: Array<(event: PointerEvent) => void>;
  pointerend: Array<(event: PointerEvent) => void>;
  lastPointerPos: { x: number; y: number };
}

export interface CanvasContext2D extends CanvasRenderingContext2D {
  backingStorePixelRatio?: number;
}

// Ticker module for animation frame management
export interface ITicker {
  addListener: (callback: TickerCallback) => void;
}

// Create Ticker module
const createTicker = (): ITicker => {
  let started = false;
  let lastTimestamp = 0;
  const listeners: TickerCallback[] = [];

  // Queue up a new frame (calls frameHandler)
  function queueFrame(): void {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(frameHandler);
    } else {
      (window as unknown as { webkitRequestAnimationFrame: typeof requestAnimationFrame }).webkitRequestAnimationFrame(frameHandler);
    }
  }

  function frameHandler(timestamp: number): void {
    let frameTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Make sure negative time isn't reported (first frame can be whacky)
    if (frameTime < 0) {
      frameTime = 17;
    }
    // Cap minimum framerate to 15fps[~68ms] (assuming 60fps[~17ms] as 'normal')
    else if (frameTime > 68) {
      frameTime = 68;
    }

    // Fire custom listeners
    listeners.forEach((listener) => listener(frameTime, frameTime / 16.6667));

    // Always queue another frame
    queueFrame();
  }

  return {
    // Public: will call function reference repeatedly once registered,
    // passing elapsed time and a lag multiplier as parameters
    addListener(callback: TickerCallback): void {
      if (typeof callback !== 'function') {
        throw new Error('Ticker.addListener() requires a function reference passed for a callback.');
      }

      listeners.push(callback);

      // Start frame-loop lazily
      if (!started) {
        started = true;
        queueFrame();
      }
    },
  };
};

export const Ticker: ITicker = createTicker();

// Stage class for canvas management
export class Stage {
  canvas: HTMLCanvasElement;
  ctx: CanvasContext2D;
  speed: number;
  dpr: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  _listeners: StageListeners;

  static stages: Stage[] = [];
  static disableHighDPI: boolean = false;
  private static lastTouchTimestamp: number = 0;

  constructor(canvasId: string | HTMLCanvasElement) {
    const canvas = typeof canvasId === 'string' 
      ? document.getElementById(canvasId) as HTMLCanvasElement
      : canvasId;
    
    if (!canvas) {
      throw new Error(`Canvas element not found: ${canvasId}`);
    }

    // Canvas and associated context references
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasContext2D;

    // Prevent gestures on stages (scrolling, zooming, etc)
    this.canvas.style.touchAction = 'none';

    // Physics speed multiplier: allows slowing down or speeding up simulation
    this.speed = 1;

    // devicePixelRatio alias (should only be used for rendering, physics shouldn't care)
    // Avoids rendering unnecessary pixels that browser might handle natively
    this.dpr = Stage.disableHighDPI 
      ? 1 
      : (window.devicePixelRatio || 1) / (this.ctx.backingStorePixelRatio || 1);

    // Canvas size in DIPs and natural pixels
    this.width = canvas.width;
    this.height = canvas.height;
    this.naturalWidth = this.width * this.dpr;
    this.naturalHeight = this.height * this.dpr;

    // Size canvas to match natural size
    if (this.width !== this.naturalWidth) {
      this.canvas.width = this.naturalWidth;
      this.canvas.height = this.naturalHeight;
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
    }

    Stage.stages.push(this);

    // Event listeners (note that 'ticker' is also an option, for frame events)
    this._listeners = {
      resize: [],
      pointerstart: [],
      pointermove: [],
      pointerend: [],
      lastPointerPos: { x: 0, y: 0 },
    };
  }

  // Add event listener
  addEventListener(event: string, handler: TickerCallback | ((evt?: PointerEvent) => void)): void {
    try {
      if (event === 'ticker') {
        Ticker.addListener(handler as TickerCallback);
      } else {
        (this._listeners[event as keyof StageListeners] as unknown[]).push(handler);
      }
    } catch {
      throw new Error('Invalid Event');
    }
  }

  // Dispatch event
  dispatchEvent(event: string, val?: PointerEvent): void {
    const listeners = this._listeners[event as keyof StageListeners];
    if (listeners && Array.isArray(listeners)) {
      listeners.forEach((listener: unknown) => (listener as (val?: PointerEvent) => void).call(this, val));
    } else {
      throw new Error('Invalid Event');
    }
  }

  // Resize canvas
  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.naturalWidth = w * this.dpr;
    this.naturalHeight = h * this.dpr;
    this.canvas.width = this.naturalWidth;
    this.canvas.height = this.naturalHeight;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.dispatchEvent('resize');
  }

  // Utility function for coordinate space conversion
  static windowToCanvas(canvas: HTMLCanvasElement, x: number, y: number): { x: number; y: number } {
    const bbox = canvas.getBoundingClientRect();
    return {
      x: (x - bbox.left) * (canvas.width / bbox.width),
      y: (y - bbox.top) * (canvas.height / bbox.height),
    };
  }

  // Handle mouse interaction
  static mouseHandler(evt: MouseEvent): void {
    // Prevent mouse events from firing immediately after touch events
    if (Date.now() - Stage.lastTouchTimestamp < 500) {
      return;
    }

    let type = 'start';
    if (evt.type === 'mousemove') {
      type = 'move';
    } else if (evt.type === 'mouseup') {
      type = 'end';
    }

    Stage.stages.forEach((stage) => {
      const pos = Stage.windowToCanvas(stage.canvas, evt.clientX, evt.clientY);
      stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
    });
  }

  // Handle touch interaction
  static touchHandler(evt: TouchEvent): void {
    Stage.lastTouchTimestamp = Date.now();

    // Set generic event type
    let type = 'start';
    if (evt.type === 'touchmove') {
      type = 'move';
    } else if (evt.type === 'touchend') {
      type = 'end';
    }

    // Dispatch "pointer events" for all changed touches across all stages
    Stage.stages.forEach((stage) => {
      // Safari doesn't treat a TouchList as an iterable, hence Array.from()
      for (const touch of Array.from(evt.changedTouches)) {
        let pos: { x: number; y: number };
        if (type !== 'end') {
          pos = Stage.windowToCanvas(stage.canvas, touch.clientX, touch.clientY);
          stage._listeners.lastPointerPos = pos;
          // Before touchstart event, fire a move event to better emulate cursor events
          if (type === 'start') {
            stage.pointerEvent('move', pos.x / stage.dpr, pos.y / stage.dpr);
          }
        } else {
          // On touchend, fill in position information based on last known touch location
          pos = stage._listeners.lastPointerPos;
        }
        stage.pointerEvent(type, pos.x / stage.dpr, pos.y / stage.dpr);
      }
    });
  }

  // Dispatch a normalized pointer event on a specific stage
  pointerEvent(type: string, x: number, y: number): void {
    // Build event object to dispatch
    const evt: PointerEvent = {
      type: type,
      x: x,
      y: y,
    };

    // Whether pointer event was dispatched over canvas element
    evt.onCanvas = x >= 0 && x <= this.width && y >= 0 && y <= this.height;

    // Dispatch
    this.dispatchEvent('pointer' + type, evt);
  }
}

// Set up global event listeners
document.addEventListener('mousedown', Stage.mouseHandler);
document.addEventListener('mousemove', Stage.mouseHandler);
document.addEventListener('mouseup', Stage.mouseHandler);
document.addEventListener('touchstart', Stage.touchHandler);
document.addEventListener('touchmove', Stage.touchHandler);
document.addEventListener('touchend', Stage.touchHandler);
