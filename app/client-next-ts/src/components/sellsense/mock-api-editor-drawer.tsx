'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Database, RotateCcw, Save, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatabaseResetUtils } from '@/lib/database-reset-utils';
import {
  clearOverrides,
  getOverrideKeys,
  reinitWithOverrides,
  removeOverride,
  setOverride,
} from '@/lib/mock-overrides-storage';

import {
  getFetchUrlForEndpoint,
  getOverrideKey,
  MOCK_API_EDITOR_ENDPOINTS,
  type MockEndpointConfig,
} from './mock-api-editor-config';
import {
  getResetDbScenario,
  getScenarioKeyByDisplayName,
  SCENARIOS_CONFIG,
} from './scenarios-config';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface MockApiEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current client scenario display name (for clientId from config). */
  clientScenario: string;
  /** Called when overrides are saved or reset so the parent can update badge count. */
  onOverridesChange?: () => void;
}

export function MockApiEditorDrawer({
  isOpen,
  onClose,
  clientScenario,
  onOverridesChange,
}: MockApiEditorDrawerProps) {
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<MockEndpointConfig | null>(null);
  const [editorValue, setEditorValue] = useState<JsonValue | null>(null);
  // Ref always holds the latest editor value — safe to read inside callbacks
  // without stale-closure issues, even if the JsonEditor onChange fires before
  // React has flushed the state update.
  const latestEditorValue = useRef<JsonValue | null>(null);
  // Bumped whenever new data is loaded → forces JsonEditorContainer to remount
  // with a fresh defaultValue so the uncontrolled editor never re-syncs stale state.
  const [editorVersion, setEditorVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Tracked as state so chips and badge update synchronously after each operation
  const [overrideKeys, setOverrideKeys] = useState<string[]>(() =>
    getOverrideKeys()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep overrideKeys in sync with localStorage whenever the drawer opens
  useEffect(() => {
    if (isOpen) {
      setOverrideKeys(getOverrideKeys());
      onOverridesChange?.();
    }
  }, [isOpen, onOverridesChange]);

  // Helper: derive the MSW DB scenario key for the current display-name scenario
  const getDbScenario = useCallback(
    () => getResetDbScenario(clientScenario) ?? undefined,
    [clientScenario]
  );

  // Resolve clientId (and optional accountId, etc.) for current scenario
  const getFetchParams = useCallback(async () => {
    const key = getScenarioKeyByDisplayName(clientScenario);
    const scenario = key
      ? (SCENARIOS_CONFIG as Record<string, { clientId?: string }>)[key]
      : null;
    const clientId = scenario?.clientId ?? '0030000131';

    let accountId: string | undefined;
    let recipientId: string | undefined;
    let transactionId: string | undefined;

    try {
      const accountsRes = await fetch('/ef/do/v1/accounts');
      if (accountsRes.ok) {
        const data = (await accountsRes.json()) as {
          items?: { id?: string }[];
        };
        accountId = data.items?.[0]?.id;
      }
    } catch {
      // ignore
    }
    try {
      const recipientsRes = await fetch('/ef/do/v1/recipients');
      if (recipientsRes.ok) {
        const data = (await recipientsRes.json()) as {
          recipients?: { id?: string }[];
        };
        recipientId = data.recipients?.[0]?.id;
      }
    } catch {
      // ignore
    }
    try {
      const txRes = await fetch('/ef/do/v1/transactions?limit=1');
      if (txRes.ok) {
        const data = (await txRes.json()) as { items?: { id?: string }[] };
        transactionId = data.items?.[0]?.id;
      }
    } catch {
      // ignore
    }

    return { clientId, accountId, recipientId, transactionId };
  }, [clientScenario]);

  const loadCurrentResponse = useCallback(
    async (config: MockEndpointConfig) => {
      setLoading(true);
      setSaveError(null);
      setUploadError(null);
      try {
        const params = await getFetchParams();
        const url = getFetchUrlForEndpoint(config, params);
        const res = await fetch(url);
        const data = (await res.json().catch(() => ({}))) as JsonValue;
        latestEditorValue.current = data;
        setEditorValue(data);
        // Force the uncontrolled JsonEditor to remount with fresh defaultValue
        setEditorVersion((v) => v + 1);
      } catch (err) {
        latestEditorValue.current = null;
        setEditorValue(null);
        setSaveError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [getFetchParams]
  );

  useEffect(() => {
    if (isOpen && selectedEndpoint) {
      loadCurrentResponse(selectedEndpoint);
    }
  }, [isOpen, selectedEndpoint, loadCurrentResponse]);

  const handleSave = useCallback(async () => {
    // Read from ref — always fresh even if React hasn't flushed the onChange state update
    const currentValue = latestEditorValue.current;
    if (!selectedEndpoint || currentValue === null) return;
    const key = getOverrideKey(
      selectedEndpoint.method,
      selectedEndpoint.pathPattern
    );
    setOverride(key, currentValue);
    setSaveError(null);
    setUploadError(null);
    await reinitWithOverrides(getDbScenario());
    setOverrideKeys(getOverrideKeys());
    onOverridesChange?.();
    DatabaseResetUtils.emulateTabSwitch();
    await loadCurrentResponse(selectedEndpoint);
  }, [selectedEndpoint, onOverridesChange, getDbScenario, loadCurrentResponse]);

  const handleResetAll = useCallback(async () => {
    clearOverrides();
    await reinitWithOverrides(getDbScenario());
    setOverrideKeys([]);
    onOverridesChange?.();
    setSelectedEndpoint(null);
    setEditorValue(null);
    setSaveError(null);
    setUploadError(null);
    DatabaseResetUtils.emulateTabSwitch();
  }, [onOverridesChange, getDbScenario]);

  const handleResetThisEndpoint = useCallback(async () => {
    if (!selectedEndpoint) return;
    const key = getOverrideKey(
      selectedEndpoint.method,
      selectedEndpoint.pathPattern
    );
    removeOverride(key);
    await reinitWithOverrides(getDbScenario());
    setOverrideKeys(getOverrideKeys());
    onOverridesChange?.();
    DatabaseResetUtils.emulateTabSwitch();
    await loadCurrentResponse(selectedEndpoint);
  }, [selectedEndpoint, loadCurrentResponse, onOverridesChange, getDbScenario]);

  const handleUploadClick = useCallback(() => {
    setUploadError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text !== 'string') return;
        try {
          const parsed = JSON.parse(text) as JsonValue;
          latestEditorValue.current = parsed;
          setEditorValue(parsed);
          setEditorVersion((v) => v + 1);
          setUploadError(null);
        } catch {
          setUploadError('Invalid JSON — check the file and try again.');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overridesCount = overrideKeys.length;
  const selectedOverrideKey = selectedEndpoint
    ? getOverrideKey(selectedEndpoint.method, selectedEndpoint.pathPattern)
    : null;
  const hasOverrideForSelected = selectedOverrideKey
    ? overrideKeys.includes(selectedOverrideKey)
    : false;

  return (
    <>
      {/* Backdrop — matches theme drawer */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — same structure as ThemeCustomizationDrawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[57rem] translate-x-0 transform flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Mock API Editor
            </h2>
            {overridesCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {overridesCount} overridden
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {overridesCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAll}
                className="h-7 gap-1.5 border-gray-300 px-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Resource chips */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4">
          <p className="mb-2 text-xs font-medium text-gray-500">Resources</p>
          <div className="flex flex-wrap gap-1.5">
            {MOCK_API_EDITOR_ENDPOINTS.map((ep) => {
              const key = getOverrideKey(ep.method, ep.pathPattern);
              const isOverridden = overrideKeys.includes(key);
              const isSelected = selectedEndpoint?.key === ep.key;
              return (
                <button
                  key={ep.key}
                  type="button"
                  onClick={() => setSelectedEndpoint(ep)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    isSelected && isOverridden
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : isSelected
                        ? 'border-gray-400 bg-gray-100 text-gray-900'
                        : isOverridden
                          ? 'border-amber-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100',
                  ].join(' ')}
                >
                  <span>{ep.label}</span>
                  {isOverridden && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-amber-500"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!selectedEndpoint ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <p className="text-sm text-gray-500">
                Select a resource to view and edit its mock response.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Operation bar */}
              <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-green-700">
                    {selectedEndpoint.method}
                  </span>
                  <code className="truncate font-mono text-xs text-gray-500">
                    {selectedEndpoint.pathPattern}
                  </code>
                </div>
                {hasOverrideForSelected && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    overridden
                  </span>
                )}
              </div>

              {/* Action toolbar */}
              <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading || editorValue === null}
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  <Save className="h-3 w-3" />
                  Save override
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={loading}
                  className="h-7 gap-1.5 border-gray-300 px-3 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Upload className="h-3 w-3" />
                  Upload JSON
                </Button>
                {hasOverrideForSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetThisEndpoint}
                    disabled={loading}
                    className="h-7 gap-1.5 border-gray-300 px-3 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset this
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Error banners */}
              {(saveError || uploadError) && (
                <div className="flex-shrink-0 border-b border-red-100 bg-red-50 px-4 py-2">
                  <p className="text-xs text-red-600">
                    {uploadError ?? saveError}
                  </p>
                </div>
              )}

              {/* Editor body — relative+absolute gives JsonEditor a real pixel height */}
              <div className="relative min-h-0 flex-1">
                <div className="absolute inset-0 overflow-hidden">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-gray-500">Loading…</p>
                    </div>
                  ) : editorValue !== null ? (
                    <JsonEditorContainer
                      key={editorVersion}
                      initialValue={editorValue}
                      onValueChange={(v) => {
                        latestEditorValue.current = v;
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Uncontrolled JSON editor container.
 *
 * Uses `defaultValue` (not `value`) so the editor manages its own internal state
 * and is never reset mid-edit by a parent re-render. To load a new document,
 * change the `key` prop — this causes React to unmount and remount the container
 * with a fresh `defaultValue`.
 *
 * `onValueChange` is called on every edit so callers can capture the latest value
 * in a ref without depending on React state flush timing.
 */
function JsonEditorContainer({
  initialValue,
  onValueChange,
}: {
  initialValue: JsonValue;
  onValueChange: (v: JsonValue) => void;
}) {
  const [JsonEditor, setJsonEditor] = useState<React.ComponentType<{
    defaultValue?: JsonValue;
    onChange: (v: JsonValue) => void;
    height?: string;
    className?: string;
    style?: React.CSSProperties;
  }> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [textareaContent, setTextareaContent] = useState(() =>
    JSON.stringify(initialValue, null, 2)
  );

  useEffect(() => {
    import('@visual-json/react')
      .then((mod) => {
        setJsonEditor(
          () =>
            mod.JsonEditor as React.ComponentType<{
              defaultValue?: JsonValue;
              onChange: (v: JsonValue) => void;
              height?: string;
              className?: string;
              style?: React.CSSProperties;
            }>
        );
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 bg-amber-50 px-4 py-2">
          <p className="text-xs text-amber-700">
            Visual editor unavailable — editing raw JSON below
          </p>
        </div>
        <textarea
          className="min-h-0 flex-1 resize-none bg-white p-4 font-mono text-xs leading-relaxed text-gray-900 outline-none"
          value={textareaContent}
          onChange={(e) => {
            setTextareaContent(e.target.value);
            try {
              const next = JSON.parse(e.target.value) as JsonValue;
              onValueChange(next);
            } catch {
              // leave ref unchanged until valid JSON
            }
          }}
          spellCheck={false}
        />
      </div>
    );
  }

  if (!JsonEditor) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading editor…</p>
      </div>
    );
  }

  return (
    <JsonEditor
      defaultValue={initialValue}
      onChange={onValueChange}
      height="100%"
      className="absolute inset-0"
      style={{
        ['--vj-bg' as string]: '#ffffff',
        ['--vj-bg-panel' as string]: '#f9fafb',
        ['--vj-bg-hover' as string]: '#f3f4f6',
        ['--vj-bg-selected' as string]: '#dbeafe',
        ['--vj-bg-selected-muted' as string]: '#eff6ff',
        ['--vj-bg-match' as string]: '#fef9c3',
        ['--vj-bg-match-active' as string]: '#fde68a',
        ['--vj-border' as string]: '#e5e7eb',
        ['--vj-border-subtle' as string]: '#f3f4f6',
        ['--vj-text' as string]: '#111827',
        ['--vj-text-muted' as string]: '#6b7280',
        ['--vj-text-dim' as string]: '#9ca3af',
        ['--vj-text-dimmer' as string]: '#d1d5db',
        ['--vj-string' as string]: '#0369a1',
        ['--vj-number' as string]: '#047857',
        ['--vj-boolean' as string]: '#7c3aed',
        ['--vj-accent' as string]: '#2563eb',
        ['--vj-accent-muted' as string]: '#dbeafe',
        ['--vj-input-bg' as string]: '#ffffff',
        ['--vj-input-border' as string]: '#d1d5db',
        ['--vj-error' as string]: '#dc2626',
        ['--vj-font' as string]: "'ui-monospace', 'Cascadia Code', monospace",
      }}
    />
  );
}
