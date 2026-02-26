import Database from 'better-sqlite3';

/**
 * Initialize the database schema.
 * Creates the player_records table and indexes if they don't exist.
 * 
 * Schema (Requirement 10.2):
 * - id: Primary key
 * - phone_hash: SHA-256 hash of phone number (unique)
 * - display_phone: Masked phone for display (***-***-XXXX)
 * - score: Player's high score
 * - created_at: Record creation timestamp
 * - updated_at: Last update timestamp
 */
export function initializeSchema(db: Database.Database): void {
  // Create player_records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS player_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_hash TEXT UNIQUE NOT NULL,
      display_phone TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for score queries (leaderboard - descending order)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_score ON player_records(score DESC)
  `);

  // Create index for phone_hash lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_phone_hash ON player_records(phone_hash)
  `);
}
