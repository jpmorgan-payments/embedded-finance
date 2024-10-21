/* eslint-disable import/no-useless-path-segments */
import { efClientCorpMock } from '@/mocks/efClientCorp.mock';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { OnboardingWizardBasicWithProvider } from './OnboardingWizardBasic.story';

const meta: Meta<typeof OnboardingWizardBasicWithProvider> = {
  title: 'Onboarding Wizard Basic / Client Variants',
  component: OnboardingWizardBasicWithProvider,
};
export default meta;

type Story = StoryObj<typeof OnboardingWizardBasicWithProvider>;

export const Primary: Story = {
  name: 'Sole Proprietorship EP',
  args: {
    clientId: '0030000129',
    apiBaseUrl: '/',
    title: 'Sole Proprietorship',
    theme: {
      variables: {
        primaryColor: 'teal',
        borderRadius: '15px',
      },
    },
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
        http.get('/clients/0030000129', () => {
          return HttpResponse.json(efClientSolPropWithMoreData);
        }),
        http.post('/clients/0030000129', () => {
          return HttpResponse.json(efClientSolPropWithMoreData);
        }),
      ],
    },
  },
};

export const LLC: Story = {
  name: 'Limited Liability Company EP',
  ...Primary,
  args: {
    ...Primary.args,
    clientId: '0030000130',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/clients/0030000130', async () => {
          return HttpResponse.json(efClientCorpMock);
        }),
      ],
    },
  },
};

export const EMBEDDED_BANKING_LLC: Story = {
  name: 'Limited Liability Company EB',
  ...Primary,
  args: {
    ...Primary.args,
    clientId: '0030000133',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/clients/0030000133', async () => {
          return HttpResponse.json(efClientCorpEBMock);
        }),
      ],
    },
  },
};

export const CANADA_MS_LLC: Story = {
  name: 'Canada MS LLC',
  ...Primary,
  args: {
    ...Primary.args,
    clientId: '0030000133',
    useCase: 'CanadaMS',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/clients/0030000133', async () => {
          return HttpResponse.json(efClientCorpEBMock);
        }),
        http.post('/clients/0030000133', () => {
          return HttpResponse.json(efClientCorpEBMock);
        }),
      ],
    },
  },
};
