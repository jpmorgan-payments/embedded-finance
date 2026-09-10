import type { EditablePartyPath } from './build-maintenance-projection';

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatAddress(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const address = value[0] as Record<string, unknown>;
  const addressLines = Array.isArray(address.addressLines)
    ? address.addressLines.join(', ')
    : undefined;
  return [
    addressLines,
    address.city,
    [address.state, address.postalCode].filter(Boolean).join(' '),
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatPhone(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const phone = value as Record<string, unknown>;
  const number = String(phone.phoneNumber ?? '');
  if (!number) return undefined;
  return `${String(phone.countryCode ?? '')} ••• ••• ${number.slice(-4)}`.trim();
}

function formatIdentity(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value
    .map((identity) => {
      const item = identity as Record<string, unknown>;
      return `${humanize(String(item.idType ?? 'ID'))} ending in ${String(
        item.value ?? ''
      ).slice(-4)}`;
    })
    .join(', ');
}

export function formatMaintenanceValue(
  value: unknown,
  path: EditablePartyPath,
  sensitivity: 'public' | 'masked'
): string {
  if (value === undefined || value === null || value === '') {
    return 'Not provided';
  }
  if (path.endsWith('.addresses')) {
    return formatAddress(value) ?? 'Not provided';
  }
  if (path.endsWith('.phone')) {
    return formatPhone(value) ?? 'Not provided';
  }
  if (path.endsWith('individualIds') || path.endsWith('organizationIds')) {
    return formatIdentity(value) ?? 'Not provided';
  }
  if (sensitivity === 'masked') return '••••••••';
  if (Array.isArray(value)) {
    return value.map((item) => humanize(String(item))).join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && /^[A-Z][A-Z_]+$/.test(value)) {
    return humanize(value);
  }
  return String(value);
}
