import { describe, expect, it } from 'vitest';

import {
  formatCurrency,
  formatDateTime,
  formatEIN,
  formatJobTitleDisplay,
  formatQuestionResponseValue,
  formatSSN,
} from './formatClientFacing';

describe('formatClientFacing', () => {
  describe('formatEIN', () => {
    it('formats 9-digit EIN with dash', () => {
      expect(formatEIN('123456789')).toBe('12-3456789');
    });

    it('returns undefined for undefined input', () => {
      expect(formatEIN(undefined)).toBeUndefined();
    });

    it('returns as-is if not 9 digits', () => {
      expect(formatEIN('12345')).toBe('12345');
    });

    it('strips existing dashes before formatting', () => {
      expect(formatEIN('12-3456789')).toBe('12-3456789');
    });
  });

  describe('formatSSN', () => {
    it('formats 9-digit SSN with dashes', () => {
      expect(formatSSN('123456789')).toBe('123-45-6789');
    });

    it('returns undefined for undefined input', () => {
      expect(formatSSN(undefined)).toBeUndefined();
    });

    it('returns as-is if not 9 digits', () => {
      expect(formatSSN('1234')).toBe('1234');
    });

    it('strips existing dashes before formatting', () => {
      expect(formatSSN('123-45-6789')).toBe('123-45-6789');
    });
  });

  describe('formatDateTime', () => {
    it('formats ISO date string', () => {
      const result = formatDateTime('2024-03-15T10:30:00Z', 'en-US');
      expect(result).toContain('2024');
      expect(result).toContain('Mar');
    });

    it('returns dash for undefined', () => {
      expect(formatDateTime(undefined)).toBe('—');
    });

    it('returns original string for invalid date', () => {
      expect(formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatCurrency', () => {
    it('formats number as USD', () => {
      const result = formatCurrency(1000, 'en-US', 'USD');
      expect(result).toContain('1,000');
      expect(result).toContain('$');
    });

    it('formats with no decimal for whole numbers', () => {
      expect(formatCurrency(500)).toContain('500');
    });

    it('formats with decimals when needed', () => {
      expect(formatCurrency(99.99)).toContain('99.99');
    });
  });

  describe('formatQuestionResponseValue', () => {
    it('formats question 30005 as currency', () => {
      const result = formatQuestionResponseValue(
        { questionId: '30005', values: ['5000'] },
        'en-US'
      );
      expect(result).toContain('$');
      expect(result).toContain('5,000');
    });

    it('joins values with comma for other questions', () => {
      const result = formatQuestionResponseValue({
        questionId: '99999',
        values: ['one', 'two', 'three'],
      });
      expect(result).toBe('one, two, three');
    });

    it('returns dash when values is undefined', () => {
      const result = formatQuestionResponseValue({ questionId: '1' });
      expect(result).toBe('—');
    });
  });

  describe('formatJobTitleDisplay', () => {
    it('returns undefined when no jobTitle', () => {
      expect(formatJobTitleDisplay(undefined)).toBeUndefined();
      expect(formatJobTitleDisplay({})).toBeUndefined();
    });

    it('formats Other with description', () => {
      expect(
        formatJobTitleDisplay({
          jobTitle: 'Other',
          jobTitleDescription: 'Chief Fun Officer',
        })
      ).toBe('Other – Chief Fun Officer');
    });

    it('title-cases regular job titles', () => {
      const result = formatJobTitleDisplay({
        jobTitle: 'CHIEF_EXECUTIVE_OFFICER',
      });
      // Only replaces underscores and capitalizes first letter of each word (no lowercasing)
      expect(result).toBe('CHIEF EXECUTIVE OFFICER');
    });

    it('title-cases single word job title', () => {
      expect(formatJobTitleDisplay({ jobTitle: 'director' })).toBe('Director');
    });
  });
});
