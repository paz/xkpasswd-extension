/**
 * Password strength calculator using entropy-based analysis
 */

export interface StrengthResult {
  entropy: number;
  score: number; // 0-4 (weak, fair, good, strong, excellent)
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent';
  crackTime: string;
  crackTimeSeconds: number;
}

/**
 * Calculate the entropy of a password
 * Entropy = log2(possible_combinations)
 */
export function calculateEntropy(password: string): number {
  if (!password) return 0;

  const length = password.length;
  let charsetSize = 0;

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  if (hasLowercase) charsetSize += 26;
  if (hasUppercase) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 33; // Common symbols

  if (charsetSize === 0) return 0;

  // Entropy = length * log2(charset_size)
  const entropy = length * Math.log2(charsetSize);

  return Math.round(entropy * 10) / 10;
}

/**
 * Estimate time to crack password based on entropy
 * Assumes 10 billion guesses per second (modern GPU)
 */
function estimateCrackTime(entropy: number): { seconds: number; display: string } {
  const guessesPerSecond = 10_000_000_000; // 10 billion
  const totalCombinations = Math.pow(2, entropy);
  const seconds = totalCombinations / (2 * guessesPerSecond); // Divide by 2 for average case

  if (seconds < 1) {
    return { seconds, display: 'Instant' };
  } else if (seconds < 60) {
    return { seconds, display: `${Math.round(seconds)} seconds` };
  } else if (seconds < 3600) {
    return { seconds, display: `${Math.round(seconds / 60)} minutes` };
  } else if (seconds < 86400) {
    return { seconds, display: `${Math.round(seconds / 3600)} hours` };
  } else if (seconds < 2592000) {
    return { seconds, display: `${Math.round(seconds / 86400)} days` };
  } else if (seconds < 31536000) {
    return { seconds, display: `${Math.round(seconds / 2592000)} months` };
  } else if (seconds < 3153600000) {
    return { seconds, display: `${Math.round(seconds / 31536000)} years` };
  } else if (seconds < 31536000000) {
    return { seconds, display: `${Math.round(seconds / 31536000 / 100)} centuries` };
  } else {
    return { seconds, display: `${Math.round(seconds / 31536000 / 1000000)} million years` };
  }
}

/**
 * Calculate password strength based on entropy
 * Returns a score from 0-4 and a human-readable label
 */
export function calculateStrength(password: string): StrengthResult {
  const entropy = calculateEntropy(password);
  const crackTime = estimateCrackTime(entropy);

  // Score based on entropy bits
  // < 40 bits: Weak
  // 40-59 bits: Fair
  // 60-79 bits: Good
  // 80-99 bits: Strong
  // >= 100 bits: Excellent
  let score: number;
  let label: StrengthResult['label'];

  if (entropy < 40) {
    score = 0;
    label = 'Weak';
  } else if (entropy < 60) {
    score = 1;
    label = 'Fair';
  } else if (entropy < 80) {
    score = 2;
    label = 'Good';
  } else if (entropy < 100) {
    score = 3;
    label = 'Strong';
  } else {
    score = 4;
    label = 'Excellent';
  }

  return {
    entropy,
    score,
    label,
    crackTime: crackTime.display,
    crackTimeSeconds: crackTime.seconds,
  };
}
