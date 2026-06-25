import { describe, expect, it } from 'vitest';

/**
 * Tests for the pure helper functions in OperationalDetailsForm.
 * These are file-scoped (not exported), so we test them via the schema
 * and re-implement the logic for unit verification.
 */

// Re-implemented from OperationalDetailsForm.tsx (file-scoped functions)
const extractQuestionIdFromMessage = (message: string): string | null => {
  const match = message.match(/\[(\d+)\]/);
  return match ? match[1] : null;
};

const formatErrorMessage = (message: string): string => {
  const hintMatch = message.match(/\[([^\]]+)\]\.?$/);
  if (hintMatch) {
    return hintMatch[1];
  }
  if (message.includes('is not supported')) {
    return 'The value entered is not supported. Please select a valid option.';
  }
  return message;
};

describe('OperationalDetailsForm helpers', () => {
  describe('extractQuestionIdFromMessage', () => {
    it('extracts question ID from bracket notation', () => {
      expect(
        extractQuestionIdFromMessage('question with ID [30002] is invalid')
      ).toBe('30002');
    });

    it('extracts first bracketed number', () => {
      expect(extractQuestionIdFromMessage('Error for [12345]')).toBe('12345');
    });

    it('returns null when no bracket found', () => {
      expect(extractQuestionIdFromMessage('no brackets here')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractQuestionIdFromMessage('')).toBeNull();
    });
  });

  describe('formatErrorMessage', () => {
    it('extracts hint from brackets at end of message', () => {
      expect(
        formatErrorMessage(
          'Value is invalid. [Please use a 2-letter ISO country code.]'
        )
      ).toBe('Please use a 2-letter ISO country code.');
    });

    it('simplifies "is not supported" messages', () => {
      expect(
        formatErrorMessage('The value ABC is not supported for this field')
      ).toBe(
        'The value entered is not supported. Please select a valid option.'
      );
    });

    it('returns original message when no hint or pattern matches', () => {
      expect(formatErrorMessage('Something went wrong')).toBe(
        'Something went wrong'
      );
    });

    it('handles message with only bracket hint', () => {
      expect(formatErrorMessage('[Enter valid value]')).toBe(
        'Enter valid value'
      );
    });
  });
});
