export { RecipientForm } from './RecipientForm';
export type { RecipientFormProps, FormData } from './RecipientForm.types';
export {
  recipientFormSchema,
  getConditionalSchema,
} from './RecipientForm.schema';

// Export individual sections
export { PaymentMethodsSection } from './PaymentMethodsSection';
export { PersonalDetailsSection } from './PersonalDetailsSection';
export { AccountDetailsSection } from './AccountDetailsSection';
export { RoutingNumbersSection } from './RoutingNumbersSection';
export { AddressSection } from './AddressSection';
export { ContactsSection } from './ContactsSection';

// Export section types
export type {
  PaymentMethodsSectionProps,
  PersonalDetailsSectionProps,
  AccountDetailsSectionProps,
  RoutingNumbersSectionProps,
  AddressSectionProps,
  ContactsSectionProps,
  FormSectionProps,
} from './RecipientForm.types';
