/*
  Copyright © 2022 Nam088. All rights reserved.
  Github: https://github.com/Nam088/firework
  Gitee: https://gitee.com/Nam088/firework
  This project is licensed under Apache-2.0.
*/

// Interface for the lattice result from text-to-dots conversion
export interface LiteralLatticeResult {
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
}

// Vector split result
export interface VectorComponents {
  x: number;
  y: number;
}

// Math utility module
export const MyMath = {
  // Degree/radian conversion constants
  toDeg: 180 / Math.PI,
  toRad: Math.PI / 180,
  halfPI: Math.PI / 2,
  twoPI: Math.PI * 2,

  // Pythagorean Theorem distance calculation
  dist(width: number, height: number): number {
    return Math.sqrt(width * width + height * height);
  },

  // Pythagorean Theorem point distance calculation
  // Same as above, but takes coordinates instead of dimensions
  pointDist(x1: number, y1: number, x2: number, y2: number): number {
    const distX = x2 - x1;
    const distY = y2 - y1;
    return Math.sqrt(distX * distX + distY * distY);
  },

  // Returns the angle (in radians) of a 2D vector
  angle(width: number, height: number): number {
    return MyMath.halfPI + Math.atan2(height, width);
  },

  // Returns the angle (in radians) between two points
  // Same as above, but takes coordinates instead of dimensions
  pointAngle(x1: number, y1: number, x2: number, y2: number): number {
    return MyMath.halfPI + Math.atan2(y2 - y1, x2 - x1);
  },

  // Splits a speed vector into x and y components (angle needs to be in radians)
  splitVector(speed: number, angle: number): VectorComponents {
    return {
      x: Math.sin(angle) * speed,
      y: -Math.cos(angle) * speed,
    };
  },

  // Generates a random number between min (inclusive) and max (exclusive)
  random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  // Generates a random integer between and possibly including min and max values
  randomInt(min: number, max: number): number {
    return ((Math.random() * (max - min + 1)) | 0) + min;
  },

  // Returns a random element from an array, or simply the set of provided arguments when called
  randomChoice<T>(choices: T[] | T, ...rest: T[]): T {
    if (rest.length === 0 && Array.isArray(choices)) {
      return choices[(Math.random() * choices.length) | 0];
    }
    const allChoices = Array.isArray(choices) ? choices : [choices, ...rest];
    return allChoices[(Math.random() * allChoices.length) | 0];
  },

  // Clamps a number between min and max values
  clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Convert text to dot matrix
   * @param text - Text content
   * @param density - Dot density, default 3
   * @param fontFamily - Font family, default Georgia
   * @param fontSize - Font size, default 60px
   * @returns Dot matrix result with width, height, and points array
   */
  literalLattice(
    text: string,
    density: number = 3,
    fontFamily: string = 'Georgia',
    fontSize: string = '60px'
  ): LiteralLatticeResult {
    // Create an empty dots array
    const dots: Array<{ x: number; y: number }> = [];
    
    // Create a canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const font = `${fontSize} ${fontFamily}`;

    ctx.font = font;
    const width = ctx.measureText(text).width;
    const fontSizeNum = parseInt(fontSize.match(/(\d+)px/)?.[1] || '60');
    canvas.width = width + 20;
    canvas.height = fontSizeNum + 20;

    ctx.font = font;
    ctx.fillText(text, 10, fontSizeNum + 10);

    // Get pixel data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < imageData.height; y += density) {
      for (let x = 0; x < imageData.width; x += density) {
        const i = (y * imageData.width + x) * 4;
        // If the alpha value is greater than 0, this pixel is part of the text
        if (imageData.data[i + 3] > 0) {
          // Add point to the dots array with coordinates
          dots.push({ x: x, y: y });
        }
      }
    }

    return {
      width: canvas.width,
      height: canvas.height,
      points: dots,
    };
  },
};
