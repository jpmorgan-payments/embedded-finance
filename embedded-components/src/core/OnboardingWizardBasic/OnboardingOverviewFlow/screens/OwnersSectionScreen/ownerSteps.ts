import { StepConfig } from '../../flow.types';
import { ContactDetailsForm } from '../PersonalSectionForms/ContactDetailsForm/ContactDetailsForm';
import { IndividualIdentityForm } from '../PersonalSectionForms/IndividualIdentityForm/IndividualIdentityForm';
import { PersonalDetailsForm } from '../PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';

export const ownerSteps: StepConfig[] = [
  {
    id: 'personal-details',
    stepType: 'form',
    title: 'Personal details',
    description:
      'We collect personal information to verify individuals for security and compliance.',
    Component: PersonalDetailsForm,
  },
  {
    id: 'identity-document',
    stepType: 'form',
    title: 'Identity document',
    description:
      'We need some additional details to verify individuals for security and compliance.',
    Component: IndividualIdentityForm,
  },
  {
    id: 'contact-details',
    stepType: 'form',
    title: 'Contact details',
    description: 'We need some additional details to confirm your identity.',
    Component: ContactDetailsForm,
  },
  {
    id: 'check-answers',
    stepType: 'check-answers',
    title: 'Check your answers',
    description:
      'Please ensure your answers are accurate and complete anything you may have missed.',
  },
];
