import { z } from "zod";

export const createReviewSchema = z.object({
  orderId: z.string().cuid({ message: "Invalid order ID format" }),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters").optional(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars")
    .optional(),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters").optional(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
