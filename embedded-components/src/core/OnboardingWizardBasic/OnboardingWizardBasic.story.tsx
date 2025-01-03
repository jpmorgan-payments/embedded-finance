/* eslint-disable no-console */
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropAnsweredQuestions } from '@/mocks/efClientSolPropAnsweredQuestions.mock';
import { efClientSolPropNew } from '@/mocks/efClientSolPropNew.mock';
import type { Meta, StoryFn } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { useDarkMode } from 'storybook-dark-mode';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';
import {
  OnboardingWizardBasic,
  OnboardingWizardBasicProps,
} from '@/core/OnboardingWizardBasic/OnboardingWizardBasic';

export type OnboardingWizardBasicWithProviderProps =
  OnboardingWizardBasicProps & EBConfig;

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  title: 'Onboarding Wizard Basic/ Steps (EP, US, new Sol Prop)',
  component: OnboardingWizardBasic,
  args: {
    onPostClientResponse: (data, error) => {
      if (data) {
        console.log('@@POST client response data', data);
      } else if (error) {
        console.log('@@POST client response error', error);
      }
    },
    onPostClientVerificationsResponse: (data, error) => {
      if (data) {
        console.log('@@POST verifications response data', data);
      } else if (error) {
        console.log('@@POST verifications response error', error);
      }
    },
  },
  argTypes: {
    onPostClientResponse: { table: { disable: true } },
    onPostClientVerificationsResponse: { table: { disable: true } },
    setClientId: { table: { disable: true } },
    availableProducts: {
      control: {
        type: 'check',
      },
      options: ['MERCHANT_SERVICES', 'EMBEDDED_PAYMENTS'],
    },
    availableJurisdictions: {
      control: {
        type: 'check',
      },
      options: ['US', 'CA'],
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = useDarkMode();
      const {
        apiBaseUrl,
        headers,
        theme,
        reactQueryDefaultOptions,
        contentTokens,
      } = context.args;
      return (
        <EBComponentsProvider
          apiBaseUrl={apiBaseUrl}
          headers={headers}
          theme={{
            colorScheme: isDarkMode ? 'dark' : 'light',
            ...theme,
          }}
          reactQueryDefaultOptions={reactQueryDefaultOptions}
          contentTokens={contentTokens}
        >
          <Story />
        </EBComponentsProvider>
      );
    },
  ],
};

export default meta;

const Template: StoryFn<OnboardingWizardBasicWithProviderProps> = (args) => (
  <OnboardingWizardBasic {...args} />
);

export const Default = Template.bind({});
Default.storyName = '1a. Initial step without clientId';
Default.args = {
  clientId: '',
  apiBaseUrl: '/',
  headers: {
    api_gateway_client_id: 'test',
  },
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  theme: {},
  contentTokens: {
    name: 'enUS',
  },
  variant: 'circle-alt',
  alertOnExit: false,
};

export const WithClientId = Default.bind({});
WithClientId.storyName = '1b. Initial step with clientId';
WithClientId.args = {
  ...Default.args,
  clientId: '0030000133',
};
WithClientId.parameters = {
  msw: {
    handlers: [
      http.get('/questions', (req) => {
        const url = new URL(req.request.url);
        const questionIds = url.searchParams.get('questionIds');
        return HttpResponse.json({
          metadata: efClientQuestionsMock.metadata,
          questions: efClientQuestionsMock?.questions.filter((q) =>
            questionIds?.includes(q.id)
          ),
        });
      }),
      http.get('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropNew);
      }),
      http.post('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropNew);
      }),
    ],
  },
};

export const OrganizationStep = Default.bind({});
OrganizationStep.storyName = '2. Organization step';
OrganizationStep.args = {
  ...WithClientId.args,
  initialStep: 1,
};
OrganizationStep.parameters = WithClientId.parameters;

export const IndividualStep = Default.bind({});
IndividualStep.storyName = '3. Individual step';
IndividualStep.args = {
  ...WithClientId.args,
  initialStep: 2,
};
IndividualStep.parameters = WithClientId.parameters;

export const AdditionalQuestions = Default.bind({});
AdditionalQuestions.storyName = '4. Additional Questions step';
AdditionalQuestions.args = {
  ...WithClientId.args,
  initialStep: 3,
};
AdditionalQuestions.parameters = WithClientId.parameters;

export const ReviewAndAttest = Default.bind({});
ReviewAndAttest.storyName = '5. Review and Attest step';
ReviewAndAttest.args = {
  ...WithClientId.args,
  initialStep: 4,
};
ReviewAndAttest.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropAnsweredQuestions);
      }),
      http.post('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropAnsweredQuestions);
      }),
    ],
  },
};
