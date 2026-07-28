import { z } from "zod";

export const discoverySearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  cuisine: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxDeliveryFee: z.coerce.number().min(0).optional(),
  isOpen: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return val;
    }, z.boolean())
    .optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().default(10),
  sortBy: z.enum(["rating", "distance", "deliveryTime", "minOrder"]).default("rating"),
});

export type DiscoverySearchInput = z.infer<typeof discoverySearchSchema>;
