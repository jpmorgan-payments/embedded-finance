/* eslint-disable no-console */
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropAnsweredQuestions } from '@/mocks/efClientSolPropAnsweredQuestions.mock';
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
  title: 'Onboarding Wizard Basic / Steps (Canada MS LLC)',
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
      options: ['CA', 'US'],
    },
    language: {
      control: {
        type: 'radio',
      },
      options: ['en', 'fr'],
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
        globalTranslationOverrides,
        language,
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
          globalTranslationOverrides={globalTranslationOverrides}
          language={language}
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
  availableProducts: ['MERCHANT_SERVICES', 'EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['CA', 'US'],
  theme: {},
  language: 'fr',
  translationOverrides: {},
  globalTranslationOverrides: {},
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
        return HttpResponse.json(efClientCorpEBMock);
      }),
      http.post('/clients/0030000133', () => {
        return HttpResponse.json(efClientCorpEBMock);
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

export const DecisionMakerStep = Default.bind({});
DecisionMakerStep.storyName = '4. Decision Maker step';
DecisionMakerStep.args = {
  ...WithClientId.args,
  initialStep: 3,
};
DecisionMakerStep.parameters = WithClientId.parameters;

export const BusinessOwner = Default.bind({});
BusinessOwner.storyName = '5. Business Owner step';
BusinessOwner.args = {
  ...WithClientId.args,
  initialStep: 4,
};
BusinessOwner.parameters = WithClientId.parameters;

export const AdditionalQuestions = Default.bind({});
AdditionalQuestions.storyName = '6. Additional Questions step';
AdditionalQuestions.args = {
  ...WithClientId.args,
  initialStep: 5,
};
AdditionalQuestions.parameters = WithClientId.parameters;

export const DocumentUpload = Default.bind({});
DocumentUpload.storyName = '7. Document Upload step';
DocumentUpload.args = {
  ...WithClientId.args,
  initialStep: 6,
};
DocumentUpload.parameters = WithClientId.parameters;

export const ReviewAndAttest = Default.bind({});
ReviewAndAttest.storyName = '8. Review and Attest step';
ReviewAndAttest.args = {
  ...WithClientId.args,
  initialStep: 7,
};
ReviewAndAttest.parameters = WithClientId.parameters;

export const ReviewAndAttestNoOutstanding = Default.bind({});
ReviewAndAttestNoOutstanding.storyName =
  '8b. Review and Attest step with No outstanding';
ReviewAndAttestNoOutstanding.args = ReviewAndAttest.args;
ReviewAndAttestNoOutstanding.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', () => {
        return HttpResponse.json(efClientSolPropAnsweredQuestions);
      }),
      http.post('/clients/0030000130', () => {
        return HttpResponse.json(efClientSolPropAnsweredQuestions);
      }),
    ],
  },
};
