import { describe, expect, it } from 'vitest';

import { getOnboardingScenarioExtras } from './kyc-onboarding';

describe('getOnboardingScenarioExtras', () => {
  it('returns link-account extras for link account in review', () => {
    expect(
      getOnboardingScenarioExtras('Onboarding - Link account in review')
    ).toEqual({
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {},
      },
    });
  });

  it('returns delta mode + skip terms extras for prefilled Delta scenario', () => {
    expect(
      getOnboardingScenarioExtras(
        'Onboarding - Seller with prefilled data (Delta)'
      )
    ).toEqual({
      deltaMode: {
        enabled: true,
        maxPendingFields: 5,
        defaultControllerNotAnOwner: true,
      },
      skipTermsDocumentAcknowledgment: true,
    });
  });

  it('returns empty extras for the standard prefilled scenario', () => {
    expect(
      getOnboardingScenarioExtras('Onboarding - Seller with prefilled data')
    ).toEqual({});
  });
});
