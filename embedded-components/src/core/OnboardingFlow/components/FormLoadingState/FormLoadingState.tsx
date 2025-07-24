import { FC } from 'react';
import { Loader2Icon } from 'lucide-react';

type FormLoadingStateProps = {
  message?: string;
};

export const FormLoadingState: FC<FormLoadingStateProps> = ({ message }) => {
  return (
    <div className="eb-flex eb-h-32 eb-items-center eb-justify-center">
      <Loader2Icon
        className="eb-mr-2 eb-animate-spin eb-stroke-primary"
        size={32}
      />
      <p className="eb-text-lg">{message}</p>
    </div>
  );
};
