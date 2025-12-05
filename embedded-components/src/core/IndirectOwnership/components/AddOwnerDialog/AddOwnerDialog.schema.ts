import { z } from 'zod';

/**
 * Zod schema for AddOwnerDialog form validation
 * Uses direct schema definition following established codebase patterns
 */
export const addOwnerFormSchema = z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .refine(
        (val) => /^[a-zA-Z\s'-]+$/.test(val.trim()),
        'First name can only contain letters, spaces, hyphens, and apostrophes'
      )
      .refine(
        (val) => !/\s\s/.test(val),
        'First name cannot contain consecutive spaces'
      )
      .transform((val) => val.trim()),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .refine(
        (val) => /^[a-zA-Z\s'-]+$/.test(val.trim()),
        'Last name can only contain letters, spaces, hyphens, and apostrophes'
      )
      .refine(
        (val) => !/\s\s/.test(val),
        'Last name cannot contain consecutive spaces'
      )
      .transform((val) => val.trim()),

    ownershipType: z.enum(['DIRECT', 'INDIRECT'], {
      required_error: 'Please select an ownership type',
      invalid_type_error: 'Please select either Direct or Indirect ownership'
    })
  })
  .refine(
    (data) => {
      // Additional cross-field validations can go here
      return data.firstName.toLowerCase() !== data.lastName.toLowerCase();
    },
    {
      message: 'First name and last name cannot be the same',
      path: ['general']
    }
  );

/**
 * Type inference for the form schema
 */
export type AddOwnerFormData = z.infer<typeof addOwnerFormSchema>;
