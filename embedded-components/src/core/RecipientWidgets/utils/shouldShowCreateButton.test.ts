import { describe, expect, it } from 'vitest';

import { shouldShowCreateButton } from './shouldShowCreateButton';

describe('shouldShowCreateButton', () => {
  it('should return false when showCreateButton is false', () => {
    expect(shouldShowCreateButton('default', false, false)).toBe(false);
    expect(shouldShowCreateButton('default', true, false)).toBe(false);
    expect(shouldShowCreateButton('singleAccount', false, false)).toBe(false);
    expect(shouldShowCreateButton('singleAccount', true, false)).toBe(false);
  });

  it('should return true for default variant when showCreateButton is true', () => {
    expect(shouldShowCreateButton('default', false, true)).toBe(true);
    expect(shouldShowCreateButton('default', true, true)).toBe(true);
  });

  it('should return false for singleAccount variant when active account exists', () => {
    expect(shouldShowCreateButton('singleAccount', true, true)).toBe(false);
  });

  it('should return true for singleAccount variant when no active account exists', () => {
    expect(shouldShowCreateButton('singleAccount', false, true)).toBe(true);
  });
});
