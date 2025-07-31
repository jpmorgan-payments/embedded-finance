'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FormDetectionUtils } from './form-detection';
import userEvent from '@testing-library/user-event';

// Field types for automation
type FieldType = 'input' | 'select' | 'checkbox';

interface AutomationField {
  type: FieldType;
  key: string;
  value: string | boolean;
  selectors: string[];
  delay?: number;
}

interface AutomationScenario {
  name: string;
  description: string;
  fields: AutomationField[];
  delay?: number;
}

// Scenario-specific automation configurations
const AUTOMATION_SCENARIOS: Record<string, AutomationScenario> = {
  'Linked Bank Account': {
    name: 'Fresh Start Account Setup',
    description: 'Quick setup for new user linking their first bank account',
    delay: 60,
    fields: [
      {
        type: 'select',
        key: 'accountType',
        value: 'INDIVIDUAL',
        selectors: [
          'select[name="accountType"]',
          '[data-testid="account-type-select"]',
          'input[name="accountType"]',
          '.eb-select-trigger',
          'select, [role="combobox"]',
        ],
      },
      {
        type: 'input',
        key: 'firstName',
        value: 'Alex',
        selectors: [
          'input[name="firstName"]',
          'input[placeholder*="first name"]',
          'input[placeholder*="First name"]',
        ],
      },
      {
        type: 'input',
        key: 'lastName',
        value: 'Thompson',
        selectors: [
          'input[name="lastName"]',
          'input[placeholder*="last name"]',
          'input[placeholder*="Last name"]',
        ],
      },
      {
        type: 'input',
        key: 'routingNumber',
        value: '021000021',
        selectors: [
          'input[name="routingNumber"]',
          'input[placeholder*="routing number"]',
          'input[placeholder*="Routing number"]',
        ],
      },
      {
        type: 'input',
        key: 'accountNumber',
        value: '1112223333',
        selectors: [
          'input[name="accountNumber"]',
          'input[placeholder*="account number"]',
          'input[placeholder*="Account number"]',
        ],
      },
      {
        type: 'checkbox',
        key: 'certify',
        value: true,
        selectors: ['input[name="certify"]', 'input[type="checkbox"]'],
      },
    ],
  },
  'Business Account Setup': {
    name: 'Business Account Setup',
    description: 'Setup for business account linking',
    delay: 60,
    fields: [
      {
        type: 'select',
        key: 'accountType',
        value: 'ORGANIZATION',
        selectors: [
          'select[name="accountType"]',
          '[data-testid="account-type-select"]',
          'input[name="accountType"]',
          '.eb-select-trigger',
          'select, [role="combobox"]',
        ],
      },
      {
        type: 'input',
        key: 'businessName',
        value: 'Acme Corp',
        selectors: [
          'input[name="businessName"]',
          'input[placeholder*="business name"]',
          'input[placeholder*="Business name"]',
        ],
      },
      {
        type: 'input',
        key: 'routingNumber',
        value: '021000021',
        selectors: [
          'input[name="routingNumber"]',
          'input[placeholder*="routing number"]',
          'input[placeholder*="Routing number"]',
        ],
      },
      {
        type: 'input',
        key: 'accountNumber',
        value: '9998887777',
        selectors: [
          'input[name="accountNumber"]',
          'input[placeholder*="account number"]',
          'input[placeholder*="Account number"]',
        ],
      },
      {
        type: 'checkbox',
        key: 'certify',
        value: true,
        selectors: ['input[name="certify"]', 'input[type="checkbox"]'],
      },
    ],
  },
  'Recipient Form': {
    name: 'New Recipient Setup',
    description: 'Create a new recipient for payments',
    delay: 60,
    fields: [
      {
        type: 'select',
        key: 'paymentMethods',
        value: 'ACH Transfer',
        selectors: [
          // Target the specific payment methods select within the dialog
          'button[role="combobox"]',
          '[role="combobox"]',
          'select[name="paymentMethods"]',
          '[data-testid="payment-methods-select"]',
          'input[name="paymentMethods"]',
          '.eb-select-trigger',
          'select, [role="combobox"]',
        ],
      },
      {
        type: 'select',
        key: 'type',
        value: 'Individual',
        selectors: [
          '[role="combobox"]',
          '[data-radix-collection-item]',
          'button[role="combobox"]',
          'select[name="type"]',
          '[data-testid="party-type-select"]',
          'input[name="type"]',
          '.eb-select-trigger',
          'select, [role="combobox"]',
        ],
      },
      {
        type: 'input',
        key: 'firstName',
        value: 'John',
        selectors: [
          'input[name="firstName"]',
          'input[placeholder*="first name"]',
          'input[placeholder*="First name"]',
          'input[placeholder*="Enter first name"]',
        ],
      },
      {
        type: 'input',
        key: 'lastName',
        value: 'Doe',
        selectors: [
          'input[name="lastName"]',
          'input[placeholder*="last name"]',
          'input[placeholder*="Last name"]',
          'input[placeholder*="Enter last name"]',
        ],
      },
      {
        type: 'input',
        key: 'accountNumber',
        value: '1234567890',
        selectors: [
          'input[name="accountNumber"]',
          'input[placeholder*="account number"]',
          'input[placeholder*="Account number"]',
          'input[placeholder*="Enter account number"]',
        ],
      },
      {
        type: 'select',
        key: 'accountType',
        value: 'Checking',
        selectors: [
          '[role="combobox"]',
          '[data-radix-collection-item]',
          'button[role="combobox"]',
          'select[name="accountType"]',
          '[data-testid="account-type-select"]',
          'input[name="accountType"]',
          '.eb-select-trigger',
          'select, [role="combobox"]',
        ],
      },
      {
        type: 'input',
        key: 'routingNumber',
        value: '021000021',
        selectors: [
          'input[name="routingNumber"]',
          'input[placeholder*="routing number"]',
          'input[placeholder*="Routing number"]',
        ],
      },
      {
        type: 'input',
        key: 'addressLine1',
        value: '123 Main St',
        selectors: [
          'input[name="addressLine1"]',
          'input[placeholder*="address"]',
          'input[placeholder*="Address"]',
        ],
      },
      {
        type: 'input',
        key: 'city',
        value: 'New York',
        selectors: [
          'input[name="city"]',
          'input[placeholder*="city"]',
          'input[placeholder*="City"]',
        ],
      },
      {
        type: 'input',
        key: 'state',
        value: 'NY',
        selectors: [
          'input[name="state"]',
          'input[placeholder*="state"]',
          'input[placeholder*="State"]',
          'select[name="state"]',
        ],
      },
      {
        type: 'input',
        key: 'postalCode',
        value: '10001',
        selectors: [
          'input[name="postalCode"]',
          'input[placeholder*="postal code"]',
          'input[placeholder*="Postal code"]',
          'input[placeholder*="zip"]',
        ],
      },
      {
        type: 'input',
        key: 'email',
        value: 'john.doe@example.com',
        selectors: [
          'input[name="email"]',
          'input[type="email"]',
          'input[placeholder*="email"]',
          'input[placeholder*="Email"]',
        ],
      },
      {
        type: 'input',
        key: 'phone',
        value: '555-123-4567',
        selectors: [
          'input[name="phone"]',
          'input[type="tel"]',
          'input[placeholder*="phone"]',
          'input[placeholder*="Phone"]',
        ],
      },
    ],
  },
};

// Simple form automation utilities
class FormAutomationUtils {
  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static async typeInField(
    selector: string,
    value: string,
    delay: number = 2,
  ): Promise<void> {
    // First, find the active dialog
    const dialog =
      document.querySelector('[role="dialog"]') ||
      document.querySelector('[data-state="open"]') ||
      document.querySelector('[data-radix-popper-content-wrapper]');

    if (!dialog) {
      console.warn('No active dialog found for input field');
      return;
    }

    const selectors = selector.split(',').map((s) => s.trim());
    let element: HTMLInputElement | null = null;

    // Try to find the element within the active dialog
    for (const sel of selectors) {
      element = dialog.querySelector(sel) as HTMLInputElement;
      if (element) break;
    }

    if (!element) {
      console.warn(
        `Element not found for selectors: ${selector} within dialog`,
      );
      console.log(
        'Available input elements in dialog:',
        Array.from(dialog.querySelectorAll('input')).map((el) => ({
          name: el.getAttribute('name'),
          placeholder: el.getAttribute('placeholder'),
          type: el.getAttribute('type'),
        })),
      );
      return;
    }

    const user = userEvent.setup({ delay });

    // For shadcn inputs, try multiple click targets
    let clickTarget: HTMLElement = element;

    // Try to find a clickable parent or sibling
    const parent = element.parentElement;
    if (parent && window.getComputedStyle(parent).pointerEvents !== 'none') {
      clickTarget = parent;
    } else {
      // Try to find any clickable ancestor
      let current = element.parentElement;
      while (current) {
        if (
          current instanceof HTMLElement &&
          window.getComputedStyle(current).pointerEvents !== 'none'
        ) {
          clickTarget = current;
          break;
        }
        current = current.parentElement;
      }
    }

    await user.click(clickTarget);
    await user.clear(element);
    await user.type(element, value);
    await user.tab();
    await this.delay(20);
  }

  private static async selectOption(
    selector: string,
    value: string,
  ): Promise<void> {
    // Try multiple selectors to find the element
    const selectors = selector.split(',').map((s) => s.trim());
    let element: HTMLElement | null = null;

    // First, find the active dialog
    const dialog =
      document.querySelector('[role="dialog"]') ||
      document.querySelector('[data-state="open"]') ||
      document.querySelector('[data-radix-popper-content-wrapper]');

    if (!dialog) {
      console.warn('No active dialog found');
      return;
    }

    console.log('Active dialog found:', {
      role: dialog.getAttribute('role'),
      dataState: dialog.getAttribute('data-state'),
      className: dialog.className,
    });

    // Try to find the element within the active dialog using the provided selectors
    for (const sel of selectors) {
      const found = dialog.querySelector(sel) as HTMLElement;
      if (found) {
        element = found;
        console.log(`Found element with selector: ${sel}`, {
          role: element.getAttribute('role'),
          text: element.textContent?.trim(),
          ariaLabel: element.getAttribute('aria-label'),
        });
        break;
      }
    }

    // If not found, try to find by context (look for combobox elements in the active dialog)
    if (!element) {
      const comboboxes = dialog.querySelectorAll('[role="combobox"]');
      console.log(
        'Available comboboxes in dialog:',
        Array.from(comboboxes).map((el) => ({
          text: el.textContent?.trim(),
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
        })),
      );

      // Try to find the first available combobox
      if (comboboxes.length > 0) {
        element = comboboxes[0] as HTMLElement;
        console.log(
          'Using first available combobox:',
          element.textContent?.trim(),
        );
      }
    }

    if (!element) {
      console.warn(`Element not found for selectors: ${selector}`);
      console.log(
        'Available combobox elements:',
        Array.from(document.querySelectorAll('[role="combobox"]')).map(
          (el) => ({
            text: el.textContent?.trim(),
            ariaLabel: el.getAttribute('aria-label'),
            role: el.getAttribute('role'),
          }),
        ),
      );
      return;
    }

    const user = userEvent.setup({ delay: 20 });

    // For Shadcn Select components, try to find the trigger button
    let clickTarget = element;
    if (element.getAttribute('role') === 'combobox') {
      // If it's a combobox, try to find the actual trigger button
      const trigger =
        element.querySelector('button[role="combobox"]') ||
        element.querySelector('[data-radix-trigger]') ||
        element;
      clickTarget = trigger as HTMLElement;
    }

    // Check if the element is actually clickable
    const computedStyle = window.getComputedStyle(clickTarget);
    if (computedStyle.pointerEvents === 'none') {
      console.warn(
        'Element has pointer-events: none, trying to find clickable parent',
      );

      // Try to find a clickable parent or sibling
      let current = clickTarget.parentElement;
      while (current) {
        if (
          current instanceof HTMLElement &&
          window.getComputedStyle(current).pointerEvents !== 'none'
        ) {
          clickTarget = current;
          console.log('Found clickable parent:', current.textContent?.trim());
          break;
        }
        current = current.parentElement;
      }
    }

    console.log('Attempting to click:', {
      element: element.textContent?.trim(),
      clickTarget: clickTarget.textContent?.trim(),
      value: value,
      pointerEvents: window.getComputedStyle(clickTarget).pointerEvents,
    });

    await user.click(clickTarget); // Click to open select
    await this.delay(40);

    // Look for options in multiple possible locations
    let foundOption = null;
    const optionSelectors = [
      '[role="option"]',
      '[data-radix-collection-item]',
      '[data-value]',
      '.eb-select-item',
    ];

    for (const optionSelector of optionSelectors) {
      const options = document.querySelectorAll(optionSelector);
      for (const opt of options) {
        const textContent = opt.textContent?.trim();
        const dataValue = opt.getAttribute('data-value');

        // Try exact match first
        if (textContent === value || dataValue === value) {
          foundOption = opt as HTMLElement;
          break;
        }
        // Try partial match
        if (textContent?.includes(value) || dataValue?.includes(value)) {
          foundOption = opt as HTMLElement;
          break;
        }
        // Try case-insensitive match
        if (
          textContent?.toLowerCase().includes(value.toLowerCase()) ||
          dataValue?.toLowerCase().includes(value.toLowerCase())
        ) {
          foundOption = opt as HTMLElement;
          break;
        }
      }
      if (foundOption) break;
    }

    if (foundOption) {
      await user.click(foundOption);
      await this.delay(40);
    } else {
      console.warn(`Option not found for value: ${value}`);
      console.log(
        'Available options:',
        Array.from(
          document.querySelectorAll(
            '[role="option"], [data-radix-collection-item]',
          ),
        ).map((opt) => ({
          text: opt.textContent?.trim(),
          value: opt.getAttribute('data-value'),
          role: opt.getAttribute('role'),
        })),
      );
    }
  }

  private static async checkCheckbox(
    selector: string,
    checked: boolean,
  ): Promise<void> {
    const selectors = selector.split(',').map((s) => s.trim());
    let element: HTMLInputElement | null = null;

    for (const sel of selectors) {
      element = document.querySelector(sel) as HTMLInputElement;
      if (element) break;
    }

    if (!element) {
      console.warn(`Element not found for selectors: ${selector}`);
      return;
    }

    if (element.checked !== checked) {
      const user = userEvent.setup({ delay: 20 });

      // Try multiple click targets for shadcn checkboxes
      let clickTarget: HTMLElement = element;

      // First try to find specific shadcn checkbox elements
      const checkboxButton = element.parentElement?.querySelector(
        'button[role="checkbox"]',
      );
      const checkboxSpan = element.parentElement?.querySelector(
        'span[role="checkbox"]',
      );
      const checkboxDiv = element.parentElement?.querySelector(
        'div[role="checkbox"]',
      );

      if (checkboxButton && checkboxButton instanceof HTMLElement) {
        clickTarget = checkboxButton;
      } else if (checkboxSpan && checkboxSpan instanceof HTMLElement) {
        clickTarget = checkboxSpan;
      } else if (checkboxDiv && checkboxDiv instanceof HTMLElement) {
        clickTarget = checkboxDiv;
      } else {
        // Try to find a clickable parent or label
        const parent = element.parentElement;
        if (
          parent &&
          window.getComputedStyle(parent).pointerEvents !== 'none'
        ) {
          clickTarget = parent;
        } else {
          // Try to find any clickable ancestor
          let current = element.parentElement;
          while (current) {
            if (
              current instanceof HTMLElement &&
              window.getComputedStyle(current).pointerEvents !== 'none'
            ) {
              clickTarget = current;
              break;
            }
            current = current.parentElement;
          }
        }
      }

      await user.click(clickTarget);
      await this.delay(40);

      // Verify the checkbox state changed
      if (element.checked !== checked) {
        // Try multiple approaches to trigger visual update
        element.checked = checked;

        // Dispatch multiple events to ensure visual update
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('click', { bubbles: true }));

        // Also try to find and update any visual indicator
        const visualIndicator =
          element.parentElement?.querySelector('[data-state]');
        if (visualIndicator) {
          visualIndicator.setAttribute(
            'data-state',
            checked ? 'checked' : 'unchecked',
          );
        }

        // Try to find and click any associated button or span
        const associatedButton = element.parentElement?.querySelector(
          'button, span[role="checkbox"]',
        );
        if (associatedButton && associatedButton instanceof HTMLElement) {
          await user.click(associatedButton);
          await this.delay(20);
        }
      }
    }
  }

  static async fillForm(scenario: AutomationScenario): Promise<void> {
    try {
      await this.delay(40);

      for (const field of scenario.fields) {
        const fieldDelay = field.delay || scenario.delay || 60;

        switch (field.type) {
          case 'select':
            await this.fillSelectField(field, fieldDelay);
            break;
          case 'input':
            await this.fillInputField(field, fieldDelay);
            break;
          case 'checkbox':
            await this.fillCheckboxField(field);
            break;
        }

        await this.delay(20);
      }
    } catch (error) {
      console.error('Form automation failed:', error);
      throw error;
    }
  }

  private static async fillSelectField(
    field: AutomationField,
    delay: number,
  ): Promise<void> {
    const { selectors, value } = field;

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        await this.selectOption(selector, value as string);
        await this.delay(delay);
        return;
      }
    }

    console.warn(`No select element found for field: ${field.key}`);
  }

  private static async fillInputField(
    field: AutomationField,
    delay: number,
  ): Promise<void> {
    const { selectors, value } = field;
    const selectorString = selectors.join(', ');

    await this.typeInField(selectorString, value as string, delay / 3);
  }

  private static async fillCheckboxField(
    field: AutomationField,
  ): Promise<void> {
    const { selectors, value } = field;
    const selectorString = selectors.join(', ');

    await this.checkCheckbox(selectorString, value as boolean);
  }
}

// Simple floating button component
interface AutomationTriggerProps {
  currentScenario: string;
}

export function AutomationTrigger({ currentScenario }: AutomationTriggerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [formStatus, setFormStatus] = useState(
    FormDetectionUtils.getFormStatus(),
  );

  useEffect(() => {
    const checkFormStatus = () => {
      setFormStatus(FormDetectionUtils.getFormStatus());
    };

    const interval = setInterval(checkFormStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
      event.preventDefault();
      runAutomation();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runAutomation = async () => {
    if (isRunning) return;

    // Map URL scenarios to automation scenarios
    const scenarioMapping: Record<string, string> = {
      'Linked Bank Account': 'Linked Bank Account',
      'Seller with Limited DDA Payments': 'Recipient Form',
      'Seller with Limited DDA': 'Recipient Form',
    };

    const mappedScenario = scenarioMapping[currentScenario] || currentScenario;
    const scenario = AUTOMATION_SCENARIOS[mappedScenario];

    console.log('Automation trigger:', {
      currentScenario,
      mappedScenario,
      scenarioFound: !!scenario,
      availableScenarios: Object.keys(AUTOMATION_SCENARIOS),
    });

    if (!scenario) {
      console.warn(
        `No automation scenario found for: ${currentScenario} (mapped to: ${mappedScenario})`,
      );
      return;
    }

    setIsRunning(true);
    try {
      await FormAutomationUtils.fillForm(scenario);
    } catch (error) {
      console.error('Automation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    runAutomation();
  };

  // Only show if form is detected and ready
  if (!formStatus.isOpen || !formStatus.isReady) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-[9999] flex items-center gap-2">
      <div className="bg-gray-100/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 shadow-lg">
        <span className="font-medium">Ctrl + Shift + A</span>
        <span className="text-gray-500 ml-1">to fill form</span>
      </div>
      <Button
        onClick={handleButtonClick}
        disabled={isRunning}
        className="w-8 h-8 rounded-full bg-gray-100/90 hover:bg-gray-200/90 text-gray-600 shadow-lg border border-gray-200 hover:scale-105 transition-transform duration-200"
        style={{ pointerEvents: 'auto' }}
        title={`Fill Form (Ctrl+Shift+A) - ${currentScenario}`}
      >
        {isRunning ? '⏳' : '⚡'}
      </Button>
    </div>
  );
}
