import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { FormField } from '@/components/ui';

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

type SelectTypeProps = {
  type: 'select';
  data: any;
};

type NonSelectTypeProps = Omit<OnboardingFormTextFieldProps, 'data'>;

export type OnboardingFormTextFieldProps = SelectTypeProps | NonSelectTypeProps;

export const OnboardingFormTextField: React.FC<
  OnboardingFormTextFieldProps
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

  t(`fields.${name}.label` as unknown as TemplateStringsArray);

  if (!isFieldVisible(name)) {
    return null;
  }

  return (
    <FormField
      control={control}
      name={name}
      {...props}
      render={(field) => null}
    />
  );
};
