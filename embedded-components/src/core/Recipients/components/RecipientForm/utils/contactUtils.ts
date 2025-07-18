import type { RecipientContact } from '@/api/generated/ep-recipients.schemas';

import type { FormData } from '../RecipientForm.schema';

/**
 * Maps API contact objects to form contact objects
 */
export function mapContactsToFormData(
  contacts?: RecipientContact[]
): FormData['contacts'] {
  return (
    contacts?.map((contact) => {
      if (contact.contactType === 'PHONE') {
        return {
          contactType: 'PHONE' as const,
          value: contact.value || '',
          countryCode: contact.countryCode || '+1',
        };
      }
      if (contact.contactType === 'EMAIL') {
        return {
          contactType: 'EMAIL' as const,
          value: contact.value || '',
        };
      }
      if (contact.contactType === 'WEBSITE') {
        return {
          contactType: 'WEBSITE' as const,
          value: contact.value || '',
        };
      }
      return {
        contactType: 'EMAIL' as const,
        value: contact.value || '',
      };
    }) || []
  );
}
