import { defineStepper } from '@stepperize/react';

export const GlobalStepper = defineStepper(
  { id: 'gateway' },
  { id: 'checklist' },
  { id: 'overview' },
  { id: 'section-stepper' },
  { id: 'owners' },
  { id: 'operational-details' },
  { id: 'review-and-attest' }
);
