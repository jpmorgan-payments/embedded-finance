'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, Loader2, Search, User } from 'lucide-react';

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
}

/**
 * PayeeSelector component
 * Tabbed interface for selecting recipients or linked accounts
 */
export function PayeeSelector({
  selectedPayeeId,
  onSelect,
  onAddNew,
  recipients = [],
  linkedAccounts = [],
  isLoading = false,
  hasMoreRecipients = false,
  onLoadMoreRecipients,
  isLoadingMoreRecipients = false,
  totalRecipients,
  hasMoreLinkedAccounts = false,
  onLoadMoreLinkedAccounts,
  isLoadingMoreLinkedAccounts = false,
  totalLinkedAccounts,
}: PayeeSelectorFullProps) {
  const [activeTab, setActiveTab] = useState<'recipients' | 'linked-accounts'>(
    'recipients'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const recipientsLoadMoreRef = useRef<HTMLDivElement>(null);
  const linkedAccountsLoadMoreRef = useRef<HTMLDivElement>(null);

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

  const handleAddNew = useCallback(() => {
    onAddNew();
  }, [onAddNew]);

  const recipientsContent = (
    <>
      {isLoading ? (
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
        <ScrollArea className="eb-h-[200px]">
          <div className="eb-divide-y eb-divide-border">
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
      <AddNewPayeeButton label="Add New Recipient" onClick={handleAddNew} />
    </>
  );

  const linkedAccountsContent = (
    <>
      {isLoading ? (
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
        <ScrollArea className="eb-h-[200px]">
          <div className="eb-divide-y eb-divide-border">
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
      <AddNewPayeeButton label="Link New Account" onClick={handleAddNew} />
    </>
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        setActiveTab(value as 'recipients' | 'linked-accounts')
      }
      className="eb-space-y-3"
    >
      <TabsList className="eb-w-full">
        <TabsTrigger value="recipients" className="eb-flex-1 eb-gap-1.5">
          <User className="eb-h-3.5 eb-w-3.5" />
          Recipients ({totalRecipients ?? recipients.length})
        </TabsTrigger>
        <TabsTrigger value="linked-accounts" className="eb-flex-1 eb-gap-1.5">
          <Link className="eb-h-3.5 eb-w-3.5" />
          Linked Accounts ({totalLinkedAccounts ?? linkedAccounts.length})
        </TabsTrigger>
      </TabsList>

      {/* Unified search + list container */}
      <div className="eb-overflow-hidden eb-rounded-lg eb-border eb-border-border">
        {/* Search Input - connected to list */}
        <div className="eb-relative eb-border-b eb-border-border eb-bg-muted/30">
          <Search className="eb-absolute eb-left-2.5 eb-top-1/2 eb-h-3.5 eb-w-3.5 eb--translate-y-1/2 eb-text-muted-foreground" />
          <Input
            placeholder={
              activeTab === 'recipients'
                ? 'Search recipients...'
                : 'Search linked accounts...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="eb-h-9 eb-rounded-none eb-border-0 eb-bg-transparent eb-pl-8 eb-text-sm focus-visible:eb-ring-0 focus-visible:eb-ring-offset-0"
          />
        </div>

        {/* List content */}
        <TabsContent value="recipients" className="eb-mt-0">
          {recipientsContent}
        </TabsContent>

        <TabsContent value="linked-accounts" className="eb-mt-0">
          {linkedAccountsContent}
        </TabsContent>
      </div>
    </Tabs>
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
      <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center">
        <div className="eb-text-sm eb-text-muted-foreground">
          No {type === 'recipients' ? 'recipients' : 'accounts'} match &ldquo;
          {searchQuery}&rdquo;
        </div>
      </div>
    );
  }

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-py-8 eb-text-center">
      <div className="eb-mb-3 eb-flex eb-h-12 eb-w-12 eb-items-center eb-justify-center eb-rounded-full eb-bg-muted">
        <Icon className="eb-h-6 eb-w-6 eb-text-muted-foreground" />
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
