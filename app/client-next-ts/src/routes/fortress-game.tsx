import { createFileRoute } from '@tanstack/react-router';

import { FortressGameApp } from '../components/fortress-game/fortress-app';

export const Route = createFileRoute('/fortress-game')({
  component: FortressGameApp,
});
