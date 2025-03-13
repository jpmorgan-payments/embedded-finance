import { defaultResources } from '@/i18n/config';
import { clsx, type ClassValue } from 'clsx';
import { getI18n } from 'react-i18next';
import { extendTailwindMerge } from 'tailwind-merge';

import { Recipient } from '@/api/generated/ef-v1.schemas';

const twMerge = extendTailwindMerge({
  prefix: 'eb-',
  extend: {
    theme: {
      borderRadius: ['button', 'input'],
    },
    classGroups: {
      'font-size': ['text-button'],
      'font-weight': [
        'font-button-primary',
        'font-button-secondary',
        'font-button-destructive',
      ],
      shadow: [
        'shadow-border-primary',
        'shadow-border-secondary',
        'shadow-border-destructive',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isValueEmpty = (value: any): boolean => {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export function _get(
  object: any,
  path: string | string[],
  defaultValue?: any
): any {
  // Handle null/undefined objects
  if (object == null) return defaultValue;

  // Normalize path to array
  const segments = Array.isArray(path) ? path : path.split('.');

  // Handle array indexes and nested paths
  let result = object;
  for (const segment of segments) {
    // Handle array indices in bracket notation e.g. "foo[0].bar"
    const matches = segment.match(/^([^[]+)|\[(.+)\]$/);
    const key = matches ? matches[1] || matches[2] : segment;

    result = result?.[key];
    if (result === undefined) return defaultValue;
  }

  return result ?? defaultValue;
}

export function createRegExpAndMessage(
  specialCharacters?: string,
  prependedMessage?: string
): [RegExp, string] {
  const escapedChars = (specialCharacters ?? '').split('').map((char) => {
    if ('^-]\\'.includes(char)) {
      return `\\${char}`;
    }

    return char;
  });
  const regExpString = `^[a-zA-Z0-9\\s${escapedChars.join('')}]*$`;
  return [
    new RegExp(regExpString),
    prependedMessage + (specialCharacters ?? '').split('').join(' '),
  ];
}

export const getRecipientLabel = (recipient: Recipient) => {
  const name =
    recipient.partyDetails?.type === 'INDIVIDUAL'
      ? [
          recipient.partyDetails?.firstName,
          recipient.partyDetails?.lastName,
        ].join(' ')
      : recipient.partyDetails?.businessName;

  return `${name} (...${recipient.account ? recipient.account.number?.slice(-4) : ''})`;
};

export const loadContentTokens = (
  language: string,
  namespace: string,
  tokensArray: any[]
) => {
  const i18n = getI18n();

  // Reset to default
  Object.entries(defaultResources).forEach(([lng, defaultContentTokens]) => {
    i18n.addResourceBundle(
      lng,
      namespace,
      defaultContentTokens.onboarding,
      false, // deep
      true // overwrite
    );
  });

  // Apply provided content tokens
  tokensArray.forEach((tokens) => {
    if (tokens) {
      i18n.addResourceBundle(language, namespace, tokens, true, true);
    }
  });

  // Re-render with new content tokens
  i18n.changeLanguage(i18n.language);
};
