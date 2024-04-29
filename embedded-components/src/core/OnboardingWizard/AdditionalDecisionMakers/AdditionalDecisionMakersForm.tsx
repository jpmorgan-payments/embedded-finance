import { Key, useContext, useEffect, useState } from 'react';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Dialog } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Title } from '@/components/ui/title';

import NavigationButtons from '../Stepper/NavigationButtons';
import { AdditionalDecisionMakerModalForm } from './AdditionalDecisionMakersModal/AdditionalDescisionMakersModal';
import { DecisionMakerCard } from './DecisionMakerCard/DecisionMakerCard';
import { createDecisionMakerFormSchema } from '../DecisionMakersForm/DecisionMakerForm.schema';
import { useContentData } from '../useContentData';
import { OnboardingFormContext } from '../context/form.context';


type AdditionalDecisionMakersFormType = {
  setActiveStep: any;
  activeStep: any;
};

const AdditionalDecisionMakersForm = ({
  setActiveStep,
  activeStep,
}: AdditionalDecisionMakersFormType) => {

  const {onboardingForm, setOnboardingForm} = useContext(OnboardingFormContext)

  const [additionalDecisionMakers, setAdditionalDecisionmakers] =
    useState(false);

  const { getContentToken: getFormSchema } = useContentData(
    'schema.businessOwnerFormSchema'
  );
  const form = useForm<any>({
    resolver: yupResolver(createDecisionMakerFormSchema(getFormSchema)),
  });


  const handleToggleButton = (val) => {
    if (val === 'No') setAdditionalDecisionmakers(false);
    if (val === 'Yes') setAdditionalDecisionmakers(true);
  };

  const onSubmit = () => {
    const errors = form?.formState?.errors;
    if (Object.values(errors).length === 0 && form.formState.isSubmitted)
      setActiveStep(activeStep + 1);
  };

  useEffect(() => {
console.log(onboardingForm)
  },[onboardingForm])


  return (
    <div className="eb-grid eb-grid-row-3">
      <Title as="h3">Additional Decision Makers</Title>

      <Form {...form}>
        <form>
          <FormField
            control={form.control}
            name="additonalDecisionMakers"
            render={() => (
              <FormItem>
                <FormLabel asterisk>
                  Are there any general partners or managing members within in
                  your business who can make decisions on behalf of your company
                  that we have not already captured in the business details?
                </FormLabel>

                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => handleToggleButton(value)}
                    defaultValue="No"
                    className="eb-flex eb-flex-col eb-space-y-1"
                  >
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <RadioGroupItem value="Yes" />

                      <FormLabel className="eb-font-normal">Yes</FormLabel>
                    </FormItem>
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <RadioGroupItem value="No" />

                      <FormLabel className="eb-font-normal">No</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          {additionalDecisionMakers && (
            <>
              <Title as="h4">Listed business decision makers</Title>

              <div className="eb-grid eb-grid-cols-3">
                {onboardingForm?.owners?.map((individual: any, index: Key) => (
                  <div
                    key={index}
                    className="eb-grid-cols-subgrid eb-grid-cols-2"
                  >
                    <DecisionMakerCard
                      individual={individual}
                      key={index}
                    ></DecisionMakerCard>
                  </div>
                ))}
                <Dialog>
                  <div className="eb-bg-black eb-w-24 eb-h-20 eb-text-white eb-rounded-md ">
                  <DialogTrigger >
                    Click to add a decision maker
                  </DialogTrigger >
                  </div>
                  <AdditionalDecisionMakerModalForm form={form} />
                </Dialog>
              </div>
            </>
          )}
          <NavigationButtons
            setActiveStep={setActiveStep}
            activeStep={activeStep}
            onSubmit={onSubmit}
          />
        </form>
      </Form>
    </div>
  );
};

export { AdditionalDecisionMakersForm };
