/**
 * SpriteRenderer - Renders sprites to canvas with visual effects.
 * 
 * Handles drawing sprite frames from a sprite sheet with support for:
 * - Basic sprite rendering at specified positions
 * - Scale transformations
 * - Squash/stretch effects for jump takeoff and landing feedback
 * 
 * Maintains 45x45 pixel visual size as per requirements.
 */

import { SpriteSheet } from './spriteSheet';

export class SpriteRenderer {
  public ctx: CanvasRenderingContext2D;
  public spriteSheet: SpriteSheet;

  /** Default visual size for sprites (matches emoji size) */
  private static readonly DEFAULT_SIZE = 45;

  constructor(ctx: CanvasRenderingContext2D, spriteSheet: SpriteSheet) {
    this.ctx = ctx;
    this.spriteSheet = spriteSheet;
  }

  /**
   * Draws a sprite frame at the specified position.
   * @param frameIndex - The index of the frame in the sprite sheet
   * @param x - The x coordinate (center of sprite)
   * @param y - The y coordinate (center of sprite)
   * @param scale - Optional scale factor (default: 1.0)
   */
  drawSprite(frameIndex: number, x: number, y: number, scale: number = 1.0): void {
    if (!this.spriteSheet.loaded) {
      return;
    }

    const frame = this.spriteSheet.getFrame(frameIndex);
    const size = SpriteRenderer.DEFAULT_SIZE;
    const scaledSize = size * scale;

    // Draw centered at (x, y)
    const drawX = x - scaledSize / 2;
    const drawY = y - scaledSize / 2;

    this.ctx.drawImage(
      this.spriteSheet.image,
      frame.x,
      frame.y,
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight,
      drawX,
      drawY,
      scaledSize,
      scaledSize
    );
  }

  /**
   * Draws a sprite frame with squash/stretch effect for visual feedback.
   * Used for jump takeoff (squash horizontally, stretch vertically) and
   * landing effects (stretch horizontally, squash vertically).
   * 
   * @param frameIndex - The index of the frame in the sprite sheet
   * @param x - The x coordinate (center of sprite)
   * @param y - The y coordinate (bottom of sprite, for ground alignment)
   * @param squashX - Horizontal scale factor (< 1 = squash, > 1 = stretch)
   * @param squashY - Vertical scale factor (< 1 = squash, > 1 = stretch)
   */
  drawWithSquash(
    frameIndex: number,
    x: number,
    y: number,
    squashX: number,
    squashY: number
  ): void {
    if (!this.spriteSheet.loaded) {
      return;
    }

    const frame = this.spriteSheet.getFrame(frameIndex);
    const size = SpriteRenderer.DEFAULT_SIZE;

    // Calculate scaled dimensions
    const scaledWidth = size * squashX;
    const scaledHeight = size * squashY;

    // Draw centered horizontally, anchored at bottom (y is ground level)
    const drawX = x - scaledWidth / 2;
    const drawY = y - scaledHeight;

    this.ctx.drawImage(
      this.spriteSheet.image,
      frame.x,
      frame.y,
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight,
      drawX,
      drawY,
      scaledWidth,
      scaledHeight
    );
  }
}
