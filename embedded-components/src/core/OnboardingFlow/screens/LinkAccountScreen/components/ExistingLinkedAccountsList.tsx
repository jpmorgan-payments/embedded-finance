import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { RecipientCard } from '@/core/RecipientWidgets/components/RecipientCard/RecipientCard';
import { invalidateRecipientQueries } from '@/core/RecipientWidgets/utils/invalidateRecipientQueries';

type ExistingLinkedAccountsListProps = {
  accounts: Recipient[];
  displayMode: 'compact' | 'detailed';
  hideRemoval: boolean;
  showAddButton: boolean;
  onAddClick: () => void;
};

export function ExistingLinkedAccountsList({
  accounts,
  displayMode,
  hideRemoval,
  showAddButton,
  onAddClick,
}: ExistingLinkedAccountsListProps) {
  const { t } = useTranslationWithTokens([
    'onboarding-overview',
    'linked-accounts',
  ]);
  const queryClient = useQueryClient();

  if (accounts.length === 0) return null;

  return (
    <div className="eb-mb-6" data-testid="existing-linked-accounts">
      <h3 className="eb-mb-2 eb-text-sm eb-font-medium">
        {t(
          'screens.linkAccount.multiAccount.existingTitle',
          'Linked accounts ({{count}})',
          { count: accounts.length }
        )}
      </h3>
      <div className="eb-space-y-3">
        {accounts.map((recipient) => (
          <RecipientCard
            key={recipient.id}
            recipient={recipient}
            compact={displayMode === 'compact'}
            hideRemoveRecipient={hideRemoval}
            onRemoveSuccess={() => {
              invalidateRecipientQueries(queryClient, 'LINKED_ACCOUNT');
            }}
            recipientType="LINKED_ACCOUNT"
            i18nNamespace="linked-accounts"
            allowDetailedPaymentMethods={false}
          />
        ))}
      </div>
      {showAddButton && (
        <div className="eb-mt-4 eb-flex eb-items-center eb-justify-between eb-rounded-md eb-border eb-border-dashed eb-border-muted-foreground eb-p-3">
          <span className="eb-text-sm eb-font-medium">
            {t(
              'screens.linkAccount.multiAccount.addMoreTitle',
              'Link another account'
            )}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddClick}
            data-testid="add-another-account-btn"
          >
            {t('screens.linkAccount.multiAccount.addMoreButton', 'Add account')}
          </Button>
        </div>
      )}
    </div>
  );
}
