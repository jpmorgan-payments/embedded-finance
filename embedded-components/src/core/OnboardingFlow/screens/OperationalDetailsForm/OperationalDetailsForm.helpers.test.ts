import { describe, expect, it } from 'vitest';

import {
  extractQuestionIdFromMessage,
  formatErrorMessage,
} from './OperationalDetailsForm';

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

    it('extracts a trailing hint followed by a period', () => {
      expect(formatErrorMessage('Invalid value [Enter valid value].')).toBe(
        'Enter valid value'
      );
    });
  });
});
