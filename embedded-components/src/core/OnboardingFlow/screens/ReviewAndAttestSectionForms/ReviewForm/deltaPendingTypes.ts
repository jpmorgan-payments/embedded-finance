/** Shared pending-field shape used by panel and inline delta review. */
export type DeltaPendingField = {
  /** Root form field key from Zod (e.g. `birthDate`, `controllerIds`, `individualAddress`) */
  fieldKey: string;
  /**
   * Full Zod issue path joined (e.g. `individualAddress.city`, `controllerIds.0.value`).
   * Used as the RHF control name when more specific than the root key.
   */
  issuePath: string;
  /** RHF path for the editable control (may be nested under `owners.{partyId}.`) */
  formPath: string;
  partyId?: string;
};

export type DeltaPendingStepGroup = {
  key: string;
  /** Compact single-line group label (section · step, or owners · name · step) */
  label: string;
  fields: DeltaPendingField[];
};
