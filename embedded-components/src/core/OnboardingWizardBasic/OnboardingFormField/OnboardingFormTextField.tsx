import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui';
import { InfoPopover } from '@/components/ux/InfoPopover';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { useFilterFunctionsByClientContext } from '../utils/formUtils';
import { OnboardingWizardFormValues } from '../utils/types';

interface OnboardingFormTextFieldProps
  extends Omit<ComponentProps<typeof FormField>, 'render'> {
  name: keyof OnboardingWizardFormValues;
  type?: 'text' | 'email' | 'select' | 'radio-group' | 'checkbox';
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  visibility?: 'visible' | 'hidden' | 'disabled';
  data?: any;
}

interface SelectTypeProps extends OnboardingFormTextFieldProps {
  type: 'select';
  data: any;
}

export const OnboardingFormTextField: React.FC<
  OnboardingFormTextFieldProps | SelectTypeProps
> = ({
  control,
  name,
  type = 'text',
  label,
  placeholder,
  description,
  tooltip,
  required,
  visibility,
  ...props
}) => {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { isFieldDisabled, isFieldRequired, isFieldVisible } =
    useFilterFunctionsByClientContext(clientData);

  const { t } = useTranslation('onboarding');

  if (name === 'organizationName' || name === 'organizationEmail') {
    t(`fields.${name}.description`);
  }

  if (!isFieldVisible(name)) {
    return null;
  }

  return (
    <FormField
      control={control}
      name={name}
      disabled={isFieldDisabled(name)}
      render={({ field }) => {
        switch (type) {
          case 'select':
          case 'email':
          case 'radio-group':
          case 'checkbox':
          case 'text':
          default:
            return (
              <FormItem>
                <div className="eb-flex eb-items-center eb-space-x-2">
                  <FormLabel asterisk={isFieldRequired(name)}>
                    {t(
                      `fields.${name}.label` as unknown as TemplateStringsArray
                    )}
                  </FormLabel>
                  <InfoPopover>
                    {t(
                      `fields.${name}.tooltip` as unknown as TemplateStringsArray
                    )}
                  </InfoPopover>
                </div>
                <FormDescription>
                  {t(
                    `fields.${name}.description` as unknown as TemplateStringsArray
                  )}
                </FormDescription>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
        }
      }}
      {...props}
    />
  );
};
