import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8)
  .max(20)
  .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/);

export const createUserRequestBodySchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: passwordSchema,
});

export const loginUserRequestSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});
