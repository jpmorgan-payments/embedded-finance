import { Recipients } from '@/core/Recipients';
import { LinkedAccountWidget } from '@/core/RecipientWidgets';

import { Accounts } from '../core/Accounts';

export const componentRegistry = {
  LinkedAccountWidget,
  Recipients,
  Accounts,
};

export type ComponentRegistry = typeof componentRegistry;
