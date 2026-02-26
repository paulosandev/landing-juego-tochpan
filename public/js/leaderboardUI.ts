/**
 * LeaderboardUI - Manages leaderboard display and interactions.
 * 
 * Creates and manages DOM elements for displaying the top 10 scores,
 * with support for highlighting the current player's entry.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

export interface LeaderboardEntry {
  rank: number;
  displayPhone: string;
  playerName: string;
  score: number;
  isCurrentPlayer: boolean;
}

export class LeaderboardUI {
  public entries: LeaderboardEntry[] = [];
  public visible: boolean = false;

  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private listElement: HTMLElement | null = null;
  private currentPlayerPhone: string | null = null;

  /** Brand colors matching the game theme */
  private static readonly COLORS = {
    dark: '#544540',
    beige: '#eae1d7',
    light: '#fef8f3',
    accent: '#FF8C42'
  };

  constructor() {
    this.createElements();
  }

  /**
   * Creates the DOM elements for the leaderboard overlay.
   */
  private createElements(): void {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'leaderboard-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(84, 69, 64, 0.95);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      backdrop-filter: blur(4px);
      padding: 1rem;
    `;

    // Create main container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      background-color: ${LeaderboardUI.COLORS.light};
      border-radius: 1rem;
      padding: 1.5rem;
      max-width: 400px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 2px solid ${LeaderboardUI.COLORS.beige};
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      text-align: center;
      margin-bottom: 1.5rem;
    `;

    const title = document.createElement('h2');
    title.textContent = '🏆 Mejores Puntuaciones';
    title.style.cssText = `
      font-family: "DM Sans", sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: ${LeaderboardUI.COLORS.dark};
      margin: 0 0 0.5rem 0;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Top 10 jugadores';
    subtitle.style.cssText = `
      font-family: "Quicksand", sans-serif;
      font-size: 0.875rem;
      color: ${LeaderboardUI.COLORS.dark};
      opacity: 0.7;
      margin: 0;
    `;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Create list container
    this.listElement = document.createElement('div');
    this.listElement.id = 'leaderboard-list';
    this.listElement.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar';
    closeButton.style.cssText = `
      margin-top: 1.5rem;
      width: 100%;
      padding: 0.75rem 1.5rem;
      background-color: ${LeaderboardUI.COLORS.dark};
      color: ${LeaderboardUI.COLORS.light};
      border: none;
      border-radius: 9999px;
      font-family: "DM Sans", sans-serif;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: transform 0.15s, background-color 0.15s;
    `;
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = LeaderboardUI.COLORS.accent;
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = LeaderboardUI.COLORS.dark;
    });
    closeButton.addEventListener('click', () => this.hide());

    // Assemble container
    this.container.appendChild(header);
    this.container.appendChild(this.listElement);
    this.container.appendChild(closeButton);
    this.overlay.appendChild(this.container);

    // Add to document body
    document.body.appendChild(this.overlay);

    // Close on overlay click (outside container)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide();
      }
    });
  }

  /**
   * Shows the leaderboard overlay.
   */
  show(): void {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.visible = true;
    }
  }

  /**
   * Hides the leaderboard overlay.
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.visible = false;
    }
  }

  /**
   * Updates the leaderboard with new entries.
   * Renders top 10 entries with rank, masked phone, and score.
   * 
   * @param entries - Array of leaderboard entries to display
   * Requirements: 8.1, 8.2
   */
  update(entries: LeaderboardEntry[]): void {
    this.entries = entries;

    if (!this.listElement) return;

    // Clear existing entries
    this.listElement.innerHTML = '';

    // Handle empty leaderboard
    if (entries.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.cssText = `
        text-align: center;
        padding: 2rem;
        color: ${LeaderboardUI.COLORS.dark};
        opacity: 0.6;
        font-family: "Quicksand", sans-serif;
      `;
      emptyMessage.textContent = 'Aún no hay puntuaciones. ¡Sé el primero!';
      this.listElement.appendChild(emptyMessage);
      return;
    }

    // Render each entry (max 10)
    const displayEntries = entries.slice(0, 10);
    displayEntries.forEach((entry) => {
      const entryElement = this.createEntryElement(entry);
      this.listElement!.appendChild(entryElement);
    });
  }

  /**
   * Creates a DOM element for a single leaderboard entry.
   */
  private createEntryElement(entry: LeaderboardEntry): HTMLElement {
    const element = document.createElement('div');
    
    // Base styles
    let backgroundColor = LeaderboardUI.COLORS.beige;
    let borderColor = 'transparent';
    let textColor = LeaderboardUI.COLORS.dark;

    // Highlight current player - Requirement 8.5
    if (entry.isCurrentPlayer) {
      backgroundColor = LeaderboardUI.COLORS.accent;
      borderColor = LeaderboardUI.COLORS.dark;
      textColor = '#ffffff';
    }

    // Special styling for top 3
    let rankEmoji = '';
    if (entry.rank === 1) rankEmoji = '🥇';
    else if (entry.rank === 2) rankEmoji = '🥈';
    else if (entry.rank === 3) rankEmoji = '🥉';

    element.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background-color: ${backgroundColor};
      border-radius: 0.5rem;
      border: 2px solid ${borderColor};
      transition: transform 0.15s;
    `;

    // Rank section
    const rankSection = document.createElement('div');
    rankSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 60px;
    `;

    const rankNumber = document.createElement('span');
    rankNumber.textContent = rankEmoji || `#${entry.rank}`;
    rankNumber.style.cssText = `
      font-family: "Miniver", cursive;
      font-size: ${rankEmoji ? '1.5rem' : '1.25rem'};
      color: ${textColor};
      min-width: 2rem;
      text-align: center;
    `;

    rankSection.appendChild(rankNumber);

    // Name section
    const nameSection = document.createElement('span');
    nameSection.textContent = entry.playerName || 'Anónimo';
    nameSection.style.cssText = `
      font-family: "Quicksand", sans-serif;
      font-size: 0.875rem;
      color: ${textColor};
      flex: 1;
      text-align: left;
      font-weight: ${entry.isCurrentPlayer ? '700' : '400'};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 120px;
    `;

    // Phone section (masked)
    const phoneSection = document.createElement('span');
    phoneSection.textContent = entry.displayPhone;
    phoneSection.style.cssText = `
      font-family: "Quicksand", sans-serif;
      font-size: 0.75rem;
      color: ${textColor};
      text-align: center;
      opacity: ${entry.isCurrentPlayer ? '1' : '0.6'};
    `;

    // Score section
    const scoreSection = document.createElement('span');
    scoreSection.textContent = entry.score.toLocaleString();
    scoreSection.style.cssText = `
      font-family: "Miniver", cursive;
      font-size: 1.25rem;
      color: ${textColor};
      min-width: 80px;
      text-align: right;
      font-weight: ${entry.isCurrentPlayer ? '700' : '400'};
    `;

    element.appendChild(rankSection);
    element.appendChild(nameSection);
    element.appendChild(phoneSection);
    element.appendChild(scoreSection);

    // Hover effect
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.02)';
    });
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
    });

    return element;
  }

  /**
   * Highlights the current player's entry in the leaderboard.
   * Updates the isCurrentPlayer flag for matching entries.
   * 
   * @param phone - The player's phone number (last 4 digits used for matching)
   * Requirement: 8.5
   */
  highlightPlayer(phone: string): void {
    this.currentPlayerPhone = phone;

    // Extract last 4 digits for matching with masked phone
    const lastFourDigits = phone.slice(-4);
    const maskedPattern = `***-***-${lastFourDigits}`;

    // Update entries with highlight flag
    const updatedEntries = this.entries.map(entry => ({
      ...entry,
      isCurrentPlayer: entry.displayPhone === maskedPattern
    }));

    // Re-render with updated highlights
    this.update(updatedEntries);
  }

  /**
   * Destroys the leaderboard UI and removes DOM elements.
   */
  destroy(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.container = null;
    this.listElement = null;
    this.entries = [];
    this.visible = false;
  }
}
