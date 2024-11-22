/* eslint-disable import/no-useless-path-segments */
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropAnsweredQuestions } from '@/mocks/efClientSolPropAnsweredQuestions.mock';
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
} from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { OnboardingWizardBasic } from './OnboardingWizardBasic';

export const OnboardingWizardBasicWithProvider = ({
  apiBaseUrl,
  headers,
  title,
  availableProducts,
  availableJurisdictions,
  theme,
  onPostClientResponse,
  onPostClientVerificationsResponse,
  setClientId,
  clientId,
  initialStep,
  variant,
}: {
  apiBaseUrl: string;
  headers: Record<string, string>;
  title: string;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<'US' | 'CA'>;
  theme: Record<string, unknown>;
  onPostClientResponse: (response?: ClientResponse, error?: ApiError) => void;
  onPostClientVerificationsResponse?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  setClientId?: (s: string) => void;
  clientId?: string;
  initialStep?: number;
  variant?: 'circle' | 'line';
}) => {
  return (
    <>
      <EBComponentsProvider
        apiBaseUrl={apiBaseUrl}
        headers={headers}
        theme={theme}
      >
        <OnboardingWizardBasic
          title={title}
          onPostClientResponse={onPostClientResponse}
          onPostClientVerificationsResponse={onPostClientVerificationsResponse}
          setClientId={setClientId}
          clientId={clientId}
          initialStep={initialStep}
          variant={variant}
          availableProducts={availableProducts}
          availableJurisdictions={availableJurisdictions}
        />
      </EBComponentsProvider>
    </>
  );
};

const meta: Meta<typeof OnboardingWizardBasicWithProvider> = {
  title: 'Onboarding Wizard Basic / Steps',
  component: OnboardingWizardBasicWithProvider,
};
export default meta;

type Story = StoryObj<typeof OnboardingWizardBasicWithProvider>;

export const Primary: Story = {
  name: 'Intro without Client ID',
  args: {
    clientId: '',
    apiBaseUrl: '/',
    availableProducts: ['MERCHANT_SERVICES'],
    availableJurisdictions: ['CA'],
    title: 'Onboarding Wizard Basic',
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
};

export const WithClientId: Story = {
  name: 'Organization step with clientId',
  ...Primary,
  args: {
    ...Primary.args,
    clientId: '0030000133',
  },
  parameters: {
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
  },
};

export const NoThemeWithPDPAPIs: Story = {
  name: 'No theme with PDP mocked APIs',
  ...Primary,
  args: {
    ...Primary.args,
    apiBaseUrl: 'https://api-mock.payments.jpmorgan.com/tsapi/',
    clientId: '123',
  },
};

export const IndividualStep: Story = {
  name: 'Individual step',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 1,
  },
};

export const DecisionMakerStep: Story = {
  name: 'Decision Maker step',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 2,
  },
};

export const BusinessOwner: Story = {
  name: 'Business Owner step',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 3,
  },
};

export const AdditionalQuestions: Story = {
  name: 'Additional Questions step',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 4,
  },
};

export const ReviewAndAttest: Story = {
  name: 'Review and Attest step',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 5,
  },
};

export const DocumentUpload: Story = {
  name: 'Document Upload step',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 5,
  },
};

export const ReviewAndAttestNoOustanding: Story = {
  name: 'Review and Attest step with No outstanding',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    initialStep: 6,
  },
  parameters: {
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
  },
};

export const LineStepper: Story = {
  name: 'Line Stepper variant',
  ...WithClientId,
  args: {
    ...WithClientId.args,
    variant: 'line',
  },
};
