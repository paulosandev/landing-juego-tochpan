/**
 * AnimationController - Controls animation state and frame timing for the rabbit sprite.
 *
 * Animation States:
 * - idle: Default state when game is not active
 * - running: Cycles through running frames while on ground and game is active
 * - jumping: Single frame displayed while airborne
 * - landing: Brief landing effect before returning to running
 *
 * Properties satisfied:
 * - Property 4: Running Animation State Consistency - on ground + active = running state
 * - Property 5: Animation Frame Rate Bounds - 8-12 fps, increases with game speed
 * - Property 6: Jump Animation State Transition - leaving ground triggers jump state
 * - Property 7: Airborne Animation Consistency - airborne = jumping frame displayed
 * - Property 8: Landing Animation Transition - landing returns to running within 16ms
 *
 * Validates: Requirements 2.1, 2.2, 2.4, 3.1, 3.2, 3.3
 */
// Animation configuration as specified in design document
export const ANIMATION_CONFIGS = {
    idle: {
        name: 'idle',
        frames: [0],
        frameRate: 1,
        loop: true
    },
    running: {
        name: 'running',
        frames: [0, 1],
        frameRate: 10, // Base frame rate: 10 fps (within 8-12 range)
        loop: true
    },
    jumping: {
        name: 'jumping',
        frames: [2],
        frameRate: 1,
        loop: false
    },
    landing: {
        name: 'landing',
        frames: [3],
        frameRate: 1,
        loop: false,
        duration: 100 // 100ms before returning to running
    }
};
// Frame rate bounds as per Requirement 2.2
const MIN_FRAME_RATE = 8;
const MAX_FRAME_RATE = 12;
const BASE_FRAME_RATE = 10;
export class AnimationController {
    constructor() {
        this.currentState = { ...ANIMATION_CONFIGS.idle };
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.stateStartTime = 0;
        this.frameAccumulator = 0;
    }
    /**
     * Transitions to a new animation state.
     * Resets frame counter and timing when state changes.
     *
     * @param stateName - The name of the state to transition to
     */
    setState(stateName) {
        // Only transition if state is actually changing
        if (this.currentState.name === stateName) {
            return;
        }
        const newState = ANIMATION_CONFIGS[stateName];
        if (!newState) {
            return;
        }
        this.currentState = { ...newState };
        this.currentFrame = 0;
        this.stateStartTime = performance.now();
        this.frameAccumulator = 0;
    }
    /**
     * Advances the animation based on elapsed time and game speed.
     * Handles frame rate scaling with game speed (Property 5).
     * Handles graceful frame skipping for slow devices (Property 11).
     *
     * @param deltaTime - Time elapsed since last update in milliseconds
     * @param gameSpeed - Current game speed multiplier (1.0 = normal)
     */
    update(deltaTime, gameSpeed = 1.0) {
        const now = performance.now();
        // Handle landing state duration - transition back to running after duration expires
        // Property 8: Landing returns to running within 16ms (one frame)
        if (this.currentState.name === 'landing' && this.currentState.duration) {
            const elapsed = now - this.stateStartTime;
            if (elapsed >= this.currentState.duration) {
                this.setState('running');
                return;
            }
        }
        // For non-looping single-frame states, no need to advance
        if (!this.currentState.loop && this.currentState.frames.length === 1) {
            this.lastFrameTime = now;
            return;
        }
        // Calculate effective frame rate based on game speed
        // Property 5: Frame rate between 8-12 fps, increases with game speed
        const effectiveFrameRate = this.calculateEffectiveFrameRate(gameSpeed);
        const frameDuration = 1000 / effectiveFrameRate;
        // Accumulate time for frame advancement
        this.frameAccumulator += deltaTime;
        // Advance frames based on accumulated time
        // Property 11: Skip frames proportionally rather than playing catch-up
        if (this.frameAccumulator >= frameDuration) {
            const framesToAdvance = Math.floor(this.frameAccumulator / frameDuration);
            this.frameAccumulator = this.frameAccumulator % frameDuration;
            if (this.currentState.loop) {
                // For looping animations, wrap around
                this.currentFrame = (this.currentFrame + framesToAdvance) % this.currentState.frames.length;
            }
            else {
                // For non-looping animations, clamp to last frame
                this.currentFrame = Math.min(this.currentFrame + framesToAdvance, this.currentState.frames.length - 1);
            }
        }
        this.lastFrameTime = now;
    }
    /**
     * Returns the current frame index from the sprite sheet.
     *
     * @returns The sprite sheet frame index for the current animation frame
     */
    getCurrentFrameIndex() {
        return this.currentState.frames[this.currentFrame] ?? 0;
    }
    /**
     * Gets the current animation state name.
     *
     * @returns The name of the current animation state
     */
    getStateName() {
        return this.currentState.name;
    }
    /**
     * Checks if the current animation has completed (for non-looping animations).
     *
     * @returns True if the animation has finished, false otherwise
     */
    isAnimationComplete() {
        if (this.currentState.loop) {
            return false;
        }
        return this.currentFrame >= this.currentState.frames.length - 1;
    }
    /**
     * Calculates the effective frame rate based on game speed.
     * Ensures frame rate stays within 8-12 fps bounds (Property 5).
     *
     * @param gameSpeed - Current game speed multiplier
     * @returns The effective frame rate in fps
     */
    calculateEffectiveFrameRate(gameSpeed) {
        // Scale frame rate proportionally with game speed
        // Base rate is 10 fps, scales linearly with game speed
        const scaledRate = BASE_FRAME_RATE * gameSpeed;
        // Clamp to bounds: 8-12 fps as per Requirement 2.2
        return Math.max(MIN_FRAME_RATE, Math.min(MAX_FRAME_RATE, scaledRate));
    }
    /**
     * Resets the animation controller to initial state.
     */
    reset() {
        this.currentState = { ...ANIMATION_CONFIGS.idle };
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.stateStartTime = 0;
        this.frameAccumulator = 0;
    }
}
//# sourceMappingURL=animationController.js.map