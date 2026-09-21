import { z } from 'zod';

import { createFileRoute } from '@tanstack/react-router';

import { ProsperityBayApp } from '../components/prosperity-bay/prosperity-app';

const prosperityBaySearchSchema = z.object({
  chapter: z.coerce.number().int().min(1).max(6).optional(),
  t: z.coerce.number().min(0).optional(),
  pause: z.union([z.literal('1'), z.literal(1), z.boolean()]).optional(),
});

export const Route = createFileRoute('/prosperity-bay')({
  component: ProsperityBayPage,
  validateSearch: prosperityBaySearchSchema,
});

function ProsperityBayPage() {
  const { chapter, t, pause } = Route.useSearch();
  return (
    <ProsperityBayApp
      chapter={chapter}
      t={t}
      pause={pause === true || pause === '1' || pause === 1}
    />
  );
}
