import { z } from "zod";

export const enqueueJobSchema = z.object({
  queueName: z.enum(["notifications", "orders", "payments", "cleanup"]),
  jobName: z.string().min(1, "Job name is required"),
  payload: z.record(z.string(), z.unknown()).default({}),
  options: z
    .object({
      attempts: z.number().int().positive().optional(),
      backoffMs: z.number().int().positive().optional(),
      delayMs: z.number().int().min(0).optional(),
    })
    .optional(),
});

export type EnqueueJobInput = z.infer<typeof enqueueJobSchema>;
