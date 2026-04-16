/**
 * Active core components (non-legacy) that ship functional requirements under
 * `embedded-components/src/core/<Component>/`.
 */
export interface CoreFunctionalRequirementDoc {
  /** Filename only; path is `embedded-components/src/core/<folder>/<file>`. */
  file: string;
  /** Short label for the link (defaults to file if omitted). */
  label?: string;
}

export interface CoreComponentRequirementsEntry {
  /** Folder name under `embedded-components/src/core/`. */
  folder: string;
  title: string;
  description: string;
  docs: CoreFunctionalRequirementDoc[];
}

export const CORE_COMPONENT_FUNCTIONAL_REQUIREMENTS: CoreComponentRequirementsEntry[] =
  [
    {
      folder: 'Accounts',
      title: 'Accounts',
      description:
        'Account management and display — balances, selection, and related UI behavior.',
      docs: [
        { file: 'FUNCTIONAL_REQUIREMENTS.md' },
        {
          file: 'ACCOUNTS_REQUIREMENTS.md',
          label: 'Accounts requirements (detailed)',
        },
      ],
    },
    {
      folder: 'ClientDetails',
      title: 'ClientDetails',
      description:
        'Party and business details presentation, drill-down, and supporting views.',
      docs: [{ file: 'FUNCTIONAL_REQUIREMENTS.md' }],
    },
    {
      folder: 'IndirectOwnership',
      title: 'IndirectOwnership',
      description:
        'Complex ownership structures, chains, and beneficial ownership flows.',
      docs: [{ file: 'FUNCTIONAL_REQUIREMENTS.md' }],
    },
    {
      folder: 'MakePayment',
      title: 'MakePayment',
      description: 'Payment amount, funding account, recipient, and submission UX.',
      docs: [
        { file: 'FUNCTIONAL_REQUIREMENTS.md' },
        {
          file: 'MAKE_PAYMENT_REQUIREMENTS.md',
          label: 'Make payment requirements (detailed)',
        },
      ],
    },
    {
      folder: 'OnboardingFlow',
      title: 'OnboardingFlow',
      description:
        'Digital onboarding wizard, steps, validation, and review flows.',
      docs: [{ file: 'FUNCTIONAL_REQUIREMENTS.md' }],
    },
    {
      folder: 'PaymentFlow',
      title: 'PaymentFlow',
      description:
        'End-to-end payment flow UI (inline and embedded), including routing and states.',
      docs: [
        { file: 'FUNCTIONAL_REQUIREMENTS.md' },
        {
          file: 'REQUIREMENTS.md',
          label: 'Payment flow requirements (overview)',
        },
      ],
    },
    {
      folder: 'RecipientWidgets',
      title: 'RecipientWidgets',
      description:
        'Recipients and linked accounts — microdeposit linking, status, and recipient management.',
      docs: [
        { file: 'FUNCTIONAL_REQUIREMENTS.md' },
        {
          file: 'LINKED_ACCOUNTS_REQUIREMENTS.md',
          label: 'Linked accounts requirements',
        },
      ],
    },
    {
      folder: 'TransactionsDisplay',
      title: 'TransactionsDisplay',
      description:
        'Transaction history, filters, details sheet, and presentation states.',
      docs: [
        { file: 'FUNCTIONAL_REQUIREMENTS.md' },
        {
          file: 'TRANSACTIONS_DISPLAY_REQUIREMENTS.md',
          label: 'Transactions display requirements (detailed)',
        },
      ],
    },
  ];
