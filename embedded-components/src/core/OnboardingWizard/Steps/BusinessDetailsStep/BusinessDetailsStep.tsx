import { FC, ReactNode, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import {
  Form
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Stack } from '@/components/ui/stack';
import { addBusinessDetails } from '../../context/form.actions';
import {
  useOnboardingForm,
} from '../../context/form.context';
import NavigationButtons from '../../Stepper/NavigationButtons';
import { useContentData } from '../../useContentData';
import {
  businessDetailsSchema,
  BusinessDetailsStepValues,
} from './BusinessDetailsStep.schema';
import { BusinessCommonForm } from '../../Forms/BusinessCommonForm/BusinessCommonForm';
import { BusinessForm } from '../../Forms/BusinessDetailsForm/BusinessDetailsForm';

type BusinessDetailsProps = {
  children?: ReactNode;
  setActiveStep: any;
  activeStep: number;
};

export const BusinessDetailsStep: FC<BusinessDetailsProps> = ({
  setActiveStep,
  activeStep,
}: any) => {
  const [selectedAccountType, setSelectedAccountType] = useState(''); // Default to individual
  const { getContentToken } = useContentData('steps.BusinessDetailsStep');
  const { setOnboardingForm, onboardingForm } = useOnboardingForm();
  const defaultInitialValues = businessDetailsSchema().cast(
    {}
  ) as BusinessDetailsStepValues;

  const form = useForm<any>({
    defaultValues: onboardingForm?.businessDetails || defaultInitialValues,
    resolver: yupResolver(businessDetailsSchema(getContentToken)),
    mode: 'onBlur',
  });

  const onSubmit = () => {
    const errors = form?.formState?.errors;
    if (Object.values(errors).length === 0 && form.formState.isSubmitted) {
      const newOnboardingForm = addBusinessDetails(
        onboardingForm,
        form.getValues()
      );
      setOnboardingForm(newOnboardingForm);
      setActiveStep(activeStep + 1);
    }
  };

  return (
    <Stack>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onChange={() => {
            setSelectedAccountType(form.getValues().legalStructure);
          }}
        >
         <BusinessForm form={form} />
          <Separator />
          <BusinessCommonForm form={form} />
          <NavigationButtons
            onSubmit={onSubmit}
            setActiveStep={setActiveStep}
            activeStep={activeStep}
          />
          {/* </ScrollArea> */}
        </form>
      </Form>
    </Stack>
  );
};
