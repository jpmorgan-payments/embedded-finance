'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Info, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AiPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// AI Prompt template for extracting design tokens
const AI_PROMPT_TEMPLATE = (websiteUrl?: string) => {
  const sourceSection = websiteUrl?.trim()
    ? `\n## Source Material\n\nPlease analyze the following website and extract its design tokens:\n${websiteUrl}\n\n`
    : '\n## Source Material\n\nPlease analyze the provided source material (website URL, screenshots, brand folios, design files, or other branded assets) and extract its design tokens.\n\n';

  return `I need help extracting design tokens from branded assets to create a theme configuration.${sourceSection}Please analyze the design system and extract the following design tokens in JSON format.

## Design Token Categories

### Typography
- **Font Families**: contentFontFamily, textHeadingFontFamily, actionableFontFamily
- **Font Properties**: actionableFontWeight (100-900), actionableFontSize (rem), actionableLineHeight (rem), actionableTextTransform (none/uppercase/lowercase), actionableLetterSpacing (em)
- **Label Typography**: editableLabelFontSize (rem), editableLabelFontWeight (100-900), editableLabelLineHeight (rem)

### Colors - Container & Backgrounds
- **Container**: containerPrimaryBackground, containerCardBackground, containerPrimaryForeground, containerSecondaryBackground, containerSecondaryForeground
- **Overlay**: overlayableBackground, overlayableForeground, overlayableZIndex (number)
- **Accent**: accentBackground, contentAccentForeground

### Colors - Interactive Elements (Actionable)
- **Accented Bold (Primary Buttons)**: actionableAccentedBoldBackground, actionableAccentedBoldBackgroundHover, actionableAccentedBoldBackgroundActive, actionableAccentedBoldForeground, actionableAccentedBoldForegroundHover, actionableAccentedBoldForegroundActive, actionableAccentedBoldBorderWidth (px), actionableAccentedBoldFontWeight (100-900)
- **Subtle (Secondary/Outline Buttons)**: actionableSubtleBackground (often "transparent" or rgba), actionableSubtleBackgroundHover, actionableSubtleBackgroundActive, actionableSubtleForeground, actionableSubtleForegroundHover, actionableSubtleForegroundActive, actionableSubtleBorderWidth (px), actionableSubtleFontWeight (100-900)
- **Negative Bold (Destructive Buttons)**: actionableNegativeBoldBackground, actionableNegativeBoldBackgroundHover, actionableNegativeBoldBackgroundActive, actionableNegativeBoldForeground, actionableNegativeBoldForegroundHover, actionableNegativeBoldForegroundActive, actionableNegativeBoldBorderWidth (px), actionableNegativeBoldFontWeight (100-900)

### Colors - Form Inputs (Editable)
- **Input Styling**: editableBackground, editableBorderColor, editableBorderRadius (px), editableLabelForeground

### Colors - Status & Sentiment
- **Status**: statusInfoForeground, statusInfoAccentBackground, statusErrorForegroundInformative, statusErrorBackground, statusSuccessForeground, statusSuccessAccentBackground, statusWarningForeground, statusWarningAccentBackground
- **Sentiment**: sentimentNegativeAccentBackground, sentimentCautionForeground, sentimentCautionAccentBackground, sentimentPositiveForeground, sentimentPositiveAccentBackground

### Colors - Navigation
- **Navigable**: navigableBackground, navigableForeground, navigableAccentBackground, navigableAccentForeground

### Layout & Spacing
- **Borders**: separableBorderColor, separableBorderRadius (px)
- **Spacing**: spacingUnit (rem, typically 0.25rem)
- **Border Radius**: actionableBorderRadius (em or px)

### Focus & Interaction
- **Focus**: focusedRingColor
- **Interaction**: actionableShiftOnActive (boolean)

## Expected JSON Format

Return a JSON object with the following structure. Use hex colors (#rrggbb), rgba() for transparent backgrounds, rem/em/px units as specified, and numeric values where indicated:

\`\`\`json
{
  "contentFontFamily": "Inter, system-ui, sans-serif",
  "textHeadingFontFamily": "Inter, system-ui, sans-serif",
  "actionableFontFamily": "Inter, system-ui, sans-serif",
  "actionableFontWeight": "500",
  "actionableFontSize": "0.875rem",
  "actionableLineHeight": "1.25rem",
  "actionableTextTransform": "none",
  "actionableLetterSpacing": "0em",
  "actionableAccentedBoldFontWeight": "600",
  "actionableSubtleFontWeight": "500",
  "actionableShiftOnActive": true,
  "actionableBorderRadius": "0.313em",
  "editableBorderRadius": "6px",
  "editableLabelFontSize": "0.875rem",
  "editableLabelFontWeight": "500",
  "editableLabelLineHeight": "1.25rem",
  "separableBorderRadius": "8px",
  "spacingUnit": "0.25rem",
  "overlayableZIndex": 1000,
  "containerPrimaryBackground": "#ffffff",
  "containerCardBackground": "#ffffff",
  "containerPrimaryForeground": "#1e293b",
  "containerSecondaryBackground": "#f8fafc",
  "containerSecondaryForeground": "#64748b",
  "contentPrimaryForeground": "#1e293b",
  "overlayableBackground": "#ffffff",
  "overlayableForeground": "#1e293b",
  "accentBackground": "#f1f5f9",
  "contentAccentForeground": "#475569",
  "editableBackground": "#ffffff",
  "editableBorderColor": "#d1d5db",
  "editableLabelForeground": "#374151",
  "separableBorderColor": "#e2e8f0",
  "actionableAccentedBoldBackground": "#0060f0",
  "actionableAccentedBoldBackgroundHover": "#0a4386",
  "actionableAccentedBoldBackgroundActive": "#083366",
  "actionableAccentedBoldForeground": "#ffffff",
  "actionableAccentedBoldForegroundHover": "#f8fafc",
  "actionableAccentedBoldForegroundActive": "#f1f5f9",
  "actionableAccentedBoldBorderWidth": "0px",
  "actionableSubtleBackground": "transparent",
  "actionableSubtleBackgroundHover": "rgba(0, 96, 240, 0.08)",
  "actionableSubtleBackgroundActive": "rgba(0, 96, 240, 0.12)",
  "actionableSubtleForeground": "#0060f0",
  "actionableSubtleForegroundHover": "#0a4386",
  "actionableSubtleForegroundActive": "#083366",
  "actionableSubtleBorderWidth": "1px",
  "focusedRingColor": "#0060f0",
  "actionableNegativeBoldBackground": "#ef4444",
  "actionableNegativeBoldBackgroundHover": "#dc2626",
  "actionableNegativeBoldBackgroundActive": "#b91c1c",
  "actionableNegativeBoldForeground": "#ffffff",
  "actionableNegativeBoldForegroundHover": "#fef2f2",
  "actionableNegativeBoldForegroundActive": "#fee2e2",
  "actionableNegativeBoldBorderWidth": "0px",
  "actionableNegativeBoldFontWeight": "600",
  "sentimentNegativeAccentBackground": "#fee2e2",
  "sentimentCautionForeground": "#f59e0b",
  "sentimentCautionAccentBackground": "#fef3c7",
  "sentimentPositiveForeground": "#10b981",
  "sentimentPositiveAccentBackground": "#d1fae5",
  "statusInfoForeground": "#0ea5e9",
  "statusInfoAccentBackground": "#e0f2fe",
  "statusErrorForegroundInformative": "#dc2626",
  "statusErrorBackground": "#fee2e2",
  "statusSuccessForeground": "#10b981",
  "statusSuccessAccentBackground": "#d1fae5",
  "statusWarningForeground": "#f59e0b",
  "statusWarningAccentBackground": "#fef3c7",
  "navigableBackground": "#ffffff",
  "navigableForeground": "#1e293b",
  "navigableAccentBackground": "#f1f5f9",
  "navigableAccentForeground": "#475569"
}
\`\`\`

## Instructions

**CRITICAL: Only include tokens that can be directly observed or derived from the source material.**

1. **ONLY extract tokens you can actually see or infer from the source material**:
   - If a color, font, spacing, or other property is not visible in the source material, DO NOT include it in the JSON
   - DO NOT use default values, placeholder values, or guess values
   - DO NOT include tokens with undefined, null, or placeholder values
   - If you cannot determine a specific token value from the source material, omit that token entirely from the JSON object

2. Analyze the design system's color scheme, typography, spacing, and interactive element styling:
   - Extract colors from buttons (primary, secondary, destructive), backgrounds, text, borders
   - Identify font families, weights, sizes, and line heights that are actually used
   - Note border radius values, spacing units, and focus ring colors that are visible
   - Map hover and active states for interactive elements that you can observe

3. **Return ONLY valid JSON**:
   - No markdown code blocks, no explanations, just the JSON object
   - Use consistent color formats (hex for solid colors, rgba() for transparency)
   - Include only tokens with actual values derived from the source material
   - If a token category (e.g., hover states, active states) is not observable, omit those tokens

4. **Example of what NOT to do**:
   - DO NOT include: "actionableAccentedBoldBackground": "#0060f0" if you cannot see this color in the source material
   - DO NOT include: "actionableFontWeight": "500" if you cannot determine the font weight
   - DO NOT include: tokens with placeholder values like "undefined", "null", or example values

5. **Example of what TO do**:
   - If you can see a primary button with blue background #0060f0, include: "actionableAccentedBoldBackground": "#0060f0"
   - If you can observe the font family used, include: "contentFontFamily": "Inter, sans-serif"
   - If you cannot determine a value, simply omit that token from the JSON

**Remember: A smaller, accurate JSON object with only observable tokens is far better than a complete JSON with guessed or default values.**

Please extract ONLY the design tokens you can directly observe from the provided source material (website, screenshots, brand folios, design files, or other branded assets) and return them in valid JSON format.`;
};

export function AiPromptDialog({ isOpen, onClose }: AiPromptDialogProps) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  // Generate prompt with website URL if provided
  const aiPrompt = useMemo(() => AI_PROMPT_TEMPLATE(websiteUrl), [websiteUrl]);

  // Copy prompt to clipboard
  const copyPromptToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setIsPromptCopied(true);
      setTimeout(() => {
        setIsPromptCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  }, [aiPrompt]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-700" />
            Extract Design Tokens with AI
          </DialogTitle>
          <DialogDescription>
            Copy this prompt and use it with any AI assistant to extract design
            tokens from websites, screenshots, brand folios, design files, or
            other branded assets.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 p-6">
            {/* Website URL Input */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="website-url"
                className="text-sm font-medium text-gray-900"
              >
                Website URL (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                />
                {websiteUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setWebsiteUrl('')}
                    className="h-9 w-9 text-gray-400 hover:text-gray-600"
                    title="Clear URL"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Enter a website URL to include it in the prompt, or leave empty
                to provide the source (URL, screenshots, brand folios, design
                files, etc.) manually to the AI assistant.
              </p>
            </div>

            {/* Prompt Text Area */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-900">
                  AI Prompt
                </Label>
                <Button
                  variant={isPromptCopied ? 'default' : 'outline'}
                  size="sm"
                  onClick={copyPromptToClipboard}
                  className="flex items-center gap-2"
                  disabled={isPromptCopied}
                >
                  {isPromptCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[250px] rounded-lg border border-gray-200 bg-gray-50">
                <div className="p-4">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800">
                    {aiPrompt}
                  </pre>
                </div>
              </ScrollArea>
            </div>

            {/* Usage Instructions */}
            <div className="flex-shrink-0 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1 text-xs text-blue-900">
                  <p className="mb-1 font-medium">How to use:</p>
                  <ol className="list-inside list-decimal space-y-1 text-blue-800">
                    <li>
                      Enter a website URL above (optional) or leave empty to
                      provide the source manually
                    </li>
                    <li>
                      Copy the prompt above using the "Copy Prompt" button
                    </li>
                    <li>
                      Paste the prompt into your preferred AI assistant along
                      with your source material (website URL, screenshots, brand
                      folios, design files, or other branded assets)
                    </li>
                    <li>
                      The AI will extract design tokens and return JSON format
                    </li>
                    <li>
                      Copy the JSON response and use "Import from Clipboard" in
                      this drawer
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Warning Dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              ⚠️ Warning: Use AI-Generated Theme JSON at Your Own Risk
            </DialogTitle>
            <DialogDescription>
              Important information about using AI-generated theme data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-3">
                The AI-generated theme JSON and instructions provided in this
                tool are intended for reference and experimentation purposes
                only. The maintainers of this tool do not assume any
                responsibility for any issues, damages, or losses that may arise
                from the use of AI-generated theme data.
              </p>
              <p className="mb-2 font-medium">
                By using this tool, you acknowledge that:
              </p>
              <ul className="mb-3 ml-2 list-inside list-disc space-y-2">
                <li>
                  AI-generated theme JSON may contain errors, inaccuracies, or
                  incomplete design tokens
                </li>
                <li>
                  The extracted tokens may not accurately represent the source
                  material's design system
                </li>
                <li>
                  There are no guarantees regarding the accuracy, completeness,
                  or suitability of the generated theme JSON for any particular
                  purpose
                </li>
                <li>
                  You should validate and test all imported theme data before
                  using it in production
                </li>
                <li>
                  You are solely responsible for reviewing, validating, and any
                  consequences resulting from the use of AI-generated theme JSON
                  in your projects
                </li>
              </ul>
              <p className="font-medium">
                Please proceed with caution and ensure you understand the
                implications of using AI-generated theme data. Always validate
                the results and test thoroughly before deploying to production.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
