import { z } from "zod";

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(50),
  description: z.string().max(250).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(250).nullable().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Menu Item Schemas
export const createMenuItemSchema = z.object({
  categoryId: z.string().cuid({ message: "Invalid category ID format" }),
  name: z.string().min(2, "Item name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.url({ message: "Invalid image URL" }).optional(),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().cuid().optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  price: z.coerce.number().positive().optional(),
  isAvailable: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export const queryMenuItemsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  categoryId: z.string().cuid().optional(),
  search: z.string().optional(),
  isAvailable: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return val;
    }, z.boolean())
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type QueryMenuItemsInput = z.infer<typeof queryMenuItemsSchema>;
