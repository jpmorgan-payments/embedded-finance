import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { Footer } from '../components/landing/footer';
import { LandingHeader } from '../components/landing/landing-header';
import { DemoNotice } from '../components/ui/demo-notice';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isSellsenseDemo = location.pathname === '/sellsense-demo';
  const isYearInReview = location.pathname === '/year-in-review';

  if (isSellsenseDemo) {
    return (
      <>
        <main>
          <Outlet />
        </main>
        <TanStackRouterDevtools />
        <DemoNotice />
      </>
    );
  }

  if (isYearInReview) {
    return (
      <>
        <main className="h-screen snap-y snap-mandatory overflow-y-scroll">
          <Outlet />
        </main>
        <TanStackRouterDevtools />
        <DemoNotice />
      </>
    );
  }

  return (
    <>
      <LandingHeader />
      <main>
        <Outlet />
      </main>
      <Footer />
      <TanStackRouterDevtools />
      <DemoNotice />
    </>
  );
}
