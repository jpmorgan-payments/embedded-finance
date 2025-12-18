'use client';

// Form detection utilities for automation
export class FormDetectionUtils {
  // Common dialog/modal selectors
  private static readonly DIALOG_SELECTORS = [
    '[role="dialog"]',
    '.eb-scrollable-dialog',
    '[data-state="open"]',
    '.dialog-content',
    '[data-radix-popper-content-wrapper]',
  ];

  // Form type detection patterns
  private static readonly FORM_PATTERNS = {
    'link-account': {
      required: [
        'select, [role="combobox"]',
        'input[placeholder*="routing"]',
        'input[placeholder*="account"]',
      ],
      optional: [
        'input[placeholder*="first name"]',
        'input[placeholder*="last name"]',
        'input[placeholder*="business name"]',
      ],
    },
    'make-payment': {
      required: [
        'input[placeholder*="amount"]',
        'input[placeholder*="recipient"]',
      ],
      optional: [
        'input[placeholder*="memo"]',
        'input[placeholder*="reference"]',
      ],
    },
    recipients: {
      required: [
        'input[placeholder*="name"]',
        'input[placeholder*="email"]',
        'input[name="firstName"]',
        'input[name="lastName"]',
        'input[name="accountNumber"]',
      ],
      optional: [
        'input[placeholder*="phone"]',
        'input[placeholder*="account"]',
        'input[name="addressLine1"]',
        'input[name="city"]',
        'input[name="state"]',
        'input[name="postalCode"]',
      ],
    },
  };

  static isFormOpen(): boolean {
    // Check for any dialog/modal
    for (const selector of this.DIALOG_SELECTORS) {
      const dialog = document.querySelector(selector);
      if (dialog) {
        // Check if dialog contains any form elements
        const hasFormElements = dialog.querySelector(
          'input, select, textarea, button[type="submit"]'
        );
        if (hasFormElements) {
          return true;
        }
      }
    }

    return false;
  }

  static getFormType(): string {
    // Check each form pattern
    for (const [formType, pattern] of Object.entries(this.FORM_PATTERNS)) {
      const dialog = this.getActiveDialog();
      if (!dialog) continue;

      // Check if all required elements are present
      const hasAllRequired = pattern.required.every((selector) =>
        dialog.querySelector(selector)
      );

      if (hasAllRequired) {
        return formType;
      }
    }

    return 'unknown';
  }

  static getActiveDialog(): Element | null {
    for (const selector of this.DIALOG_SELECTORS) {
      const dialog = document.querySelector(selector);
      if (dialog) {
        return dialog;
      }
    }
    return null;
  }

  static isFormReady(): boolean {
    const formType = this.getFormType();
    if (formType === 'unknown') return false;

    const dialog = this.getActiveDialog();
    if (!dialog) return false;

    // Check if form has at least one interactive element
    const hasInteractiveElements = dialog.querySelector(
      'input, select, textarea, button'
    );
    return hasInteractiveElements !== null;
  }

  static getFormStatus(): {
    isOpen: boolean;
    type: string;
    isReady: boolean;
  } {
    const isOpen = this.isFormOpen();
    const type = this.getFormType();
    const isReady = this.isFormReady();

    return {
      isOpen,
      type,
      isReady,
    };
  }

  // Utility method to check if a specific form type is open
  static isSpecificFormOpen(formType: string): boolean {
    return this.getFormType() === formType;
  }

  // Get all form elements in the active dialog
  static getFormElements(): Record<
    string,
    Element | null | NodeListOf<Element>
  > {
    const dialog = this.getActiveDialog();
    if (!dialog) return {};

    const elements: Record<string, Element | null | NodeListOf<Element>> = {};

    // Common form elements
    elements.submit = dialog.querySelector('button[type="submit"]');
    elements.cancel = dialog.querySelector('button[type="button"]');

    // Input elements
    elements.inputs = dialog.querySelectorAll('input, select, textarea');

    return elements;
  }
}
