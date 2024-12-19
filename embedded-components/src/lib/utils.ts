import { defaultResources } from '@/i18n/config';
import { clsx, type ClassValue } from 'clsx';
import { getI18n } from 'react-i18next';
import { extendTailwindMerge } from 'tailwind-merge';

import { Recipient } from '@/api/generated/ef-v1.schemas';

const twMerge = extendTailwindMerge({
  prefix: 'eb-',
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
