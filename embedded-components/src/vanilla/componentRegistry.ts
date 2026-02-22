import { LinkedAccountWidget } from '@/core/RecipientWidgets';

import { Accounts } from '../core/Accounts';

export const componentRegistry = {
  LinkedAccountWidget,
  Accounts,
};

export type ComponentRegistry = typeof componentRegistry;
