/* eslint-disable no-console */
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropAdditionalDocuments } from '@/mocks/efClientSolPropAdditionalDocuments.mock';
import { efClientSolPropAnsweredQuestions } from '@/mocks/efClientSolPropAnsweredQuestions.mock';
import { efClientSolPropNew } from '@/mocks/efClientSolPropNew.mock';
import { efDocumentClientDetail } from '@/mocks/efDocumentClientDetail';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import type { Meta, StoryFn } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import {
  OnboardingWizardBasic,
  OnboardingWizardBasicProps,
} from '@/core/OnboardingWizardBasic/OnboardingWizardBasic';

import type { BaseStoryArgs } from '../../../.storybook/preview';

/**
 * Story args interface extending base provider args
 */
export type OnboardingWizardBasicSPStoryArgs = OnboardingWizardBasicProps &
  BaseStoryArgs;

/**
 * @deprecated Use OnboardingWizardBasicSPStoryArgs instead
 * Kept for backward compatibility with existing story files
 */
export type OnboardingWizardBasicWithProviderProps =
  OnboardingWizardBasicSPStoryArgs;

const meta: Meta<OnboardingWizardBasicSPStoryArgs> = {
  title: 'Legacy/OnboardingWizardBasic/Steps',
  component: OnboardingWizardBasic,
  tags: ['@legacy', '@onboarding'],
  args: {
    onPostClientResponse: (data, error) => {
      if (data) {
        console.log('@@POST client response data', data);
      } else if (error) {
        console.log('@@POST client response error', error);
      }
    },
    onPostPartyResponse(response, error) {
      if (response) {
        console.log('@@POST party response data', response);
      } else if (error) {
        console.log('@@POST party response error', error);
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
    onSetClientId: { table: { disable: true } },
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
    usePartyResource: { control: 'boolean' },
  },
};

export default meta;

const Template: StoryFn<OnboardingWizardBasicSPStoryArgs> = (args) => (
  <OnboardingWizardBasic {...args} />
);

export const Default = Template.bind({});
Default.storyName = '1a. Initial step without clientId';
Default.args = {
  initialClientId: '',
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
  initialClientId: '0030000133',
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
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientSolPropNew?.parties?.filter((p) => p.id === '2000000111')[0]
        );
      }),
    ],
  },
};

export const OrganizationStep = Default.bind({});
OrganizationStep.storyName = '2. Organization step';
OrganizationStep.args = {
  ...WithClientId.args,
  usePartyResource: true, // Use party resource for organization step
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
  blockPostVerification: true,
  initialStep: 4,
};
ReviewAndAttest.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropAnsweredQuestions);
      }),
      http.get('/documents/abcd1c1d-6635-43ff-a8e5-b252926bddef', () => {
        return HttpResponse.json(efDocumentClientDetail);
      }),
      http.post('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropAnsweredQuestions);
      }),
      http.post('/clients/0030000133/verifications', () => {
        // return HttpResponse.json({acceptedAt: new Date().toISOString()});
        return HttpResponse.error();
      }),
      http.get('/questions', () => {
        return HttpResponse.json(efClientQuestionsMock);
      }),
    ],
  },
};

export const AdditionalDocumentsRequested = Default.bind({});
AdditionalDocumentsRequested.storyName =
  '6. Additional Documents requested step';
AdditionalDocumentsRequested.args = {
  ...WithClientId.args,
  blockPostVerification: true,
};
AdditionalDocumentsRequested.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json(efClientSolPropAdditionalDocuments);
      }),
      http.get('/document-requests/68430', () => {
        return HttpResponse.json(efDocumentRequestDetails);
      }),
      http.post('/documents', () => {
        return HttpResponse.json({
          requestId: Math.random().toString(36).substring(7),
          traceId: `doc-${Math.random().toString(36).substring(7)}`,
        });
      }),
    ],
  },
};
