/**
 * V3 request assembly + counterparty mapping.
 *
 * Pure functions (no React) so they can be unit tested field-by-field.
 * See SPECIFICATION.md §3.1 and §13.2.
 */
import type {
  PaymentType,
  PostTransactionRequestBaseV3,
  TransactionCounterParty,
  TransactionCounterPartyAccountRoutingInformation,
} from '@/api/generated/ep-transactions-v3.schemas';
import type {
  RoutingInformation,
  TransactionRecipientDetailsV2,
} from '@/api/generated/ep-transactions.schemas';

import type { UnsavedRecipient } from '../../PaymentFlow/PaymentFlow.types';
import type { PaymentFlowFXFormData } from '../PaymentFlowFX.types';

/** Max lengths for `paymentPurpose` fields (§3.1 / V-6). */
const PAYMENT_PURPOSE_CODE_MAX = 4;
const PAYMENT_PURPOSE_CUSTOM_CODE_MAX = 35;

/**
 * Convert the existing V2 `TransactionRecipientDetailsV2` payload (kept on
 * `UnsavedRecipient.transactionRecipient`) into a V3 `creditor` counterparty.
 *
 * One-time recipients are domestic only in v1 (D4) — this preserves the existing
 * domestic one-time payment feature under the V3 submission path.
 */
/** Map V2 `partyDetails` → V3 counterparty `partyDetails` (or `undefined` when empty). */
function mapCounterPartyDetails(
  party: NonNullable<TransactionRecipientDetailsV2['partyDetails']>
): NonNullable<TransactionCounterParty['partyDetails']> | undefined {
  const partyDetails: NonNullable<TransactionCounterParty['partyDetails']> = {};
  if (party.type) partyDetails.type = party.type;
  if (party.firstName) partyDetails.firstName = party.firstName;
  if (party.lastName) partyDetails.lastName = party.lastName;
  if (party.businessName) partyDetails.businessName = party.businessName;

  if (party.address) {
    const addr = party.address;
    partyDetails.address = {
      streetName: addr.addressLine1,
      city: addr.city,
      country: addr.countryCode,
      ...(addr.state ? { countrySubDivision: addr.state } : {}),
      ...(addr.postalCode ? { postalCode: addr.postalCode } : {}),
    };
  }

  const contacts = party.contacts ?? [];
  const email = contacts.find((c) => c.contactType === 'EMAIL')?.value;
  const phone = contacts.find((c) => c.contactType === 'PHONE')?.value;
  if (email || phone) {
    partyDetails.contacts = {
      ...(email ? { emailAddress: email } : {}),
      ...(phone ? { phoneNumber: phone } : {}),
    };
  }

  return Object.keys(partyDetails).length > 0 ? partyDetails : undefined;
}

/** Map V2 `account` → V3 counterparty `account`. */
function mapCounterPartyAccount(
  account: NonNullable<TransactionRecipientDetailsV2['account']>
): NonNullable<TransactionCounterParty['account']> {
  const routingInformation: TransactionCounterPartyAccountRoutingInformation[] =
    (account.routingInformation ?? []).map((ri: RoutingInformation) => ({
      routingNumber: ri.routingNumber,
      transactionType: ri.transactionType,
      routingCodeType: ri.routingCodeType,
    }));

  return {
    type: account.type ?? 'CHECKING',
    externalAccount: {
      number: account.number,
      ...(routingInformation.length > 0 ? { routingInformation } : {}),
      ...(account.countryCode ? { country: account.countryCode } : {}),
    },
  };
}

export function mapUnsavedRecipientToCounterParty(
  unsaved: UnsavedRecipient
): TransactionCounterParty {
  const source: TransactionRecipientDetailsV2 = unsaved.transactionRecipient;
  const counterParty: TransactionCounterParty = {};

  if (source.partyDetails) {
    const partyDetails = mapCounterPartyDetails(source.partyDetails);
    if (partyDetails) {
      counterParty.partyDetails = partyDetails;
    }
  }

  if (source.account) {
    counterParty.account = mapCounterPartyAccount(source.account);
  }

  return counterParty;
}

/** Validated `paymentPurpose`, or `undefined` if empty / invalid (V-6). */
function normalisePaymentPurpose(paymentPurpose?: {
  code?: string;
  customCode?: string;
}): PostTransactionRequestBaseV3['paymentPurpose'] | undefined {
  if (!paymentPurpose) return undefined;

  const result: { code?: string; customCode?: string } = {};

  if (paymentPurpose.code) {
    if (paymentPurpose.code.length > PAYMENT_PURPOSE_CODE_MAX) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PaymentFlowFX] paymentPurpose.code exceeds ${PAYMENT_PURPOSE_CODE_MAX} chars; dropping.`
      );
    } else {
      result.code = paymentPurpose.code;
    }
  }

  if (paymentPurpose.customCode) {
    if (paymentPurpose.customCode.length > PAYMENT_PURPOSE_CUSTOM_CODE_MAX) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PaymentFlowFX] paymentPurpose.customCode exceeds ${PAYMENT_PURPOSE_CUSTOM_CODE_MAX} chars; dropping.`
      );
    } else {
      result.customCode = paymentPurpose.customCode;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Assemble a `createTransactionV3` request body from the FX form data.
 *
 * - Amount is passed through as a **string** (never `parseFloat`, §3.1 / V-8).
 * - `debtor` derives from `fromAccountId` (REGISTERED_ACCOUNT).
 * - `creditor` derives from `payeeId` (saved) or the mapped unsaved recipient.
 * - `memo` is omitted when empty (API min length 1).
 * - FX adds `targetCurrency` (never `'USD'`) and `fxInformation.rateId` only for
 *   a locked (non-indicative) quote — an empty `fxInformation` is never sent.
 * - `paymentPurpose` passthrough (validated) from `fxConfig`.
 */
export function buildV3Request(params: {
  formData: PaymentFlowFXFormData;
  transactionReferenceId: string;
  paymentType: PaymentType;
  paymentPurpose?: { code?: string; customCode?: string };
}): PostTransactionRequestBaseV3 {
  const { formData, transactionReferenceId, paymentType, paymentPurpose } =
    params;

  const request: PostTransactionRequestBaseV3 = {
    transactionReferenceId,
    type: paymentType,
    amount: formData.amount,
    currency: 'USD',
    debtor: {
      account: {
        type: 'REGISTERED_ACCOUNT',
        registeredAccount: { id: formData.fromAccountId ?? '' },
      },
    },
    creditor: formData.unsavedRecipient
      ? mapUnsavedRecipientToCounterParty(formData.unsavedRecipient)
      : { id: formData.payeeId ?? '' },
  };

  const memo = formData.memo?.trim();
  if (memo) {
    request.memo = memo;
  }

  const { targetCurrency } = formData;
  if (targetCurrency && targetCurrency !== 'USD') {
    request.targetCurrency = targetCurrency;

    const quote = formData.fxQuote;
    if (quote && !quote.isIndicative && quote.rateId) {
      request.fxInformation = { rateId: quote.rateId };
    }
  }

  const normalisedPurpose = normalisePaymentPurpose(paymentPurpose);
  if (normalisedPurpose) {
    request.paymentPurpose = normalisedPurpose;
  }

  return request;
}
