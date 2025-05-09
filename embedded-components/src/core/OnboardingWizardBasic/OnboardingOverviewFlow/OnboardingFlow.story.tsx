/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import type { Meta, StoryFn } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { useDarkMode } from 'storybook-dark-mode';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { EBConfig } from '@/core/EBComponentsProvider/config.types';

import { ORGANIZATION_TYPE_LIST } from '../utils/organizationTypeList';
import { handlers } from './msw.handlers';
import { OnboardingFlow, OnboardingFlowProps } from './OnboardingFlow';

export type OnboardingWizardBasicWithProviderProps = OnboardingFlowProps &
  EBConfig;

const meta: Meta<OnboardingWizardBasicWithProviderProps> = {
  title: 'Onboarding Overview Flow / Appearance & Theme',
  component: OnboardingFlow,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers,
    },
  },
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
    onPostPartyResponse: { table: { disable: true } },
    onPostClientVerificationsResponse: { table: { disable: true } },
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

const Template: StoryFn<OnboardingWizardBasicWithProviderProps> = (args) => {
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return <OnboardingFlow height={`${containerHeight}px`} {...args} />;
};

export const Default = Template.bind({});
Default.storyName = 'Default Theme';
Default.args = {
  initialClientId: '',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
  headers: {
    api_gateway_client_id: import.meta.env.VITE_API_GATEWAY_CLIENT_ID ?? 'test',
  },
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  availableOrganizationTypes: [
    'SOLE_PROPRIETORSHIP',
    'LIMITED_LIABILITY_COMPANY',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'GENERAL_PARTNERSHIP',
    'LIMITED_PARTNERSHIP',
    'C_CORPORATION',
    // 'S_CORPORATION',
    // not allowed:
    // 'PARTNERSHIP',
    // 'PUBLICLY_TRADED_COMPANY',
    // 'NON_PROFIT_CORPORATION',
    // 'GOVERNMENT_ENTITY',
    // 'UNINCORPORATED_ASSOCIATION',
  ],
  theme: {
    variables: {},
  },
  contentTokens: {
    name: 'enUS',
  },
  alertOnExit: false,
};

export const STheme = Default.bind({});
STheme.storyName = 'S Theme';
STheme.args = {
  ...Default.args,
  theme: {
    variables: {
      fontFamily: 'Open Sans',
      headerFontFamily: 'Amplitude',
      backgroundColor: '#f6f7f8',
      inputColor: '#FFFFFF',
      inputBorderColor: '#0000004D',
      borderColor: '#0000004D',
      borderRadius: '6px',
      inputBorderRadius: '4px',
      buttonBorderRadius: '8px',
      buttonFontFamily: 'Amplitude',
      buttonTextTransform: 'uppercase',
      buttonLetterSpacing: '0.6px',
      primaryColor: '#1B7F9E',
      secondaryColor: 'white',
      secondaryForegroundColor: '#1B7F9E',
      secondaryBorderWidth: '1px',
    },
  },
};

export const SThemeWithMock = Default.bind({});
SThemeWithMock.storyName = 'Mocked New Client';
SThemeWithMock.args = {
  ...STheme.args,
  apiBaseUrl: '',
  headers: {
    api_gateway_client_id: 'test',
  },
};

export const MockExistingClient = Default.bind({});
MockExistingClient.storyName = 'Mocked Existing LLC Client';
MockExistingClient.args = {
  ...SThemeWithMock.args,
  initialClientId: '0030000132',
};

export const MockDocumentsRequested = Default.bind({});
MockDocumentsRequested.storyName = 'Mocked Documents Requested';
MockDocumentsRequested.args = {
  ...SThemeWithMock.args,
  initialClientId: '0030000133',
};
MockDocumentsRequested.parameters = {
  msw: {
    handlers: [
      http.get('/clients/0030000133', () => {
        return HttpResponse.json({
          ...efClientCorpEBMock,
          status: 'INFORMATION_REQUESTED',
        });
      }),
      http.get('/document-requests/68805', () => {
        return HttpResponse.json({
          ...efDocumentRequestDetails,
          partyId: '2000000112',
        });
      }),
      http.get('/document-requests/68804', () => {
        return HttpResponse.json({
          ...efDocumentRequestDetails,
          partyId: '2000000113',
        });
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
      http.post('/document-requests/:requestId/submit', ({ params }) => {
        console.log(
          `Document request ${params.requestId} submitted successfully`
        );
        return new HttpResponse(
          JSON.stringify({
            acceptedAt: new Date().toISOString(),
          }),
          {
            status: 202,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }),
    ],
  },
};
