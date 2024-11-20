import { z } from 'zod';

const tileSchema = z
  .string()
  .min(8)
  .max(100, 'Title cannot exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s]+$/, 'Title can only contain letters, numbers, and spaces');

export const createPostRequestBodySchema = z.object({
  title: tileSchema,
  content: z.string().min(16),
});

export const updatePostRequestBodySchema = z.object({
  title: tileSchema.optional(),
  content: z.string().min(16).optional(),
  isHidden: z.boolean().optional(),
});
