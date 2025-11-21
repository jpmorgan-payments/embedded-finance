import {
  AlertCircle,
  CheckCircle,
  CircleDot,
  Clock,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type {
  Recipient,
  RecipientStatus,
} from '@/api/generated/ep-recipients.schemas';

/**
 * Formats a recipient's name based on their type
 */
export const formatRecipientName = (
  recipient: Recipient | null | undefined
): string => {
  if (!recipient || !recipient.partyDetails) {
    return 'Unknown';
  }

  if (recipient.partyDetails.type === 'INDIVIDUAL') {
    const firstName = recipient.partyDetails.firstName || '';
    const lastName = recipient.partyDetails.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unnamed Individual';
  }
  if (recipient.partyDetails.type === 'ORGANIZATION') {
    return recipient.partyDetails.businessName || 'Unnamed Organization';
  }
  return 'Unknown';
};

/**
 * Gets the appropriate color and icon for a recipient status
 */
export const getStatusColor = (status: RecipientStatus) => {
  const statusConfig: Record<
    RecipientStatus,
    { color: string; icon: LucideIcon }
  > = {
    ACTIVE: {
      color: 'eb-text-green-700 eb-bg-green-50 eb-border-green-200',
      icon: CheckCircle,
    },
    INACTIVE: {
      color: 'eb-text-gray-700 eb-bg-gray-50 eb-border-gray-200',
      icon: CircleDot,
    },
    MICRODEPOSITS_INITIATED: {
      color: 'eb-text-blue-700 eb-bg-blue-50 eb-border-blue-200',
      icon: Clock,
    },
    PENDING: {
      color: 'eb-text-orange-700 eb-bg-orange-50 eb-border-orange-200',
      icon: Clock,
    },
    READY_FOR_VALIDATION: {
      color: 'eb-text-yellow-700 eb-bg-yellow-50 eb-border-yellow-200',
      icon: AlertCircle,
    },
    REJECTED: {
      color: 'eb-text-red-700 eb-bg-red-50 eb-border-red-200',
      icon: XCircle,
    },
  };

  return statusConfig[status] ?? statusConfig.INACTIVE;
};

/**
 * Gets the status icon component for a recipient status
 */
export const getStatusIcon = (status: RecipientStatus) => {
  const { icon: Icon } = getStatusColor(status);
  return Icon;
};

/**
 * Formats a recipient's display address
 */
export const formatRecipientAddress = (recipient: Recipient): string => {
  const { address } = recipient.partyDetails;
  if (!address) return 'No address provided';

  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Formats a recipient's contact information
 */
export const formatRecipientContacts = (recipient: Recipient): string[] => {
  if (
    !recipient.partyDetails.contacts ||
    recipient.partyDetails.contacts.length === 0
  ) {
    return ['No contact information'];
  }

  return recipient.partyDetails.contacts.map((contact) => {
    switch (contact.contactType) {
      case 'EMAIL':
        return contact.value;
      case 'PHONE':
        return `${contact.countryCode || ''}${contact.value}`;
      case 'WEBSITE':
        return contact.value;
      default:
        return contact.value;
    }
  });
};

/**
 * Formats account information for display
 */
export const formatAccountInfo = (recipient: Recipient): string => {
  if (!recipient.account) return 'No account information';

  const accountNumber = recipient.account.number;
  const accountType = recipient.account.type;
  const routing = recipient.account.routingInformation?.[0];

  let result = `****${accountNumber?.slice(-4) || ''}`;

  if (accountType) {
    result += ` (${accountType})`;
  }

  if (routing) {
    result += ` • ${routing.routingCodeType}: ${routing.routingNumber}`;
  }

  return result;
};

/**
 * Determines if a recipient can be verified
 */
export const canVerifyRecipient = (recipient: Recipient): boolean => {
  return recipient.status === 'MICRODEPOSITS_INITIATED';
};

/**
 * Determines if a recipient can be edited
 */
export const canEditRecipient = (recipient: Recipient): boolean => {
  return recipient.status !== 'REJECTED';
};

/**
 * Gets a human-readable status description
 */
export const getStatusDescription = (status: RecipientStatus): string => {
  const descriptions: Record<RecipientStatus, string> = {
    ACTIVE: 'The recipient is active and ready for payments',
    INACTIVE: 'The recipient is inactive and cannot receive payments',
    MICRODEPOSITS_INITIATED: 'Microdeposits have been sent for verification',
    PENDING: 'The recipient is pending and still being processed',
    READY_FOR_VALIDATION: 'The recipient is ready for account validation',
    REJECTED: 'The recipient has been rejected and cannot be used',
  };

  return descriptions[status] ?? 'Unknown status';
};

/**
 * Validates if a recipient has required information for payments
 */
export const validateRecipientForPayments = (
  recipient: Recipient
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check basic recipient information
  if (!recipient.partyDetails) {
    errors.push('Party details are required');
  } else if (recipient.partyDetails.type === 'INDIVIDUAL') {
    if (!recipient.partyDetails.firstName)
      errors.push('First name is required');
    if (!recipient.partyDetails.lastName) errors.push('Last name is required');
  } else if (recipient.partyDetails.type === 'ORGANIZATION') {
    if (!recipient.partyDetails.businessName)
      errors.push('Business name is required');
  }

  // Check account information
  if (!recipient.account) {
    errors.push('Account information is required');
  } else {
    if (!recipient.account.number) errors.push('Account number is required');
    if (
      !recipient.account.routingInformation ||
      recipient.account.routingInformation.length === 0
    ) {
      errors.push('Routing information is required');
    }
  }

  // Check status
  if (recipient.status !== 'ACTIVE') {
    errors.push('Recipient must be active to receive payments');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Filters recipients based on search criteria
 */
export const filterRecipients = (
  recipients: Recipient[],
  searchTerm: string
): Recipient[] => {
  if (!searchTerm) return recipients;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return recipients.filter((recipient) => {
    const name = formatRecipientName(recipient).toLowerCase();
    const accountNumber = recipient.account?.number?.toLowerCase() || '';
    const businessName =
      recipient.partyDetails.businessName?.toLowerCase() || '';
    const firstName = recipient.partyDetails.firstName?.toLowerCase() || '';
    const lastName = recipient.partyDetails.lastName?.toLowerCase() || '';

    return (
      name.includes(lowerSearchTerm) ||
      accountNumber.includes(lowerSearchTerm) ||
      businessName.includes(lowerSearchTerm) ||
      firstName.includes(lowerSearchTerm) ||
      lastName.includes(lowerSearchTerm)
    );
  });
};

/**
 * Sorts recipients by a given field
 */
export const sortRecipients = (
  recipients: Recipient[],
  field: keyof Recipient,
  direction: 'asc' | 'desc' = 'asc'
): Recipient[] => {
  return [...recipients].sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];

    // Handle special cases
    if (field === 'createdAt' || field === 'updatedAt') {
      aValue = new Date(aValue as string).getTime().toString();
      bValue = new Date(bValue as string).getTime().toString();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue && bValue && aValue < bValue)
      return direction === 'asc' ? -1 : 1;
    if (aValue && bValue && aValue > bValue)
      return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Gets recipient type display name
 */
export const getRecipientTypeDisplayName = (type: string): string => {
  const typeNames = {
    RECIPIENT: 'Recipient',
    LINKED_ACCOUNT: 'Linked Account',
    SETTLEMENT_ACCOUNT: 'Settlement Account',
  };

  return typeNames[type as keyof typeof typeNames] || type;
};

/**
 * Checks if two recipients are the same
 */
export const isSameRecipient = (a: Recipient, b: Recipient): boolean => {
  return a.id === b.id;
};

/**
 * Creates a display-friendly recipient summary
 */
export const createRecipientSummary = (recipient: Recipient): string => {
  const name = formatRecipientName(recipient);
  const accountInfo = formatAccountInfo(recipient);
  const status = recipient.status || 'UNKNOWN';

  return `${name} - ${accountInfo} (${status})`;
};
