import { z } from 'zod';

export const nullableInput = <T extends z.ZodTypeAny>(
  schema: T,
  message = 'Output value cannot be null'
) => {
  return schema.nullable().transform((val, ctx) => {
    if (val === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,
        message,
      });

      return z.NEVER;
    }

    return val;
  });
};
