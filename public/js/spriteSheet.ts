/**
 * SpriteSheet - Manages loading and frame extraction from sprite sheet images.
 * 
 * Sprite Sheet Layout (4 frames, 45px each):
 * +-------+-------+-------+-------+
 * | Run 1 | Run 2 | Jump  | Land  |
 * | (0)   | (1)   | (2)   | (3)   |
 * +-------+-------+-------+-------+
 *   45px    45px    45px    45px
 */

export interface FrameCoordinates {
  x: number;
  y: number;
}

export class SpriteSheet {
  public image: HTMLImageElement;
  public frameWidth: number;
  public frameHeight: number;
  public loaded: boolean;

  constructor(frameWidth: number = 45, frameHeight: number = 45) {
    this.image = new Image();
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.loaded = false;
  }

  /**
   * Loads the sprite sheet image from the given source URL.
   * @param src - The URL of the sprite sheet image
   * @returns Promise that resolves when the image is loaded, rejects on failure
   */
  load(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loaded = false;

      this.image.onload = () => {
        this.loaded = true;
        resolve();
      };

      this.image.onerror = () => {
        this.loaded = false;
        reject(new Error(`Failed to load sprite sheet: ${src}`));
      };

      this.image.src = src;
    });
  }

  /**
   * Gets the x, y coordinates for a specific frame in the sprite sheet.
   * Assumes frames are arranged horizontally in a single row.
   * @param frameIndex - The index of the frame (0-based)
   * @returns The x, y coordinates of the frame's top-left corner
   */
  getFrame(frameIndex: number): FrameCoordinates {
    // Ensure frameIndex is non-negative
    const safeIndex = Math.max(0, Math.floor(frameIndex));
    
    return {
      x: safeIndex * this.frameWidth,
      y: 0
    };
  }
}
