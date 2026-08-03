import { describe, expect, it } from 'vitest';

import { groupEditedContentTokens } from './content-token-changes-overview';

describe('groupEditedContentTokens', () => {
  it('groups edits by namespace and marks on-page keys', () => {
    const groups = groupEditedContentTokens(
      {
        'onboarding-overview:fields.email.label': 'Franchisee Email',
        'common:errors.footnote': 'Call support',
        'onboarding-overview:screens.owners.title': 'Owners',
      },
      new Set(['common:errors.footnote']),
      (key) => (key.includes('footnote') ? 'Default footnote' : 'Default'),
      {
        common: '#6b7280',
        'onboarding-overview': '#14b8a6',
      }
    );

    expect(groups).toHaveLength(2);
    expect(groups[0].namespace).toBe('onboarding-overview');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].label).toBe('Onboarding overview');
    expect(groups[1].namespace).toBe('common');
    expect(groups[1].items[0].isOnPage).toBe(true);
    expect(groups[0].items.every((i) => i.isOnPage === false)).toBe(true);
  });

  it('returns empty list when there are no edits', () => {
    expect(
      groupEditedContentTokens({}, new Set(), () => undefined, {})
    ).toEqual([]);
  });
});
