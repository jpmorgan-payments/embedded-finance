import { i18n } from '@/i18n/config';
import { z } from 'zod';

export const PersonalDetailsFormSchema = z.object({
  controllerFirstName: z.string().min(1, i18n.t('common:validation.required')),
});
