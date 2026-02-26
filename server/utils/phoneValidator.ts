import { createHash } from 'crypto';

/**
 * PhoneValidator utility for validating, hashing, and masking phone numbers.
 * Used for player identification in the leaderboard system.
 */

/**
 * Validates that a phone number contains exactly 10 numeric digits.
 * @param phone - The phone number string to validate
 * @returns true if the phone number is exactly 10 numeric digits, false otherwise
 */
export function validate(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

/**
 * Hashes a phone number using SHA-256 for secure storage.
 * @param phone - The phone number to hash
 * @returns The SHA-256 hash of the phone number as a hex string
 */
export function hash(phone: string): string {
  return createHash('sha256').update(phone).digest('hex');
}

/**
 * Masks a phone number for display, showing only the last 4 digits.
 * @param phone - The phone number to mask (should be 10 digits)
 * @returns The masked phone number in format ***-***-XXXX
 */
export function mask(phone: string): string {
  const lastFour = phone.slice(-4);
  return `***-***-${lastFour}`;
}

export const PhoneValidator = {
  validate,
  hash,
  mask,
};

export default PhoneValidator;
