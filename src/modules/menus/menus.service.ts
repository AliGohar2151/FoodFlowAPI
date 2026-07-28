import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  QueryMenuItemsInput,
} from "./menus.schema.js";

export class MenusService {
  /**
   * Create a menu category for a restaurant.
   */
  async createCategory(restaurantId: string, input: CreateCategoryInput) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return prisma.menuCategory.create({
      data: {
        restaurantId,
        name: input.name,
        description: input.description ?? null,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      },
    });
  }

  /**
   * Get all active menu categories for a restaurant, ordered by displayOrder.
   */
  async getCategories(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  /**
   * Update a menu category.
   */
  async updateCategory(
    restaurantId: string,
    categoryId: string,
    input: UpdateCategoryInput,
  ) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!category) {
      throw new NotFoundError("Menu category");
    }

    return prisma.menuCategory.update({
      where: { id: categoryId },
      data: {
        name: input.name ?? category.name,
        description:
          input.description !== undefined ? input.description : category.description,
        displayOrder: input.displayOrder ?? category.displayOrder,
        isActive: input.isActive ?? category.isActive,
      },
    });
  }

  /**
   * Delete a menu category.
   */
  async deleteCategory(restaurantId: string, categoryId: string) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!category) {
      throw new NotFoundError("Menu category");
    }

    await prisma.menuCategory.delete({
      where: { id: categoryId },
    });

    return { message: "Menu category deleted successfully" };
  }

  /**
   * Create a menu item.
   */
  async createMenuItem(restaurantId: string, input: CreateMenuItemInput) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: input.categoryId, restaurantId },
    });
    if (!category) {
      throw new NotFoundError("Menu category");
    }

    return prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        price: input.price,
        isAvailable: input.isAvailable,
        isVegetarian: input.isVegetarian,
        isVegan: input.isVegan,
        isGlutenFree: input.isGlutenFree,
        isSpicy: input.isSpicy,
        displayOrder: input.displayOrder,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * List menu items for a restaurant with filtering and pagination.
   */
  async getMenuItems(restaurantId: string, query: QueryMenuItemsInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single menu item detail.
   */
  async getMenuItemById(itemId: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        restaurant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundError("Menu item");
    }

    return item;
  }

  /**
   * Update a menu item.
   */
  async updateMenuItem(restaurantId: string, itemId: string, input: UpdateMenuItemInput) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });
    if (!item) {
      throw new NotFoundError("Menu item");
    }

    return prisma.menuItem.update({
      where: { id: itemId },
      data: {
        categoryId: input.categoryId ?? item.categoryId,
        name: input.name ?? item.name,
        description:
          input.description !== undefined ? input.description : item.description,
        imageUrl: input.imageUrl !== undefined ? input.imageUrl : item.imageUrl,
        price: input.price ?? item.price,
        isAvailable: input.isAvailable ?? item.isAvailable,
        isVegetarian: input.isVegetarian ?? item.isVegetarian,
        isVegan: input.isVegan ?? item.isVegan,
        isGlutenFree: input.isGlutenFree ?? item.isGlutenFree,
        isSpicy: input.isSpicy ?? item.isSpicy,
        displayOrder: input.displayOrder ?? item.displayOrder,
      },
    });
  }

  /**
   * Delete a menu item.
   */
  async deleteMenuItem(restaurantId: string, itemId: string) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });
    if (!item) {
      throw new NotFoundError("Menu item");
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    });

    return { message: "Menu item deleted successfully" };
  }
}

export const menusService = new MenusService();
