'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EBConfig } from '@jpmorgan-payments/embedded-finance-components';
import { defaultResources } from '@jpmorgan-payments/embedded-finance-components/i18n/config';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Hand,
  Languages,
  MousePointer2,
  MousePointerClick,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

// Available language options
const LANGUAGE_OPTIONS = [
  { value: 'enUS', label: 'English (US)' },
  { value: 'frCA', label: 'French (Canada)' },
  { value: 'esUS', label: 'Spanish (US)' },
] as const;

interface ContentTokenEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onContentTokensChange: (tokens: EBConfig['contentTokens']) => void;
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
  topOffset?: string; // CSS value for top position (e.g., '4rem' or '13rem')
}

interface FlattenedToken {
  key: string;
  fullKey: string; // namespace:key format for matching data-content-token
  value: string;
  namespace: string;
  annotationNumber?: number;
  domElement?: Element | null;
  domElements?: Element[]; // All DOM elements with this token (for duplicates)
  duplicateCount?: number; // Number of duplicates
  isChanged?: boolean;
  isOnPage?: boolean; // Whether the token is currently visible in the DOM
}

interface Annotation {
  id: string;
  element: Element;
  elements?: Element[]; // All elements for this token (for duplicates)
  number: number;
  namespace: string;
  key: string;
  fullKey: string;
  duplicateCount?: number;
  duplicateIndex?: number; // 1-based index within duplicates (e.g., 1 of 3)
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
  'client-details': '#f97316', // orange
};

/**
 * Flatten a nested object into dot-notation keys
 * e.g., { labels: { name: "Name" } } => { "labels.name": "Name" }
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenObject(value as Record<string, unknown>, newKey)
      );
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }

  return result;
}

interface TokenValueResult {
  value: string | undefined;
  isFallback: boolean; // True if using English fallback because language doesn't have this token
}

/**
 * Get the default value for a token from the i18n files
 * Token format: "namespace:path.to.key" (e.g., "client-details:labels.doingBusinessAs")
 * Returns value and whether it's using English fallback
 */
function getDefaultTokenValue(
  tokenId: string,
  language: string
): TokenValueResult {
  const colonIndex = tokenId.indexOf(':');
  if (colonIndex === -1) return { value: undefined, isFallback: false };

  const namespace = tokenId.substring(0, colonIndex);
  const path = tokenId.substring(colonIndex + 1);

  // Get the i18n data for this language from defaultResources
  const langData = defaultResources[language as keyof typeof defaultResources];
  const namespaceData = langData?.[namespace as keyof typeof langData] as
    | Record<string, unknown>
    | undefined;

  if (!namespaceData) {
    // Fallback to enUS if namespace not found in selected language
    const fallbackData = defaultResources.enUS?.[
      namespace as keyof typeof defaultResources.enUS
    ] as Record<string, unknown> | undefined;
    if (!fallbackData) return { value: undefined, isFallback: false };
    const flattened = flattenObject(fallbackData);
    return { value: flattened[path], isFallback: language !== 'enUS' };
  }

  const flattened = flattenObject(namespaceData);
  const value = flattened[path];

  // If value not found in selected language, try English
  if (value === undefined && language !== 'enUS') {
    const fallbackData = defaultResources.enUS?.[
      namespace as keyof typeof defaultResources.enUS
    ] as Record<string, unknown> | undefined;
    if (fallbackData) {
      const fallbackFlattened = flattenObject(fallbackData);
      const fallbackValue = fallbackFlattened[path];
      if (fallbackValue !== undefined) {
        return { value: fallbackValue, isFallback: true };
      }
    }
  }

  return { value, isFallback: false };
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
 * Scan DOM for elements with data-content-token attribute
 * Uses the DOM as the source of truth - any element with data-content-token is editable
 * Returns a Map of tokens found in the DOM, tracking duplicates
 */
function scanDOMForEditableTokens(): Map<string, FlattenedToken> {
  const tokens = new Map<string, FlattenedToken>();

  // Search entire document body (including portals where dialogs render)
  const elements = document.body.querySelectorAll('[data-content-token]');

  let annotationNumber = 1;

  elements.forEach((element) => {
    const tokenId = element.getAttribute('data-content-token');
    if (tokenId && isElementVisible(element)) {
      // data-content-token format is "namespace:path" (e.g., "client-details:labels.doingBusinessAs")
      // Extract namespace from the token ID (before the colon)
      const colonIndex = tokenId.indexOf(':');
      const namespace =
        colonIndex > -1 ? tokenId.substring(0, colonIndex) : 'unknown';

      // Get the current text content as the value
      const textContent = element.textContent?.trim() || '';

      // Check if this token already exists (duplicate)
      const existing = tokens.get(tokenId);
      if (existing) {
        // Add to existing token's elements array
        existing.domElements = existing.domElements || [existing.domElement!];
        existing.domElements.push(element);
        existing.duplicateCount = existing.domElements.length;
      } else {
        // New token
        tokens.set(tokenId, {
          key: tokenId,
          fullKey: tokenId,
          value: textContent,
          namespace,
          annotationNumber: annotationNumber++,
          domElement: element,
          domElements: [element],
          duplicateCount: 1,
          isOnPage: true, // Token is currently visible
        });
      }
    }
  });

  return tokens;
}

/**
 * Merge new tokens with existing ones, preserving tokens that are no longer on page
 */
function mergeTokens(
  existing: Map<string, FlattenedToken>,
  current: Map<string, FlattenedToken>
): Map<string, FlattenedToken> {
  const merged = new Map<string, FlattenedToken>();

  // First, mark all existing tokens as not on page
  existing.forEach((token, key) => {
    merged.set(key, {
      ...token,
      isOnPage: false,
      domElement: null,
      domElements: [],
      duplicateCount: 0,
    });
  });

  // Then update with current tokens (on page)
  current.forEach((token, key) => {
    const existingToken = merged.get(key);
    if (existingToken) {
      // Update existing token with current DOM info
      merged.set(key, {
        ...existingToken,
        ...token,
        isOnPage: true,
        // Keep the original annotation number for consistency
        annotationNumber: existingToken.annotationNumber,
      });
    } else {
      // New token we haven't seen before
      merged.set(key, {
        ...token,
        isOnPage: true,
      });
    }
  });

  return merged;
}

/**
 * Build nested token structure from flattened tokens
 * Converts "namespace:path.to.key" format to nested object structure
 */
function buildNestedTokens(
  flatTokens: Record<string, string>
): EBConfig['contentTokens'] {
  const nested: EBConfig['contentTokens'] = {
    name: 'enUS',
    tokens: {},
  };

  Object.entries(flatTokens).forEach(([key, value]) => {
    // Handle "namespace:path.to.key" format
    const colonIndex = key.indexOf(':');
    let namespace: string;
    let path: string[];

    if (colonIndex > -1) {
      // Format: "namespace:path.to.key"
      namespace = key.substring(0, colonIndex);
      const pathStr = key.substring(colonIndex + 1);
      path = pathStr.split('.');
    } else {
      // Fallback: "namespace.path.to.key"
      const parts = key.split('.');
      namespace = parts[0];
      path = parts.slice(1);
    }

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
    if (path.length > 0) {
      current[path[path.length - 1]] = value;
    }
  });

  return nested;
}

/**
 * Content Token Editor Drawer
 *
 * Interactive drawer for analyzing and editing content tokens visible on the page.
 * Features:
 * - Scans DOM for elements with data-content-token attribute
 * - Allows clicking on tokens in the page to focus the corresponding editor field
 * - Annotates matched elements with numbered badges
 * - Allows live editing of token values
 * - Exports only changed tokens as JSON
 */
export function ContentTokenEditorDrawer({
  isOpen,
  onClose,
  onContentTokensChange,
  selectedLanguage: propSelectedLanguage = 'enUS',
  onLanguageChange,
  topOffset = '4rem',
}: ContentTokenEditorDrawerProps) {
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [matchedTokens, setMatchedTokens] = useState<
    Map<string, FlattenedToken>
  >(new Map());
  const [_annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editedTokens, setEditedTokens] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [focusedTokenKey, setFocusedTokenKey] = useState<string | null>(null);
  const [clickedFromPageKey, setClickedFromPageKey] = useState<string | null>(
    null
  ); // Track tokens clicked from page (not drawer)
  const [_hoveredTokenKey, setHoveredTokenKey] = useState<string | null>(null); // For syncing hover across duplicates
  const [internalLanguage, setInternalLanguage] =
    useState(propSelectedLanguage); // Local state for language
  const [isEditMode, setIsEditMode] = useState(true); // true = click tokens to edit, false = interact with components
  const [showAnnotations, setShowAnnotations] = useState(true); // Toggle annotation overlays
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const inputRefsMap = useRef<Map<string, HTMLInputElement>>(new Map());

  // Use the selected language (from local state)
  const selectedLanguage = internalLanguage;

  // Sync internal language with prop when it changes
  useEffect(() => {
    setInternalLanguage(propSelectedLanguage);
  }, [propSelectedLanguage]);

  // Handle language change
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      setInternalLanguage(newLanguage);
      onLanguageChange?.(newLanguage);
      // Clear edited tokens when language changes since defaults change
      setEditedTokens({});
      // Trigger a re-render with empty tokens then force update
      // This ensures the page shows the new language defaults
      onContentTokensChange({ name: newLanguage } as EBConfig['contentTokens']);
    },
    [onLanguageChange, onContentTokensChange]
  );

  // Handle import - show dialog
  const handleImport = useCallback(() => {
    setImportText('');
    setImportError(null);
    setShowImportDialog(true);
  }, []);

  // Process the imported JSON
  const processImport = useCallback(() => {
    try {
      const imported = JSON.parse(importText);

      // Handle the exported format: { name: "enUS", tokens: { namespace: { path: { to: { key: "value" } } } } }
      // Or simple format: { namespace: { path: { to: { key: "value" } } } }
      const tokensObj = imported.tokens || imported;

      // Flatten the imported nested structure to match our editedTokens format (namespace:path.to.key)
      const flattenNamespace = (
        obj: Record<string, unknown>,
        path: string[] = []
      ): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(obj)) {
          const newPath = [...path, key];
          if (typeof value === 'string') {
            result[newPath.join('.')] = value;
          } else if (typeof value === 'object' && value !== null) {
            Object.assign(
              result,
              flattenNamespace(value as Record<string, unknown>, newPath)
            );
          }
        }
        return result;
      };

      // Flatten each namespace with namespace:path format
      const flattened: Record<string, string> = {};
      for (const [namespace, content] of Object.entries(tokensObj)) {
        if (typeof content === 'object' && content !== null) {
          const flatNamespace = flattenNamespace(
            content as Record<string, unknown>
          );
          for (const [path, value] of Object.entries(flatNamespace)) {
            flattened[`${namespace}:${path}`] = value;
          }
        }
      }

      const tokenCount = Object.keys(flattened).length;
      if (tokenCount === 0) {
        setImportError('No valid tokens found in JSON.');
        return;
      }

      setEditedTokens((prev) => ({ ...prev, ...flattened }));

      // Update the page with the imported tokens
      const nestedTokens = buildNestedTokens({ ...editedTokens, ...flattened });
      onContentTokensChange(nestedTokens);

      // Close dialog on success
      setShowImportDialog(false);
      setImportText('');
      setImportError(null);
    } catch (error) {
      console.error('Failed to import tokens:', error);
      setImportError('Invalid JSON. Please check the format and try again.');
    }
  }, [importText, editedTokens, onContentTokensChange]);

  // Add/remove body class for CSS hover effects when in edit mode
  useEffect(() => {
    if (isOpen && isEditMode) {
      document.body.classList.add('content-token-edit-mode');
    } else {
      document.body.classList.remove('content-token-edit-mode');
    }
    return () => {
      document.body.classList.remove('content-token-edit-mode');
    };
  }, [isOpen, isEditMode]);

  // Add/remove body class to constrain dialogs when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('content-token-drawer-open');
    } else {
      document.body.classList.remove('content-token-drawer-open');
    }
    return () => {
      document.body.classList.remove('content-token-drawer-open');
    };
  }, [isOpen]);

  // Ref for the drawer element
  const drawerRef = useRef<HTMLDivElement>(null);

  // When drawer is open and there's a dialog, make the dialog inert while interacting with drawer
  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    let activeDialog: Element | null = null;

    // When pointer enters drawer, make any open dialog inert
    const handlePointerEnter = () => {
      activeDialog = document.querySelector(
        '[role="dialog"][data-state="open"]'
      );
      if (activeDialog) {
        activeDialog.setAttribute('inert', '');
      }
    };

    // When pointer leaves drawer, remove inert from dialog
    const handlePointerLeave = () => {
      if (activeDialog) {
        activeDialog.removeAttribute('inert');
        activeDialog = null;
      }
    };

    // Handle wheel scroll in drawer
    const handleWheel = (e: WheelEvent) => {
      if (drawer.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    drawer.addEventListener('pointerenter', handlePointerEnter);
    drawer.addEventListener('pointerleave', handlePointerLeave);
    drawer.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      drawer.removeEventListener('pointerenter', handlePointerEnter);
      drawer.removeEventListener('pointerleave', handlePointerLeave);
      drawer.removeEventListener('wheel', handleWheel);
      // Clean up inert if component unmounts
      if (activeDialog) {
        activeDialog.removeAttribute('inert');
      }
    };
  }, [isOpen]);

  // Add/remove body class for CSS annotation display
  useEffect(() => {
    if (isOpen && showAnnotations) {
      document.body.classList.add('show-annotations');
    } else {
      document.body.classList.remove('show-annotations');
    }
    return () => {
      document.body.classList.remove('show-annotations');
    };
  }, [isOpen, showAnnotations]);

  // Handle hover on data-content-token elements to sync highlighting across duplicates
  useEffect(() => {
    if (!isOpen || !isEditMode) return;

    const handleTokenMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tokenElement = target.closest('[data-content-token]');
      if (tokenElement) {
        const tokenKey = tokenElement.getAttribute('data-content-token');
        if (tokenKey) {
          setHoveredTokenKey(tokenKey);
          // Add hover class to all elements with the same token
          document
            .querySelectorAll(`[data-content-token="${tokenKey}"]`)
            .forEach((el) => {
              el.classList.add('content-token-hover');
            });
        }
      }
    };

    const handleTokenMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tokenElement = target.closest('[data-content-token]');
      if (tokenElement) {
        const tokenKey = tokenElement.getAttribute('data-content-token');
        if (tokenKey) {
          setHoveredTokenKey(null);
          // Remove hover class from all elements with the same token
          document
            .querySelectorAll(`[data-content-token="${tokenKey}"]`)
            .forEach((el) => {
              el.classList.remove('content-token-hover');
            });
        }
      }
    };

    const mainContent = document.querySelector('main') || document.body;
    mainContent.addEventListener('mouseenter', handleTokenMouseEnter, true);
    mainContent.addEventListener('mouseleave', handleTokenMouseLeave, true);

    return () => {
      mainContent.removeEventListener(
        'mouseenter',
        handleTokenMouseEnter,
        true
      );
      mainContent.removeEventListener(
        'mouseleave',
        handleTokenMouseLeave,
        true
      );
      // Clean up any leftover hover classes
      document.querySelectorAll('.content-token-hover').forEach((el) => {
        el.classList.remove('content-token-hover');
      });
    };
  }, [isOpen, isEditMode]);

  // Highlight DOM elements when a token is focused in the drawer
  useEffect(() => {
    if (!isOpen || !focusedTokenKey) {
      // Clean up any leftover focus classes
      document.querySelectorAll('.content-token-drawer-focus').forEach((el) => {
        el.classList.remove('content-token-drawer-focus');
      });
      return;
    }

    // Add focus class to all elements with the focused token
    const elements = document.querySelectorAll(
      `[data-content-token="${focusedTokenKey}"]`
    );
    elements.forEach((el) => {
      el.classList.add('content-token-drawer-focus');
    });

    // Scroll first element into view if it exists
    if (elements.length > 0) {
      elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      elements.forEach((el) => {
        el.classList.remove('content-token-drawer-focus');
      });
    };
  }, [isOpen, focusedTokenKey]);

  // Handle clicks on data-content-token elements (only in edit mode)
  useEffect(() => {
    if (!isOpen || !isEditMode || matchedTokens.size === 0) return;

    const handleTokenClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tokenElement = target.closest('[data-content-token]');

      if (tokenElement) {
        // Prevent the click from triggering component handlers (buttons, links, etc.)
        event.preventDefault();
        event.stopPropagation();

        const fullKey = tokenElement.getAttribute('data-content-token');
        if (fullKey) {
          // Find the internal key that matches this fullKey
          const matchingEntry = Array.from(matchedTokens.entries()).find(
            ([, token]) => token.fullKey === fullKey
          );

          if (matchingEntry) {
            const [internalKey] = matchingEntry;
            setFocusedTokenKey(internalKey);
            setClickedFromPageKey(internalKey); // Mark as clicked from page

            // Scroll to and focus the input
            setTimeout(() => {
              const inputElement = inputRefsMap.current.get(internalKey);
              if (inputElement) {
                inputElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
                inputElement.focus();
                inputElement.select();
              }
            }, 100);
          } else {
            // Token not in our list yet - rescan and try again
            const matched = scanDOMForEditableTokens();
            if (matched.size !== matchedTokens.size) {
              setMatchedTokens(matched);
              // Find again after rescan
              const newMatchingEntry = Array.from(matched.entries()).find(
                ([, token]) => token.fullKey === fullKey
              );
              if (newMatchingEntry) {
                const [internalKey] = newMatchingEntry;
                setFocusedTokenKey(internalKey);
                setClickedFromPageKey(internalKey); // Mark as clicked from page
                setTimeout(() => {
                  const inputElement = inputRefsMap.current.get(internalKey);
                  if (inputElement) {
                    inputElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                    inputElement.focus();
                    inputElement.select();
                  }
                }, 150); // Slightly longer delay to let the list re-render
              }
            }
          }
        }
      }
    };

    // Listen on document.body to capture clicks in dialogs (which render in portals)
    document.body.addEventListener('click', handleTokenClick, true); // true = capture phase

    return () => {
      document.body.removeEventListener('click', handleTokenClick, true);
    };
  }, [isOpen, isEditMode, matchedTokens]);

  // Scan DOM for tokens when drawer opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTokens(true);

      // Scan DOM for all data-content-token elements (DOM is the source of truth)
      const matched = scanDOMForEditableTokens();
      setMatchedTokens(matched);

      // Set data attributes on DOM elements for CSS-based annotations
      matched.forEach((token) => {
        if (token.domElements && token.annotationNumber) {
          const allElements = token.domElements;
          const duplicateCount = allElements.length;
          const color = NAMESPACE_COLORS[token.namespace] || '#6b7280';

          allElements.forEach((element, index) => {
            const el = element as HTMLElement;
            el.setAttribute(
              'data-annotation-number',
              String(token.annotationNumber)
            );
            el.setAttribute('data-annotation-namespace', token.namespace);
            el.setAttribute('data-annotation-color', color);
            // Set CSS custom property for annotation color
            el.style.setProperty('--annotation-color', color);

            if (duplicateCount > 1) {
              el.setAttribute(
                'data-annotation-duplicate',
                `${token.annotationNumber}.${index + 1}`
              );
            }
          });
        }
      });

      // We no longer need the annotations state for rendering
      setAnnotations([]);

      setIsLoadingTokens(false);
    } else {
      // Clean up data attributes and CSS custom properties when drawer closes
      document.querySelectorAll('[data-annotation-number]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.removeAttribute('data-annotation-number');
        htmlEl.removeAttribute('data-annotation-namespace');
        htmlEl.removeAttribute('data-annotation-color');
        htmlEl.removeAttribute('data-annotation-duplicate');
        htmlEl.style.removeProperty('--annotation-color');
      });
    }
  }, [isOpen]);

  // Rescan DOM when new nodes are added (e.g., when a dialog opens)
  // Use a ref to access current matchedTokens without adding it as a dependency
  const matchedTokensRef = useRef(matchedTokens);
  matchedTokensRef.current = matchedTokens;

  useEffect(() => {
    if (!isOpen) return;

    const addAnnotationsToTokens = (matched: Map<string, FlattenedToken>) => {
      // Add data attributes to ALL tokens that are on the page
      matched.forEach((token) => {
        if (token.isOnPage && token.domElements && token.annotationNumber) {
          const allElements = token.domElements;
          const duplicateCount = allElements.length;
          const color = NAMESPACE_COLORS[token.namespace] || '#6b7280';

          allElements.forEach((element, index) => {
            const el = element as HTMLElement;
            // Always set attributes (element may have been recreated by React)
            el.setAttribute(
              'data-annotation-number',
              String(token.annotationNumber)
            );
            el.setAttribute('data-annotation-namespace', token.namespace);
            el.setAttribute('data-annotation-color', color);
            el.style.setProperty('--annotation-color', color);

            if (duplicateCount > 1) {
              el.setAttribute(
                'data-annotation-duplicate',
                `${token.annotationNumber}.${index + 1}`
              );
            }
          });
        }
      });
    };

    const rescanTokens = () => {
      const currentTokens = scanDOMForEditableTokens();

      // Merge with existing tokens (preserves tokens no longer on page)
      const merged = mergeTokens(matchedTokensRef.current, currentTokens);

      // Always add annotations to elements (they may have been recreated)
      addAnnotationsToTokens(merged);

      // Update state with merged tokens
      setMatchedTokens(merged);
    };

    // Run initial scan
    rescanTokens();

    // Use MutationObserver to detect when new nodes are added
    const observer = new MutationObserver((mutations) => {
      // Check if any mutation added nodes or changed data-state (dialog open/close)
      const hasRelevantChange = mutations.some(
        (m) =>
          m.addedNodes.length > 0 ||
          m.removedNodes.length > 0 ||
          (m.type === 'attributes' && m.attributeName === 'data-state')
      );
      if (hasRelevantChange) {
        // Debounce the rescan
        setTimeout(rescanTokens, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'], // Watch for dialog state changes
    });

    return () => {
      observer.disconnect();
    };
  }, [isOpen]); // Only depend on isOpen

  // Debounced page update - only fire after user stops typing
  const debouncedUpdateRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debouncedContentTokensChange = useCallback(
    (tokens: EBConfig['contentTokens']) => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
      debouncedUpdateRef.current = setTimeout(() => {
        onContentTokensChange(tokens);
      }, 150); // 150ms debounce
    },
    [onContentTokensChange]
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  // Handle token edit - update local state immediately, debounce page update
  const handleTokenEdit = useCallback(
    (key: string, newValue: string) => {
      const updated = { ...editedTokens, [key]: newValue };
      setEditedTokens(updated);

      // Build nested tokens structure and debounce the page update
      const nestedTokens = buildNestedTokens(updated);
      debouncedContentTokensChange(nestedTokens);
    },
    [editedTokens, debouncedContentTokensChange]
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
        token.value.toLowerCase().includes(query)
    );
  }, [matchedTokens, searchQuery]);

  // Cleanup on drawer close
  useEffect(() => {
    if (!isOpen) {
      setAnnotations([]);
      setMatchedTokens(new Map());
      setEditedTokens({});
      setSearchQuery('');
      setIsEditMode(true); // Reset to edit mode for next open
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Create drawer content that will be portaled
  const drawerContent = (
    <>
      {/* Transparent overlay that indicates edit mode - pointer-events none so tokens can be clicked */}
      {isEditMode && matchedTokens.size > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            top: topOffset,
            right: '600px', // Don't cover the drawer
            backgroundColor: 'rgba(59, 130, 246, 0.03)',
            backdropFilter: 'saturate(0.95)',
          }}
        >
          {/* Informational banner at top of overlay */}
          <div className="absolute left-0 right-0 top-4 flex justify-center">
            <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
              <span className="flex items-center gap-2">
                <MousePointer2 className="h-4 w-4" />
                Click on highlighted tokens to edit them
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drawer - slides in from right alongside content */}
      <div
        ref={drawerRef}
        data-content-token-drawer=""
        className={`fixed right-0 z-[60] flex w-[600px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: topOffset,
          bottom: 0,
        }}
        onPointerDownCapture={(e) => {
          // Only stop propagation if there's an open dialog (to prevent Radix dismiss)
          if (document.querySelector('[role="dialog"][data-state="open"]')) {
            e.stopPropagation();
          }
        }}
        onFocusCapture={(e) => {
          // Only stop propagation if there's an open dialog
          if (document.querySelector('[role="dialog"][data-state="open"]')) {
            e.stopPropagation();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">
              Content Tokens
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {
                Array.from(matchedTokens.values()).filter((t) => t.isOnPage)
                  .length
              }{' '}
              on page
            </span>
            {Object.keys(editedTokens).length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {Object.keys(editedTokens).length} changed
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar - Compact */}
          <div className="space-y-2 border-b border-gray-200 px-4 py-2">
            {/* Row 1: Language + Mode toggles */}
            <div className="flex items-center gap-3">
              {/* Language Selector - Compact */}
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger
                  id="language-select"
                  className="h-8 w-[140px] text-sm"
                >
                  <Languages className="mr-1 h-3.5 w-3.5 text-gray-500" />
                  <span className="truncate">
                    {LANGUAGE_OPTIONS.find(
                      (opt) => opt.value === selectedLanguage
                    )?.label || 'Language'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Compact toggles */}
              <div className="flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                    isEditMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title={
                    isEditMode
                      ? 'Click tokens to select and edit'
                      : 'Interact with page normally'
                  }
                >
                  {isEditMode ? (
                    <MousePointer2 className="h-3.5 w-3.5" />
                  ) : (
                    <Hand className="h-3.5 w-3.5" />
                  )}
                  {isEditMode ? 'Select Mode' : 'Interact Mode'}
                </button>
                <div className="h-4 w-px bg-gray-300" />
                <button
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                    showAnnotations
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title={
                    showAnnotations
                      ? 'Hide numbered badges on tokens'
                      : 'Show numbered badges on tokens'
                  }
                >
                  {showAnnotations ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  {showAnnotations ? 'Show Badges' : 'Hide Badges'}
                </button>
              </div>
            </div>

            {/* Row 2: Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-300 py-1 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Row 3: Action buttons */}
            <div className="flex gap-1.5">
              <Button
                onClick={handleImport}
                variant="outline"
                size="sm"
                className="h-7 flex-1 text-xs"
                title="Import tokens from clipboard (JSON)"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import
              </Button>
              <Button
                onClick={handleExport}
                disabled={Object.keys(editedTokens).length === 0}
                variant="outline"
                size="sm"
                className="h-7 flex-1 text-xs"
                title="Export changed tokens as JSON"
              >
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                Export
              </Button>
              <Button
                onClick={() => {
                  setEditedTokens({});
                  onContentTokensChange({
                    name: selectedLanguage,
                  } as EBConfig['contentTokens']);
                }}
                disabled={Object.keys(editedTokens).length === 0}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                title="Revert all tokens to their default values"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingTokens ? (
              <div className="py-12 text-center text-gray-500">
                <FileText className="mx-auto mb-4 h-12 w-12 animate-pulse opacity-50" />
                <p>Loading content tokens...</p>
              </div>
            ) : matchedTokens.size === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No content tokens found on this page</p>
                <p className="mt-2 text-sm text-gray-400">
                  Content tokens will appear when components with
                  data-content-token attributes are rendered
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTokens.map(([key, token]) => {
                  // Get the default value from the JSON files for the selected language
                  // JSON is the primary source of truth for defaults
                  // Fall back to DOM content only if JSON doesn't have this key
                  const tokenResult = getDefaultTokenValue(
                    key,
                    selectedLanguage
                  );
                  const defaultValue = tokenResult.value ?? token.value; // Fall back to DOM if JSON lookup fails
                  const isFallback = tokenResult.isFallback;
                  // Show edited value if user changed it, otherwise show JSON default
                  const editedValue =
                    key in editedTokens ? editedTokens[key] : defaultValue;
                  const isChanged =
                    key in editedTokens && editedTokens[key] !== defaultValue;
                  const isFocused = focusedTokenKey === key;
                  const color = NAMESPACE_COLORS[token.namespace] || '#6b7280';
                  const isDuplicate = (token.duplicateCount || 1) > 1;
                  const isJsonMissing = tokenResult.value === undefined;
                  const isOffPage = token.isOnPage === false;

                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-3 transition-all duration-200 ${
                        isOffPage
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : isFocused
                            ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
                            : isChanged
                              ? 'border-blue-500 bg-blue-50'
                              : isFallback
                                ? 'border-orange-300 bg-orange-50'
                                : 'border-gray-200'
                      }`}
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <div
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${isOffPage ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: color }}
                        >
                          {token.annotationNumber || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate font-mono text-xs ${isOffPage ? 'italic text-gray-400' : 'text-gray-500'}`}
                            >
                              {key}
                            </span>
                            {isOffPage && (
                              <span
                                className="flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600"
                                title="Token is no longer visible on the page (e.g., dialog closed)"
                              >
                                🚫 Hidden
                              </span>
                            )}
                            {isJsonMissing && (
                              <span
                                className="flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700"
                                title="Token not found in i18n JSON files - showing DOM text"
                              >
                                ⚠️ Missing
                              </span>
                            )}
                            {isFallback && !isJsonMissing && (
                              <span
                                className="flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700"
                                title="Using English default - no translation for this language"
                              >
                                <Languages className="h-3 w-3" />
                                EN
                              </span>
                            )}
                            {isDuplicate && !isOffPage && (
                              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
                                ×{token.duplicateCount}
                              </span>
                            )}
                            {clickedFromPageKey === key && (
                              <span className="flex items-center gap-1 rounded bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                                <MousePointerClick className="h-3 w-3" />
                                clicked
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              ref={(el) => {
                                if (el) {
                                  inputRefsMap.current.set(key, el);
                                } else {
                                  inputRefsMap.current.delete(key);
                                }
                              }}
                              type="text"
                              value={editedValue}
                              onChange={(e) =>
                                handleTokenEdit(key, e.target.value)
                              }
                              onFocus={() => setFocusedTokenKey(key)}
                              onBlur={() => {
                                setFocusedTokenKey(null);
                                setClickedFromPageKey(null); // Clear clicked from page on blur
                              }}
                              className="w-full rounded border border-gray-300 px-2 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={defaultValue}
                            />
                            {/* Revert individual token button */}
                            {isChanged && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newEdited = { ...editedTokens };
                                  delete newEdited[key];
                                  setEditedTokens(newEdited);
                                  // Update page content
                                  const nestedTokens =
                                    buildNestedTokens(newEdited);
                                  onContentTokensChange(nestedTokens);
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Revert to default"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Import Tokens
              </h3>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                  setImportError(null);
                }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              Paste your exported JSON content below:
            </p>
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              placeholder='{"tokens": {"namespace": {"key": "value"}}}'
              className="h-48 w-full rounded-md border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {importError && (
              <p className="mt-2 text-sm text-red-600">{importError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportText('');
                  setImportError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={processImport} disabled={!importText.trim()}>
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Render drawer in a portal at document body level
  // This puts it at the same level as Radix portals, avoiding focus trap issues
  return createPortal(drawerContent, document.body);
}
