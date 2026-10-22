import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Button } from '@/components/ui';

import { formatIdentifier, maskIdentifier } from '../utils/identifierDisplay';

export function MaintenanceIdentifierValue({
  identifier,
}: {
  identifier: { idType?: string; value?: string };
}) {
  const { tString } = useTranslationWithTokens('client-details');
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="eb-inline-flex eb-items-center eb-gap-1">
      <span className="eb-font-mono eb-tracking-wide">
        {isVisible ? formatIdentifier(identifier) : maskIdentifier(identifier)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="eb-h-6 eb-w-6"
        onClick={() => setIsVisible(!isVisible)}
        aria-label={
          isVisible
            ? tString('maskedValue.hideValue')
            : tString('maskedValue.showValue')
        }
      >
        {isVisible ? (
          <EyeOffIcon className="eb-h-3.5 eb-w-3.5" />
        ) : (
          <EyeIcon className="eb-h-3.5 eb-w-3.5" />
        )}
      </Button>
    </span>
  );
}
