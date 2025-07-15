import { LinkedAccountWidget } from '@/core/LinkedAccountWidget';
import { Recipients } from '@/core/Recipients';

export const componentRegistry = {
  LinkedAccountWidget,
  Recipients,
};

export type ComponentRegistry = typeof componentRegistry;
