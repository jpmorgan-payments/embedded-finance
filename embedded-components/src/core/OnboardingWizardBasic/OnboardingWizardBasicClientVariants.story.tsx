import { efClientCorpMock } from '@/mocks/efClientCorp.mock';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientCorpNew } from '@/mocks/efClientCorpNew.mock';
import { efClientCorpWithMissingAttrsMock } from '@/mocks/efClientCorpWithMissingAttrs.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropNew } from '@/mocks/efClientSolPropNew.mock';
import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import { http, HttpResponse } from 'msw';
import type { Meta } from '@storybook/react-vite';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasicSP.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Legacy/OnboardingWizardBasic/ClientVariants',
  tags: ['@legacy', '@onboarding'],
};
export default meta;

export const SoleProprietorship_EP_NEW = Default.bind({});
SoleProprietorship_EP_NEW.storyName = 'Sole Proprietorship EP NEW';
SoleProprietorship_EP_NEW.args = {
  ...Default.args,
  initialClientId: '0030000135',
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
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientSolPropNew?.parties?.filter((p) => p.id === '2000000111')[0]
        );
      }),
    ],
  },
};

export const SoleProprietorship_EP = Default.bind({});
SoleProprietorship_EP.storyName = 'Sole Proprietorship EP';
SoleProprietorship_EP.args = {
  ...Default.args,
  initialClientId: '0030000129',
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
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientSolPropWithMoreData?.parties?.filter(
            (p) => p.id === '2000000111'
          )[0]
        );
      }),
    ],
  },
};

export const LLC_EP = Default.bind({});
LLC_EP.storyName = 'Limited Liability Company EP';
LLC_EP.args = {
  ...Default.args,
  initialClientId: '0030000130',
  availableProducts: ['EMBEDDED_PAYMENTS'],
};
LLC_EP.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpMock);
      }),
      http.post('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpMock);
      }),
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientCorpMock?.parties?.filter((p) => p.id === '2000000111')[0]
        );
      }),
    ],
  },
};

export const LLC_EP_NEW = Default.bind({});
LLC_EP_NEW.storyName = 'Limited Liability Company EP - NEW';
LLC_EP_NEW.args = {
  ...Default.args,
  initialClientId: '0030000130',
  availableProducts: ['EMBEDDED_PAYMENTS'],
};
LLC_EP_NEW.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpNew);
      }),
      http.post('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpNew);
      }),
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientCorpNew?.parties?.filter((p) => p.id === '2000000111')[0]
        );
      }),
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
    ],
  },
};

export const LLC_WithMissingAttrs = Default.bind({});
LLC_WithMissingAttrs.storyName =
  'Limited Liability Company EP With Missing Attrs';
LLC_WithMissingAttrs.args = {
  ...Default.args,
  initialClientId: '0030000130',
  availableProducts: ['EMBEDDED_PAYMENTS'],
};
LLC_WithMissingAttrs.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpWithMissingAttrsMock);
      }),
      http.post('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpWithMissingAttrsMock);
      }),
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientCorpWithMissingAttrsMock?.parties?.filter(
            (p) => p.id === '2000000111'
          )[0]
        );
      }),
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
    ],
  },
};

export const LLC_Canada_MS = Default.bind({});
LLC_Canada_MS.storyName = 'Limited Liability Company Canada MS';
LLC_Canada_MS.args = {
  ...Default.args,
  initialClientId: '0030000133',
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
      http.post('/parties/2000000111', () => {
        return HttpResponse.json(
          efClientCorpEBMock?.parties?.filter((p) => p.id === '2000000111')[0]
        );
      }),
    ],
  },
};
