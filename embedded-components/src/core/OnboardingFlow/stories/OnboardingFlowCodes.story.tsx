import { efClientCorpEBMockNoIndustry } from '@/mocks/efClientCorpEBNoIndustry.mock';
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
  title: 'Core/OnboardingFlow/NAICS Recommendations',
  tags: ['@core', '@onboarding'],
};
export default meta;

const SThemeWithMock = Default.bind({});
SThemeWithMock.storyName = 'No Client ID';
SThemeWithMock.args = {
  ...STheme.args,
  apiBaseUrl: '',
  headers: {
    api_gateway_client_id: 'test',
  },
};

const MockExistingClient = Default.bind({});
MockExistingClient.play = async () => {
  localStorage.removeItem('NAICS_SUGGESTION_FEATURE_FLAG');
};
MockExistingClient.storyName = 'New';
MockExistingClient.args = {
  ...SThemeWithMock.args,
  initialClientId: CLIENT_ID,
};

// Recommendation API mock stories
export const MockSingleRecommendation = Default.bind({});
MockSingleRecommendation.storyName = 'Single Recommendation';
MockSingleRecommendation.args = {
  ...MockExistingClient.args,
};
// Enable the NAICS suggestion feature flag
MockSingleRecommendation.play = async () => {
  localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
};
MockSingleRecommendation.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMockNoIndustry,
          parties: efClientCorpEBMockNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We operate a fast-casual restaurant serving burgers, fries, and beverages to customers for dine-in and takeout.',
                }
              : party.organizationDetails,
          })),
        });
      }),
      http.post('/recommendations', async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        return HttpResponse.json({
          resourceType: 'NAICS_CODE',
          message: 'Recommended NAICS code for restaurant business',
          resource: [
            {
              naicsCode: '722511',
              naicsDescription: 'Full-Service Restaurants',
            },
          ],
        });
      }),
    ],
  },
};

export const MockMultipleRecommendations = Default.bind({});
MockMultipleRecommendations.storyName = 'Multiple Recommendations';
MockMultipleRecommendations.args = {
  ...MockExistingClient.args,
};
// Enable the NAICS suggestion feature flag
MockMultipleRecommendations.play = async () => {
  localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
};
MockMultipleRecommendations.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMockNoIndustry,
          parties: efClientCorpEBMockNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We provide custom software development services, web application development, and technology consulting to help businesses digitize their operations and improve efficiency.',
                }
              : party.organizationDetails,
          })),
        });
      }),
      http.post('/recommendations', async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 2000);
        });
        return HttpResponse.json({
          resourceType: 'NAICS_CODE',
          message: 'Recommended NAICS codes for software consulting business',
          resource: [
            {
              naicsCode: '541511',
              naicsDescription: 'Custom Computer Programming Services',
            },
            {
              naicsCode: '541512',
              naicsDescription: 'Computer Systems Design Services',
            },
            {
              naicsCode: '541519',
              naicsDescription: 'Other Computer Related Services',
            },
          ],
        });
      }),
    ],
  },
};

export const MockEmptyRecommendations = Default.bind({});
MockEmptyRecommendations.storyName = 'Empty or many recommendations';
MockEmptyRecommendations.args = {
  ...MockExistingClient.args,
};
// Enable the NAICS suggestion feature flag
MockEmptyRecommendations.play = async () => {
  localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
};
MockEmptyRecommendations.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMockNoIndustry,
          parties: efClientCorpEBMockNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We do business stuff and make money.',
                }
              : party.organizationDetails,
          })),
        });
      }),
      http.post('/recommendations', async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        // Intentionally return empty recommendations to show the warning
        return HttpResponse.json({
          resourceType: 'NAICS_CODE',
          message: 'No matching NAICS codes found for this description',
          resource: [],
        });
      }),
    ],
  },
};

export const MockRecommendation400Error = Default.bind({});
MockRecommendation400Error.storyName = 'API Error';
MockRecommendation400Error.args = {
  ...MockExistingClient.args,
};
MockRecommendation400Error.play = async () => {
  localStorage.setItem('NAICS_SUGGESTION_FEATURE_FLAG', 'true');
};
MockRecommendation400Error.parameters = {
  msw: {
    handlers: [
      http.get(`/clients/${CLIENT_ID}`, () => {
        return HttpResponse.json({
          ...efClientCorpEBMockNoIndustry,
          parties: efClientCorpEBMockNoIndustry.parties?.map((party) => ({
            ...party,
            organizationDetails: party.organizationDetails
              ? {
                  ...party.organizationDetails,
                  organizationDescription:
                    'We operate a small retail shop with in-store and online sales.',
                }
              : party.organizationDetails,
          })),
        });
      }),
      http.post('/recommendations', async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 800);
        });
        return HttpResponse.json(
          {
            title: 'Bad Request',
            httpStatus: 400,
            context: [
              {
                message:
                  'We could not process your request. Please try again or proceed with manual selection.',
              },
            ],
          },
          { status: 400 }
        );
      }),
    ],
  },
};
