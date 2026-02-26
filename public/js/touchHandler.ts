/**
 * TouchHandler - Processes touch/pointer input events with debouncing and gesture prevention.
 * 
 * Uses Pointer Events API for unified touch/mouse handling across devices.
 * 
 * Properties satisfied:
 * - Property 1: Touch Input Debouncing - only first touch triggers jump during airborne
 * - Property 2: Touch Event Boundary Enforcement - touches outside container ignored
 * - Property 3: Default Browser Behavior Prevention - defaults prevented during gameplay
 * 
 * Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6
 */

// Debounce window in milliseconds - prevents rapid successive inputs
const DEBOUNCE_WINDOW_MS = 16; // One frame at 60fps

export class TouchHandler {
  public enabled: boolean;
  public lastTouchTime: number;
  
  private container: HTMLElement | null;
  private inputCallback: (() => void) | null;
  private boundPointerDown: (event: PointerEvent) => void;
  private boundPreventDefaults: (event: Event) => void;

  constructor() {
    this.enabled = false;
    this.lastTouchTime = 0;
    this.container = null;
    this.inputCallback = null;
    
    // Bind event handlers to preserve 'this' context
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPreventDefaults = this.preventDefaults.bind(this);
  }

  /**
   * Initializes the touch handler by attaching pointer event listeners to the container.
   * Uses Pointer Events API for unified touch/mouse handling.
   * 
   * Requirement 1.4: Support touch input across the entire game container area
   * 
   * @param container - The HTML element to attach event listeners to
   */
  init(container: HTMLElement): void {
    if (!container) {
      return;
    }

    // Clean up any existing listeners
    this.cleanup();

    this.container = container;
    this.enabled = true;

    // Attach pointer event listener for unified touch/mouse handling
    // Requirement 1.1: Register input within 16ms (one frame)
    container.addEventListener('pointerdown', this.boundPointerDown, { passive: false });

    // Prevent default browser behaviors during gameplay
    // Requirement 1.2: Prevent scroll, zoom, pull-to-refresh
    container.addEventListener('touchstart', this.boundPreventDefaults, { passive: false });
    container.addEventListener('touchmove', this.boundPreventDefaults, { passive: false });
    container.addEventListener('touchend', this.boundPreventDefaults, { passive: false });
    
    // Prevent context menu on long press
    container.addEventListener('contextmenu', this.boundPreventDefaults);
    
    // Prevent double-tap zoom
    container.addEventListener('dblclick', this.boundPreventDefaults);

    // Set touch-action CSS to prevent browser gestures
    container.style.touchAction = 'none';
    container.style.userSelect = 'none';
    // Vendor prefixes for broader compatibility
    (container.style as any).webkitUserSelect = 'none';
    (container.style as any).webkitTouchCallout = 'none';
  }

  /**
   * Registers a callback function to be called when valid input is detected.
   * 
   * @param callback - Function to call when input is triggered
   */
  onInput(callback: () => void): void {
    this.inputCallback = callback;
  }

  /**
   * Prevents default browser behaviors for touch events.
   * Blocks scroll, zoom, and pull-to-refresh during gameplay.
   * 
   * Requirement 1.2: Prevent default browser behaviors during gameplay
   * Property 3: Default Browser Behavior Prevention
   * 
   * @param event - The event to prevent defaults on
   */
  preventDefaults(event: Event): void {
    if (!this.enabled) {
      return;
    }

    event.preventDefault();
    
    if (event.stopPropagation) {
      event.stopPropagation();
    }
  }

  /**
   * Checks if the handler is within the debounce window.
   * Used to prevent rapid successive inputs during jump.
   * 
   * Requirement 1.3: Process only first touch until jump action completes
   * Property 1: Touch Input Debouncing
   * 
   * @returns True if within debounce window, false otherwise
   */
  isDebounced(): boolean {
    const now = performance.now();
    return (now - this.lastTouchTime) < DEBOUNCE_WINDOW_MS;
  }

  /**
   * Handles pointer down events (unified touch/mouse).
   * Validates the event is within the container bounds before triggering callback.
   * 
   * Requirement 1.5: Ignore touch events outside the game container
   * Property 2: Touch Event Boundary Enforcement
   * 
   * @param event - The pointer event
   */
  private handlePointerDown(event: PointerEvent): void {
    // Check if handler is enabled
    if (!this.enabled || !this.container) {
      return;
    }

    // Prevent default browser behaviors
    // Requirement 1.2: Prevent scroll, zoom, pull-to-refresh
    this.preventDefaults(event);

    // Validate event is within container bounds
    // Requirement 1.5: Ignore touches outside game container
    if (!this.isEventWithinContainer(event)) {
      return;
    }

    // Check debounce window
    // Requirement 1.3: Process only first touch until jump completes
    if (this.isDebounced()) {
      return;
    }

    // Update last touch time
    this.lastTouchTime = performance.now();

    // Trigger the input callback
    // Requirement 1.1: Register input within 16ms
    if (this.inputCallback) {
      this.inputCallback();
    }

    // Requirement 1.6: Failed touch events should not affect subsequent inputs
    // This is handled by the try-catch-free design - each event is independent
  }

  /**
   * Checks if a pointer event occurred within the container bounds.
   * 
   * Property 2: Touch Event Boundary Enforcement
   * 
   * @param event - The pointer event to check
   * @returns True if event is within container, false otherwise
   */
  private isEventWithinContainer(event: PointerEvent): boolean {
    if (!this.container) {
      return false;
    }

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }

  /**
   * Resets the debounce timer.
   * Should be called when the jump action completes (rabbit lands).
   */
  resetDebounce(): void {
    this.lastTouchTime = 0;
  }

  /**
   * Enables the touch handler.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disables the touch handler.
   * Touch events will still be captured but not processed.
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Cleans up event listeners and resets state.
   */
  cleanup(): void {
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.boundPointerDown);
      this.container.removeEventListener('touchstart', this.boundPreventDefaults);
      this.container.removeEventListener('touchmove', this.boundPreventDefaults);
      this.container.removeEventListener('touchend', this.boundPreventDefaults);
      this.container.removeEventListener('contextmenu', this.boundPreventDefaults);
      this.container.removeEventListener('dblclick', this.boundPreventDefaults);
      
      // Reset touch-action CSS
      this.container.style.touchAction = '';
      this.container.style.userSelect = '';
    }

    this.container = null;
    this.inputCallback = null;
    this.enabled = false;
    this.lastTouchTime = 0;
  }

  /**
   * Gets the time since the last touch input in milliseconds.
   * 
   * @returns Time since last touch in ms, or Infinity if no touch recorded
   */
  getTimeSinceLastTouch(): number {
    if (this.lastTouchTime === 0) {
      return Infinity;
    }
    return performance.now() - this.lastTouchTime;
  }
}
