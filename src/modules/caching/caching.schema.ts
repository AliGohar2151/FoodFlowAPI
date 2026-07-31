import { z } from "zod";

export const invalidateCacheSchema = z.object({
  key: z.string().optional(),
  pattern: z.string().optional(),
});

export type InvalidateCacheInput = z.infer<typeof invalidateCacheSchema>;
