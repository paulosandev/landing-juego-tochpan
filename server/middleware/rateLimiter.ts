import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware for score submissions.
 * 
 * Limits to 10 score submissions per minute per IP address.
 * Returns 429 status with retryAfter when exceeded.
 * 
 * Property 19: Rate Limiting - requests beyond 10/minute get 429 status
 * Requirements: 9.5
 */
export const scoreSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests',
    retryAfter: 60, // Default value, will be overridden by handler
  },
  handler: (req, res, next, options) => {
    const retryAfterSeconds = Math.ceil((options.windowMs - (Date.now() % options.windowMs)) / 1000);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: retryAfterSeconds,
    });
  },
  keyGenerator: (req) => {
    // Use IP address for rate limiting
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

export default scoreSubmissionLimiter;
