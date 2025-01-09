import { z } from 'zod';

export const DocumentUploadStepFormSchema = z.object({
  file: z
    .instanceof(Array<File>)
    .refine((files) => files.every((file) => file.size < 2 * 1024 * 1024), {
      message: 'Each file must be less than 2MB',
    }),
});
