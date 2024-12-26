import { efClientCorpMock } from '@/mocks/efClientCorp.mock';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropNew } from '@/mocks/efClientSolPropNew.mock';
import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import type { Meta } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasic.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Onboarding Wizard Basic / Client Variants',
};
export default meta;

export const SoleProprietorship_EP_NEW = Default.bind({});
SoleProprietorship_EP_NEW.storyName = 'Sole Proprietorship EP NEW';
SoleProprietorship_EP_NEW.args = {
  ...Default.args,
  clientId: '0030000135',
  availableProducts: ['EMBEDDED_PAYMENTS'],
};
SoleProprietorship_EP_NEW.parameters = {
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
      http.get('/clients/0030000135', () => {
        return HttpResponse.json(efClientSolPropNew);
      }),
      http.post('/clients/0030000135', () => {
        return HttpResponse.json(efClientSolPropNew);
      }),
    ],
  },
};

export const SoleProprietorship_EP = Default.bind({});
SoleProprietorship_EP.storyName = 'Sole Proprietorship EP';
SoleProprietorship_EP.args = {
  ...Default.args,
  clientId: '0030000129',
  availableProducts: ['EMBEDDED_PAYMENTS'],
};
SoleProprietorship_EP.parameters = {
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
};

export const LLC_EP = Default.bind({});
LLC_EP.storyName = 'Limited Liability Company EP';
LLC_EP.args = {
  ...Default.args,
  clientId: '0030000130',
  availableProducts: ['EMBEDDED_PAYMENTS'],
};
LLC_EP.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpMock);
      }),
    ],
  },
};

export const LLC_Canada_MS = Default.bind({});
LLC_Canada_MS.storyName = 'Limited Liability Company Canada MS';
LLC_Canada_MS.args = {
  ...Default.args,
  clientId: '0030000133',
  availableJurisdictions: ['CA'],
  availableProducts: ['MERCHANT_SERVICES'],
};
LLC_Canada_MS.parameters = {
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
};
