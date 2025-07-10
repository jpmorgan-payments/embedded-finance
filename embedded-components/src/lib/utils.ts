import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

import { Recipient } from '@/api/generated/ef-v1.schemas';

const twMerge = extendTailwindMerge({
  prefix: 'eb-',
  extend: {
    theme: {
      borderRadius: ['button', 'input'],
    },
    classGroups: {
      'font-size': ['text-button', 'text-label'],
      'font-weight': [
        'font-button-primary',
        'font-button-secondary',
        'font-button-destructive',
        'font-label',
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

export async function compressImage(
  file: File,
  options:
    | {
        maxWidthHeight?: number;
        quality?: number;
        outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
        maxSizeKB?: number;
      }
    | number = {}
): Promise<string> {
  // Handle backwards compatibility with old function signature
  const opts =
    typeof options === 'number' ? { maxWidthHeight: options } : options;

  const {
    maxWidthHeight = 1000,
    quality = 0.5,
    outputFormat = 'image/jpeg',
    maxSizeKB,
  } = opts;

  // Validate input
  if (!(file instanceof File)) {
    throw new Error('Invalid file input');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }

  // Skip compression for small images if no specific maxSizeKB is set
  if (!maxSizeKB && file.size < 100 * 1024) {
    // Less than 100KB
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => resolve(event.target?.result as string);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    // Add timeout handling
    const timeoutId = setTimeout(() => {
      reject(new Error('Image compression timed out'));
    }, 10000); // 10 seconds timeout

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        clearTimeout(timeoutId);
        const canvas = document.createElement('canvas');
        let { height, width } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthHeight) {
            height = Math.round((height * maxWidthHeight) / width);
            width = maxWidthHeight;
          }
        } else if (height > maxWidthHeight) {
          width = Math.round((width * maxWidthHeight) / height);
          height = maxWidthHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with initial quality
        let currentQuality = quality;
        let compressedDataUrl = canvas.toDataURL(outputFormat, currentQuality);

        // If maxSizeKB is specified, reduce quality until size is under limit
        if (maxSizeKB) {
          // Calculate current size in KB
          const getKBSize = (dataUrl: string) =>
            Math.round((dataUrl.length * 3) / 4 / 1024);

          while (
            getKBSize(compressedDataUrl) > maxSizeKB &&
            currentQuality > 0.1
          ) {
            currentQuality -= 0.1;
            compressedDataUrl = canvas.toDataURL(outputFormat, currentQuality);
          }
        }

        resolve(compressedDataUrl);
      };
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };
    };
    reader.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
  });
}
