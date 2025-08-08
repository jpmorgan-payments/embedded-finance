/**
 * Custom error classes for configuration-related errors
 */

export class ConfigurationError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ConfigurationError';
    this.code = code;
    this.details = details;
  }
}

export class ConfigValidationError extends ConfigurationError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(
    message: string,
    validationErrors: Array<{ field: string; message: string; code: string }>,
  ) {
    super(message, 'VALIDATION_FAILED', validationErrors);
    this.name = 'ConfigValidationError';
    this.validationErrors = validationErrors;
  }
}

export class ConfigLoadError extends ConfigurationError {
  constructor(message: string, originalError?: Error) {
    super(message, 'LOAD_FAILED', originalError);
    this.name = 'ConfigLoadError';
  }
}

export class MappingNotFoundError extends ConfigurationError {
  public readonly criteria: any;

  constructor(criteria: any) {
    const criteriaKey =
      typeof criteria === 'string'
        ? criteria
        : `${criteria.product}-${criteria.jurisdiction}-${criteria.legalEntityType}`;

    super(
      `No mapping found for criteria: ${criteriaKey}`,
      'MAPPING_NOT_FOUND',
      criteria,
    );
    this.name = 'MappingNotFoundError';
    this.criteria = criteria;
  }
}

export class UnsupportedCombinationError extends ConfigurationError {
  public readonly criteria: any;
  public readonly supportedCombinations: string[];

  constructor(criteria: any, supportedCombinations: string[]) {
    const criteriaKey =
      typeof criteria === 'string'
        ? criteria
        : `${criteria.product}-${criteria.jurisdiction}-${criteria.legalEntityType}`;

    super(
      `Unsupported criteria combination: ${criteriaKey}. Supported combinations: ${supportedCombinations.join(', ')}`,
      'UNSUPPORTED_COMBINATION',
      { criteria, supportedCombinations },
    );
    this.name = 'UnsupportedCombinationError';
    this.criteria = criteria;
    this.supportedCombinations = supportedCombinations;
  }
}

export class ArazzoFileNotFoundError extends ConfigurationError {
  public readonly filePath: string;

  constructor(filePath: string) {
    super(
      `Arazzo specification file not found: ${filePath}`,
      'ARAZZO_FILE_NOT_FOUND',
      { filePath },
    );
    this.name = 'ArazzoFileNotFoundError';
    this.filePath = filePath;
  }
}

/**
 * Error handler utility functions
 */
export class ConfigErrorHandler {
  /**
   * Formats configuration errors for user display
   */
  static formatErrorForUser(error: Error): {
    title: string;
    message: string;
    suggestions: string[];
    canRetry: boolean;
  } {
    if (error instanceof ConfigValidationError) {
      return {
        title: 'Configuration Validation Error',
        message: 'The configuration file contains invalid data.',
        suggestions: [
          'Check the configuration file format',
          'Verify all required fields are present',
          'Contact support if the issue persists',
        ],
        canRetry: false,
      };
    }

    if (error instanceof ConfigLoadError) {
      return {
        title: 'Configuration Load Error',
        message: 'Failed to load the configuration file.',
        suggestions: [
          'Check your internet connection',
          'Refresh the page to try again',
          'Contact support if the issue persists',
        ],
        canRetry: true,
      };
    }

    if (error instanceof MappingNotFoundError) {
      return {
        title: 'Mapping Not Found',
        message: 'No workflow mapping found for the selected criteria.',
        suggestions: [
          'Try a different combination of criteria',
          'Check if the selected combination is supported',
          'Contact support to request support for this combination',
        ],
        canRetry: false,
      };
    }

    if (error instanceof UnsupportedCombinationError) {
      return {
        title: 'Unsupported Combination',
        message:
          'The selected criteria combination is not currently supported.',
        suggestions: [
          `Try one of these supported combinations: ${error.supportedCombinations.join(', ')}`,
          'Contact support to request support for this combination',
        ],
        canRetry: false,
      };
    }

    if (error instanceof ArazzoFileNotFoundError) {
      return {
        title: 'Workflow File Not Found',
        message: 'The workflow specification file could not be found.',
        suggestions: [
          'Try refreshing the page',
          'Select a different criteria combination',
          'Contact support if the issue persists',
        ],
        canRetry: true,
      };
    }

    // Generic error handling
    return {
      title: 'Configuration Error',
      message: error.message || 'An unexpected error occurred.',
      suggestions: [
        'Try refreshing the page',
        'Contact support if the issue persists',
      ],
      canRetry: true,
    };
  }

  /**
   * Logs configuration errors with appropriate detail level
   */
  static logError(error: Error, context?: string): void {
    const logContext = context ? `[${context}]` : '';

    if (error instanceof ConfigurationError) {
      console.error(
        `${logContext} Configuration Error [${error.code}]:`,
        error.message,
      );
      if (error.details) {
        console.error('Error details:', error.details);
      }
    } else {
      console.error(`${logContext} Unexpected error:`, error);
    }

    // In development, log the full stack trace
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Determines if an error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    if (error instanceof ConfigLoadError) return true;
    if (error instanceof ArazzoFileNotFoundError) return true;
    return false;
  }

  /**
   * Gets retry delay for recoverable errors
   */
  static getRetryDelay(error: Error, attemptNumber: number): number {
    if (!this.isRecoverable(error)) return 0;

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }
}

/**
 * Type guards for error checking
 */
export const isConfigurationError = (
  error: any,
): error is ConfigurationError => {
  return error instanceof ConfigurationError;
};

export const isConfigValidationError = (
  error: any,
): error is ConfigValidationError => {
  return error instanceof ConfigValidationError;
};

export const isConfigLoadError = (error: any): error is ConfigLoadError => {
  return error instanceof ConfigLoadError;
};

export const isMappingNotFoundError = (
  error: any,
): error is MappingNotFoundError => {
  return error instanceof MappingNotFoundError;
};

export const isUnsupportedCombinationError = (
  error: any,
): error is UnsupportedCombinationError => {
  return error instanceof UnsupportedCombinationError;
};

export const isArazzoFileNotFoundError = (
  error: any,
): error is ArazzoFileNotFoundError => {
  return error instanceof ArazzoFileNotFoundError;
};
