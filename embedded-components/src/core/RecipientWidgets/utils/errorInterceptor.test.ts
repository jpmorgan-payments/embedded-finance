import { describe, expect, it } from 'vitest';

import { interceptError, isKnownError } from './errorInterceptor';

describe('errorInterceptor', () => {
  describe('interceptError', () => {
    it('should return null for null error', () => {
      expect(interceptError(null)).toBeNull();
    });

    it('should return null for undefined error', () => {
      expect(interceptError(undefined)).toBeNull();
    });

    it('should detect RTP_UNAVAILABLE error from context code', () => {
      const error = {
        response: {
          data: {
            httpStatus: 400,
            title: 'Payment Method Not Supported',
            context: [
              {
                code: 'RTP_UNAVAILABLE',
                field: 'account.routingInformation[].transactionType',
                message:
                  'RTP (Real-Time Payments) is not available at this financial institution.',
              },
            ],
          },
          status: 400,
        },
        status: 400,
      } as any;

      const result = interceptError(error);

      expect(result).not.toBeNull();
      expect(result?.isKnown).toBe(true);

      if (result?.isKnown) {
        expect(result.config.code).toBe('RTP_UNAVAILABLE');
        expect(result.config.variant).toBe('warning');
        expect(result.context?.field).toBe(
          'account.routingInformation[].transactionType'
        );
        expect(result.context?.message).toContain(
          'RTP (Real-Time Payments) is not available'
        );
      }
    });

    it('should return unknown error for errors without known code', () => {
      const error = {
        response: {
          data: {
            httpStatus: 500,
            title: 'Internal Server Error',
            context: [
              {
                message: 'Something went wrong',
              },
            ],
          },
          status: 500,
        },
        status: 500,
      } as any;

      const result = interceptError(error);

      expect(result).not.toBeNull();
      expect(result?.isKnown).toBe(false);
      if (result && !result.isKnown) {
        expect(result.originalError).toBe(error);
      }
    });

    it('should return unknown error for errors without context', () => {
      const error = {
        response: {
          data: {
            httpStatus: 400,
            title: 'Bad Request',
          },
          status: 400,
        },
        status: 400,
      } as any;

      const result = interceptError(error);

      expect(result).not.toBeNull();
      expect(result?.isKnown).toBe(false);
    });

    it('should handle error with empty context array', () => {
      const error = {
        response: {
          data: {
            httpStatus: 400,
            title: 'Bad Request',
            context: [],
          },
          status: 400,
        },
        status: 400,
      } as any;

      const result = interceptError(error);

      expect(result).not.toBeNull();
      expect(result?.isKnown).toBe(false);
    });
  });

  describe('isKnownError', () => {
    it('should return true for known error result', () => {
      const result = {
        isKnown: true as const,
        config: {
          code: 'RTP_UNAVAILABLE' as const,
          titleKey: 'errors.known.RTP_UNAVAILABLE.title',
          descriptionKey: 'errors.known.RTP_UNAVAILABLE.description',
          variant: 'warning' as const,
        },
        originalError: {} as any,
      };

      expect(isKnownError(result)).toBe(true);
    });

    it('should return false for unknown error result', () => {
      const result = {
        isKnown: false as const,
        originalError: {} as any,
      };

      expect(isKnownError(result)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isKnownError(null)).toBe(false);
    });
  });
});
