'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  EBConfig,
  EBThemeVariables,
} from '@jpmorgan-payments/embedded-finance-components';
import {
  Brush,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Database,
  Download,
  Languages,
  Layers,
  Loader2,
  Save,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  countContentTokenOverrides,
  countThemeVariableOverrides,
} from '@/lib/demo-customization-storage';
import {
  deleteMasterModePreset,
  downloadMasterModeBundle,
  downloadMasterModePreset,
  listMasterModePresets,
  saveMasterModePreset,
  type MasterModePreset,
} from '@/lib/master-mode-presets-storage';
import {
  getOverrides,
  type MockOverridesMap,
} from '@/lib/mock-overrides-storage';
import { cn } from '@/lib/utils';

import {
  describeMasterModeFormat,
  groupContentTokenKeys,
  parseMasterModeText,
  summarizeMasterModeBundle,
  toSafeFileName,
  type MasterModeBundle,
  type MasterModeImportSummary,
} from './master-mode-bundle';
import {
  countConfiguredProps,
  ONBOARDING_PROP_FIELDS,
  type OnboardingFlowConfigProps,
} from './onboarding-flow-props-config';
import type { ThemeOption } from './use-sellsense-themes';

export type MasterModeApplyPayload = {
  /** `null` clears custom theme back to a preset base. */
  theme: {
    baseTheme: ThemeOption;
    variables: EBThemeVariables;
  } | null;
  /** `null` clears content token overrides. */
  contentTokens: EBConfig['contentTokens'] | null;
  /** `null` clears onboarding prop overrides. */
  onboardingFlowPropOverrides: OnboardingFlowConfigProps | null;
  mocks?: MockOverridesMap;
  includeMocks: boolean;
};

interface MasterModeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topOffset?: string;
  currentTheme: ThemeOption;
  customThemeVariables: EBThemeVariables;
  customThemeBaseTheme?: ThemeOption;
  contentTokens: EBConfig['contentTokens'];
  onboardingFlowPropOverrides: OnboardingFlowConfigProps;
  mockOverrideCount: number;
  onApply: (payload: MasterModeApplyPayload) => void | Promise<void>;
  onOpenThemeDrawer: () => void;
  onOpenContentTokensDrawer: () => void;
  onOpenConfigDrawer: () => void;
  onOpenMocksDrawer: () => void;
}

type CategoryId = 'theme' | 'content' | 'config' | 'mocks';

function CategoryCard({
  id,
  title,
  subtitle,
  icon,
  count,
  accentClass,
  children,
  onEdit,
  editLabel,
}: {
  id: CategoryId;
  title: string;
  subtitle: string;
  icon: ReactNode;
  count: number;
  accentClass: string;
  children: React.ReactNode;
  onEdit: () => void;
  editLabel: string;
}) {
  const active = count > 0;
  return (
    <section
      data-category={id}
      className={cn(
        'rounded-xl border p-4 transition-colors',
        active
          ? cn(
              'border-amber-300 bg-gradient-to-br from-amber-50 to-white',
              accentClass
            )
          : 'border-gray-200 bg-white'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              active
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  active
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {active ? `${count} overridden` : 'Using defaults'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-shrink-0 text-xs"
          onClick={onEdit}
        >
          {editLabel}
        </Button>
      </div>
      <div className="min-h-[3rem]">{children}</div>
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-gray-400">{text}</p>;
}

export function MasterModeDrawer({
  isOpen,
  onClose,
  topOffset = '4rem',
  currentTheme,
  customThemeVariables,
  customThemeBaseTheme,
  contentTokens,
  onboardingFlowPropOverrides,
  mockOverrideCount,
  onApply,
  onOpenThemeDrawer,
  onOpenContentTokensDrawer,
  onOpenConfigDrawer,
  onOpenMocksDrawer,
}: MasterModeDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presets, setPresets] = useState<MasterModePreset[]>([]);
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isReadingClipboard, setIsReadingClipboard] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingBundle, setPendingBundle] = useState<MasterModeBundle | null>(
    null
  );
  const [pendingSummary, setPendingSummary] =
    useState<MasterModeImportSummary | null>(null);
  const [includeMocksOnApply, setIncludeMocksOnApply] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveFileName, setSaveFileName] = useState('');
  const [includeMocksOnSave, setIncludeMocksOnSave] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshPresets = useCallback(() => {
    setPresets(listMasterModePresets());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshPresets();
    setImportError(null);
    setStatusMessage(null);
  }, [isOpen, refreshPresets]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (saveDialogOpen) {
        setSaveDialogOpen(false);
        return;
      }
      onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, saveDialogOpen]);

  const liveSummary = useMemo(() => {
    const bundle: MasterModeBundle = {
      theme:
        currentTheme === 'Custom' ||
        Object.keys(customThemeVariables).length > 0
          ? {
              baseTheme: customThemeBaseTheme || 'Empty',
              variables: customThemeVariables,
            }
          : undefined,
      contentTokens: contentTokens?.tokens
        ? {
            name: contentTokens.name,
            tokens: contentTokens.tokens as Record<string, unknown>,
          }
        : contentTokens?.name && contentTokens.name !== 'enUS'
          ? { name: contentTokens.name }
          : undefined,
      onboardingFlowPropOverrides,
      mocks: mockOverrideCount > 0 ? getOverrides() : undefined,
    };
    return summarizeMasterModeBundle(bundle);
  }, [
    contentTokens,
    currentTheme,
    customThemeBaseTheme,
    customThemeVariables,
    mockOverrideCount,
    onboardingFlowPropOverrides,
  ]);

  const themeCount = countThemeVariableOverrides(customThemeVariables);
  const contentCount = countContentTokenOverrides(
    contentTokens?.tokens as Record<string, unknown> | undefined
  );
  const configCount = countConfiguredProps(onboardingFlowPropOverrides);
  const totalLive = themeCount + contentCount + configCount + mockOverrideCount;

  const contentGroups = useMemo(
    () =>
      groupContentTokenKeys(
        contentTokens?.tokens as Record<string, unknown> | undefined
      ),
    [contentTokens]
  );

  const configuredPropFields = useMemo(
    () =>
      ONBOARDING_PROP_FIELDS.filter((field) =>
        Object.prototype.hasOwnProperty.call(
          onboardingFlowPropOverrides,
          field.key
        )
      ),
    [onboardingFlowPropOverrides]
  );

  const handleParsedText = useCallback((text: string, label?: string) => {
    const result = parseMasterModeText(text);
    if (!result.ok) {
      setImportError(result.error);
      setPendingBundle(null);
      setPendingSummary(null);
      return false;
    }
    setImportError(null);
    setPendingBundle(result.bundle);
    setPendingSummary(result.summary);
    setIncludeMocksOnApply(result.summary.mockOverrideCount > 0);
    const formatLabel = describeMasterModeFormat(result.format);
    setStatusMessage(
      label
        ? `Recognized ${formatLabel} from “${label}” — review below, then apply.`
        : `Recognized ${formatLabel} — review below, then apply.`
    );
    return true;
  }, []);

  const handleFileUpload = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      try {
        const text = await file.text();
        handleParsedText(text, file.name);
      } catch {
        setImportError('Could not read that file as JSON');
        setPendingBundle(null);
        setPendingSummary(null);
      }
    },
    [handleParsedText]
  );

  const handlePasteFromClipboard = useCallback(async () => {
    setIsReadingClipboard(true);
    setImportError(null);
    try {
      if (!navigator.clipboard?.readText) {
        setShowPastePanel(true);
        setImportError(
          'Clipboard access unavailable — paste JSON into the box below.'
        );
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setShowPastePanel(true);
        setImportError('Clipboard is empty — paste JSON into the box below.');
        return;
      }
      setPasteText(text);
      const ok = handleParsedText(text, 'clipboard');
      if (!ok) setShowPastePanel(true);
    } catch {
      setShowPastePanel(true);
      setImportError(
        'Could not read clipboard — paste JSON into the box below.'
      );
    } finally {
      setIsReadingClipboard(false);
    }
  }, [handleParsedText]);

  const handlePastePanelSubmit = useCallback(() => {
    const ok = handleParsedText(pasteText, 'pasted JSON');
    if (ok) setShowPastePanel(false);
  }, [handleParsedText, pasteText]);

  const buildCurrentBundle = useCallback(
    (withMocks: boolean): MasterModeBundle => ({
      theme:
        Object.keys(customThemeVariables).length > 0
          ? {
              baseTheme:
                customThemeBaseTheme ||
                (currentTheme === 'Custom' ? 'Empty' : currentTheme),
              variables: customThemeVariables,
            }
          : undefined,
      contentTokens: contentTokens?.tokens
        ? {
            name: contentTokens.name,
            tokens: contentTokens.tokens as Record<string, unknown>,
          }
        : contentTokens?.name
          ? { name: contentTokens.name }
          : undefined,
      onboardingFlowPropOverrides:
        Object.keys(onboardingFlowPropOverrides).length > 0
          ? onboardingFlowPropOverrides
          : undefined,
      mocks: withMocks ? getOverrides() : undefined,
    }),
    [
      contentTokens,
      currentTheme,
      customThemeBaseTheme,
      customThemeVariables,
      onboardingFlowPropOverrides,
    ]
  );

  const applyBundle = useCallback(
    async (bundle: MasterModeBundle, withMocks: boolean) => {
      setIsApplying(true);
      try {
        await onApply({
          theme: bundle.theme?.variables
            ? {
                baseTheme: (bundle.theme.baseTheme as ThemeOption) || 'Empty',
                variables: bundle.theme.variables,
              }
            : null,
          contentTokens: bundle.contentTokens
            ? {
                name:
                  (bundle.contentTokens.name as 'enUS' | 'frCA' | 'esUS') ||
                  'enUS',
                ...(bundle.contentTokens.tokens
                  ? { tokens: bundle.contentTokens.tokens }
                  : {}),
              }
            : null,
          onboardingFlowPropOverrides:
            bundle.onboardingFlowPropOverrides ?? null,
          mocks: withMocks ? bundle.mocks : undefined,
          includeMocks: withMocks && !!bundle.mocks,
        });
        setPendingBundle(null);
        setPendingSummary(null);
        setStatusMessage('Applied customization to the playground.');
        refreshPresets();
      } finally {
        setIsApplying(false);
      }
    },
    [onApply, refreshPresets]
  );

  const openSaveDialog = useCallback(() => {
    const defaultName = pendingBundle?.name || 'My customization';
    setSaveName(defaultName);
    setSaveFileName(toSafeFileName(defaultName));
    setIncludeMocksOnSave(
      (pendingSummary?.mockOverrideCount ?? mockOverrideCount) > 0
    );
    setSaveDialogOpen(true);
  }, [
    mockOverrideCount,
    pendingBundle?.name,
    pendingSummary?.mockOverrideCount,
  ]);

  const handleSavePreset = useCallback(() => {
    const name = saveName.trim() || 'Untitled';
    const fileName = saveFileName.trim() || toSafeFileName(name);
    const bundle = pendingBundle
      ? {
          ...pendingBundle,
          mocks: includeMocksOnSave ? pendingBundle.mocks : undefined,
        }
      : buildCurrentBundle(includeMocksOnSave);

    saveMasterModePreset({ name, fileName, bundle });
    setSaveDialogOpen(false);
    refreshPresets();
    setStatusMessage(`Saved “${name}” locally as ${fileName}.`);
  }, [
    buildCurrentBundle,
    includeMocksOnSave,
    pendingBundle,
    refreshPresets,
    saveFileName,
    saveName,
  ]);

  const handleDownloadCurrent = useCallback(() => {
    const name = saveName.trim() || 'master-customization';
    const fileName = toSafeFileName(name);
    downloadMasterModeBundle(buildCurrentBundle(includeMocksOnSave), fileName);
  }, [buildCurrentBundle, includeMocksOnSave, saveName]);

  if (!isOpen) return null;

  const drawer = (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        data-master-mode-drawer
        className="fixed right-0 z-[60] flex w-[640px] max-w-[100vw] translate-x-0 transform flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out"
        style={{ top: topOffset, bottom: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="master-mode-title"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-600" />
            <div>
              <h2
                id="master-mode-title"
                className="text-base font-semibold text-gray-900"
              >
                Master customization
              </h2>
              <p className="text-xs text-gray-500">
                Theme, copy, and config in one place
              </p>
            </div>
            {totalLive > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-medium text-white">
                {totalLive} active
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Close master customization"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-5 p-4">
            {/* Import */}
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Load customization
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Upload or paste JSON. Playground exports and hosted page /
                content-override payloads are recognized automatically.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload JSON
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    void handleFileUpload(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  disabled={isReadingClipboard}
                  onClick={() => void handlePasteFromClipboard()}
                >
                  {isReadingClipboard ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardPaste className="h-4 w-4" />
                  )}
                  Paste from clipboard
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={openSaveDialog}
                >
                  <Save className="h-4 w-4" />
                  Save current…
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-gray-500"
                  onClick={() => setShowPastePanel((v) => !v)}
                >
                  {showPastePanel ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {showPastePanel ? 'Hide paste box' : 'Paste JSON…'}
                </Button>
              </div>

              {showPastePanel && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                    placeholder="Paste formatted JSON here…"
                    className="min-h-[9rem] w-full resize-y rounded-md border border-gray-300 bg-white p-3 font-mono text-xs text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    spellCheck={false}
                    aria-label="Paste customization JSON"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!pasteText.trim()}
                      onClick={handlePastePanelSubmit}
                    >
                      Recognize &amp; preview
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPasteText('');
                        setImportError(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {importError && (
                <p className="mt-2 text-sm text-red-600">{importError}</p>
              )}
              {statusMessage && !importError && (
                <p className="mt-2 text-sm text-emerald-700">{statusMessage}</p>
              )}
            </section>

            {/* Pending import preview */}
            {pendingBundle && pendingSummary && (
              <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-sky-950">
                      Ready to apply
                    </h3>
                    <p className="mt-1 text-xs text-sky-800">
                      {pendingSummary.themeVariableCount} theme ·{' '}
                      {pendingSummary.contentTokenCount} copy ·{' '}
                      {pendingSummary.configPropCount} config
                      {pendingSummary.mockOverrideCount > 0
                        ? ` · ${pendingSummary.mockOverrideCount} mocks`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={isApplying}
                      onClick={() =>
                        void applyBundle(pendingBundle, includeMocksOnApply)
                      }
                      className="gap-1"
                    >
                      {isApplying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPendingBundle(null);
                        setPendingSummary(null);
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <PreviewStat
                    label="Theme"
                    count={pendingSummary.themeVariableCount}
                    colors={pendingSummary.themePreviewColors}
                  />
                  <PreviewStat
                    label="Copy"
                    count={pendingSummary.contentTokenCount}
                    keys={pendingSummary.contentTokenPreviewKeys}
                  />
                  <PreviewStat
                    label="Config"
                    count={pendingSummary.configPropCount}
                    keys={pendingSummary.configPropLabels}
                  />
                </div>

                {pendingSummary.mockOverrideCount > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-sky-200 bg-white px-3 py-2">
                    <div className="text-xs text-gray-700">
                      Include {pendingSummary.mockOverrideCount} mock API
                      override
                      {pendingSummary.mockOverrideCount === 1 ? '' : 's'}
                    </div>
                    <Switch
                      checked={includeMocksOnApply}
                      onCheckedChange={setIncludeMocksOnApply}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Live visual map */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                What’s overridden now
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Amber means the playground is using custom values instead of
                SellSense defaults. Open a category to edit details.
              </p>

              <div className="space-y-3">
                <CategoryCard
                  id="theme"
                  title="Theme & design tokens"
                  subtitle={
                    currentTheme === 'Custom'
                      ? `Custom theme${customThemeBaseTheme ? ` (from ${customThemeBaseTheme})` : ''}`
                      : `Preset: ${currentTheme}`
                  }
                  icon={<Brush className="h-5 w-5" />}
                  count={themeCount}
                  accentClass=""
                  onEdit={onOpenThemeDrawer}
                  editLabel="Edit theme"
                >
                  {themeCount > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {liveSummary.themePreviewColors.map((color) => (
                          <span
                            key={color}
                            className="h-8 w-8 rounded-md border border-black/10 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      {typeof customThemeVariables.fontFamily === 'string' ||
                      typeof customThemeVariables.contentFontFamily ===
                        'string' ? (
                        <p
                          className="truncate text-sm text-gray-700"
                          style={{
                            fontFamily:
                              (customThemeVariables.contentFontFamily as
                                string | undefined) ||
                              (customThemeVariables.fontFamily as
                                string | undefined),
                          }}
                        >
                          Aa —{' '}
                          {(customThemeVariables.contentFontFamily as
                            string | undefined) ||
                            (customThemeVariables.fontFamily as
                              string | undefined)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <EmptyHint text="No custom colors or typography — component defaults apply." />
                  )}
                </CategoryCard>

                <CategoryCard
                  id="content"
                  title="Content tokens (copy)"
                  subtitle={
                    contentTokens?.name
                      ? `Language pack: ${contentTokens.name}`
                      : 'Language pack: enUS'
                  }
                  icon={<Languages className="h-5 w-5" />}
                  count={contentCount}
                  accentClass=""
                  onEdit={onOpenContentTokensDrawer}
                  editLabel="Edit copy"
                >
                  {contentCount > 0 ? (
                    <div className="space-y-2">
                      {contentGroups.map((group) => (
                        <div
                          key={group.namespace}
                          className="rounded-lg border border-amber-200/80 bg-white/80 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-800">
                              {group.namespace}
                            </span>
                            <span className="text-[11px] text-amber-700">
                              {group.count}
                            </span>
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {group.keys.map((key) => (
                              <li
                                key={key}
                                className="truncate font-mono text-[11px] text-gray-500"
                              >
                                {key}
                              </li>
                            ))}
                            {group.count > group.keys.length && (
                              <li className="text-[11px] text-gray-400">
                                +{group.count - group.keys.length} more
                              </li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyHint text="No copy overrides — default product wording is shown." />
                  )}
                </CategoryCard>

                <CategoryCard
                  id="config"
                  title="Onboarding config"
                  subtitle="Host props / onboardingFlowConfig"
                  icon={<SlidersHorizontal className="h-5 w-5" />}
                  count={configCount}
                  accentClass=""
                  onEdit={onOpenConfigDrawer}
                  editLabel="Edit config"
                >
                  {configCount > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {configuredPropFields.map((field) => {
                        const value = (
                          onboardingFlowPropOverrides as Record<string, unknown>
                        )[field.key];
                        const display =
                          typeof value === 'boolean'
                            ? value
                              ? 'On'
                              : 'Off'
                            : Array.isArray(value)
                              ? `${value.length} items`
                              : typeof value === 'object' && value
                                ? 'Custom'
                                : String(value);
                        return (
                          <span
                            key={field.key}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs text-gray-800"
                            title={field.description}
                          >
                            <span className="truncate font-medium">
                              {field.label}
                            </span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                              {display}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyHint text="No host prop overrides — SellSense baseline config applies." />
                  )}
                </CategoryCard>

                <CategoryCard
                  id="mocks"
                  title="Mock API data"
                  subtitle="Optional — scenario response overrides"
                  icon={<Database className="h-5 w-5" />}
                  count={mockOverrideCount}
                  accentClass=""
                  onEdit={onOpenMocksDrawer}
                  editLabel="Edit mocks"
                >
                  {mockOverrideCount > 0 ? (
                    <p className="text-xs text-gray-600">
                      {mockOverrideCount} endpoint
                      {mockOverrideCount === 1 ? '' : 's'} overridden in this
                      browser. Include them when saving a named version if you
                      want the full playground snapshot.
                    </p>
                  ) : (
                    <EmptyHint text="No mock overrides — seeded scenario data is used." />
                  )}
                </CategoryCard>
              </div>
            </div>

            {/* Saved versions */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Saved versions (this browser)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={openSaveDialog}
                >
                  Save current
                </Button>
              </div>
              {presets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
                  No saved versions yet. Save the current playground state as a
                  named JSON snapshot.
                </div>
              ) : (
                <ul className="space-y-2">
                  {presets.map((preset) => {
                    const summary = summarizeMasterModeBundle(preset.bundle);
                    return (
                      <li
                        key={preset.id}
                        className="rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {preset.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-gray-500">
                              {preset.fileName}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {summary.themeVariableCount} theme ·{' '}
                              {summary.contentTokenCount} copy ·{' '}
                              {summary.configPropCount} config
                              {summary.mockOverrideCount > 0
                                ? ` · ${summary.mockOverrideCount} mocks`
                                : ''}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 text-xs"
                              onClick={() =>
                                void applyBundle(
                                  preset.bundle,
                                  !!preset.bundle.mocks &&
                                    Object.keys(preset.bundle.mocks).length > 0
                                )
                              }
                            >
                              Apply
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Download JSON"
                              onClick={() => downloadMasterModePreset(preset)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete"
                              onClick={() => {
                                deleteMasterModePreset(preset.id);
                                refreshPresets();
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {(summary.themePreviewColors.length > 0 ||
                          summary.configPropLabels.length > 0) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {summary.themePreviewColors.map((color) => (
                              <span
                                key={`${preset.id}-${color}`}
                                className="h-4 w-4 rounded border border-black/10"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            {summary.configPropLabels
                              .slice(0, 3)
                              .map((label) => (
                                <span
                                  key={`${preset.id}-${label}`}
                                  className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                                >
                                  {label}
                                </span>
                              ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      {saveDialogOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSaveDialogOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white text-gray-900 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="master-save-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div>
                <h3
                  id="master-save-title"
                  className="text-sm font-semibold text-gray-900"
                >
                  Save customization version
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Stores a named JSON snapshot in this browser. You can download
                  the same file anytime.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-gray-600 hover:text-gray-900"
                onClick={() => setSaveDialogOpen(false)}
                aria-label="Close save dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="master-save-name"
                  className="text-xs font-medium text-gray-700"
                >
                  Name
                </Label>
                <Input
                  id="master-save-name"
                  value={saveName}
                  onChange={(event) => {
                    setSaveName(event.target.value);
                    setSaveFileName(toSafeFileName(event.target.value));
                  }}
                  placeholder="Partner demo v1"
                  className="border-gray-300 bg-white text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="master-save-file"
                  className="text-xs font-medium text-gray-700"
                >
                  File name
                </Label>
                <Input
                  id="master-save-file"
                  value={saveFileName}
                  onChange={(event) => setSaveFileName(event.target.value)}
                  placeholder="partner-demo-v1.json"
                  className="border-gray-300 bg-white font-mono text-xs text-gray-900"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-600">
                  Include mock API overrides
                </div>
                <Switch
                  checked={includeMocksOnSave}
                  onCheckedChange={setIncludeMocksOnSave}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCurrent}
                className="gap-1 border-gray-300 bg-white text-gray-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download only
              </Button>
              <Button
                size="sm"
                onClick={handleSavePreset}
                className="gap-1 bg-amber-600 text-white hover:bg-amber-700"
              >
                <Save className="h-3.5 w-3.5" />
                Save locally
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(drawer, document.body);
}

function PreviewStat({
  label,
  count,
  colors,
  keys,
}: {
  label: string;
  count: number;
  colors?: string[];
  keys?: string[];
}) {
  return (
    <div className="rounded-lg border border-sky-200 bg-white p-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-600">{label}</span>
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            count > 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
          )}
        >
          {count}
        </span>
      </div>
      {colors && colors.length > 0 && (
        <div className="mt-2 flex gap-1">
          {colors.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-4 w-4 rounded border border-black/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
      {keys && keys.length > 0 && (
        <p className="mt-1 line-clamp-2 font-mono text-[10px] text-gray-400">
          {keys.slice(0, 2).join(', ')}
        </p>
      )}
    </div>
  );
}
