import { StepType } from '../../types';
import { ContactDetailsForm } from '../PersonalSectionForms/ContactDetailsForm/ContactDetailsForm';
import { IndividualIdentityForm } from '../PersonalSectionForms/IndividualIdentityForm/IndividualIdentityForm';
import { PersonalDetailsForm } from '../PersonalSectionForms/PersonalDetailsForm/PersonalDetailsForm';

export const ownerSteps: StepType[] = [
  {
    id: 'personal-details',
    type: 'form',
    title: 'Personal details',
    description:
      'We collect your personal information as the primary person controlling business operations for the company.',
    FormComponent: PersonalDetailsForm,
  },
  {
    id: 'identity-document',
    type: 'form',
    title: 'Identity document',
    description: 'We need some additional details to confirm your identity.',
    FormComponent: IndividualIdentityForm,
  },
  {
    id: 'contact-details',
    type: 'form',
    title: 'Contact details',
    description: 'We need some additional details to confirm your identity.',
    FormComponent: ContactDetailsForm,
  },
  {
    id: 'check-answers',
    type: 'check-answers',
    title: 'Check your answers',
    description:
      'Please ensure your answers are accurate and complete anything you may have missed.',
  },
];
