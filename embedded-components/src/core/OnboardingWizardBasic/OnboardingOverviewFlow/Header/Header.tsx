import { FC } from 'react';

type HeaderProps = {
  title: string;
  subTitle?: string | JSX.Element;
  description?: string;
  infoText?: string;
  className?: string;
};

export const Header: FC<HeaderProps> = ({
  title,
  subTitle,
  description,
  infoText,
  className,
}) => (
  <div>
    <div className="eb-flex eb-h-6 eb-items-end eb-space-x-2 eb-text-sm">
      {subTitle}
    </div>
  </div>
);
