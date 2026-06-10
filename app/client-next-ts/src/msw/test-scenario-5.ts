/** Recommended NAICS codes surfaced first in the industry picker for `/test-scenario-5`. */
/** Must exist in embedded-components `naics-codes.json` or they are dropped from the picker. */
export const TEST_SCENARIO_5_NAICS_CODES = [
  '525996',
  '525995',
  '525991',
] as const;

export type TestScenario5NaicsCode =
  (typeof TEST_SCENARIO_5_NAICS_CODES)[number];

/** NAICS assessment questions served after a recommended code is selected. */
export const TEST_SCENARIO_5_QUESTION_IDS = [
  '30012',
  '30013',
  '30015',
  '30032',
  '30075',
  '30163',
  '30164',
  '30165',
  '30167',
  '30169',
  '30171',
  '30173',
  '30174',
  '30178',
  '30179',
  '30181',
  '30182',
  '30183',
  '30185',
  '30187',
  '30189',
  '30191',
] as const;

export const TEST_SCENARIO_5_DASHBOARD_ACCOUNT_ID = 'ts5-acc-payments';

export function isTestScenario5NaicsCode(
  code: string | undefined | null
): code is TestScenario5NaicsCode {
  return (
    typeof code === 'string' &&
    (TEST_SCENARIO_5_NAICS_CODES as readonly string[]).includes(code)
  );
}

const NAICS_CODE_REQUIRED_QUESTION_IDS = [
  '30012',
  '30013',
  '30015',
  '30032',
  '30075',
  '30163',
  '30164',
  '30165',
  '30167',
  '30169',
  '30171',
  '30173',
  '30174',
  '30178',
  '30179',
  '30181',
  '30182',
  '30183',
  '30185',
  '30187',
  '30189',
  '30191',
] as const;

export function areAllNaicsCodeQuestionsAnswered(
  questionResponses: Array<{ questionId?: string }> | undefined,
  outstandingQuestionIds: string[] | undefined
): boolean {
  const answered = new Set(
    (questionResponses ?? [])
      .map((r) => r.questionId)
      .filter((id): id is string => typeof id === 'string')
  );
  const outstanding = new Set(outstandingQuestionIds ?? []);

  const coreComplete = NAICS_CODE_REQUIRED_QUESTION_IDS.every(
    (id) => answered.has(id) && !outstanding.has(id)
  );
  return coreComplete;
}
