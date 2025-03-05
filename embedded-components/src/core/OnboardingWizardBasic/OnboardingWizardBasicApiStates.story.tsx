import { efClientCorpAnsweredQuestions } from '@/mocks/efClientCorpAnsweredQuestions.mock';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efClientQuestionsMock } from '@/mocks/efClientQuestions.mock';
import { efClientSolPropWithMoreData } from '@/mocks/efClientSolPropWithMoreData.mock';
import type { Meta } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';

import OnboardingWizardBasicMeta, {
  Default,
  OnboardingWizardBasicWithProviderProps,
} from './OnboardingWizardBasicSP.story';

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  ...OnboardingWizardBasicMeta,
  title: 'Onboarding Wizard Basic / API States',
};
export default meta;

export const DefaultOK = Default.bind({});
DefaultOK.storyName = 'Default 200 OK';
DefaultOK.args = {
  ...Default.args,
  initialClientId: '0030000130',
};
DefaultOK.parameters = {
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
      http.get('/clients/0030000130', () => {
        return HttpResponse.json(efClientSolPropWithMoreData);
      }),
      http.post('/clients/0030000130', () => {
        return HttpResponse.json(efClientSolPropWithMoreData);
      }),
    ],
  },
};

export const WithLoadingState = DefaultOK.bind({});
WithLoadingState.storyName = 'Loading state on get';
WithLoadingState.args = DefaultOK.args;
WithLoadingState.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        // Delay the response by 3 seconds (3000 milliseconds)
        await delay(5000);
        return HttpResponse.json(efClientSolPropWithMoreData);
      }),
      http.post('/clients/0030000130', async () => {
        // You can add a delay here too if needed
        return HttpResponse.json(efClientSolPropWithMoreData);
      }),
    ],
  },
};

export const WithLoadingStateThenReviewInProgress = DefaultOK.bind({});
WithLoadingStateThenReviewInProgress.storyName =
  'Loading state on GET, then REVIEW_IN_PROGRESS';
WithLoadingStateThenReviewInProgress.args = DefaultOK.args;
WithLoadingStateThenReviewInProgress.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        // Delay the response by 3 seconds (3000 milliseconds)
        await delay(5000);
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'REVIEW_IN_PROGRESS',
        });
      }),
    ],
  },
};

export const WithNoOutstandingRequirements = DefaultOK.bind({});
WithNoOutstandingRequirements.storyName =
  'NEW with no outstanding requirements';
WithNoOutstandingRequirements.args = DefaultOK.args;
WithNoOutstandingRequirements.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(efClientCorpAnsweredQuestions);
      }),
    ],
  },
};

export const WithLoadingStateAndError = DefaultOK.bind({});
WithLoadingStateAndError.storyName = 'Unhandled server error on POST';
WithLoadingStateAndError.args = DefaultOK.args;
WithLoadingStateAndError.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(efClientSolPropWithMoreData);
      }),
      http.post('/clients/0030000130', async () => {
        await delay(1000); // Adding a small delay to the error response
        return HttpResponse.json(
          {
            title: 'Invalid Data',
            httpStatus: 400,
            context: [
              {
                message: 'Invalid email format.',
                location: 'BODY',
                field: 'email',
              },
              {
                message: 'Invalid phone number format.',
                location: 'BODY',
                field: 'phone.phoneNumber',
              },
            ],
          },
          { status: 400 }
        );
      }),
    ],
  },
};

export const WithErrorOnPost = DefaultOK.bind({});
WithErrorOnPost.storyName = 'Server error on GET /clients/:clientId';
WithErrorOnPost.args = DefaultOK.args;
WithErrorOnPost.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json(
          {
            title: 'Invalid Data',
            httpStatus: 400,
            context: [
              {
                message: 'Client with ID [0030000130] does not exist.',
                location: 'BODY',
                field: 'clientId',
              },
            ],
          },
          { status: 400 }
        );
      }),
    ],
  },
};

export const OnboardingInProgress = DefaultOK.bind({});
OnboardingInProgress.storyName = 'ClientStatus: PENDING';
OnboardingInProgress.args = DefaultOK.args;
OnboardingInProgress.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000130', async () => {
        return HttpResponse.json({
          ...efClientSolPropWithMoreData,
          status: 'PENDING',
        });
      }),
    ],
  },
};
