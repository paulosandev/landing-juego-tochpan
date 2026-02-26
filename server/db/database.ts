import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './schema';

let db: Database.Database | null = null;

/**
 * Get the database instance, creating it if necessary.
 * Uses WAL mode for better concurrent read support.
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dataDir = path.join(__dirname, '..', 'data');
  const dbPath = path.join(dataDir, 'tochpan.db');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent read support (Requirement 10.3)
  db.pragma('journal_mode = WAL');
  
  // Initialize schema on first connection (Requirement 10.5)
  initializeSchema(db);
  
  return db;
}

/**
 * Close the database connection.
 * Useful for testing and graceful shutdown.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reset the database instance (for testing purposes).
 */
export function resetDatabase(): void {
  db = null;
}
