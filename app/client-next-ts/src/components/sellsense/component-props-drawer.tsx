'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  FormInput,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import {
  buildOnboardingFlowConfigExport,
  clearConfigProp,
  countConfiguredProps,
  HOSTED_PLATFORM_SAMPLE,
  isPropConfigured,
  mergeOnboardingFlowConfig,
  ONBOARDING_PROP_FIELDS,
  parseOnboardingFlowConfigImport,
  PROP_FIELD_GROUPS,
  SELLSENSE_ONBOARDING_BASELINE,
  setConfigProp,
  type OnboardingFlowConfigKey,
  type OnboardingFlowConfigProps,
  type PropFieldDescriptor,
} from './onboarding-flow-props-config';

interface ComponentPropsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  overrides: OnboardingFlowConfigProps;
  onOverridesChange: (overrides: OnboardingFlowConfigProps) => void;
  /** Scenario-only extras (e.g. linkAccountStepOptions for review scenarios) — display only. */
  scenarioExtras?: OnboardingFlowConfigProps;
  isOnboardingView: boolean;
  /** CSS top offset so the drawer sits below the header (and MSW banner), like Content Tokens. */
  topOffset?: string;
}

type EditorMode = 'form' | 'json';

type DisclosureConfigValue = NonNullable<
  OnboardingFlowConfigProps['disclosureConfig']
>;

type AcknowledgementRow = NonNullable<
  OnboardingFlowConfigProps['reviewAttestTermsAcknowledgements']
>[number];

const COMMON_ACK_LABEL_KEYS = [
  'reviewAndAttest.termsAndConditions.agreeToTerms',
  'reviewAndAttest.termsAndConditions.agreeToTermsWithPlatform',
  'reviewAndAttest.attestation.authorizeSharing',
  'reviewAndAttest.attestation.accurateInfo',
] as const;

function MultiSelectChips({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const selected = new Set(value ?? []);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.has(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              active
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            onClick={() => {
              const next = new Set(selected);
              if (active) next.delete(opt.value);
              else next.add(opt.value);
              onChange(Array.from(next));
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
          mode === 'form'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange('form')}
      >
        <FormInput className="h-3 w-3" />
        Form
      </button>
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
          mode === 'json'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => onChange('json')}
      >
        <Code2 className="h-3 w-3" />
        JSON
      </button>
    </div>
  );
}

function JsonPropEditor({
  value,
  onChange,
  placeholder,
  minHeightClass = 'min-h-[6rem]',
}: {
  value: unknown;
  onChange: (next: unknown) => void;
  placeholder?: string;
  minHeightClass?: string;
}) {
  const [text, setText] = useState(() =>
    value === undefined ? '' : JSON.stringify(value, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(value === undefined ? '' : JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  return (
    <div className="space-y-1">
      <textarea
        className={`${minHeightClass} w-full resize-y rounded-md border border-gray-300 bg-white p-2 font-mono text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400`}
        value={text}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (!next.trim()) {
            setError(null);
            onChange(undefined);
            return;
          }
          try {
            onChange(JSON.parse(next));
            setError(null);
          } catch {
            setError('Invalid JSON');
          }
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function FieldShell({
  field,
  configured,
  onClear,
  modeToggle,
  children,
}: {
  field: PropFieldDescriptor;
  configured: boolean;
  onClear: () => void;
  modeToggle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`space-y-2 rounded-md border p-3 ${
        configured
          ? 'border-amber-200 bg-amber-50/40'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-medium text-gray-900">
              {field.label}
            </Label>
            {configured && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                configured
              </span>
            )}
            {modeToggle}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{field.description}</p>
          <p className="mt-0.5 font-mono text-[10px] text-gray-400">
            {field.key}
          </p>
        </div>
        {configured && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-gray-500"
            onClick={onClear}
            title="Clear override (use baseline)"
          >
            Clear
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function DisclosureConfigForm({
  value,
  onChange,
}: {
  value: DisclosureConfigValue | undefined;
  onChange: (next: DisclosureConfigValue | undefined) => void;
}) {
  const current: DisclosureConfigValue = value ?? { platformName: '' };

  const update = (patch: Partial<DisclosureConfigValue>) => {
    const next: DisclosureConfigValue = {
      ...current,
      ...patch,
    };
    // Drop empty optional strings
    if (!next.productName?.trim()) delete next.productName;
    if (!next.platformAgreementUrl?.trim()) delete next.platformAgreementUrl;
    if (!next.platformAgreementLabel?.trim())
      delete next.platformAgreementLabel;

    if (!next.platformName.trim()) {
      // Keep object if other fields exist; otherwise clear
      if (
        next.productName ||
        next.platformAgreementUrl ||
        next.platformAgreementLabel
      ) {
        onChange(next);
      } else {
        onChange(undefined);
      }
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">Platform name *</Label>
        <Input
          className="h-8 text-sm"
          value={current.platformName}
          placeholder="Platform, Inc."
          onChange={(e) => update({ platformName: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">Product name</Label>
        <Input
          className="h-8 text-sm"
          value={current.productName ?? ''}
          placeholder="Accounts"
          onChange={(e) => update({ productName: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">Platform agreement URL</Label>
        <Input
          className="h-8 text-sm"
          value={current.platformAgreementUrl ?? ''}
          placeholder="https://…"
          onChange={(e) => update({ platformAgreementUrl: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">
          Platform agreement label
        </Label>
        <Input
          className="h-8 text-sm"
          value={current.platformAgreementLabel ?? ''}
          placeholder="Platform, Inc. Program Agreement"
          onChange={(e) => update({ platformAgreementLabel: e.target.value })}
        />
      </div>
    </div>
  );
}

function LinkHrefsEditor({
  value,
  onChange,
}: {
  value: Record<string, string> | undefined;
  onChange: (next: Record<string, string> | undefined) => void;
}) {
  const entries = Object.entries(value ?? {});

  const setEntries = (nextEntries: Array<[string, string]>) => {
    const filtered = nextEntries.filter(([k]) => k.trim().length > 0);
    if (filtered.length === 0) {
      onChange(undefined);
      return;
    }
    onChange(Object.fromEntries(filtered));
  };

  return (
    <div className="space-y-2 rounded border border-dashed border-gray-200 bg-white/70 p-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-gray-500">
          Link hrefs (tag → URL)
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-[11px]"
          onClick={() => setEntries([...entries, ['', '']])}
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      {entries.length === 0 && (
        <p className="text-[11px] text-gray-400">
          Optional — maps Trans tag names to absolute URLs.
        </p>
      )}
      {entries.map(([tag, url], index) => (
        <div key={index} className="flex items-center gap-1.5">
          <Input
            className="h-7 flex-1 font-mono text-xs"
            placeholder="tagName"
            value={tag}
            onChange={(e) => {
              const next = [...entries] as Array<[string, string]>;
              next[index] = [e.target.value, url];
              setEntries(next);
            }}
          />
          <Input
            className="h-7 flex-[2] font-mono text-xs"
            placeholder="https://…"
            value={url}
            onChange={(e) => {
              const next = [...entries] as Array<[string, string]>;
              next[index] = [tag, e.target.value];
              setEntries(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600"
            onClick={() => setEntries(entries.filter((_, i) => i !== index))}
            aria-label="Remove link href"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function AcknowledgementsForm({
  value,
  onChange,
  emptyHint = 'No custom acknowledgements — the component uses its default terms UI. Add rows to replace the built-in checkboxes.',
  addLabel = 'Add acknowledgement',
  commonLabelKeys = COMMON_ACK_LABEL_KEYS,
  idPrefix = 'ack',
}: {
  value: AcknowledgementRow[] | undefined;
  onChange: (next: AcknowledgementRow[] | undefined) => void;
  emptyHint?: string;
  addLabel?: string;
  commonLabelKeys?: readonly string[];
  idPrefix?: string;
}) {
  const rows = value ?? [];

  const updateRow = (index: number, patch: Partial<AcknowledgementRow>) => {
    const next = rows.map((row, i) => {
      if (i !== index) return row;
      const merged: AcknowledgementRow = { ...row, ...patch };
      if (!merged.linkHrefs || Object.keys(merged.linkHrefs).length === 0) {
        const { linkHrefs: _omit, ...rest } = merged;
        return rest;
      }
      return merged;
    });
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...rows,
      {
        id: `${idPrefix}-${rows.length + 1}`,
        labelKey: commonLabelKeys[0] ?? '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length === 0 ? undefined : next);
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500">{emptyHint}</p>
      )}
      {rows.map((row, index) => (
        <div
          key={`${row.id}-${index}`}
          className="space-y-2 rounded-md border border-gray-200 bg-white p-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-700">
              Acknowledgement {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-1.5 text-[11px] text-red-600 hover:text-red-700"
              onClick={() => removeRow(index)}
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">id</Label>
            <Input
              className="h-8 font-mono text-sm"
              value={row.id}
              onChange={(e) => updateRow(index, { id: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">labelKey</Label>
            <Input
              className="h-8 font-mono text-sm"
              list={`${idPrefix}-label-keys-${index}`}
              value={row.labelKey}
              onChange={(e) => updateRow(index, { labelKey: e.target.value })}
            />
            <datalist id={`${idPrefix}-label-keys-${index}`}>
              {commonLabelKeys.map((key) => (
                <option key={key} value={key} />
              ))}
            </datalist>
          </div>
          <LinkHrefsEditor
            value={row.linkHrefs}
            onChange={(linkHrefs) => updateRow(index, { linkHrefs })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-full gap-1.5 text-xs"
        onClick={addRow}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

type LinkAccountStepOptionsValue = {
  initialValues?: Record<string, unknown>;
  completionMode?: 'editable' | 'reviewOnly' | 'prefillSummary';
  reviewAcknowledgements?: AcknowledgementRow[];
  summaryDisplayedPaymentTypes?: string[];
  showAcknowledgementsIntro?: boolean;
  bankFormConfigOverride?: Record<string, unknown>;
  partyId?: string;
  presetAccounts?: unknown[];
  allowMultipleAccounts?: boolean;
  existingAccountsDisplay?: 'compact' | 'detailed';
};

const PAYMENT_TYPE_OPTIONS = [
  { value: 'ACH', label: 'ACH' },
  { value: 'WIRE', label: 'WIRE' },
  { value: 'RTP', label: 'RTP' },
] as const;

const COMPLETION_MODE_OPTIONS = [
  { value: 'editable', label: 'editable' },
  { value: 'reviewOnly', label: 'reviewOnly' },
  { value: 'prefillSummary', label: 'prefillSummary (alias)' },
] as const;

const COMMON_LINK_ACCOUNT_ACK_LABEL_KEYS = [
  'screens.linkAccount.prefillSummary.acknowledgements.businessPurpose',
  'screens.linkAccount.review.acknowledgements.termsAndPolicies',
  'screens.linkAccount.review.acknowledgements.payoutAccountAttestation',
] as const;

function SelectChips({
  options,
  value,
  onChange,
  allowEmpty = true,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              active
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            onClick={() => {
              if (active && allowEmpty) onChange(undefined);
              else onChange(opt.value);
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RoutingNumbersEditor({
  value,
  onChange,
}: {
  value: Array<{ paymentType?: string; routingNumber?: string }> | undefined;
  onChange: (
    next: Array<{ paymentType: string; routingNumber: string }> | undefined
  ) => void;
}) {
  const rows = value ?? [];

  const setRows = (
    next: Array<{ paymentType: string; routingNumber: string }>
  ) => {
    const cleaned = next.filter(
      (r) => r.paymentType.trim() || r.routingNumber.trim()
    );
    onChange(cleaned.length === 0 ? undefined : cleaned);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-600">routingNumbers</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-[11px]"
          onClick={() =>
            setRows([
              ...rows.map((r) => ({
                paymentType: r.paymentType ?? 'ACH',
                routingNumber: r.routingNumber ?? '',
              })),
              { paymentType: 'ACH', routingNumber: '' },
            ])
          }
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      {rows.length === 0 && (
        <p className="text-[11px] text-gray-400">No routing numbers set.</p>
      )}
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <select
            className="h-7 rounded-md border border-gray-300 bg-white px-1.5 text-xs"
            value={row.paymentType ?? 'ACH'}
            onChange={(e) => {
              const next = rows.map((r, i) =>
                i === index
                  ? {
                      paymentType: e.target.value,
                      routingNumber: r.routingNumber ?? '',
                    }
                  : {
                      paymentType: r.paymentType ?? 'ACH',
                      routingNumber: r.routingNumber ?? '',
                    }
              );
              setRows(next);
            }}
          >
            {PAYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Input
            className="h-7 flex-1 font-mono text-xs"
            placeholder="Routing number"
            value={row.routingNumber ?? ''}
            onChange={(e) => {
              const next = rows.map((r, i) =>
                i === index
                  ? {
                      paymentType: r.paymentType ?? 'ACH',
                      routingNumber: e.target.value,
                    }
                  : {
                      paymentType: r.paymentType ?? 'ACH',
                      routingNumber: r.routingNumber ?? '',
                    }
              );
              setRows(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600"
            onClick={() =>
              setRows(
                rows
                  .filter((_, i) => i !== index)
                  .map((r) => ({
                    paymentType: r.paymentType ?? 'ACH',
                    routingNumber: r.routingNumber ?? '',
                  }))
              )
            }
            aria-label="Remove routing number"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function LinkAccountStepOptionsForm({
  value,
  onChange,
}: {
  value: LinkAccountStepOptionsValue | undefined;
  onChange: (next: LinkAccountStepOptionsValue | undefined) => void;
}) {
  const current: LinkAccountStepOptionsValue = value ?? {};
  const initialValues = (current.initialValues ?? {}) as Record<
    string,
    unknown
  >;

  const emit = (next: LinkAccountStepOptionsValue) => {
    // Drop empty optional fields for cleaner export
    const cleaned: LinkAccountStepOptionsValue = { ...next };

    if (!cleaned.partyId?.trim()) delete cleaned.partyId;
    if (!cleaned.completionMode) delete cleaned.completionMode;
    if (!cleaned.existingAccountsDisplay)
      delete cleaned.existingAccountsDisplay;
    if (cleaned.allowMultipleAccounts === undefined)
      delete cleaned.allowMultipleAccounts;
    if (cleaned.showAcknowledgementsIntro === undefined)
      delete cleaned.showAcknowledgementsIntro;
    if (
      !cleaned.summaryDisplayedPaymentTypes ||
      cleaned.summaryDisplayedPaymentTypes.length === 0
    ) {
      delete cleaned.summaryDisplayedPaymentTypes;
    }
    if (
      !cleaned.reviewAcknowledgements ||
      cleaned.reviewAcknowledgements.length === 0
    ) {
      delete cleaned.reviewAcknowledgements;
    }
    if (
      !cleaned.presetAccounts ||
      (Array.isArray(cleaned.presetAccounts) &&
        cleaned.presetAccounts.length === 0)
    ) {
      delete cleaned.presetAccounts;
    }
    if (
      !cleaned.bankFormConfigOverride ||
      Object.keys(cleaned.bankFormConfigOverride).length === 0
    ) {
      delete cleaned.bankFormConfigOverride;
    }

    if (cleaned.initialValues) {
      const iv = { ...cleaned.initialValues };
      for (const [k, v] of Object.entries(iv)) {
        if (
          v === undefined ||
          v === '' ||
          (Array.isArray(v) && v.length === 0)
        ) {
          delete iv[k];
        }
      }
      if (Object.keys(iv).length === 0) delete cleaned.initialValues;
      else cleaned.initialValues = iv;
    }

    if (Object.keys(cleaned).length === 0) {
      onChange(undefined);
      return;
    }
    onChange(cleaned);
  };

  const patch = (partial: Partial<LinkAccountStepOptionsValue>) => {
    emit({ ...current, ...partial });
  };

  const patchInitialValues = (partial: Record<string, unknown>) => {
    const nextIv = { ...initialValues, ...partial };
    for (const [k, v] of Object.entries(partial)) {
      if (v === undefined) delete nextIv[k];
    }
    patch({
      initialValues: Object.keys(nextIv).length === 0 ? undefined : nextIv,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">completionMode</Label>
        <SelectChips
          options={COMPLETION_MODE_OPTIONS}
          value={current.completionMode}
          onChange={(next) =>
            patch({
              completionMode: next as
                | LinkAccountStepOptionsValue['completionMode']
                | undefined,
            })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-600">partyId</Label>
        <Input
          className="h-8 font-mono text-sm"
          value={current.partyId ?? ''}
          placeholder="Optional existing party ID"
          onChange={(e) => patch({ partyId: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-white px-2.5 py-2">
        <div>
          <Label className="text-xs text-gray-700">allowMultipleAccounts</Label>
          <p className="text-[11px] text-gray-400">
            Offer “Link another account” after success
          </p>
        </div>
        <Switch
          checked={Boolean(current.allowMultipleAccounts)}
          onCheckedChange={(checked) =>
            patch({ allowMultipleAccounts: checked })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-600">existingAccountsDisplay</Label>
        <SelectChips
          options={[
            { value: 'compact', label: 'compact' },
            { value: 'detailed', label: 'detailed' },
          ]}
          value={current.existingAccountsDisplay}
          onChange={(next) =>
            patch({
              existingAccountsDisplay: next as
                | 'compact'
                | 'detailed'
                | undefined,
            })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-white px-2.5 py-2">
        <div>
          <Label className="text-xs text-gray-700">
            showAcknowledgementsIntro
          </Label>
          <p className="text-[11px] text-gray-400">
            Intro line above review acknowledgement checkboxes
          </p>
        </div>
        <Switch
          checked={Boolean(current.showAcknowledgementsIntro)}
          onCheckedChange={(checked) =>
            patch({ showAcknowledgementsIntro: checked })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-600">
          summaryDisplayedPaymentTypes
        </Label>
        <MultiSelectChips
          options={[...PAYMENT_TYPE_OPTIONS]}
          value={current.summaryDisplayedPaymentTypes}
          onChange={(next) =>
            patch({
              summaryDisplayedPaymentTypes:
                next.length === 0 ? undefined : next,
            })
          }
        />
      </div>

      <div className="space-y-3 rounded-md border border-dashed border-gray-200 bg-white/80 p-2.5">
        <Label className="text-xs font-medium text-gray-700">
          initialValues
        </Label>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">paymentTypes</Label>
          <MultiSelectChips
            options={[...PAYMENT_TYPE_OPTIONS]}
            value={
              Array.isArray(initialValues.paymentTypes)
                ? (initialValues.paymentTypes as string[])
                : undefined
            }
            onChange={(next) =>
              patchInitialValues({
                paymentTypes: next.length === 0 ? undefined : next,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">accountNumber</Label>
          <Input
            className="h-8 font-mono text-sm"
            value={
              typeof initialValues.accountNumber === 'string'
                ? initialValues.accountNumber
                : ''
            }
            placeholder="Optional prefill"
            onChange={(e) =>
              patchInitialValues({
                accountNumber: e.target.value || undefined,
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">accountType</Label>
            <SelectChips
              options={[
                { value: 'INDIVIDUAL', label: 'INDIVIDUAL' },
                { value: 'ORGANIZATION', label: 'ORGANIZATION' },
              ]}
              value={
                typeof initialValues.accountType === 'string'
                  ? initialValues.accountType
                  : undefined
              }
              onChange={(next) => patchInitialValues({ accountType: next })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">bankAccountType</Label>
            <SelectChips
              options={[
                { value: 'CHECKING', label: 'CHECKING' },
                { value: 'SAVINGS', label: 'SAVINGS' },
              ]}
              value={
                typeof initialValues.bankAccountType === 'string'
                  ? initialValues.bankAccountType
                  : undefined
              }
              onChange={(next) => patchInitialValues({ bankAccountType: next })}
            />
          </div>
        </div>
        <RoutingNumbersEditor
          value={
            Array.isArray(initialValues.routingNumbers)
              ? (initialValues.routingNumbers as Array<{
                  paymentType?: string;
                  routingNumber?: string;
                }>)
              : undefined
          }
          onChange={(next) => patchInitialValues({ routingNumbers: next })}
        />
        <p className="text-[11px] text-gray-400">
          Other initialValues fields (address, contacts, names) — use JSON mode.
        </p>
      </div>

      <div className="space-y-2 rounded-md border border-dashed border-gray-200 bg-white/80 p-2.5">
        <Label className="text-xs font-medium text-gray-700">
          reviewAcknowledgements
        </Label>
        <AcknowledgementsForm
          value={current.reviewAcknowledgements}
          onChange={(next) => patch({ reviewAcknowledgements: next })}
          emptyHint="No link-account acknowledgement checkboxes."
          addLabel="Add link-account acknowledgement"
          commonLabelKeys={COMMON_LINK_ACCOUNT_ACK_LABEL_KEYS}
          idPrefix="link-ack"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-600">
          bankFormConfigOverride (JSON)
        </Label>
        <JsonPropEditor
          value={current.bankFormConfigOverride}
          onChange={(next) =>
            patch({
              bankFormConfigOverride:
                next && typeof next === 'object' && !Array.isArray(next)
                  ? (next as Record<string, unknown>)
                  : undefined,
            })
          }
          placeholder={`{\n  "paymentMethods": { "available": ["ACH"] }\n}`}
          minHeightClass="min-h-[4.5rem]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-600">presetAccounts (JSON)</Label>
        <JsonPropEditor
          value={current.presetAccounts}
          onChange={(next) =>
            patch({
              presetAccounts: Array.isArray(next) ? next : undefined,
            })
          }
          placeholder={`[\n  { "id": "acct-1", "initialValues": { … } }\n]`}
          minHeightClass="min-h-[4.5rem]"
        />
      </div>
    </div>
  );
}

function PropFieldRow({
  field,
  overrides,
  baselineValue,
  onChange,
  onClear,
}: {
  field: PropFieldDescriptor;
  overrides: OnboardingFlowConfigProps;
  baselineValue: unknown;
  onChange: (key: OnboardingFlowConfigKey, value: unknown) => void;
  onClear: (key: OnboardingFlowConfigKey) => void;
}) {
  const [mode, setMode] = useState<EditorMode>('form');
  const configured = isPropConfigured(overrides, field.key);
  const effectiveValue = configured
    ? (overrides as Record<string, unknown>)[field.key]
    : baselineValue;

  const supportsFormMode =
    field.key === 'disclosureConfig' ||
    field.key === 'reviewAttestTermsAcknowledgements' ||
    field.key === 'linkAccountStepOptions';

  if (supportsFormMode) {
    const jsonPlaceholder =
      field.key === 'disclosureConfig'
        ? `{\n  "platformName": "Platform, Inc."\n}`
        : field.key === 'linkAccountStepOptions'
          ? `{\n  "completionMode": "prefillSummary",\n  "initialValues": {}\n}`
          : `[\n  { "id": "agreeJpTerms", "labelKey": "…" }\n]`;

    return (
      <FieldShell
        field={field}
        configured={configured}
        onClear={() => onClear(field.key)}
        modeToggle={<ModeToggle mode={mode} onChange={setMode} />}
      >
        {mode === 'json' ? (
          <JsonPropEditor
            value={configured ? effectiveValue : baselineValue}
            onChange={(next) => onChange(field.key, next)}
            placeholder={jsonPlaceholder}
            minHeightClass="min-h-[8rem]"
          />
        ) : field.key === 'disclosureConfig' ? (
          <DisclosureConfigForm
            value={
              (configured ? effectiveValue : baselineValue) as
                | DisclosureConfigValue
                | undefined
            }
            onChange={(next) => onChange(field.key, next)}
          />
        ) : field.key === 'linkAccountStepOptions' ? (
          <LinkAccountStepOptionsForm
            value={
              (configured ? effectiveValue : baselineValue) as
                | LinkAccountStepOptionsValue
                | undefined
            }
            onChange={(next) => onChange(field.key, next)}
          />
        ) : (
          <AcknowledgementsForm
            value={
              (configured ? effectiveValue : baselineValue) as
                | AcknowledgementRow[]
                | undefined
            }
            onChange={(next) => onChange(field.key, next)}
          />
        )}
      </FieldShell>
    );
  }

  return (
    <FieldShell
      field={field}
      configured={configured}
      onClear={() => onClear(field.key)}
    >
      {field.control === 'boolean' && (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(effectiveValue)}
            onCheckedChange={(checked) => onChange(field.key, checked)}
          />
          <span className="text-xs text-gray-600">
            {Boolean(effectiveValue) ? 'true' : 'false'}
            {!configured && baselineValue !== undefined && (
              <span className="text-gray-400"> (baseline)</span>
            )}
          </span>
        </div>
      )}

      {field.control === 'multi-select' && field.options && (
        <MultiSelectChips
          options={field.options}
          value={
            Array.isArray(effectiveValue)
              ? (effectiveValue as string[])
              : undefined
          }
          onChange={(next) => onChange(field.key, next)}
        />
      )}

      {field.control === 'json' && (
        <JsonPropEditor
          value={configured ? effectiveValue : baselineValue}
          onChange={(next) => onChange(field.key, next)}
          placeholder={`{\n  ...\n}`}
        />
      )}
    </FieldShell>
  );
}

export function ComponentPropsDrawer({
  isOpen,
  onClose,
  overrides,
  onOverridesChange,
  scenarioExtras,
  isOnboardingView,
  topOffset = '4rem',
}: ComponentPropsDrawerProps) {
  const [copied, setCopied] = useState<'changed' | 'effective' | null>(null);
  const [showApplied, setShowApplied] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const configuredCount = countConfiguredProps(overrides);

  const effectiveProps = useMemo(
    () =>
      mergeOnboardingFlowConfig(
        SELLSENSE_ONBOARDING_BASELINE,
        scenarioExtras,
        overrides
      ),
    [overrides, scenarioExtras]
  );

  // Escape closes the drawer; do not lock body scroll or block main content.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showImportDialog) {
        setShowImportDialog(false);
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, showImportDialog]);

  const handlePropChange = useCallback(
    (key: OnboardingFlowConfigKey, value: unknown) => {
      onOverridesChange(setConfigProp(overrides, key, value));
    },
    [onOverridesChange, overrides]
  );

  const handlePropClear = useCallback(
    (key: OnboardingFlowConfigKey) => {
      onOverridesChange(clearConfigProp(overrides, key));
    },
    [onOverridesChange, overrides]
  );

  const copyJson = useCallback(
    async (mode: 'changed' | 'effective') => {
      const payload =
        mode === 'changed'
          ? buildOnboardingFlowConfigExport(overrides)
          : buildOnboardingFlowConfigExport(effectiveProps);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(mode);
      setTimeout(() => setCopied(null), 2000);
    },
    [effectiveProps, overrides]
  );

  const processImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importText) as unknown;
      const result = parseOnboardingFlowConfigImport(parsed);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      onOverridesChange(result.config);
      setShowImportDialog(false);
      setImportText('');
      setImportError(null);
    } catch {
      setImportError('Invalid JSON. Please check the format and try again.');
    }
  }, [importText, onOverridesChange]);

  if (!isOpen) return null;

  const drawerContent = (
    <>
      {/* Drawer sits below header (topOffset), same inline pattern as Content Tokens */}
      <div
        data-component-props-drawer=""
        className={`fixed right-0 z-[60] flex w-[600px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: topOffset,
          bottom: 0,
        }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Component Props
            </h2>
            {configuredCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {configuredCount} configured
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Context */}
        <div className="flex-shrink-0 space-y-2 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
              OnboardingFlow
            </span>
            <span className="text-xs text-gray-500">
              Host props → onboardingFlowConfig
            </span>
          </div>
          {!isOnboardingView && (
            <p className="rounded-md bg-blue-50 px-2 py-1.5 text-xs text-blue-800">
              Open an onboarding scenario to live-preview changes. You can still
              edit and copy JSON from here.
            </p>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={configuredCount === 0}
            onClick={() => void copyJson('changed')}
            title="Copy configured (changed) props as onboardingFlowConfig JSON"
          >
            {copied === 'changed' ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy changed
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => void copyJson('effective')}
            title="Copy effective applied props as onboardingFlowConfig JSON"
          >
            {copied === 'effective' ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy effective
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              setImportText('');
              setImportError(null);
              setShowImportDialog(true);
            }}
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={configuredCount === 0}
            onClick={() => onOverridesChange({})}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-600"
            onClick={() => onOverridesChange({ ...HOSTED_PLATFORM_SAMPLE })}
            title="Load a generic hosted-platform sample config"
          >
            Load sample
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Currently applied */}
          <div className="border-b border-gray-200 px-4 py-3">
            <button
              type="button"
              className="flex w-full items-center gap-1.5 text-left text-sm font-medium text-gray-900"
              onClick={() => setShowApplied((v) => !v)}
            >
              {showApplied ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              Currently applied
              {scenarioExtras && Object.keys(scenarioExtras).length > 0 && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (includes scenario extras)
                </span>
              )}
            </button>
            {showApplied && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-2 font-mono text-[11px] leading-relaxed text-gray-800">
                {JSON.stringify(
                  buildOnboardingFlowConfigExport(effectiveProps),
                  null,
                  2
                )}
              </pre>
            )}
          </div>

          <div className="space-y-1 p-4">
            <Accordion
              type="multiple"
              defaultValue={['linkAccount', 'disclosure', 'products']}
            >
              {PROP_FIELD_GROUPS.map((group) => {
                const fields = ONBOARDING_PROP_FIELDS.filter(
                  (f) => f.group === group.id
                );
                const groupConfigured = fields.filter((f) =>
                  isPropConfigured(overrides, f.key)
                ).length;
                return (
                  <AccordionItem key={group.id} value={group.id}>
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <span className="flex items-center gap-2">
                        {group.label}
                        {groupConfigured > 0 && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            {groupConfigured}
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pb-2">
                        {fields.map((field) => (
                          <PropFieldRow
                            key={field.key}
                            field={field}
                            overrides={overrides}
                            baselineValue={
                              (
                                SELLSENSE_ONBOARDING_BASELINE as Record<
                                  string,
                                  unknown
                                >
                              )[field.key]
                            }
                            onChange={handlePropChange}
                            onClear={handlePropClear}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Import dialog — only this modal blocks interaction */}
      {showImportDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Import onboardingFlowConfig
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                  setImportError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs text-gray-500">
                Paste{' '}
                <code className="rounded bg-gray-100 px-1">
                  {'{ "onboardingFlowConfig": { ... } }'}
                </code>{' '}
                or a bare props object. Unknown keys and callbacks are stripped.
              </p>
              <textarea
                className="min-h-[12rem] w-full rounded-md border border-gray-300 p-2 font-mono text-xs outline-none focus:border-blue-400"
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                spellCheck={false}
                placeholder={`{\n  "onboardingFlowConfig": {\n    "showLinkAccountStep": true,\n    "hideLinkedAccountRemoval": true\n  }\n}`}
              />
              {importError && (
                <p className="text-xs text-red-600">{importError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText('');
                    setImportError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!importText.trim()}
                  onClick={processImport}
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(drawerContent, document.body);
}
