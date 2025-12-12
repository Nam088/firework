/**
 * Generic Object Pool for Performance
 * 
 * Reuses objects instead of creating new ones to reduce GC pressure.
 */

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  
  constructor(factory: () => T, reset: (obj: T) => void = () => {}) {
    this.factory = factory;
    this.reset = reset;
  }
  
  /**
   * Get an object from pool or create new one
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }
  
  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
  
  /**
   * Get current pool size
   */
  get size(): number {
    return this.pool.length;
  }
  
  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
  }
  
  /**
   * Pre-allocate objects in the pool
   */
  preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }
}
