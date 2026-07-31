import { z } from "zod";

export const recordAuditLogSchema = z.object({
  action: z.string().min(1, "Action is required").max(100),
  entityType: z.string().min(1, "Entity type is required").max(100),
  entityId: z.string().min(1, "Entity ID is required").max(100),
  oldValues: z.record(z.string(), z.unknown()).optional(),
  newValues: z.record(z.string(), z.unknown()).optional(),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().cuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type RecordAuditLogInput = z.infer<typeof recordAuditLogSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
