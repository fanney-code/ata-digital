/**
 * Utility functions for Aadhar Number / National ID safe normalization,
 * exact duplicate comparison, and privacy masking.
 *
 * Stored authoritatively in `students.national_id` in the database,
 * and aliased as `aadhar_number` in the application domain.
 */

/**
 * Safely normalizes an Aadhar / National ID string for exact duplicate comparison:
 * - Trims leading and trailing whitespace
 * - Strips internal whitespace formatting (e.g. "1234 5678 9012" -> "123456789012")
 * - Converts to uppercase for case-insensitive normalization if letters are present
 * - Returns an empty string for null, undefined, or empty/whitespace-only input
 */
export function normalizeAadhar(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[\s-]+/g, '').trim().toUpperCase();
}

/**
 * Evaluates whether two Aadhar numbers match after exact normalization:
 * - Returns `false` if either or both values are null, undefined, or empty (preventing false duplicates on missing data)
 * - Returns `true` if and only if both normalized values are non-empty and strictly identical
 * - Does NOT perform fuzzy or partial matching
 */
export function isAadharMatch(a?: string | null, b?: string | null): boolean {
  const normA = normalizeAadhar(a);
  const normB = normalizeAadhar(b);
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Returns a privacy-safe masked representation of an Aadhar number
 * for display in UI notifications and error messages without exposing full identifiers.
 * e.g. "1234 5678 9012" -> "****9012"
 */
export function maskAadhar(value?: string | null): string {
  const norm = normalizeAadhar(value);
  if (!norm) return '';
  if (norm.length <= 4) return '****' + norm;
  return `****${norm.slice(-4)}`;
}
