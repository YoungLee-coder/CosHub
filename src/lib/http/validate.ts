import type { ZodSchema } from 'zod'

export function validateWithSchema<T>(schema: ZodSchema<T>, input: unknown) {
  return schema.safeParse(input)
}
