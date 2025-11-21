import crypto from 'crypto';

/**
 * Generate a random string for PKCE code_verifier
 * @param length - Length of the random string (default: 128)
 * @returns Random URL-safe base64 string
 */
export function generateRandomString(length: number = 128): string {
  const bytes = crypto.randomBytes(length);
  return bytes.toString('base64url');
}

/**
 * Generate code_challenge from code_verifier using S256 (SHA256)
 * @param codeVerifier - The code_verifier string
 * @returns Base64URL-encoded SHA256 hash
 */
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return hash.toString('base64url');
}

/**
 * Generate both code_verifier and code_challenge
 * @returns Object with code_verifier and code_challenge
 */
export function generatePKCEPair() {
  const codeVerifier = generateRandomString();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  return {
    codeVerifier,
    codeChallenge,
  };
}
