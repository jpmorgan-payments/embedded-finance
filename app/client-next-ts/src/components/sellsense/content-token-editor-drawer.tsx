'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Search, Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EBConfig } from '@jpmorgan-payments/embedded-finance-components';

// Import JSON files from local i18n directory
const i18nModules = import.meta.glob('../../i18n/en-US/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, any>;

interface ContentTokenEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onContentTokensChange: (tokens: EBConfig['contentTokens']) => void;
}

interface FlattenedToken {
  key: string;
  value: string;
  namespace: string;
  annotationNumber?: number;
  domElement?: Element | null;
  isChanged?: boolean;
}

interface Annotation {
  id: string;
  element: Element;
  number: number;
  namespace: string;
  key: string;
}

// Namespace color mapping
const NAMESPACE_COLORS: Record<string, string> = {
  'make-payment': '#3b82f6', // blue
  'linked-accounts': '#10b981', // green
  accounts: '#f59e0b', // amber
  recipients: '#8b5cf6', // purple
  transactions: '#ef4444', // red
  onboarding: '#06b6d4', // cyan
  'onboarding-overview': '#14b8a6', // teal
  common: '#6b7280', // gray
  'bank-account-form': '#ec4899', // pink
  validation: '#6366f1', // indigo
};

// Flatten nested object to dot notation
function flattenObject(
  obj: any,
  prefix = '',
  namespace = '',
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(flattened, flattenObject(value, newKey, namespace));
      } else if (typeof value === 'string') {
        const fullKey = namespace ? `${namespace}.${newKey}` : newKey;
        flattened[fullKey] = value;
      }
    }
  }

  return flattened;
}

/**
 * Load and flatten all content tokens from local JSON files
 */
function loadAllContentTokens(): Record<string, string> {
  const namespaces = [
    'accounts',
    'bank-account-form',
    'common',
    'linked-accounts',
    'make-payment',
    'onboarding-overview',
    'onboarding',
    'recipients',
    'transactions',
    'validation',
  ];

  const allTokens: Record<string, string> = {};

  if (Object.keys(i18nModules).length === 0) {
    console.warn('No i18n modules found');
    return allTokens;
  }

  for (const namespace of namespaces) {
    const fileName =
      namespace === 'onboarding' ? 'onboarding.json' : `${namespace}.json`;
    const moduleKey = Object.keys(i18nModules).find((key) =>
      key.includes(`/${fileName}`),
    );

    if (moduleKey && i18nModules[moduleKey]) {
      const tokens = i18nModules[moduleKey];
      const flattened = flattenObject(tokens, '', namespace);
      Object.assign(allTokens, flattened);
    }
  }

  return allTokens;
}

/**
 * Normalize text for comparison (trim, collapse whitespace, replace non-breaking spaces)
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ');
}

/**
 * Check if element is visible in the DOM
 */
function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.getAttribute('aria-hidden') !== 'true'
  );
}

/**
 * Extract visible text nodes from the DOM
 */
function extractVisibleText(): Array<{ text: string; element: Element }> {
  const textNodes: Array<{ text: string; element: Element }> = [];
  const skipTags = ['script', 'style', 'noscript', 'meta', 'link', 'title'];

  function walkNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeText(node.textContent || '');
      if (text.length > 0) {
        let parent = node.parentElement;
        while (parent) {
          if (isElementVisible(parent)) {
            textNodes.push({ text, element: parent });
            break;
          }
          parent = parent.parentElement;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      if (!skipTags.includes(tagName)) {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNode(node.childNodes[i]);
        }
      }
    }
  }

  const mainContent = document.querySelector('main') || document.body;
  walkNode(mainContent);
  return textNodes;
}

/**
 * Match content tokens to DOM elements by text content
 */
function matchTokensToDOM(
  tokens: Record<string, string>,
): Map<string, FlattenedToken> {
  const matched = new Map<string, FlattenedToken>();
  const visibleTexts = extractVisibleText();
  const textToElements = new Map<string, Element[]>();

  // Group elements by normalized text
  visibleTexts.forEach(({ text, element }) => {
    if (!textToElements.has(text)) {
      textToElements.set(text, []);
    }
    textToElements.get(text)!.push(element);
  });

  let annotationNumber = 1;

  Object.entries(tokens).forEach(([key, value]) => {
    const normalizedValue = normalizeText(value);
    const elements = textToElements.get(normalizedValue) || [];

    if (elements.length > 0) {
      const namespace = key.split('.')[0];
      matched.set(key, {
        key,
        value,
        namespace,
        annotationNumber: annotationNumber++,
        domElement: elements[0],
      });
    }
  });

  return matched;
}

/**
 * Build nested token structure from flattened tokens
 */
function buildNestedTokens(
  flatTokens: Record<string, string>,
): EBConfig['contentTokens'] {
  const nested: EBConfig['contentTokens'] = {
    name: 'enUS',
    tokens: {},
  };

  Object.entries(flatTokens).forEach(([key, value]) => {
    const parts = key.split('.');
    const namespace = parts[0];
    const path = parts.slice(1);

    if (!(nested.tokens as Record<string, any>)[namespace]) {
      (nested.tokens as Record<string, any>)[namespace] = {};
    }

    let current: any = (nested.tokens as Record<string, any>)[namespace];
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  });

  return nested;
}

/**
 * Disambiguate duplicate token values by injecting numbered test tokens
 */
async function disambiguateTokens(
  tokens: Record<string, string>,
  onUpdate: (tokens: EBConfig['contentTokens']) => void,
): Promise<Map<string, FlattenedToken>> {
  // Find duplicate values
  const valueToKeys = new Map<string, string[]>();
  Object.entries(tokens).forEach(([key, value]) => {
    const normalized = normalizeText(value);
    if (!valueToKeys.has(normalized)) {
      valueToKeys.set(normalized, []);
    }
    valueToKeys.get(normalized)!.push(key);
  });

  const duplicates = Array.from(valueToKeys.entries()).filter(
    ([, keys]) => keys.length > 1,
  );

  if (duplicates.length === 0) {
    return matchTokensToDOM(tokens);
  }

  // Create numbered versions for disambiguation
  const testTokens: Record<string, string> = { ...tokens };
  duplicates.forEach(([value, keys]) => {
    keys.forEach((key, index) => {
      testTokens[key] = `${value} [${index + 1}]`;
    });
  });

  // Inject test tokens and wait for DOM update
  onUpdate(buildNestedTokens(testTokens));

  // Wait for DOM to update
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Now match with numbered values
  const visibleTexts = extractVisibleText();
  const matched = new Map<string, FlattenedToken>();
  let annotationNumber = 1;

  Object.entries(testTokens).forEach(([key, testValue]) => {
    const normalizedTestValue = normalizeText(testValue);
    const matchingElements = visibleTexts.filter(
      ({ text }) => text === normalizedTestValue,
    );

    if (matchingElements.length > 0) {
      const namespace = key.split('.')[0];
      matched.set(key, {
        key,
        value: tokens[key], // Use original value
        namespace,
        annotationNumber: annotationNumber++,
        domElement: matchingElements[0].element,
      });
    }
  });

  // Restore original tokens
  onUpdate(buildNestedTokens(tokens));
  await new Promise((resolve) => setTimeout(resolve, 300));

  return matched;
}

/**
 * Content Token Editor Drawer
 *
 * Interactive drawer for analyzing and editing content tokens visible on the page.
 * Features:
 * - Scans DOM for visible content tokens
 * - Annotates matched elements with numbered badges
 * - Allows live editing of token values
 * - Exports only changed tokens as JSON
 */
export function ContentTokenEditorDrawer({
  isOpen,
  onClose,
  onContentTokensChange,
}: ContentTokenEditorDrawerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [matchedTokens, setMatchedTokens] = useState<
    Map<string, FlattenedToken>
  >(new Map());
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editedTokens, setEditedTokens] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const allTokensRef = useRef<Record<string, string>>({});

  // Load tokens when drawer opens
  useEffect(() => {
    if (isOpen && Object.keys(allTokensRef.current).length === 0) {
      setIsLoadingTokens(true);
      const tokens = loadAllContentTokens();
      allTokensRef.current = tokens;
      setEditedTokens({});
      setIsLoadingTokens(false);
    }
  }, [isOpen]);

  // Analyze button handler
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Ensure tokens are loaded
      if (Object.keys(allTokensRef.current).length === 0) {
        const tokens = loadAllContentTokens();
        allTokensRef.current = tokens;
      }

      const tokens = allTokensRef.current;

      if (Object.keys(tokens).length === 0) {
        alert(
          'No content tokens loaded. Please check the browser console for errors.',
        );
        return;
      }

      // Try simple matching first
      let matched = matchTokensToDOM(tokens);

      // Check for duplicates and disambiguate if needed
      const hasDuplicates = Array.from(matched.values()).some(
        (token) =>
          Array.from(matched.values()).filter(
            (t) => normalizeText(t.value) === normalizeText(token.value),
          ).length > 1,
      );

      if (hasDuplicates) {
        matched = await disambiguateTokens(tokens, onContentTokensChange);
      }

      setMatchedTokens(matched);

      // Create annotations
      const newAnnotations: Annotation[] = [];
      matched.forEach((token, key) => {
        if (token.domElement && token.annotationNumber) {
          newAnnotations.push({
            id: `annotation-${token.annotationNumber}`,
            element: token.domElement,
            number: token.annotationNumber,
            namespace: token.namespace,
            key,
          });
        }
      });
      setAnnotations(newAnnotations);
    } catch (error) {
      console.error('Error analyzing content tokens:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onContentTokensChange]);

  // Update annotation positions on scroll/resize
  useEffect(() => {
    if (annotations.length === 0) return;

    let rafId: number;
    const updatePositions = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        setAnnotations((prev) => prev.map((a) => ({ ...a })));
      });
    };

    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePositions, 16);
    };

    window.addEventListener('scroll', throttledUpdate, true);
    window.addEventListener('resize', throttledUpdate);

    return () => {
      window.removeEventListener('scroll', throttledUpdate, true);
      window.removeEventListener('resize', throttledUpdate);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(timeoutId);
    };
  }, [annotations.length]);

  // Handle token edit
  const handleTokenEdit = useCallback(
    (key: string, newValue: string) => {
      const updated = { ...editedTokens, [key]: newValue };
      setEditedTokens(updated);

      // Merge original and edited tokens, then build nested structure
      const allCurrentTokens = { ...allTokensRef.current, ...updated };
      const nestedTokens = buildNestedTokens(allCurrentTokens);
      onContentTokensChange(nestedTokens);
    },
    [editedTokens, onContentTokensChange],
  );

  // Export changed tokens
  const handleExport = useCallback(() => {
    const changed = buildNestedTokens(editedTokens);
    const json = JSON.stringify(changed, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editedTokens]);

  // Filter tokens by search
  const filteredTokens = useMemo(() => {
    if (!searchQuery) {
      return Array.from(matchedTokens.entries());
    }

    const query = searchQuery.toLowerCase();
    return Array.from(matchedTokens.entries()).filter(
      ([key, token]) =>
        key.toLowerCase().includes(query) ||
        token.value.toLowerCase().includes(query),
    );
  }, [matchedTokens, searchQuery]);

  // Cleanup on drawer close
  useEffect(() => {
    if (!isOpen) {
      setAnnotations([]);
      setMatchedTokens(new Map());
      setEditedTokens({});
      setSearchQuery('');
      allTokensRef.current = {};
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer - slides in from right alongside content */}
      <div
        className={`fixed right-0 w-[600px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: '4rem',
          bottom: 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Content Token Editor
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Components'}
              </Button>
              <Button
                onClick={handleExport}
                disabled={Object.keys(editedTokens).length === 0}
                variant="outline"
                className="flex-shrink-0"
                title="Export changed tokens as JSON"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {isLoadingTokens ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p>Loading content tokens...</p>
              </div>
            ) : matchedTokens.size === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Analyze Components" to scan for content tokens</p>
                {Object.keys(allTokensRef.current).length === 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    Warning: No tokens loaded. Check console for errors.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTokens.map(([key, token]) => {
                  const editedValue = editedTokens[key] ?? token.value;
                  const isChanged = editedValue !== token.value;
                  const color = NAMESPACE_COLORS[token.namespace] || '#6b7280';

                  return (
                    <div
                      key={key}
                      className={`p-3 border rounded-lg ${
                        isChanged
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: color }}
                        >
                          {token.annotationNumber || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-1 font-mono truncate">
                            {key}
                          </div>
                          <input
                            type="text"
                            value={editedValue}
                            onChange={(e) =>
                              handleTokenEdit(key, e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={token.value}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {Object.keys(editedTokens).length > 0 ? (
                <span className="font-medium text-gray-900">
                  {Object.keys(editedTokens).length} token(s) changed
                </span>
              ) : (
                <span>No changes</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Annotation Overlays */}
      {annotations.map((annotation) => {
        try {
          if (!annotation.element || !document.contains(annotation.element)) {
            return null;
          }

          const rect = annotation.element.getBoundingClientRect();
          const color = NAMESPACE_COLORS[annotation.namespace] || '#6b7280';

          // Only render if element is visible
          if (rect.width === 0 || rect.height === 0) {
            return null;
          }

          return (
            <div
              key={annotation.id}
              className="fixed pointer-events-none z-[60]"
              style={{
                left: `${rect.right}px`,
                top: `${rect.top}px`,
                transform: 'translate(8px, -50%)',
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-white"
                style={{ backgroundColor: color }}
                title={`${annotation.key}: ${annotation.namespace}`}
              >
                {annotation.number}
              </div>
            </div>
          );
        } catch (error) {
          // Element may have been removed from DOM
          return null;
        }
      })}
    </>
  );
}
