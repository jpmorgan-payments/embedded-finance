import { FC } from 'react';
import { Loader2Icon } from 'lucide-react';

type StepLayoutProps = {
  title: string | JSX.Element;
  showSpinner?: boolean;
  subTitle?: string | JSX.Element;
  description?: string;
  children?: React.ReactNode;
};

export const StepLayout: FC<StepLayoutProps> = ({
  title,
  showSpinner,
  subTitle,
  description,
  children,
}) => (
  <div className="eb-flex eb-min-h-full eb-flex-auto eb-flex-col">
    <div className="eb-space-y-3">
      {typeof subTitle === 'string' ? (
        <div className="eb-flex eb-h-6 eb-w-full eb-items-end eb-text-sm">
          {subTitle}
        </div>
      ) : (
        subTitle
      )}

      <div className="eb-flex eb-items-center eb-gap-3">
        <h1 className="eb-w-full eb-font-header eb-text-3xl eb-font-medium">
          {title}
        </h1>
        {showSpinner && (
          <Loader2Icon className="eb-animate-spin eb-stroke-primary" />
        )}
      </div>

      {description && (
        <p className="eb-text-sm eb-font-normal">{description}</p>
      )}
    </div>
    {children}
  </div>
);
