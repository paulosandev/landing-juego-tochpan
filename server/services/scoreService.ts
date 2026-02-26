import { getDatabase } from '../db/database';
import { validate, hash, mask } from '../utils/phoneValidator';

/**
 * Result of a score save operation.
 */
export interface SaveResult {
  success: boolean;
  isNewRecord: boolean;
  previousScore?: number;
}

/**
 * Player record from the database.
 */
export interface PlayerRecord {
  id: number;
  phoneHash: string;
  displayPhone: string;
  playerName: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Saves a player's score. Inserts a new record or updates existing if the new score is higher.
 * 
 * @param phone - The player's 10-digit phone number
 * @param score - The score to save
 * @param playerName - The player's name
 * @returns SaveResult indicating success and whether it's a new record
 * 
 * Requirements: 7.4 - Only updates if new score is higher
 */
export async function saveScore(phone: string, score: number, playerName: string = ''): Promise<SaveResult> {
  if (!validate(phone)) {
    return { success: false, isNewRecord: false };
  }

  if (!Number.isInteger(score) || score < 0) {
    return { success: false, isNewRecord: false };
  }

  const db = getDatabase();
  const phoneHash = hash(phone);
  const displayPhone = mask(phone);
  const sanitizedName = playerName.trim().slice(0, 50); // Limit name length

  // Check for existing record
  const existing = db.prepare(
    'SELECT score FROM player_records WHERE phone_hash = ?'
  ).get(phoneHash) as { score: number } | undefined;

  if (existing) {
    // Only update if new score is higher (Requirement 7.4)
    if (score > existing.score) {
      db.prepare(
        'UPDATE player_records SET score = ?, player_name = ?, updated_at = CURRENT_TIMESTAMP WHERE phone_hash = ?'
      ).run(score, sanitizedName, phoneHash);
      
      return {
        success: true,
        isNewRecord: true,
        previousScore: existing.score,
      };
    }
    
    // Score not higher, no update needed
    return {
      success: true,
      isNewRecord: false,
      previousScore: existing.score,
    };
  }

  // Insert new record
  db.prepare(
    'INSERT INTO player_records (phone_hash, display_phone, player_name, score) VALUES (?, ?, ?, ?)'
  ).run(phoneHash, displayPhone, sanitizedName, score);

  return {
    success: true,
    isNewRecord: true,
  };
}

/**
 * Retrieves the top scores ordered by score descending.
 * 
 * @param limit - Maximum number of records to return (default 10)
 * @returns Array of PlayerRecord objects
 * 
 * Requirements: 8.1 - Return top 10 scores
 */
export async function getTopScores(limit: number = 10): Promise<PlayerRecord[]> {
  const db = getDatabase();
  
  const rows = db.prepare(
    `SELECT id, phone_hash, display_phone, player_name, score, created_at, updated_at 
     FROM player_records 
     ORDER BY score DESC 
     LIMIT ?`
  ).all(limit) as Array<{
    id: number;
    phone_hash: string;
    display_phone: string;
    player_name: string;
    score: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    phoneHash: row.phone_hash,
    displayPhone: row.display_phone,
    playerName: row.player_name || '',
    score: row.score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Retrieves a player's record by phone number.
 * 
 * @param phone - The player's 10-digit phone number
 * @returns PlayerRecord if found, null otherwise
 * 
 * Requirements: 9.3 - Get player's score by phone
 */
export async function getScoreByPhone(phone: string): Promise<PlayerRecord | null> {
  if (!validate(phone)) {
    return null;
  }

  const db = getDatabase();
  const phoneHash = hash(phone);

  const row = db.prepare(
    `SELECT id, phone_hash, display_phone, player_name, score, created_at, updated_at 
     FROM player_records 
     WHERE phone_hash = ?`
  ).get(phoneHash) as {
    id: number;
    phone_hash: string;
    display_phone: string;
    player_name: string;
    score: number;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    phoneHash: row.phone_hash,
    displayPhone: row.display_phone,
    playerName: row.player_name || '',
    score: row.score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const ScoreService = {
  saveScore,
  getTopScores,
  getScoreByPhone,
};

export default ScoreService;
