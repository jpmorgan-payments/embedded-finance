import { User } from 'tabler-icons-react';

import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui';

import { DecisionMakerModal } from '../DecisionMakerModal/DecisionMakerModal';

type DecisionMakersCardProps = {
  individual: any;
  key?: any;
  controller: boolean;
};

const fieldsController = (individual: any) => {
  return [
    { des: 'Title', var: individual?.individualDetails?.jobTitle },
    { des: 'Email', var: individual?.email },
    { des: 'SSN', var: individual?.individualDetails?.individualIds[0]?.value },
  ];
};

const fieldsOther = (individual: any) => {
  return [
    { des: 'Title', var: individual?.individualDetails?.jobTitle },
    { des: 'Email', var: individual?.email },
    { des: 'Phone', var: individual?.phone },
  ];
};

const DecisionMakerCard = ({
  individual,
  key,
  controller,
}: DecisionMakersCardProps) => {
  const fields = controller
    ? fieldsController(individual)
    : fieldsOther(individual);

  return (
    <Dialog>
      <div className="eb-w-80">
        <Card>
          <CardContent
            className={`${controller && 'eb-bg-black/10'} eb-h-60 eb-rounded-md eb-content-center eb-flex`}
          >
            <div className="eb-grid  eb-grid-flow-row-dense eb-grid-cols-3 eb-content-center eb-justify-center eb-flex">
              <div className="eb-col eb-gap-2 eb-content-center">
                <div className="eb-flex eb-mb-3 eb-w-12 eb-h-12 eb-place-content-center eb-justify-center eb-rounded-full eb-border-2 eb-border-secondary/90 eb-justify-items-center eb-justify-center eb-place-content-center eb-items-center">
                  <User key="userIcon" size={20} color="black"></User>
                </div>
                <div>
                  {fields?.map((fieldVal) => (
                    <div key={fieldVal.des}>
                      <Text className="eb-font-bold eb-text-sm">
                        {fieldVal?.des}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
              <div className="eb-gap-2 eb-content-center">
                <div className="eb-mb-3">
                  {individual?.firstName} {individual?.lastName}
                </div>

                <div>
                  {fields?.map((fieldVal) => (
                    <div key={fieldVal.var}>
                      <Text className="eb-text-sm">
                        {fieldVal?.var ? fieldVal?.var : 'N/A'}
                      </Text>
                    </div>
                  ))}
                </div>
                <div>
                  {controller ? (
                    <Text className="eb-text-sm eb-w-max">View/edit details in prior step</Text>
                  ) : (
                    <DialogTrigger>
                      <Button type="button" variant="outline">
                        View/Edit Details
                      </Button>
                    </DialogTrigger>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
     <DecisionMakerModal index={key} onOpenChange={() => {}} /> 
      </div>
    </Dialog>
  );
};
export { DecisionMakerCard };
