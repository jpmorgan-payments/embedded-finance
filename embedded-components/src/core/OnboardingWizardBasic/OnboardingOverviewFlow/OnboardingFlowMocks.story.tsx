import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { Meta } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import defaultMeta, {
  Default,
  OnboardingFlowWithProviderProps,
  STheme,
} from './OnboardingFlow.story';

const CLIENT_ID = '0030000132';

const meta: Meta<OnboardingFlowWithProviderProps> = {
  ...defaultMeta,
  title: 'Onboarding Flow / Mocked Client Status',
};
export default meta;

export const SThemeWithMock = Default.bind({});
SThemeWithMock.storyName = 'No Client ID';
SThemeWithMock.args = {
  ...STheme.args,
  apiBaseUrl: '',
  headers: {
    api_gateway_client_id: 'test',
  },
};

export const MockExistingClient = Default.bind({});
MockExistingClient.storyName = 'New';
MockExistingClient.args = {
  ...SThemeWithMock.args,
  initialClientId: CLIENT_ID,
};

export const MockReviewInProgress = Default.bind({});
MockReviewInProgress.storyName = 'Review In Progress';
MockReviewInProgress.args = {
  ...MockExistingClient.args,
};
MockReviewInProgress.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'REVIEW_IN_PROGRESS',
        });
      }),
    ],
  },
};

export const MockInformationRequested = Default.bind({});
MockInformationRequested.storyName = 'Information Requested';
MockInformationRequested.args = {
  ...MockExistingClient.args,
};
MockInformationRequested.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'INFORMATION_REQUESTED',
        });
      }),
    ],
  },
};

export const MockDeclined = Default.bind({});
MockDeclined.storyName = 'Declined';
MockDeclined.args = {
  ...MockExistingClient.args,
};
MockDeclined.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'DECLINED',
        });
      }),
    ],
  },
};

export const MockApproved = Default.bind({});
MockApproved.storyName = 'Approved';
MockApproved.args = {
  ...MockExistingClient.args,
};
MockApproved.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'APPROVED',
        });
      }),
    ],
  },
};
