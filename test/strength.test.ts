import {describe, it, expect} from 'vitest';
import {calculateEntropy, calculateStrength} from '../src/core/strength';

describe('Password Strength Calculator', () => {
  describe('calculateEntropy', () => {
    it('should return 0 for empty password', () => {
      expect(calculateEntropy('')).toBe(0);
    });

    it('should calculate entropy for lowercase only', () => {
      const entropy = calculateEntropy('hello');
      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThan(30); // 5 chars * log2(26) ≈ 23.5
    });

    it('should calculate higher entropy for mixed case', () => {
      const lowerOnly = calculateEntropy('hello');
      const mixed = calculateEntropy('Hello');
      expect(mixed).toBeGreaterThan(lowerOnly);
    });

    it('should calculate even higher entropy with numbers', () => {
      const letters = calculateEntropy('Hello');
      const withNumbers = calculateEntropy('Hello123');
      expect(withNumbers).toBeGreaterThan(letters);
    });

    it('should calculate highest entropy with symbols', () => {
      const withNumbers = calculateEntropy('Hello123');
      const withSymbols = calculateEntropy('Hello123!@#');
      expect(withSymbols).toBeGreaterThan(withNumbers);
    });
  });

  describe('calculateStrength', () => {
    it('should rate weak passwords as weak', () => {
      const result = calculateStrength('hello');
      expect(result.label).toBe('Weak');
      expect(result.score).toBe(0);
    });

    it('should rate strong passwords appropriately', () => {
      const result = calculateStrength('Correct-Horse-Battery-Staple');
      expect(result.label).not.toBe('Weak');
      expect(result.score).toBeGreaterThan(1);
    });

    it('should include entropy in result', () => {
      const result = calculateStrength('MyPassword123!');
      expect(result.entropy).toBeGreaterThan(0);
    });

    it('should include crack time estimate', () => {
      const result = calculateStrength('MyPassword123!');
      expect(result.crackTime).toBeTruthy();
      expect(result.crackTimeSeconds).toBeGreaterThan(0);
    });

    it('should rate very long passwords as excellent', () => {
      const result = calculateStrength('Correct-Horse-Battery-Staple-Purple-Monkey-Dishwasher');
      expect(result.label).toBe('Excellent');
      expect(result.score).toBe(4);
    });
  });
});
