import { describe, expect, it } from 'vitest';

import { AVAILABLE_COMPONENTS } from '../scenarios-config';
import { createFullscreenUrl } from './component-card';

describe('createFullscreenUrl', () => {
  it('maps PaymentFlow to payment-flow slug', () => {
    const url = createFullscreenUrl('PaymentFlow', 'Empty');
    expect(url).toContain('component=payment-flow');
    expect(url).toContain('fullscreen=true');
    expect(url).toContain('theme=Empty');
    expect(url).not.toContain('make-payment');
  });

  it('maps legacy MakePayment name to payment-flow slug', () => {
    const url = createFullscreenUrl('MakePayment', 'SellSense');
    expect(url).toContain('component=payment-flow');
  });

  it('maps all AVAILABLE_COMPONENTS values to known slugs', () => {
    const expected: Record<string, string> = {
      [AVAILABLE_COMPONENTS.ACCOUNTS]: 'accounts',
      [AVAILABLE_COMPONENTS.PAYMENT_FLOW]: 'payment-flow',
      [AVAILABLE_COMPONENTS.LINKED_ACCOUNTS]: 'linked-accounts',
      [AVAILABLE_COMPONENTS.TRANSACTIONS]: 'transactions',
      [AVAILABLE_COMPONENTS.RECIPIENTS]: 'recipients',
      [AVAILABLE_COMPONENTS.ONBOARDING_FLOW]: 'onboarding',
      [AVAILABLE_COMPONENTS.CLIENT_DETAILS]: 'client-details',
    };

    for (const [name, slug] of Object.entries(expected)) {
      const url = createFullscreenUrl(name, 'Empty');
      expect(url, name).toContain(`component=${slug}`);
    }
  });
});

describe('AVAILABLE_COMPONENTS payment naming', () => {
  it('exposes PaymentFlow (not MakePayment) as the public component name', () => {
    expect(AVAILABLE_COMPONENTS.PAYMENT_FLOW).toBe('PaymentFlow');
    expect(Object.values(AVAILABLE_COMPONENTS)).not.toContain('MakePayment');
    expect(Object.keys(AVAILABLE_COMPONENTS).includes('MAKE_PAYMENT')).toBe(
      false
    );
  });
});
