import type { IndividualLegalNameValues } from '@/core/ClientProfile/models/individualLegalName.types';

export type PartyNameUpdateRequest = {
  individualDetails: Partial<IndividualLegalNameValues>;
};

export type PartyNameUpdateResult =
  | { kind: 'unchanged' }
  | {
      kind: 'unsupported-clear';
      fields: Array<keyof IndividualLegalNameValues>;
    }
  | { kind: 'changed'; request: PartyNameUpdateRequest };

const NAME_FIELDS: Array<keyof IndividualLegalNameValues> = [
  'firstName',
  'middleName',
  'lastName',
];

export function buildPartyNameUpdate(
  baselineName: IndividualLegalNameValues,
  submittedName: IndividualLegalNameValues
): PartyNameUpdateResult {
  const unsupportedClearFields = NAME_FIELDS.filter(
    (fieldName) =>
      baselineName[fieldName] !== '' && submittedName[fieldName] === ''
  );

  if (unsupportedClearFields.length > 0) {
    return { kind: 'unsupported-clear', fields: unsupportedClearFields };
  }

  const individualDetails = NAME_FIELDS.reduce<
    Partial<IndividualLegalNameValues>
  >((changedFields, fieldName) => {
    if (baselineName[fieldName] !== submittedName[fieldName]) {
      changedFields[fieldName] = submittedName[fieldName];
    }
    return changedFields;
  }, {});

  if (Object.keys(individualDetails).length === 0) {
    return { kind: 'unchanged' };
  }

  return { kind: 'changed', request: { individualDetails } };
}
