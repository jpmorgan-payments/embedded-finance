import { createFileRoute } from '@tanstack/react-router';

import { YearInReviewDashboard } from '../components/year-in-review/YearInReviewDashboard';

export const Route = createFileRoute('/year-in-review')({
  component: YearInReviewPage,
});

function YearInReviewPage() {
  return <YearInReviewDashboard />;
}
