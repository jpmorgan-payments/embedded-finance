import { Button } from '@/components/ui';

interface FormActionButtonsProps {
  onPrevious?: () => void;
  onNext?: (() => void) | ((values?: any) => void);
  onSubmit?: (() => void) | ((values?: any) => void);
  isLoading?: boolean;
  disablePrevious?: boolean;
  disableNext?: boolean;
  showPrevious?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  className?: string;
}

export const FormActionButtons = ({
  onPrevious,
  onNext,
  onSubmit,
  isLoading,
  disablePrevious,
  disableNext,
  showPrevious = true,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  className = 'eb-flex eb-w-full eb-justify-end eb-gap-4',
}: FormActionButtonsProps) => {
  const handleNext = onNext ?? onSubmit;

  return (
    <div className={className}>
      {showPrevious && (
        <Button
          disabled={disablePrevious || isLoading}
          variant="secondary"
          onClick={onPrevious}
        >
          {previousLabel}
        </Button>
      )}
      <Button
        disabled={disableNext || isLoading}
        onClick={handleNext}
        type={handleNext ? 'button' : 'submit'}
      >
        {nextLabel}
      </Button>
    </div>
  );
};
