import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

import { Layout } from 'components';
import {
  AccountsPage,
  AuthenticationPage,
  CasesPage,
  DebitCardsPage,
  NotFoundErrorPage,
  OnboardingPage,
  OverviewPage,
  RecipientsPage,
  TransactionsPage,
} from 'pages';

import { themes } from 'themes';
import {
  ForgeRockCallback,
  ForgeRockProtectedRoutes,
  Login,
  SecureContent,
} from 'features/Authentication';
import { EmbeddedComponentsPage } from 'pages/EmbeddedComponentsPage';
import { OnboardingNextPage } from 'pages/OnboardingNextPage';
import { EPLinkedAccountPage } from 'pages/EPLinkedAccountsPage';
import { OnboardingNextPageV2 } from 'pages/OnboardingNextPageV2';
import { ThemeEditorPage } from 'pages/ThemeEditorPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

const App = () => {
  const [themeName, setThemeName] = useState<string>(Object.keys(themes)[0]);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={themes[themeName]}
        withGlobalStyles
        withNormalizeCSS
      >
        <ModalsProvider>
          <BrowserRouter>
            <Layout
              themeProps={{
                currentThemeName: themeName,
                themeNames: Object.keys(themes),
                setThemeName: setThemeName,
              }}
            >
              <Routes>
                <Route path="*" element={<NotFoundErrorPage />} />
                <Route element={<AuthenticationPage />}>
                  <Route path="login">
                    <Route path="" element={<Login />} />
                    <Route path="callback" element={<ForgeRockCallback />} />
                  </Route>
                  <Route element={<ForgeRockProtectedRoutes />}>
                    <Route path="loggedIn" element={<SecureContent />} />
                  </Route>
                </Route>
                <Route path="overview" element={<OverviewPage />} />
                <Route path="onboarding" element={<OnboardingPage />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="recipients" element={<RecipientsPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="debit-cards" element={<DebitCardsPage />} />
                <Route path="cases" element={<CasesPage />} />
                <Route
                  path="embedded-components"
                  element={<EmbeddedComponentsPage />}
                />
                <Route path="ep/onboarding" element={<OnboardingNextPage />} />
                <Route path="ep/onboarding-basic" element={<OnboardingNextPageV2 />} />
                <Route path="theme-editor" element={<ThemeEditorPage />} />
                <Route
                  path="ep/linked-accounts"
                  element={<EPLinkedAccountPage />}
                />
                <Route path="/" element={<Navigate replace to="/overview" />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};

export default App;
