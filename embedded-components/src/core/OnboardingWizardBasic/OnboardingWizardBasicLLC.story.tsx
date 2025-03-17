/* eslint-disable no-console */
import { efClientCorpAnsweredQuestions } from '@/mocks/efClientCorpAnsweredQuestions.mock';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efDocumentClientDetail } from '@/mocks/efDocumentClientDetail';
import {
  efDocumentRequestComplexDetails,
  efDocumentRequestDetails,
} from '@/mocks/efDocumentRequestDetails.mock';
import { linkedAccountListMock } from '@/mocks/efLinkedAccounts.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import type { Meta, StoryFn } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { useDarkMode } from 'storybook-dark-mode';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';
import {
  OnboardingWizardBasic,
  OnboardingWizardBasicProps,
} from '@/core/OnboardingWizardBasic/OnboardingWizardBasic';

import { ORGANIZATION_TYPE_LIST } from './utils/organizationTypeList';

export type OnboardingWizardBasicWithProviderProps =
  OnboardingWizardBasicProps & EBConfig;

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  title: 'Onboarding Wizard Basic/ Steps (EP, US, LLC)',
  component: OnboardingWizardBasic,
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
    availableOrganizationTypes: {
      control: {
        type: 'check',
      },
      options: ORGANIZATION_TYPE_LIST,
    },
    usePartyResource: { control: 'boolean' },
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
  initialClientId: '',
  apiBaseUrl: '/',
  headers: {
    api_gateway_client_id: 'test',
  },
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  availableOrganizationTypes: [
    'SOLE_PROPRIETORSHIP',
    'LIMITED_LIABILITY_COMPANY',
  ],
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
        return HttpResponse.json(efClientCorpEBMock);
      }),
      http.post('/clients/0030000133', () => {
        return HttpResponse.json(efClientCorpEBMock);
      }),
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientCorpEBMock?.parties?.filter((p) => p.id === '2000000111')[0]
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

export const BenefitialOwners = Default.bind({});
BenefitialOwners.storyName = '4. Benefitial Owners step';
BenefitialOwners.args = {
  ...WithClientId.args,
  initialStep: 3,
};
BenefitialOwners.parameters = WithClientId.parameters;

export const AdditionalQuestions = Default.bind({});
AdditionalQuestions.storyName = '5. Additional Questions step';
AdditionalQuestions.args = {
  ...WithClientId.args,
  initialStep: 4,
};
AdditionalQuestions.parameters = WithClientId.parameters;

export const ReviewAndAttest = Default.bind({});
ReviewAndAttest.storyName = '6. Review and Attest step';
ReviewAndAttest.args = {
  ...WithClientId.args,
  blockPostVerification: true,
  initialStep: 5,
};
ReviewAndAttest.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json(efClientCorpAnsweredQuestions);
      }),
      http.get('/documents/abcd1c1d-6635-43ff-a8e5-b252926bddef', () => {
        return HttpResponse.json(efDocumentClientDetail);
      }),
      http.post('/clients/0030000133', () => {
        return HttpResponse.json(efClientCorpAnsweredQuestions);
      }),
      http.post('/clients/0030000133/verifications', () => {
        // return HttpResponse.json({acceptedAt: new Date().toISOString()});
        return HttpResponse.error();
      }),
      http.get('/questions', () => {
        return HttpResponse.json(efClientQuestionsMock);
      }),
      http.get('/documents/:documentId/file', () => {
        return new HttpResponse(
          new Blob(['Mock PDF content'], { type: 'application/pdf' }),
          {
            headers: {
              'Content-Type': 'application/pdf',
            },
          }
        );
      }),
    ],
  },
};

export const ReviewIsInProgress = Default.bind({});
ReviewIsInProgress.storyName = '7.1. Review is in progress';
ReviewIsInProgress.args = {
  ...WithClientId.args,
  blockPostVerification: true,
  showLinkedAccountPanel: true,
};
ReviewIsInProgress.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'REVIEW_IN_PROGRESS',
        });
      }),
      // Mock empty linked accounts response
      http.get('/recipients', () => {
        return HttpResponse.json({
          ...linkedAccountListMock,
          recipients: [],
        });
      }),
    ],
  },
};

export const AdditionalDocumentsRequested = Default.bind({});
AdditionalDocumentsRequested.storyName =
  '7.2. Additional Documents requested step';
AdditionalDocumentsRequested.args = {
  ...WithClientId.args,
  blockPostVerification: true,
};
AdditionalDocumentsRequested.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'INFORMATION_REQUESTED',
        });
      }),
      http.get('/document-requests/68805', () => {
        return HttpResponse.json(efDocumentRequestDetails);
      }),
      http.get('/document-requests/68804', () => {
        return HttpResponse.json(efDocumentRequestDetails);
      }),
      http.get('/document-requests/68803', () => {
        return HttpResponse.json(efOrganizationDocumentRequestDetails);
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

export const AdditionalDocumentsRequestedComplex = Default.bind({});
AdditionalDocumentsRequestedComplex.storyName =
  '7.3. Additional Documents requested step (Complex)';
AdditionalDocumentsRequestedComplex.args = {
  ...WithClientId.args,
  blockPostVerification: true,
};
AdditionalDocumentsRequestedComplex.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'INFORMATION_REQUESTED',
        });
      }),
      http.get('/document-requests/68805', () => {
        return HttpResponse.json(efDocumentRequestComplexDetails);
      }),
      http.get('/document-requests/68804', () => {
        return HttpResponse.json(efDocumentRequestComplexDetails);
      }),
      http.get('/document-requests/68803', () => {
        return HttpResponse.json(efOrganizationDocumentRequestDetails);
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

export const ClientStatusChangeSimulation = Default.bind({});
ClientStatusChangeSimulation.storyName = '8. Client Status Change Simulation';
ClientStatusChangeSimulation.args = {
  ...WithClientId.args,
  blockPostVerification: true,
};
let requestCount = 0;
ClientStatusChangeSimulation.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        requestCount += 1;
        const status =
          requestCount > 3 ? 'INFORMATION_REQUESTED' : 'REVIEW_IN_PROGRESS';
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status,
        });
      }),
      http.get('/document-requests/68805', () => {
        return HttpResponse.json(efDocumentRequestDetails);
      }),
      http.get('/document-requests/68804', () => {
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
