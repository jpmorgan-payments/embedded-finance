import { useCallback } from 'react';
import { z } from 'zod';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import {
  PresentationApp,
  type PresentationState,
} from '../components/partially-hosted-presentation/presentation-app';

const presentationSearchSchema = z.object({
  slide: z.string().optional(),
  step: z.coerce.number().int().min(0).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  autoplay: z.union([z.literal('1'), z.literal(1), z.boolean()]).optional(),
});

export const Route = createFileRoute('/partially-hosted-presentation')({
  component: PartiallyHostedPresentationPage,
  validateSearch: presentationSearchSchema,
});

function PartiallyHostedPresentationPage() {
  const { slide, step, theme, autoplay } = Route.useSearch();
  const navigate = useNavigate({ from: '/partially-hosted-presentation' });

  // autoplay is read but never written back, so a copied link never starts playing on its own.
  const handleStateChange = useCallback(
    (state: PresentationState) => {
      navigate({
        search: {
          slide: state.slide,
          step: state.step > 0 ? state.step : undefined,
          theme: state.theme === 'light' ? undefined : state.theme,
        },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate]
  );

  return (
    <PresentationApp
      initial={{
        slide,
        step,
        theme,
        autoplay: autoplay === true || autoplay === '1' || autoplay === 1,
      }}
      onStateChange={handleStateChange}
    />
  );
}
