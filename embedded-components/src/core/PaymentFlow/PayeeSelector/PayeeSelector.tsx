'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Link,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { Payee, PayeeSelectorProps } from '../PaymentFlow.types';
import { AddNewPayeeButton, PayeeListItem } from './PayeeListItem';

interface PayeeSelectorFullProps extends PayeeSelectorProps {
  recipients?: Payee[];
  linkedAccounts?: Payee[];
  isLoading?: boolean;
  // Recipients infinite scroll
  hasMoreRecipients?: boolean;
  onLoadMoreRecipients?: () => void;
  isLoadingMoreRecipients?: boolean;
  totalRecipients?: number;
  // Linked accounts infinite scroll
  hasMoreLinkedAccounts?: boolean;
  onLoadMoreLinkedAccounts?: () => void;
  isLoadingMoreLinkedAccounts?: boolean;
  totalLinkedAccounts?: number;
  // Account restriction - when true, recipients tab shows restriction message
  recipientsRestricted?: boolean;
  recipientsRestrictedMessage?: string;
  // Show warning banner when payee was cleared due to restriction
  showRestrictionWarning?: boolean;
  // Error states
  recipientsError?: boolean;
  linkedAccountsError?: boolean;
  onRetryRecipients?: () => void;
  onRetryLinkedAccounts?: () => void;
}

/**
 * PayeeSelector component
 * Tabbed interface for selecting recipients or linked accounts
 */
export function PayeeSelector({
  selectedPayeeId,
  onSelect,
  onAddNew,
  onAddRecipient,
  onLinkAccount,
  recipients = [],
  linkedAccounts = [],
  isLoading = false,
  hasMoreRecipients = false,
  onLoadMoreRecipients,
  isLoadingMoreRecipients = false,
  totalRecipients: _totalRecipients,
  hasMoreLinkedAccounts = false,
  onLoadMoreLinkedAccounts,
  isLoadingMoreLinkedAccounts = false,
  totalLinkedAccounts: _totalLinkedAccounts,
  recipientsRestricted = false,
  recipientsRestrictedMessage = 'This account type cannot send payments to external recipients. Please select a linked account instead.',
  showRestrictionWarning = false,
  recipientsError = false,
  linkedAccountsError = false,
  onRetryRecipients,
  onRetryLinkedAccounts,
}: PayeeSelectorFullProps) {
  // Default to linked-accounts tab when recipients are restricted
  const [activeTab, setActiveTab] = useState<'recipients' | 'linked-accounts'>(
    recipientsRestricted ? 'linked-accounts' : 'recipients'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const recipientsLoadMoreRef = useRef<HTMLDivElement>(null);
  const linkedAccountsLoadMoreRef = useRef<HTMLDivElement>(null);

  // Track previous recipientsRestricted value to detect changes
  const prevRecipientsRestricted = useRef(recipientsRestricted);

  // Switch to linked-accounts tab only when restriction is first applied
  useEffect(() => {
    // Only switch if recipientsRestricted changed from false to true
    if (recipientsRestricted && !prevRecipientsRestricted.current) {
      setActiveTab('linked-accounts');
    }
    prevRecipientsRestricted.current = recipientsRestricted;
  }, [recipientsRestricted]);

  // Intersection observer for recipients infinite scroll
  useEffect(() => {
    if (!hasMoreRecipients || isLoadingMoreRecipients || !onLoadMoreRecipients)
      return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRecipients();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = recipientsLoadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMoreRecipients, isLoadingMoreRecipients, onLoadMoreRecipients]);

  // Intersection observer for linked accounts infinite scroll
  useEffect(() => {
    if (
      !hasMoreLinkedAccounts ||
      isLoadingMoreLinkedAccounts ||
      !onLoadMoreLinkedAccounts
    )
      return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreLinkedAccounts();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = linkedAccountsLoadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [
    hasMoreLinkedAccounts,
    isLoadingMoreLinkedAccounts,
    onLoadMoreLinkedAccounts,
  ]);

  // When searching, keep loading more data until all is fetched
  // This ensures search results are complete
  useEffect(() => {
    if (!searchQuery.trim()) return;

    // Load more recipients if searching and there are more pages
    if (hasMoreRecipients && !isLoadingMoreRecipients && onLoadMoreRecipients) {
      onLoadMoreRecipients();
    }
  }, [
    searchQuery,
    hasMoreRecipients,
    isLoadingMoreRecipients,
    onLoadMoreRecipients,
  ]);

  useEffect(() => {
    if (!searchQuery.trim()) return;

    // Load more linked accounts if searching and there are more pages
    if (
      hasMoreLinkedAccounts &&
      !isLoadingMoreLinkedAccounts &&
      onLoadMoreLinkedAccounts
    ) {
      onLoadMoreLinkedAccounts();
    }
  }, [
    searchQuery,
    hasMoreLinkedAccounts,
    isLoadingMoreLinkedAccounts,
    onLoadMoreLinkedAccounts,
  ]);

  // Determine if we're still loading search results
  const isSearchingRecipients = !!searchQuery.trim() && hasMoreRecipients;
  const isSearchingLinkedAccounts =
    !!searchQuery.trim() && hasMoreLinkedAccounts;

  // Filter payees based on search query (client-side filtering)
  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const query = searchQuery.toLowerCase();
    return recipients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) || p.accountNumber?.includes(query)
    );
  }, [recipients, searchQuery]);

  const filteredLinkedAccounts = useMemo(() => {
    if (!searchQuery.trim()) return linkedAccounts;
    const query = searchQuery.toLowerCase();
    return linkedAccounts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) || p.accountNumber?.includes(query)
    );
  }, [linkedAccounts, searchQuery]);

  const handleAddRecipient = useCallback(() => {
    if (onAddRecipient) {
      onAddRecipient();
    } else if (onAddNew) {
      onAddNew();
    }
  }, [onAddRecipient, onAddNew]);

  const handleLinkAccount = useCallback(() => {
    if (onLinkAccount) {
      onLinkAccount();
    } else if (onAddNew) {
      onAddNew();
    }
  }, [onLinkAccount, onAddNew]);

  // Threshold for showing search bar and using fixed height scroll area
  const SHOW_SEARCH_THRESHOLD = 5;
  const showRecipientsSearch = recipients.length >= SHOW_SEARCH_THRESHOLD;
  const showLinkedAccountsSearch =
    linkedAccounts.length >= SHOW_SEARCH_THRESHOLD;

  const recipientsContent = (
    <>
      {recipientsError ? (
        <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-gap-3 eb-px-4 eb-py-6 eb-text-center">
          <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
            <AlertCircle className="eb-h-5 eb-w-5 eb-text-destructive" />
          </div>
          <div className="eb-space-y-1">
            <p className="eb-text-sm eb-font-medium eb-text-foreground">
              Unable to load recipients
            </p>
            <p className="eb-text-xs eb-text-muted-foreground">
              We couldn&apos;t load your recipients. Please try again.
            </p>
          </div>
          {onRetryRecipients && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryRecipients}
              className="eb-mt-1"
            >
              <RefreshCw className="eb-mr-2 eb-h-3 eb-w-3" />
              Retry
            </Button>
          )}
        </div>
      ) : isLoading ? (
        <div className="eb-flex eb-items-center eb-justify-center eb-py-6">
          <Loader2 className="eb-h-5 eb-w-5 eb-animate-spin eb-text-muted-foreground" />
        </div>
      ) : filteredRecipients.length === 0 && !isSearchingRecipients ? (
        <EmptyState
          type="recipients"
          hasSearch={!!searchQuery.trim()}
          searchQuery={searchQuery}
        />
      ) : (
        <ScrollArea
          className={showRecipientsSearch ? 'eb-h-[200px]' : undefined}
        >
          <div
            className={cn(
              'eb-divide-y eb-divide-border',
              showRecipientsSearch && 'eb-border-b eb-border-border'
            )}
          >
            {filteredRecipients.map((payee) => (
              <PayeeListItem
                key={payee.id}
                payee={payee}
                isSelected={payee.id === selectedPayeeId}
                onSelect={onSelect}
              />
            ))}

            {/* Show searching indicator when loading more for search */}
            {isSearchingRecipients && (
              <div className="eb-flex eb-items-center eb-justify-center eb-py-3">
                <span className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                  <Loader2 className="eb-h-3 eb-w-3 eb-animate-spin" />
                  Searching...
                </span>
              </div>
            )}

            {/* Infinite scroll sentinel (only when not searching) */}
            {hasMoreRecipients && !searchQuery.trim() && (
              <div
                ref={recipientsLoadMoreRef}
                className="eb-flex eb-items-center eb-justify-center eb-py-3"
              >
                {isLoadingMoreRecipients && (
                  <span className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                    <Loader2 className="eb-h-3 eb-w-3 eb-animate-spin" />
                    Loading more...
                  </span>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Add New - footer button */}
      <AddNewPayeeButton
        label="Add New Recipient"
        onClick={handleAddRecipient}
      />
    </>
  );

  const linkedAccountsContent = (
    <>
      {linkedAccountsError ? (
        <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-gap-3 eb-px-4 eb-py-6 eb-text-center">
          <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
            <AlertCircle className="eb-h-5 eb-w-5 eb-text-destructive" />
          </div>
          <div className="eb-space-y-1">
            <p className="eb-text-sm eb-font-medium eb-text-foreground">
              Unable to load linked accounts
            </p>
            <p className="eb-text-xs eb-text-muted-foreground">
              We couldn&apos;t load your linked accounts. Please try again.
            </p>
          </div>
          {onRetryLinkedAccounts && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryLinkedAccounts}
              className="eb-mt-1"
            >
              <RefreshCw className="eb-mr-2 eb-h-3 eb-w-3" />
              Retry
            </Button>
          )}
        </div>
      ) : isLoading ? (
        <div className="eb-flex eb-items-center eb-justify-center eb-py-6">
          <Loader2 className="eb-h-5 eb-w-5 eb-animate-spin eb-text-muted-foreground" />
        </div>
      ) : filteredLinkedAccounts.length === 0 && !isSearchingLinkedAccounts ? (
        <EmptyState
          type="linked-accounts"
          hasSearch={!!searchQuery.trim()}
          searchQuery={searchQuery}
        />
      ) : (
        <ScrollArea
          className={showLinkedAccountsSearch ? 'eb-h-[200px]' : undefined}
        >
          <div
            className={cn(
              'eb-divide-y eb-divide-border',
              showLinkedAccountsSearch && 'eb-border-b eb-border-border'
            )}
          >
            {filteredLinkedAccounts.map((payee) => (
              <PayeeListItem
                key={payee.id}
                payee={payee}
                isSelected={payee.id === selectedPayeeId}
                onSelect={onSelect}
              />
            ))}

            {/* Show searching indicator when loading more for search */}
            {isSearchingLinkedAccounts && (
              <div className="eb-flex eb-items-center eb-justify-center eb-py-3">
                <span className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                  <Loader2 className="eb-h-3 eb-w-3 eb-animate-spin" />
                  Searching...
                </span>
              </div>
            )}

            {/* Infinite scroll sentinel (only when not searching) */}
            {hasMoreLinkedAccounts && !searchQuery.trim() && (
              <div
                ref={linkedAccountsLoadMoreRef}
                className="eb-flex eb-items-center eb-justify-center eb-py-3"
              >
                {isLoadingMoreLinkedAccounts && (
                  <span className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                    <Loader2 className="eb-h-3 eb-w-3 eb-animate-spin" />
                    Loading more...
                  </span>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Add New - footer button */}
      <AddNewPayeeButton label="Link New Account" onClick={handleLinkAccount} />
    </>
  );

  return (
    <div className="eb-space-y-3">
      {/* Warning banner when payee was cleared due to account restriction */}
      {showRestrictionWarning && (
        <div
          role="alert"
          className="eb-flex eb-items-start eb-gap-2 eb-rounded-md eb-border eb-border-amber-200 eb-bg-amber-50 eb-p-3 eb-text-sm"
        >
          <AlertTriangle
            className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0 eb-text-amber-600"
            aria-hidden="true"
          />
          <div className="eb-text-amber-800">
            <span className="eb-font-medium">Recipient cleared.</span> The
            selected account type can only send payments to linked accounts.
            Please select a linked account below.
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as 'recipients' | 'linked-accounts')
        }
        className="eb-space-y-3"
      >
        <TabsList
          className="eb-h-auto eb-w-full eb-flex-col @md:eb-h-9 @md:eb-flex-row"
          aria-label="Payee type selection"
        >
          <TabsTrigger
            value="recipients"
            className={cn(
              'eb-w-full eb-gap-1.5 eb-text-sm @md:eb-flex-1',
              recipientsRestricted && 'eb-text-muted-foreground'
            )}
          >
            {recipientsRestricted ? (
              <Lock
                className="eb-h-3.5 eb-w-3.5 eb-shrink-0 eb-text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <User
                className="eb-h-3.5 eb-w-3.5 eb-shrink-0"
                aria-hidden="true"
              />
            )}
            Recipients ({recipients.length})
          </TabsTrigger>
          <TabsTrigger
            value="linked-accounts"
            className="eb-w-full eb-gap-1.5 eb-text-sm @md:eb-flex-1"
          >
            <Link
              className="eb-h-3.5 eb-w-3.5 eb-shrink-0"
              aria-hidden="true"
            />
            Linked Accounts ({linkedAccounts.length})
          </TabsTrigger>
        </TabsList>

        {/* Unified search + list container */}
        <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
          {/* Search Input - hidden when recipients restricted on recipients tab, or when fewer than 5 items */}
          {!(recipientsRestricted && activeTab === 'recipients') &&
            ((activeTab === 'recipients' && showRecipientsSearch) ||
              (activeTab === 'linked-accounts' &&
                showLinkedAccountsSearch)) && (
              <div className="eb-relative eb-border-b eb-border-border eb-bg-muted/30">
                <Search
                  className="eb-absolute eb-left-2.5 eb-top-1/2 eb-h-3.5 eb-w-3.5 eb--translate-y-1/2 eb-text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder={
                    activeTab === 'recipients'
                      ? 'Search recipients...'
                      : 'Search linked accounts...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="eb-h-9 eb-rounded-none eb-border-0 eb-bg-transparent eb-pl-8 eb-text-sm focus-visible:eb-ring-0 focus-visible:eb-ring-offset-0"
                  aria-label={
                    activeTab === 'recipients'
                      ? 'Search recipients'
                      : 'Search linked accounts'
                  }
                />
              </div>
            )}

          {/* List content */}
          <TabsContent value="recipients" className="eb-mt-0">
            {recipientsRestricted ? (
              <RestrictionMessage message={recipientsRestrictedMessage} />
            ) : (
              recipientsContent
            )}
          </TabsContent>

          <TabsContent value="linked-accounts" className="eb-mt-0">
            {linkedAccountsContent}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/**
 * RestrictionMessage component
 * Shows a message when recipients are restricted due to account type
 */
function RestrictionMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center"
    >
      <div className="eb-mb-3 eb-flex eb-h-12 eb-w-12 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
        <Lock
          className="eb-h-6 eb-w-6 eb-text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="eb-font-medium eb-text-foreground">
        Recipients Not Available
      </div>
      <div className="eb-mt-1 eb-max-w-[280px] eb-text-sm eb-text-muted-foreground">
        {message}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  type: 'recipients' | 'linked-accounts';
  hasSearch: boolean;
  searchQuery: string;
}

function EmptyState({ type, hasSearch, searchQuery }: EmptyStateProps) {
  const Icon = type === 'recipients' ? User : Link;

  if (hasSearch) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center"
      >
        <div className="eb-text-sm eb-text-muted-foreground">
          No {type === 'recipients' ? 'recipients' : 'accounts'} match &ldquo;
          {searchQuery}&rdquo;
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center"
    >
      <div className="eb-mb-3 eb-flex eb-h-12 eb-w-12 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary/10">
        <Icon className="eb-h-6 eb-w-6 eb-text-primary" aria-hidden="true" />
      </div>
      <div className="eb-font-medium">
        {type === 'recipients' ? 'No recipients yet' : 'No linked accounts'}
      </div>
      <div className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
        {type === 'recipients'
          ? 'Add a recipient to send money to people or businesses.'
          : 'Link your bank accounts for transfer of funds.'}
      </div>
    </div>
  );
}
