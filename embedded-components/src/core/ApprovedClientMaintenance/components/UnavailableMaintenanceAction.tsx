import type { ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui';

type UnavailableMaintenanceActionProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
};

export function UnavailableMaintenanceAction({
  children,
  icon,
  variant = 'ghost',
  size = 'sm',
}: UnavailableMaintenanceActionProps) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="eb-inline-flex eb-cursor-not-allowed">
          <Button variant={variant} size={size} disabled>
            {icon}
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t('placeholders.unavailable')}</TooltipContent>
    </Tooltip>
  );
}
