import { useState } from 'react';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { runA11yChecks } from '@/lib/a11y-checks';
import { calculateContrast } from '@/lib/color-contrast';

import { ContrastChecker } from './contrast-checker';
import { getValidColorPairs } from './theme-color-pairs';

interface ThemeA11yPanelProps {
  mergedTheme: EBThemeVariables;
}

export function ThemeA11yPanel({ mergedTheme }: ThemeA11yPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contrastFilter, setContrastFilter] = useState<
    'all' | 'failing' | 'aa-only'
  >('all');
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  // Summary stats for collapsed header
  const colorPairs = getValidColorPairs(mergedTheme);
  const contrastResults = colorPairs.map((pair) => ({
    ...pair,
    result: calculateContrast(pair.foregroundValue, pair.backgroundValue),
  }));
  const failingContrast = contrastResults.filter(
    (p) => !p.result || p.result.level === 'Fail'
  ).length;
  const a11ySummary = runA11yChecks(mergedTheme);
  const totalIssues = failingContrast + a11ySummary.failing;
  const hasIssues = totalIssues > 0;

  // Contrast-derived collections for the detailed section
  const failingPairs = contrastResults.filter(
    (p) => !p.result || p.result.level === 'Fail'
  );
  const aaOnlyPairs = contrastResults.filter(
    (p) =>
      p.result &&
      p.result.level === 'AA' &&
      p.result.passes.AAA.normal === false
  );

  const filteredPairs =
    contrastFilter === 'failing'
      ? failingPairs
      : contrastFilter === 'aa-only'
        ? aaOnlyPairs
        : contrastResults;

  const aaPassing = contrastResults.filter(
    (p) => p.result && p.result.passes.AA.normal
  ).length;
  const aaaPassing = contrastResults.filter(
    (p) => p.result && p.result.passes.AAA.normal
  ).length;

  return (
    <>
      <div className="mb-6 border-b border-gray-200 pb-6">
        {/* Header / summary toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex w-full items-center justify-between rounded-lg p-2.5 transition-colors ${
            hasIssues
              ? 'border border-red-200 bg-red-50 hover:bg-red-100'
              : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
          }`}
          aria-expanded={isExpanded}
          aria-controls="a11y-check-details"
        >
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsWarningDialogOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
              title="View warning about using generated theme JSON"
              aria-label="View warning about using generated theme JSON"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Warning: Use at Your Own Risk</span>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500">
                Experimental:
              </span>
              <span className="text-xs font-normal text-gray-900">
                Accessibility Check
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInfoDialogOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-500 ring-offset-background transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1"
                aria-label="Learn how accessibility checks work"
              >
                <Info className="h-3 w-3" />
                <span>How this works</span>
              </button>
            </div>
            {!isExpanded && (
              <span
                className={`text-xs ${
                  hasIssues ? 'font-medium text-red-700' : 'text-gray-600'
                }`}
              >
                {hasIssues
                  ? `⚠ ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found`
                  : '✓ All checks passing'}
              </span>
            )}
          </div>
          <div className="ml-2 flex flex-shrink-0 items-center gap-2">
            {!isExpanded && hasIssues && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {totalIssues}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div id="a11y-check-details" className="mt-4 space-y-4">
            {/* A11y Checks Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Theme checks (font, spacing, focus, radius)
                    </div>
                    <span className="font-medium text-gray-900">
                      Overall status:
                    </span>{' '}
                    {a11ySummary.failing > 0 ? (
                      <span className="text-red-600">
                        ⚠ {a11ySummary.failing} issues
                      </span>
                    ) : a11ySummary.warnings > 0 ? (
                      <span className="text-amber-600">
                        ⚠ {a11ySummary.warnings} warnings
                      </span>
                    ) : (
                      <span className="text-green-600">
                        ✓ All checks passing
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {a11ySummary.passing} pass, {a11ySummary.warnings} warnings,{' '}
                  {a11ySummary.failing} fail
                </div>
              </div>

              {/* A11y Check Results */}
              <div className="space-y-2">
                {a11ySummary.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`rounded-lg border p-3 ${
                      check.status === 'pass'
                        ? 'border-green-200 bg-green-50'
                        : check.status === 'warning'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {check.status === 'pass' ? (
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {check.label}
                        </div>
                        <div className="mt-1 text-xs text-gray-700">
                          {check.message}
                        </div>
                        {check.recommendation && (
                          <div className="mt-2 text-xs italic text-gray-600">
                            💡 {check.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contrast Checker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Color Contrast
                  </h4>
                  <p className="mt-1 text-xs text-gray-600">
                    WCAG 2.1 Level AA (4.5:1) and AAA (7:1) compliance
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  {aaPassing}/{colorPairs.length} pass AA, {aaaPassing}/
                  {colorPairs.length} pass AAA
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={contrastFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContrastFilter('all')}
                  className="text-xs"
                >
                  All ({colorPairs.length})
                </Button>
                <Button
                  variant={contrastFilter === 'failing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContrastFilter('failing')}
                  className="text-xs"
                >
                  Failing ({failingPairs.length})
                </Button>
                <Button
                  variant={contrastFilter === 'aa-only' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setContrastFilter('aa-only')}
                  className="text-xs"
                >
                  AA Only ({aaOnlyPairs.length})
                </Button>
              </div>

              {/* Contrast Results */}
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {filteredPairs.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                    No color pairs found matching the filter
                  </div>
                ) : (
                  filteredPairs.map((pair) => (
                    <ContrastChecker
                      key={`${pair.background}-${pair.foreground}`}
                      foreground={pair.foregroundValue}
                      background={pair.backgroundValue}
                      label={pair.label}
                      textSize={pair.textSize}
                      showRatio={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Accessibility checks in this panel
            </DialogTitle>
            <DialogDescription>
              How we evaluate your theme for basic accessibility and color
              contrast.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-800">
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-900">
                1. Theme checks (non-visual)
              </h4>
              <p className="text-xs text-gray-700">
                We run a small set of heuristic checks on your theme tokens via{' '}
                <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">
                  runA11yChecks
                </code>
                , including:
              </p>
              <ul className="ml-4 mt-1 list-disc text-xs text-gray-700">
                <li>
                  Actionable font size vs. 14px/16px readability thresholds.
                </li>
                <li>Form label font size for minimum legibility.</li>
                <li>Touch target spacing based on your spacing unit.</li>
                <li>
                  Extremely large border radius that can reduce control clarity.
                </li>
              </ul>
              <p className="mt-1 text-xs text-gray-600">
                These checks are opinionated guidance, not a complete WCAG
                audit.
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-900">
                2. Color contrast checks
              </h4>
              <p className="text-xs text-gray-700">
                We compute contrast ratios for a curated set of semantic color
                pairs (e.g. primary button, secondary button, status messages)
                using the WCAG 2.1 formula:
              </p>
              <ul className="ml-4 mt-1 list-disc text-xs text-gray-700">
                <li>AA normal text: 4.5:1, large text: 3:1.</li>
                <li>AAA normal text: 7:1, large text: 4.5:1.</li>
                <li>
                  Filters let you focus on{' '}
                  <span className="font-medium">Failing</span> pairs or{' '}
                  <span className="font-medium">AA Only</span> (passes AA but
                  not AAA).
                </li>
              </ul>
              <p className="mt-1 text-xs text-gray-600">
                The pairs come from theme tokens (like semantic button/status
                colors), so real screens should still be validated with an
                end-to-end a11y audit for your product.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning dialog */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              ⚠️ Warning: Use Generated Theme JSON at Your Own Risk
            </DialogTitle>
            <DialogDescription>
              Important information about using theme data generated from this
              tool
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-3">
                The theme JSON and instructions provided in this tool (including
                AI-generated, manually customized, or imported themes) are
                intended for reference and experimentation purposes only. The
                maintainers of this tool do not assume any responsibility for
                any issues, damages, or losses that may arise from the use of
                generated theme data.
              </p>
              <p className="mb-2 font-medium">
                By using this tool, you acknowledge that:
              </p>
              <ul className="mb-3 ml-2 list-inside list-disc space-y-2">
                <li>
                  Generated theme JSON (whether AI-generated, manually created,
                  or imported) may contain errors, inaccuracies, or incomplete
                  design tokens
                </li>
                <li>
                  The extracted or customized tokens may not accurately
                  represent the intended design system or may not be suitable
                  for production use without additional validation and hardening
                </li>
                <li>
                  You are responsible for reviewing, validating, and testing any
                  theme data before deploying it to production
                </li>
              </ul>
              <p className="text-xs text-amber-800">
                Always run your own accessibility, design, and engineering
                reviews before adopting the generated tokens in a production
                system.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
