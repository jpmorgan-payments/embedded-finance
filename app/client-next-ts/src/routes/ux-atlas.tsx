import { z } from 'zod';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import {
  UxAtlasPage,
  type UxAtlasSearch,
} from '@/components/ux-atlas/ux-atlas-page';

const optionalString = z.string().optional().catch(undefined);

const uxAtlasSearchSchema = z.object({
  yes: optionalString,
  no: optionalString,
  unsure: optionalString,
  focus: optionalString,
});

export const Route = createFileRoute('/ux-atlas')({
  component: UxAtlasRoute,
  validateSearch: uxAtlasSearchSchema,
});

function UxAtlasRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <UxAtlasPage
      search={search}
      onSearchChange={(next: UxAtlasSearch) =>
        navigate({ search: next, replace: true, resetScroll: false })
      }
    />
  );
}
