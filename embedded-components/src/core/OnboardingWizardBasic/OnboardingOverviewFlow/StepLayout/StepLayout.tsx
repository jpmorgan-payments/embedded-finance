import { FC } from 'react';

type StepLayoutProps = {
  title: string;
  subTitle?: string | JSX.Element;
  description?: string;
  children?: React.ReactNode;
};

export const StepLayout: FC<StepLayoutProps> = ({
  title,
  subTitle,
  description,
  children,
}) => (
  <div className="eb-flex eb-min-h-full eb-flex-col eb-space-y-6">
    <div className="eb-flex eb-flex-col eb-gap-y-1.5">
      {subTitle && (
        <div className="eb-flex eb-h-6 eb-items-end eb-text-sm">{subTitle}</div>
      )}

      <h1 className="eb-font-header eb-text-3xl eb-font-medium">{title}</h1>

      {description && (
        <p className="eb-text-sm eb-font-semibold">{description}</p>
      )}
    </div>
    {children}
  </div>
);
