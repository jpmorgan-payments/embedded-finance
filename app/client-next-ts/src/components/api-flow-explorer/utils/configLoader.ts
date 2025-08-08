import { CriteriaMappingConfig, OnboardingCriteria } from '../types';
import {
  ConfigurationError,
  ConfigValidationError,
  ConfigLoadError,
  MappingNotFoundError,
  UnsupportedCombinationError,
  ArazzoFileNotFoundError,
  ConfigErrorHandler,
} from './configErrors';

export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: string[];
}

/**
 * Loads and validates the criteria mapping configuration
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: CriteriaMappingConfig | null = null;
  private loadPromise: Promise<CriteriaMappingConfig> | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Loads the configuration from the JSON file
   */
  public async loadConfig(): Promise<CriteriaMappingConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchConfig();
    this.config = await this.loadPromise;
    return this.config;
  }

  private async fetchConfig(): Promise<CriteriaMappingConfig> {
    try {
      const response = await fetch(
        '/api-flow-explorer/data/criteria-mapping.json',
      );

      if (!response.ok) {
        throw new ConfigLoadError(
          `Failed to load configuration: ${response.status} ${response.statusText}`,
          new Error(`HTTP ${response.status}`),
        );
      }

      let config;
      try {
        config = await response.json();
      } catch (parseError) {
        throw new ConfigLoadError(
          'Failed to parse configuration JSON',
          parseError instanceof Error
            ? parseError
            : new Error('JSON parse error'),
        );
      }

      const validationResult = this.validateConfig(config);

      if (!validationResult.isValid) {
        throw new ConfigValidationError(
          'Configuration validation failed',
          validationResult.errors,
        );
      }

      if (validationResult.warnings.length > 0) {
        console.warn('Configuration warnings:', validationResult.warnings);
      }

      return config;
    } catch (error) {
      ConfigErrorHandler.logError(
        error instanceof Error ? error : new Error('Unknown error'),
        'ConfigLoader.fetchConfig',
      );

      if (error instanceof ConfigurationError) {
        throw error;
      }

      throw new ConfigLoadError(
        `Failed to load criteria mapping configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Validates the configuration structure and content
   */
  public validateConfig(config: any): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: string[] = [];

    // Check required top-level properties
    if (!config.mappings) {
      errors.push({
        field: 'mappings',
        message: 'Missing required field: mappings',
        code: 'MISSING_FIELD',
      });
    }

    if (!config.defaultCriteria) {
      errors.push({
        field: 'defaultCriteria',
        message: 'Missing required field: defaultCriteria',
        code: 'MISSING_FIELD',
      });
    }

    if (!config.supportedCombinations) {
      errors.push({
        field: 'supportedCombinations',
        message: 'Missing required field: supportedCombinations',
        code: 'MISSING_FIELD',
      });
    }

    // Validate mappings structure
    if (config.mappings) {
      for (const [key, mapping] of Object.entries(config.mappings)) {
        const mappingErrors = this.validateMapping(key, mapping as any);
        errors.push(...mappingErrors);
      }
    }

    // Validate default criteria
    if (config.defaultCriteria) {
      const defaultErrors = this.validateCriteria(
        config.defaultCriteria,
        'defaultCriteria',
      );
      errors.push(...defaultErrors);
    }

    // Validate supported combinations consistency
    if (config.mappings && config.supportedCombinations) {
      const mappingKeys = Object.keys(config.mappings);
      const unsupportedMappings = mappingKeys.filter(
        (key) => !config.supportedCombinations.includes(key),
      );
      const missingMappings = config.supportedCombinations.filter(
        (combo: string) => !mappingKeys.includes(combo),
      );

      if (unsupportedMappings.length > 0) {
        warnings.push(
          `Mappings exist but are not in supportedCombinations: ${unsupportedMappings.join(', ')}`,
        );
      }

      if (missingMappings.length > 0) {
        errors.push({
          field: 'supportedCombinations',
          message: `Supported combinations reference missing mappings: ${missingMappings.join(', ')}`,
          code: 'MISSING_MAPPING',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateMapping(key: string, mapping: any): ConfigValidationError[] {
    const errors: ConfigValidationError[] = [];
    const requiredFields = [
      'product',
      'jurisdiction',
      'legalEntityType',
      'arazzoFile',
      'requiredOperations',
    ];

    for (const field of requiredFields) {
      if (!mapping[field]) {
        errors.push({
          field: `mappings.${key}.${field}`,
          message: `Missing required field in mapping ${key}: ${field}`,
          code: 'MISSING_FIELD',
        });
      }
    }

    // Validate array fields
    if (
      mapping.requiredOperations &&
      !Array.isArray(mapping.requiredOperations)
    ) {
      errors.push({
        field: `mappings.${key}.requiredOperations`,
        message: `requiredOperations must be an array in mapping ${key}`,
        code: 'INVALID_TYPE',
      });
    }

    // Validate key format matches criteria
    if (mapping.product && mapping.jurisdiction && mapping.legalEntityType) {
      const expectedKey = `${mapping.product}-${mapping.jurisdiction}-${mapping.legalEntityType}`;
      if (key !== expectedKey) {
        errors.push({
          field: `mappings.${key}`,
          message: `Mapping key ${key} does not match expected format ${expectedKey}`,
          code: 'INVALID_KEY_FORMAT',
        });
      }
    }

    return errors;
  }

  private validateCriteria(
    criteria: any,
    fieldPath: string,
  ): ConfigValidationError[] {
    const errors: ConfigValidationError[] = [];
    const requiredFields = ['product', 'jurisdiction', 'legalEntityType'];

    for (const field of requiredFields) {
      if (!criteria[field]) {
        errors.push({
          field: `${fieldPath}.${field}`,
          message: `Missing required field in criteria: ${field}`,
          code: 'MISSING_FIELD',
        });
      }
    }

    return errors;
  }

  /**
   * Gets the mapping for specific criteria
   */
  public async getMappingForCriteria(
    criteria: OnboardingCriteria,
  ): Promise<any> {
    try {
      const config = await this.loadConfig();
      const key = `${criteria.product}-${criteria.jurisdiction}-${criteria.legalEntityType}`;

      const mapping = config.mappings[key];
      if (!mapping) {
        throw new MappingNotFoundError(criteria);
      }

      return mapping;
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      ConfigErrorHandler.logError(
        error instanceof Error ? error : new Error('Unknown error'),
        'ConfigLoader.getMappingForCriteria',
      );
      throw new ConfigurationError(
        `Failed to get mapping for criteria: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MAPPING_RETRIEVAL_FAILED',
        criteria,
      );
    }
  }

  /**
   * Checks if a criteria combination is supported
   */
  public async isCombinationSupported(
    criteria: OnboardingCriteria,
  ): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      const key = `${criteria.product}-${criteria.jurisdiction}-${criteria.legalEntityType}`;
      return config.supportedCombinations.includes(key);
    } catch (error) {
      ConfigErrorHandler.logError(
        error instanceof Error ? error : new Error('Unknown error'),
        'ConfigLoader.isCombinationSupported',
      );
      // Return false for unsupported combinations when config can't be loaded
      return false;
    }
  }

  /**
   * Gets all available options for criteria selection
   */
  public async getAvailableOptions(): Promise<{
    products: string[];
    jurisdictions: string[];
    legalEntityTypes: string[];
  }> {
    const config = await this.loadConfig();

    const products = new Set<string>();
    const jurisdictions = new Set<string>();
    const legalEntityTypes = new Set<string>();

    Object.values(config.mappings).forEach((mapping) => {
      products.add(mapping.product);
      jurisdictions.add(mapping.jurisdiction);
      legalEntityTypes.add(mapping.legalEntityType);
    });

    return {
      products: Array.from(products).sort(),
      jurisdictions: Array.from(jurisdictions).sort(),
      legalEntityTypes: Array.from(legalEntityTypes).sort(),
    };
  }

  /**
   * Gets valid combinations for a partial criteria selection
   */
  public async getValidCombinations(
    partialCriteria: Partial<OnboardingCriteria>,
  ): Promise<string[]> {
    const config = await this.loadConfig();

    return config.supportedCombinations.filter((combination) => {
      const mapping = config.mappings[combination];
      if (!mapping) return false;

      if (
        partialCriteria.product &&
        mapping.product !== partialCriteria.product
      )
        return false;
      if (
        partialCriteria.jurisdiction &&
        mapping.jurisdiction !== partialCriteria.jurisdiction
      )
        return false;
      if (
        partialCriteria.legalEntityType &&
        mapping.legalEntityType !== partialCriteria.legalEntityType
      )
        return false;

      return true;
    });
  }

  /**
   * Validates that an Arazzo file exists and is accessible
   */
  public async validateArazzoFile(filePath: string): Promise<boolean> {
    try {
      const response = await fetch(filePath);
      return response.ok;
    } catch (error) {
      ConfigErrorHandler.logError(
        error instanceof Error ? error : new Error('Unknown error'),
        'ConfigLoader.validateArazzoFile',
      );
      return false;
    }
  }

  /**
   * Gets the Arazzo file path for specific criteria and validates it exists
   */
  public async getValidatedArazzoFile(
    criteria: OnboardingCriteria,
  ): Promise<string> {
    try {
      const mapping = await this.getMappingForCriteria(criteria);
      const filePath = mapping.arazzoFile;

      const isValid = await this.validateArazzoFile(filePath);
      if (!isValid) {
        throw new ArazzoFileNotFoundError(filePath);
      }

      return filePath;
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      ConfigErrorHandler.logError(
        error instanceof Error ? error : new Error('Unknown error'),
        'ConfigLoader.getValidatedArazzoFile',
      );
      throw new ConfigurationError(
        `Failed to get validated Arazzo file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ARAZZO_VALIDATION_FAILED',
        criteria,
      );
    }
  }

  /**
   * Validates a complete criteria combination including Arazzo file availability
   */
  public async validateCriteriaWithFiles(
    criteria: OnboardingCriteria,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if combination is supported
      const isSupported = await this.isCombinationSupported(criteria);
      if (!isSupported) {
        const config = await this.loadConfig();
        throw new UnsupportedCombinationError(
          criteria,
          config.supportedCombinations,
        );
      }

      // Check if mapping exists
      const mapping = await this.getMappingForCriteria(criteria);

      // Check if Arazzo file exists
      const arazzoFileExists = await this.validateArazzoFile(
        mapping.arazzoFile,
      );
      if (!arazzoFileExists) {
        errors.push(`Arazzo file not found: ${mapping.arazzoFile}`);
      }

      // Validate required operations are defined
      if (
        !mapping.requiredOperations ||
        mapping.requiredOperations.length === 0
      ) {
        warnings.push(
          'No required operations defined for this criteria combination',
        );
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        errors.push(error.message);
      } else {
        errors.push(
          `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Resets the cached configuration (useful for testing)
   */
  public resetCache(): void {
    this.config = null;
    this.loadPromise = null;
  }
}

export const configLoader = ConfigLoader.getInstance();
