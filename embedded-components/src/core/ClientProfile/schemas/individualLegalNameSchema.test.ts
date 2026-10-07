import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { createIndividualLegalNameSchemaShape } from './individualLegalNameSchema';

const schema = z.object(
  createIndividualLegalNameSchemaShape(
    {
      firstName: 'firstName',
      middleName: 'middleName',
      lastName: 'lastName',
    },
    (fieldName, messageKey) => `${fieldName}.${messageKey}`
  )
);

describe('createIndividualLegalNameSchemaShape', () => {
  test('accepts a valid legal name', () => {
    expect(
      schema.safeParse({
        firstName: 'Sam',
        middleName: '',
        lastName: 'Lee',
      }).success
    ).toBe(true);
  });

  test('preserves required-message precedence', () => {
    const parsed = schema.safeParse({
      firstName: '',
      middleName: '',
      lastName: 'Lee',
    });

    expect(parsed.error?.issues[0]?.message).toBe('firstName.required');
  });

  test('accepts one-character first and last names', () => {
    expect(
      schema.safeParse({ firstName: 'A', middleName: '', lastName: 'L' })
        .success
    ).toBe(true);
  });

  test('uses consumer-provided field names in required errors', () => {
    const parsed = schema.safeParse({
      firstName: 'Sam',
      middleName: '',
      lastName: '',
    });

    expect(parsed.error?.issues[0]?.message).toBe('lastName.required');
  });
});
