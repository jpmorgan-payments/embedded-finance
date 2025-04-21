import { defineStepper } from '@stepperize/react';

export const globalSteps = [
  { id: 'gateway' },
  { id: 'checklist' },
  { id: 'overview' },
  { id: 'section-stepper' },
  { id: 'owners' },
];

export const GlobalStepper = defineStepper(...globalSteps);
