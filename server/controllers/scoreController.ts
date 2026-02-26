import { Request, Response } from 'express';
import { saveScore, getTopScores, getScoreByPhone } from '../services/scoreService';
import { validate } from '../utils/phoneValidator';

/**
 * ScoreController handles HTTP endpoints for score operations.
 * 
 * Endpoints:
 * - POST /api/scores - Submit a new score
 * - GET /api/scores/top - Get top 10 scores
 * - GET /api/scores/:phone - Get a player's score by phone number
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

/**
 * POST /api/scores
 * Submit a new score for a player.
 * 
 * Request body: { phone: string, score: number, playerName?: string }
 * Response: { success: boolean, isNewRecord: boolean }
 * 
 * Error responses:
 * - 400: { error: "Phone must be 10 digits" } - Invalid phone format
 * - 400: { error: "Invalid score" } - Negative or non-integer score
 * 
 * Requirements: 9.1, 9.4
 */
export async function submitScore(req: Request, res: Response): Promise<void> {
  const { phone, score, playerName } = req.body;

  // Validate phone number format (Requirement 9.4)
  if (typeof phone !== 'string' || !validate(phone)) {
    res.status(400).json({ error: 'Phone must be 10 digits' });
    return;
  }

  // Validate score (Requirement 9.4)
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
    res.status(400).json({ error: 'Invalid score' });
    return;
  }

  // Validate playerName if provided
  const name = typeof playerName === 'string' ? playerName : '';

  try {
    const result = await saveScore(phone, score, name);
    res.json({
      success: result.success,
      isNewRecord: result.isNewRecord,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * GET /api/scores/top
 * Retrieve the top 10 scores.
 * 
 * Response: { scores: PlayerRecord[] }
 * 
 * Requirements: 9.2
 */
export async function getTop(req: Request, res: Response): Promise<void> {
  try {
    const scores = await getTopScores(10);
    res.json({ scores });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * GET /api/scores/:phone
 * Retrieve a player's score by phone number.
 * 
 * Response: { score: PlayerRecord | null }
 * 
 * Error responses:
 * - 400: { error: "Phone must be 10 digits" } - Invalid phone format
 * 
 * Requirements: 9.3, 9.4
 */
export async function getPlayerScore(req: Request, res: Response): Promise<void> {
  const { phone } = req.params;

  // Validate phone number format (Requirement 9.4)
  if (!validate(phone)) {
    res.status(400).json({ error: 'Phone must be 10 digits' });
    return;
  }

  try {
    const score = await getScoreByPhone(phone);
    res.json({ score });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

export const ScoreController = {
  submitScore,
  getTop,
  getPlayerScore,
};

export default ScoreController;
