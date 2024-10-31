import { OrganizationType } from '@/api/generated/smbdo.schemas';

export const ORGANIZATION_TYPE_MAPPING: Record<OrganizationType, string> = {
  LIMITED_LIABILITY_COMPANY: 'Limited Liability Company',
  LIMITED_LIABILITY_PARTNERSHIP: 'Limited Liability Partnership',
  GENERAL_PARTNERSHIP: 'General Partnership',
  LIMITED_PARTNERSHIP: 'Limited Partnership',
  C_CORPORATION: 'C Corporation',
  S_CORPORATION: 'S Corporation',
  PARTNERSHIP: 'Partnership',
  PUBLICLY_TRADED_COMPANY: 'Publicly Traded Company',
  NON_PROFIT_CORPORATION: 'Non-Profit Corporation',
  GOVERNMENT_ENTITY: 'Government Entity',
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  UNINCORPORATED_ASSOCIATION: 'Unincorporated Association',
};
