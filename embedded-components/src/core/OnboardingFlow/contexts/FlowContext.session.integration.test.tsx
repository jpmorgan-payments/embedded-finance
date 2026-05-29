/**
 * Focused RTL checks for {@link FlowProvider} session merging — avoids heavier
 * onboarding shell tests while exercising real {@link updateSessionData} behavior.
 */
import { describe, expect, test } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import {
  FlowProvider,
  OnboardingContext,
  useFlowContext,
} from '@/core/OnboardingFlow/contexts';

function SessionMergeProbe() {
  const { sessionData, updateSessionData } = useFlowContext();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          updateSessionData({
            hideGatewayInfoAlert: true,
          })
        }
      >
        Persist session flag
      </button>
      <span data-testid="gateway-alert-flag">
        {sessionData.hideGatewayInfoAlert === true ? 'hidden' : 'visible'}
      </span>
    </>
  );
}

const onboardingCtx: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: undefined,
  clientGetStatus: 'success',
  setClientId: () => {},
  organizationType: undefined,
  showLinkAccountStep: false,
  showDownloadChecklist: false,
  docUploadOnlyMode: false,
  docUploadMaxFileSizeBytes: 8 * 1024 * 1024,
};

describe('FlowProvider sessionData', () => {
  test('updateSessionData merges partial updates for downstream screens', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <OnboardingContext.Provider value={onboardingCtx}>
        <FlowProvider initialScreenId="gateway" flowConfig={flowConfig}>
          <SessionMergeProbe />
        </FlowProvider>
      </OnboardingContext.Provider>
    );

    expect(screen.getByTestId('gateway-alert-flag')).toHaveTextContent(
      'visible'
    );

    await user.click(
      screen.getByRole('button', { name: /persist session flag/i })
    );

    expect(screen.getByTestId('gateway-alert-flag')).toHaveTextContent(
      'hidden'
    );
  });
});
