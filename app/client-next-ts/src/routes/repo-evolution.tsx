import { z } from 'zod';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { RepoEvolutionApp } from '@/components/repo-evolution/repo-evolution-app';

const repoEvolutionSearchSchema = z.object({
  m: z.string().optional(),
});

export const Route = createFileRoute('/repo-evolution')({
  component: RepoEvolutionPage,
  validateSearch: repoEvolutionSearchSchema,
});

function RepoEvolutionPage() {
  const { m } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <RepoEvolutionApp
      initialMilestone={m}
      onMilestoneChange={(id) => navigate({ search: { m: id }, replace: true })}
    />
  );
}
