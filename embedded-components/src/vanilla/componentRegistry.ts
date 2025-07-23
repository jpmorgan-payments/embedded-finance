import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';
import { Recipients } from '@/core/Recipients';

import { Accounts } from '../core/Accounts';

export const componentRegistry = {
  LinkedAccountWidget,
  Recipients,
  Accounts,
};

export type ComponentRegistry = typeof componentRegistry;
