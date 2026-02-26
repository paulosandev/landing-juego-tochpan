import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { submitScore, getTop, getPlayerScore } from './controllers/scoreController';
import { scoreSubmissionLimiter } from './middleware/rateLimiter';
import { getDatabase } from './db/database';

/**
 * Express server for Tochpan Café game.
 * 
 * Routes:
 * - POST /api/scores - Submit a new score (with rate limiting)
 * - GET /api/scores/top - Get top 10 scores
 * - GET /api/scores/:phone - Get a player's score by phone number
 * 
 * Requirements: 9.4, 9.6
 */

const app: ReturnType<typeof express> = express();
const PORT = process.env.PORT || 3000;

// Detect if running from source (tsx) or compiled (dist)
const isDevMode = !__dirname.includes('dist');
const publicPath = isDevMode 
  ? path.join(__dirname, '..', 'public')  // From server/ -> public/
  : path.join(__dirname, '..', '..', 'public');  // From dist/server/ -> public/

// ============================================
// Input Sanitization Middleware (Requirement 9.4)
// ============================================

/**
 * Sanitizes string values in request body to prevent injection attacks.
 * Removes or escapes potentially dangerous characters.
 */
function sanitizeInput(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Remove null bytes and control characters
    let sanitized = obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Trim whitespace
    sanitized = sanitized.trim();
    // Limit string length to prevent DoS
    return sanitized.slice(0, 1000);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys as well
      const sanitizedKey = typeof key === 'string' 
        ? key.replace(/[^\w.-]/g, '').slice(0, 100) 
        : key;
      sanitized[sanitizedKey] = sanitizeInput(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Middleware to sanitize all incoming request bodies.
 * Prevents SQL injection and other injection attacks.
 */
function sanitizationMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  next();
}

/**
 * Middleware to sanitize URL parameters.
 * Ensures phone numbers in params only contain digits.
 */
function sanitizeParamsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        // For phone parameter, only allow digits
        if (key === 'phone') {
          req.params[key] = value.replace(/\D/g, '').slice(0, 10);
        } else {
          // General sanitization for other params
          req.params[key] = value.replace(/[^\w.-]/g, '').slice(0, 100);
        }
      }
    }
  }
  next();
}

// ============================================
// Middleware Setup
// ============================================

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply input sanitization to all requests
app.use(sanitizationMiddleware);
app.use(sanitizeParamsMiddleware);

// Serve static files from public directory
app.use(express.static(publicPath));

// ============================================
// API Routes
// ============================================

// POST /api/scores - Submit a new score (with rate limiting)
// Requirement 9.1, 9.5
app.post('/api/scores', scoreSubmissionLimiter, submitScore);

// GET /api/scores/top - Get top 10 scores
// Requirement 9.2
app.get('/api/scores/top', getTop);

// GET /api/scores/:phone - Get a player's score by phone number
// Requirement 9.3
app.get('/api/scores/:phone', getPlayerScore);

// ============================================
// Error Handling
// ============================================

/**
 * 404 handler for undefined routes.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Global error handler.
 * Catches any unhandled errors and returns a generic server error.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

// ============================================
// Server Initialization
// ============================================

/**
 * Initialize database and start server.
 * Requirement 10.5: Database initialized automatically on first server start.
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database (creates tables if they don't exist)
    getDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Tochpan Café server running on port ${PORT}`);
      console.log(`Static files served from: ${publicPath}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export for testing
export { app, sanitizeInput };
