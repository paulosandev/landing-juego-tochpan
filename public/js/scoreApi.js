/**
 * ScoreApi - Handles score submission, retrieval, and phone number input modal.
 *
 * Features:
 * - API calls to backend (POST /api/scores, GET /api/scores/top)
 * - Phone number validation (10 digits)
 * - Local storage fallback for offline/error scenarios
 * - Modal component for phone number input
 *
 * Requirements: 7.1, 7.2, 9.1
 */
/** Brand colors matching the game theme */
const COLORS = {
    dark: '#544540',
    beige: '#eae1d7',
    light: '#fef8f3',
    accent: '#FF8C42'
};
/** Local storage key for pending scores */
const PENDING_SCORES_KEY = 'tochpan_pending_scores';
/**
 * Validates that a phone number contains exactly 10 numeric digits.
 * Requirement: 7.2
 *
 * @param phone - The phone number string to validate
 * @returns true if the phone number is exactly 10 numeric digits
 */
export function validatePhone(phone) {
    return /^\d{10}$/.test(phone);
}
/**
 * Masks a phone number for display, showing only the last 4 digits.
 *
 * @param phone - The phone number to mask (should be 10 digits)
 * @returns The masked phone number in format ***-***-XXXX
 */
export function maskPhone(phone) {
    const lastFour = phone.slice(-4);
    return `***-***-${lastFour}`;
}
/**
 * Saves a pending score to local storage for later retry.
 * Used when network requests fail.
 *
 * @param phone - The player's phone number
 * @param score - The score to save
 * @param playerName - The player's name
 */
function savePendingScore(phone, score, playerName = '') {
    try {
        const pending = getPendingScores();
        // Update existing entry or add new one
        const existingIndex = pending.findIndex(p => p.phone === phone);
        if (existingIndex >= 0) {
            // Only update if new score is higher
            if (score > pending[existingIndex].score) {
                pending[existingIndex] = { phone, score, playerName, timestamp: Date.now() };
            }
        }
        else {
            pending.push({ phone, score, playerName, timestamp: Date.now() });
        }
        localStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(pending));
    }
    catch (error) {
        console.error('Failed to save pending score to local storage:', error);
    }
}
/**
 * Retrieves pending scores from local storage.
 *
 * @returns Array of pending score entries
 */
function getPendingScores() {
    try {
        const stored = localStorage.getItem(PENDING_SCORES_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    catch {
        return [];
    }
}
/**
 * Removes a pending score from local storage after successful submission.
 *
 * @param phone - The phone number to remove
 */
function removePendingScore(phone) {
    try {
        const pending = getPendingScores();
        const filtered = pending.filter(p => p.phone !== phone);
        localStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(filtered));
    }
    catch (error) {
        console.error('Failed to remove pending score:', error);
    }
}
/**
 * Submits a score to the backend API.
 * Falls back to local storage if the request fails.
 * Requirement: 9.1
 *
 * @param phone - The player's phone number (10 digits)
 * @param score - The score to submit
 * @param playerName - The player's name
 * @returns Promise resolving to submission result
 */
export async function submitScore(phone, score, playerName = '') {
    // Validate phone before submission
    if (!validatePhone(phone)) {
        return { success: false, isNewRecord: false, error: 'Ingresa 10 dígitos' };
    }
    try {
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, score, playerName }),
        });
        if (response.ok) {
            const data = await response.json();
            // Remove from pending if it was there
            removePendingScore(phone);
            return {
                success: data.success,
                isNewRecord: data.isNewRecord,
            };
        }
        // Handle specific error responses
        if (response.status === 400) {
            const errorData = await response.json();
            return { success: false, isNewRecord: false, error: errorData.error };
        }
        if (response.status === 429) {
            // Rate limited - save locally and inform user
            savePendingScore(phone, score, playerName);
            return {
                success: false,
                isNewRecord: false,
                error: 'Demasiados intentos. Intenta más tarde.',
                savedLocally: true,
            };
        }
        // Server error - fall back to local storage
        throw new Error('Server error');
    }
    catch (error) {
        // Network error or server error - save locally
        savePendingScore(phone, score, playerName);
        return {
            success: false,
            isNewRecord: false,
            error: 'Puntuación guardada localmente',
            savedLocally: true,
        };
    }
}
/**
 * Fetches the top scores from the backend API.
 *
 * @returns Promise resolving to array of leaderboard entries
 */
export async function fetchTopScores() {
    try {
        const response = await fetch('/api/scores/top');
        if (!response.ok) {
            throw new Error('Failed to fetch scores');
        }
        const data = await response.json();
        return data.scores.map((entry, index) => ({
            rank: index + 1,
            displayPhone: entry.display_phone,
            playerName: entry.player_name || '',
            score: entry.score,
            isCurrentPlayer: false,
        }));
    }
    catch (error) {
        console.error('Failed to fetch top scores:', error);
        return [];
    }
}
/**
 * Attempts to submit any pending scores stored locally.
 * Should be called when the app initializes or regains connectivity.
 */
export async function retryPendingScores() {
    const pending = getPendingScores();
    for (const entry of pending) {
        try {
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: entry.phone, score: entry.score, playerName: entry.playerName || '' }),
            });
            if (response.ok) {
                removePendingScore(entry.phone);
            }
        }
        catch {
            // Still offline, keep in pending
            break;
        }
    }
}
/**
 * PhoneInputModal - Modal component for collecting phone number and name input.
 * Displays when a player achieves a new high score.
 * Requirement: 7.1
 */
export class PhoneInputModal {
    constructor() {
        this.overlay = null;
        this.container = null;
        this.nameInput = null;
        this.phoneInput = null;
        this.errorElement = null;
        this.submitButton = null;
        this.isSubmitting = false;
        this.onSubmitCallback = null;
        this.onCloseCallback = null;
        this.createElements();
    }
    /**
     * Creates the DOM elements for the phone input modal.
     */
    createElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'phone-input-overlay';
        this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(84, 69, 64, 0.95);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 200;
      backdrop-filter: blur(4px);
      padding: 1rem;
    `;
        // Create container
        this.container = document.createElement('div');
        this.container.style.cssText = `
      background-color: ${COLORS.light};
      border-radius: 1rem;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 2px solid ${COLORS.beige};
      text-align: center;
    `;
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `margin-bottom: 1.5rem;`;
        const title = document.createElement('h2');
        title.textContent = '🎉 ¡Nuevo Récord!';
        title.style.cssText = `
      font-family: "DM Sans", sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: ${COLORS.dark};
      margin: 0 0 0.5rem 0;
    `;
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Ingresa tus datos para guardar tu puntuación';
        subtitle.style.cssText = `
      font-family: "Quicksand", sans-serif;
      font-size: 0.875rem;
      color: ${COLORS.dark};
      opacity: 0.7;
      margin: 0;
    `;
        header.appendChild(title);
        header.appendChild(subtitle);
        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `margin-bottom: 1rem;`;
        // Name input
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Tu nombre';
        nameLabel.style.cssText = `
      display: block;
      font-family: "Quicksand", sans-serif;
      font-size: 0.875rem;
      color: ${COLORS.dark};
      margin-bottom: 0.25rem;
      text-align: left;
    `;
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Ej: Juan';
        this.nameInput.maxLength = 50;
        this.nameInput.style.cssText = `
      width: 100%;
      padding: 0.75rem 1rem;
      font-family: "Quicksand", sans-serif;
      font-size: 1rem;
      border: 2px solid ${COLORS.beige};
      border-radius: 0.5rem;
      background-color: ${COLORS.light};
      color: ${COLORS.dark};
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
      margin-bottom: 1rem;
    `;
        this.nameInput.addEventListener('focus', () => {
            if (this.nameInput) {
                this.nameInput.style.borderColor = COLORS.accent;
            }
        });
        this.nameInput.addEventListener('blur', () => {
            if (this.nameInput) {
                this.nameInput.style.borderColor = COLORS.beige;
            }
        });
        // Phone input
        const phoneLabel = document.createElement('label');
        phoneLabel.textContent = 'Tu teléfono';
        phoneLabel.style.cssText = `
      display: block;
      font-family: "Quicksand", sans-serif;
      font-size: 0.875rem;
      color: ${COLORS.dark};
      margin-bottom: 0.25rem;
      text-align: left;
    `;
        this.phoneInput = document.createElement('input');
        this.phoneInput.type = 'tel';
        this.phoneInput.placeholder = '10 dígitos';
        this.phoneInput.maxLength = 10;
        this.phoneInput.inputMode = 'numeric';
        this.phoneInput.pattern = '[0-9]*';
        this.phoneInput.style.cssText = `
      width: 100%;
      padding: 1rem;
      font-family: "Quicksand", sans-serif;
      font-size: 1.25rem;
      text-align: center;
      letter-spacing: 0.2em;
      border: 2px solid ${COLORS.beige};
      border-radius: 0.5rem;
      background-color: ${COLORS.light};
      color: ${COLORS.dark};
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
    `;
        // Input focus styles
        this.phoneInput.addEventListener('focus', () => {
            if (this.phoneInput) {
                this.phoneInput.style.borderColor = COLORS.accent;
            }
        });
        this.phoneInput.addEventListener('blur', () => {
            if (this.phoneInput) {
                this.phoneInput.style.borderColor = COLORS.beige;
            }
        });
        // Only allow numeric input
        this.phoneInput.addEventListener('input', (e) => {
            const target = e.target;
            target.value = target.value.replace(/\D/g, '');
            this.clearError();
        });
        // Submit on Enter
        this.phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });
        inputContainer.appendChild(nameLabel);
        inputContainer.appendChild(this.nameInput);
        inputContainer.appendChild(phoneLabel);
        inputContainer.appendChild(this.phoneInput);
        // Create error element
        this.errorElement = document.createElement('p');
        this.errorElement.style.cssText = `
      font-family: "Quicksand", sans-serif;
      font-size: 0.875rem;
      color: #dc2626;
      margin: 0.5rem 0 0 0;
      min-height: 1.25rem;
    `;
        inputContainer.appendChild(this.errorElement);
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.5rem;
    `;
        // Submit button
        this.submitButton = document.createElement('button');
        this.submitButton.textContent = 'Guardar Puntuación';
        this.submitButton.style.cssText = `
      width: 100%;
      padding: 0.875rem 1.5rem;
      background-color: ${COLORS.accent};
      color: white;
      border: none;
      border-radius: 9999px;
      font-family: "DM Sans", sans-serif;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: transform 0.15s, background-color 0.15s, opacity 0.15s;
    `;
        this.submitButton.addEventListener('mouseenter', () => {
            if (this.submitButton && !this.isSubmitting) {
                this.submitButton.style.transform = 'scale(1.02)';
            }
        });
        this.submitButton.addEventListener('mouseleave', () => {
            if (this.submitButton) {
                this.submitButton.style.transform = 'scale(1)';
            }
        });
        this.submitButton.addEventListener('click', () => this.handleSubmit());
        // Skip button
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Omitir';
        skipButton.style.cssText = `
      width: 100%;
      padding: 0.75rem 1.5rem;
      background-color: transparent;
      color: ${COLORS.dark};
      border: 2px solid ${COLORS.beige};
      border-radius: 9999px;
      font-family: "DM Sans", sans-serif;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: background-color 0.15s;
      opacity: 0.7;
    `;
        skipButton.addEventListener('mouseenter', () => {
            skipButton.style.backgroundColor = COLORS.beige;
        });
        skipButton.addEventListener('mouseleave', () => {
            skipButton.style.backgroundColor = 'transparent';
        });
        skipButton.addEventListener('click', () => this.hide());
        buttonsContainer.appendChild(this.submitButton);
        buttonsContainer.appendChild(skipButton);
        // Assemble container
        this.container.appendChild(header);
        this.container.appendChild(inputContainer);
        this.container.appendChild(buttonsContainer);
        this.overlay.appendChild(this.container);
        // Add to document body
        document.body.appendChild(this.overlay);
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }
    /**
     * Shows the phone input modal.
     *
     * @param onSubmit - Callback when phone is submitted
     * @param onClose - Callback when modal is closed without submission
     */
    show(onSubmit, onClose) {
        this.onSubmitCallback = onSubmit;
        this.onCloseCallback = onClose || null;
        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
        if (this.nameInput) {
            this.nameInput.value = '';
            this.nameInput.focus();
        }
        if (this.phoneInput) {
            this.phoneInput.value = '';
        }
        this.clearError();
        this.setSubmitting(false);
    }
    /**
     * Hides the phone input modal.
     */
    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
        this.onSubmitCallback = null;
        this.onCloseCallback = null;
    }
    /**
     * Checks if the modal is currently visible.
     */
    isVisible() {
        return this.overlay?.style.display === 'flex';
    }
    /**
     * Handles the submit action.
     */
    async handleSubmit() {
        if (this.isSubmitting || !this.phoneInput || !this.nameInput || !this.onSubmitCallback)
            return;
        const phone = this.phoneInput.value;
        const playerName = this.nameInput.value.trim();
        // Validate phone number - Requirement 7.2
        if (!validatePhone(phone)) {
            this.showError('Ingresa 10 dígitos');
            return;
        }
        this.setSubmitting(true);
        this.clearError();
        try {
            const result = await this.onSubmitCallback(phone, playerName);
            if (result.success || result.savedLocally) {
                // Success or saved locally - close modal
                this.hide();
            }
            else if (result.error) {
                // Show error message
                this.showError(result.error);
                this.setSubmitting(false);
            }
        }
        catch (error) {
            this.showError('Error al guardar. Intenta de nuevo.');
            this.setSubmitting(false);
        }
    }
    /**
     * Shows an error message.
     */
    showError(message) {
        if (this.errorElement) {
            this.errorElement.textContent = message;
        }
        if (this.phoneInput) {
            this.phoneInput.style.borderColor = '#dc2626';
        }
    }
    /**
     * Clears the error message.
     */
    clearError() {
        if (this.errorElement) {
            this.errorElement.textContent = '';
        }
        if (this.phoneInput) {
            this.phoneInput.style.borderColor = COLORS.beige;
        }
    }
    /**
     * Sets the submitting state.
     */
    setSubmitting(submitting) {
        this.isSubmitting = submitting;
        if (this.submitButton) {
            this.submitButton.disabled = submitting;
            this.submitButton.textContent = submitting ? 'Guardando...' : 'Guardar Puntuación';
            this.submitButton.style.opacity = submitting ? '0.6' : '1';
            this.submitButton.style.cursor = submitting ? 'not-allowed' : 'pointer';
        }
        if (this.phoneInput) {
            this.phoneInput.disabled = submitting;
        }
        if (this.nameInput) {
            this.nameInput.disabled = submitting;
        }
    }
    /**
     * Destroys the modal and removes DOM elements.
     */
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.container = null;
        this.nameInput = null;
        this.phoneInput = null;
        this.errorElement = null;
        this.submitButton = null;
        this.onSubmitCallback = null;
        this.onCloseCallback = null;
    }
}
/**
 * ScoreApi - Main class combining all score-related functionality.
 */
export class ScoreApi {
    constructor() {
        this.currentPlayerPhone = null;
        this.currentPlayerName = null;
        this.phoneModal = new PhoneInputModal();
        // Try to submit any pending scores on initialization
        retryPendingScores();
    }
    /**
     * Gets the current player's phone number (if set).
     */
    getCurrentPlayerPhone() {
        return this.currentPlayerPhone;
    }
    /**
     * Gets the current player's name (if set).
     */
    getCurrentPlayerName() {
        return this.currentPlayerName;
    }
    /**
     * Prompts the user to enter their phone number and name, then submit their score.
     * Requirement: 7.1
     *
     * @param score - The score to submit
     * @returns Promise resolving to submission result
     */
    async promptAndSubmitScore(score) {
        return new Promise((resolve) => {
            this.phoneModal.show(async (phone, playerName) => {
                const result = await submitScore(phone, score, playerName);
                if (result.success || result.savedLocally) {
                    this.currentPlayerPhone = phone;
                    this.currentPlayerName = playerName;
                }
                resolve(result);
                return result;
            }, () => {
                // User skipped - resolve with no submission
                resolve({ success: false, isNewRecord: false });
            });
        });
    }
    /**
     * Fetches top scores and marks the current player's entry.
     *
     * @returns Promise resolving to leaderboard entries
     */
    async getTopScores() {
        const entries = await fetchTopScores();
        // Mark current player's entry if we have their phone
        if (this.currentPlayerPhone) {
            const maskedPhone = maskPhone(this.currentPlayerPhone);
            return entries.map(entry => ({
                ...entry,
                isCurrentPlayer: entry.displayPhone === maskedPhone,
            }));
        }
        return entries;
    }
    /**
     * Destroys the ScoreApi and cleans up resources.
     */
    destroy() {
        this.phoneModal.destroy();
    }
}
export default ScoreApi;
//# sourceMappingURL=scoreApi.js.map