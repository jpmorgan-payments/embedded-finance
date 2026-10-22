import {
  formatEIN,
  formatSSN,
} from '@/core/ClientDetails/utils/formatClientFacing';

import type { MaintenancePhone } from '../models/maintenanceApi.types';

type Identifier = { idType?: string; value?: string };

const SSN_FORMAT_TYPES = new Set(['SSN', 'ITIN']);

export const formatIdentifier = ({ idType, value }: Identifier) => {
  if (!value) return '';
  if (SSN_FORMAT_TYPES.has(idType ?? '')) return formatSSN(value) ?? value;
  if (idType === 'EIN') return formatEIN(value) ?? value;
  return value;
};

export const maskIdentifier = ({ idType, value }: Identifier) => {
  if (!value) return '';
  const lastFour = value.slice(-4);
  if (SSN_FORMAT_TYPES.has(idType ?? '')) return `***-**-${lastFour}`;
  if (idType === 'EIN') return `**-***${lastFour}`;
  return `****${lastFour}`;
};

export const formatPhone = (phone?: MaintenancePhone) =>
  phone?.phoneNumber
    ? `${phone.countryCode ?? ''} ${phone.phoneNumber}`.trim()
    : '';
