/**
 * NAICS codes that are always valid for NON_PROFIT_CORPORATION or UNINCORPORATED_ASSOCIATION
 * organization types.
 */
export const NONPROFIT_NAICS_CODES = [
  '622111', // Not-For-Profit Hospitals
  '813110', // Religious Organizations
  '813211', // Grantmaking Foundations
  '813212', // Voluntary Health Organizations
  '813219', // Other Grantmaking And Giving Services
  '813311', // Human Rights Organizations
  '813312', // Environment Conservation And Wildlife Organizations
  '813319', // Other Social Advocacy Organizations
  '813410', // Civic And Social Organizations
  '813910', // Business Associations
  '813920', // Professional Organizations
  '813930', // Labor Unions And Similar Labor Organizations
  '813940', // Political Organizations
  '813990', // Other Similar Organizations
] as const;

/**
 * NAICS codes that are conditionally valid for nonprofits.
 * These are valid ONLY when the qualifying question response indicates
 * the entity operates as a nonprofit (answer is TRUE).
 */
export const NONPROFIT_CONDITIONAL_NAICS_CODES = [
  '611111', // Elementary And Secondary Schools (Private)
  '611211', // Junior Colleges (Private)
  '611311', // Colleges Universities And Professional Schools (Private)
] as const;

/**
 * All NAICS codes potentially valid for nonprofit organizations
 * (includes both unconditional and conditional codes).
 */
export const ALL_NONPROFIT_NAICS_CODES = [
  ...NONPROFIT_NAICS_CODES,
  ...NONPROFIT_CONDITIONAL_NAICS_CODES,
] as const;

/**
 * Organization types that require nonprofit NAICS code validation.
 */
export const NONPROFIT_ORGANIZATION_TYPES = [
  'NON_PROFIT_CORPORATION',
  'UNINCORPORATED_ASSOCIATION',
] as const;

export type NonprofitOrganizationType =
  (typeof NONPROFIT_ORGANIZATION_TYPES)[number];

/**
 * Check if an organization type is a nonprofit type.
 */
export const isNonprofitOrganizationType = (
  organizationType: string | undefined
): organizationType is NonprofitOrganizationType => {
  return NONPROFIT_ORGANIZATION_TYPES.includes(
    organizationType as NonprofitOrganizationType
  );
};

/**
 * Check if a NAICS code is valid for a nonprofit organization type.
 * Returns true if:
 * - The code is in the unconditional nonprofit NAICS list, OR
 * - The code is in the conditional list AND the qualifying question answer is true
 */
export const isValidNonprofitNaicsCode = (
  naicsCode: string,
  qualifyingQuestionAnswer?: boolean
): boolean => {
  if ((NONPROFIT_NAICS_CODES as readonly string[]).includes(naicsCode)) {
    return true;
  }

  if (
    (NONPROFIT_CONDITIONAL_NAICS_CODES as readonly string[]).includes(naicsCode)
  ) {
    return qualifyingQuestionAnswer === true;
  }

  return false;
};
