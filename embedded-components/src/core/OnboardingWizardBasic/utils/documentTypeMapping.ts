import { DocumentTypeSmbdo } from '@/api/generated/smbdo.schemas';

export const DOCUMENT_TYPE_MAPPING: Record<
  DocumentTypeSmbdo,
  { label: string; description: string }
> = {
  ANNUAL_FILINGS: { label: 'Annual Filings', description: '' },
  ARTICLES_OF_ASSOCIATION: {
    label: 'Articles Of Association',
    description: '',
  },
  ARTICLES_OF_INCORPORATION: {
    label: 'Articles Of Incorporation',
    description:
      'Official document filed with the state that formally establishes your corporation',
  },
  BANK_STATEMENT: {
    label: 'Bank Statement',
    description: 'From last 3 months',
  },
  BANKING_LICENSE: { label: 'Banking License', description: '' },
  BEARER_SHARES_ATTESTATION: {
    label: 'Bearer Shares Attestation',
    description: '',
  },
  BENEFICIAL_OWNER_INFORMATION: {
    label: 'Beneficial Owner Information',
    description: '',
  },
  BRAND_LOGO: { label: 'Brand Logo', description: '' },
  BUSINESS_LICENSE: {
    label: 'Business License',
    description: 'Current business license issued by your local government',
  },
  BUSINESS_REGISTRATION_CERT: {
    label: 'Business Registration Certificate',
    description:
      'Official certificate confirming your business registration with the appropriate government agency',
  },
  CERTIFICATE_OF_GOOD_STANDING: {
    label: 'Certificate Of Good Standing',
    description:
      'Document issued by a government agency confirming your business is in good standing',
  },
  CERTIFICATE_OF_STATUS: { label: 'Certificate Of Status', description: '' },
  COMMERCIAL_REGISTRY: { label: 'Commercial Registry', description: '' },
  CONSTITUTIONAL_DOCUMENT: {
    label: 'Constitutional Document',
    description: '',
  },
  CREDIT_CARD_STATEMENT: {
    label: 'Credit Card Statement',
    description: 'Dated within the past 6 months',
  },
  DETAILS_OF_DIRECTORS: { label: 'Details Of Directors', description: '' },
  DISCLOSURE_AND_CONSENT: { label: 'Disclosure And Consent', description: '' },
  DRIVERS_LICENSE: {
    label: 'Drivers License',
    description: 'Include front and back',
  },
  EIN: {
    label: 'EIN Document',
    description:
      'IRS-issued letter confirming your Employer Identification Number',
  },
  EVIDENCE: { label: 'Evidence', description: '' },
  FILING_RECEIPT: { label: 'Filing Receipt', description: '' },
  GOV_ISSUED_ID_CARD: { label: 'Government Issued ID Card', description: '' },
  GOVERNMENT_REGISTERED_DOCUMENT: {
    label: 'Government Registered Document',
    description: '',
  },
  IDENTIFICATION_DOCUMENT: {
    label: 'Identification Document',
    description: '',
  },
  INCUMBENCY_CERTIFICATE: {
    label: 'Certificate of Incumbency',
    description: '',
  },
  INSURANCE_DOCUMENT: {
    label: 'Insurance Document',
    description: 'Dated within the past',
  },
  IRS_DOCUMENT_TIN: { label: 'IRS Document TIN', description: '' },
  JPMC_DISCLOSURE: { label: 'JPMC Disclosure', description: '' },
  LEGAL_DOCUMENTS: { label: 'Legal Documents', description: '' },
  LLC_AGREEMENT: { label: 'LLC Agreement', description: '' },
  LOAN_ACCOUNT_STATEMENT: {
    label: 'Loan Account Statement',
    description: 'Dated within the past',
  },
  MAA: { label: 'MAA', description: '' },
  MOA: { label: 'MOA', description: '' },
  OFFERING_MEMO: { label: 'Offering Memo', description: '' },
  OPERATING_AGREEMENT: {
    label: 'Operating Agreement',
    description:
      'Document outlining the ownership and operating procedures of your business',
  },
  OTHER_GOV_REGISTRATION_DOCS: {
    label: 'Other Gov Registration Docs',
    description: '',
  },
  OWNERSHIP_ATTESTATION: {
    label: 'Ownership Attestation',
    description: '',
  },
  PARTNERSHIP_AGREEMENT: { label: 'Partnership Agreement', description: '' },
  PASSPORT: { label: 'Passport', description: 'Photo page' },
  SEC_FILINGS_10K: { label: 'SEC Filings 10K', description: '' },
  SIGNATURE_CARD: { label: 'Signature Card', description: '' },
  SSN_CARD: { label: 'SSN Card', description: '' },
  STANDARD_OPERATING_PROCEDURE: {
    label: 'Standard Operating Procedure',
    description: '',
  },
  SUPPORT_CONTACT: { label: 'Support Contact', description: '' },
  TAX_DOCUMENT: {
    label: 'Tax Document',
    description:
      'Recent tax filing or other tax-related documentation for your business',
  },
  TERMS_CONDITIONS: { label: 'Terms and Conditions', description: '' },
  TRUST_AGREEMENT: { label: 'Trust Agreement', description: '' },
  TRUST_DEED: { label: 'Trust Deed', description: '' },
  UTILITY_BILL: {
    label: 'Utility Bill',
    description:
      'Dated within the past 3 months, showing your business address',
  },
  BULK_MIGRATION: { label: 'Bulk Migration', description: '' },
};
