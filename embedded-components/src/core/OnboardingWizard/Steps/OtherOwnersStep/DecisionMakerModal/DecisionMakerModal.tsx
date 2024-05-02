import { useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddressForm } from '@/core/OnboardingWizard/Forms/AddressForm/AddressForm';
import { PersonalDetailsForm } from '@/core/OnboardingWizard/Forms/PersonalDetailsForm/PersonalDetailsForm';

import { addOtherOwner } from '../../../context/form.actions';
import { useOnboardingForm } from '../../../context/form.context';
import { useContentData } from '../../../useContentData';
import {
  createPersonalDetailsSchema,
  PersonalDetailsValues,
} from '../../PersonalDetailsStep/PersonalDetailsStep.schema';
import { Form } from '@/components/ui/form';

const defaultInitialValues = createPersonalDetailsSchema().cast({});

type DecisionMakerModalProps = {
  index?: number;
  onOpenChange: any;
};

const DecisionMakerModal = ({
  index,
  onOpenChange,
}: DecisionMakerModalProps) => {
  const { getContentToken: getFormSchema } = useContentData(
    'schema.businessOwnerFormSchema'
  );
  const { setOnboardingForm, onboardingForm } = useOnboardingForm();
  const [defaultValues, setDefaultValues] = useState(defaultInitialValues);

  useEffect(() => {
    if (onboardingForm?.otherOwners?.length) {
      setDefaultValues(onboardingForm?.otherOwners[index]);
    }
  }, [onboardingForm]);

  const form = useForm<PersonalDetailsValues>({
    defaultValues: defaultValues,
    resolver: yupResolver(createPersonalDetailsSchema(getFormSchema)),
  });
  const onSubmit: SubmitHandler<PersonalDetailsValues> = (
    data: PersonalDetailsValues
  ) => {
    const errors = form?.formState?.errors;

    if (!Object.values(errors).length) {
      const newOnboardingForm = addOtherOwner(onboardingForm, form.getValues());
      setOnboardingForm(newOnboardingForm);
      onOpenChange(false);
    }
  };

  return (
    <DialogPortal>
      <DialogOverlay />

      <DialogContent>
        <DialogTitle>Enter decision maker details</DialogTitle>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <PersonalDetailsForm form={form} />
            <AddressForm form={form} />

            <div className="eb-mt-[25px] eb-mb-sm eb-flex eb-justify-end">
              <Button type="submit" className="eb-bg-black">
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </DialogPortal>
  );
};

export { DecisionMakerModal };