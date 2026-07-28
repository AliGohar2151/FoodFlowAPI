import { prisma } from "../../infrastructure/database/index.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../common/errors/index.js";
import type { AddToCartInput, UpdateCartItemInput } from "./carts.schema.js";

export class CartsService {
  /**
   * Get or initialize active cart for a user.
   */
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            deliveryFee: true,
            minOrderAmount: true,
            estimatedDeliveryTimeMinutes: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                isAvailable: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    cart ??= await prisma.cart.create({
      data: { userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            deliveryFee: true,
            minOrderAmount: true,
            estimatedDeliveryTimeMinutes: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                isAvailable: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return this.calculateCartSummary(cart);
  }

  /**
   * Add a menu item to user's cart (Enforces single-restaurant policy).
   */
  async addToCart(userId: string, input: AddToCartInput) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: input.menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem) {
      throw new NotFoundError("Menu item");
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestError("This menu item is currently unavailable");
    }

    if (menuItem.restaurant.status !== "ACTIVE") {
      throw new BadRequestError("This restaurant is currently not accepting orders");
    }

    const cart = await this.getCartRaw(userId);

    // Single-restaurant policy enforcement
    if (cart.restaurantId && cart.restaurantId !== menuItem.restaurantId) {
      if (!input.clearExisting) {
        throw new ConflictError(
          "Your cart contains items from another restaurant. Set clearExisting to true to replace cart items.",
        );
      }

      // Clear existing cart items and switch restaurant
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
        prisma.cart.update({
          where: { id: cart.id },
          data: { restaurantId: menuItem.restaurantId },
        }),
      ]);
    } else if (!cart.restaurantId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: menuItem.restaurantId },
      });
    }

    // Add or increment cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId: input.menuItemId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + input.quantity,
          specialInstructions:
            input.specialInstructions ?? existingItem.specialInstructions,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: input.menuItemId,
          quantity: input.quantity,
          unitPrice: menuItem.price,
          specialInstructions: input.specialInstructions ?? null,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update quantity of a cart item.
   */
  async updateCartItem(userId: string, itemId: string, input: UpdateCartItemInput) {
    const cart = await this.getCartRaw(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundError("Cart item");
    }

    if (input.quantity === 0) {
      return this.removeCartItem(userId, itemId);
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: input.quantity,
        specialInstructions:
          input.specialInstructions !== undefined
            ? input.specialInstructions
            : item.specialInstructions,
      },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart.
   */
  async removeCartItem(userId: string, itemId: string) {
    const cart = await this.getCartRaw(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundError("Cart item");
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    // Check remaining items count
    const remainingCount = await prisma.cartItem.count({
      where: { cartId: cart.id },
    });
    if (remainingCount === 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Clear all items in cart.
   */
  async clearCart(userId: string) {
    const cart = await this.getCartRaw(userId);

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null },
      }),
    ]);

    return this.getCart(userId);
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────

  private async getCartRaw(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    return cart ?? (await prisma.cart.create({ data: { userId } }));
  }

  private calculateCartSummary(cart: {
    id: string;
    userId: string;
    restaurantId: string | null;
    restaurant: {
      id: string;
      name: string;
      slug: string;
      deliveryFee: unknown;
      minOrderAmount: unknown;
      estimatedDeliveryTimeMinutes: number;
    } | null;
    items: {
      id: string;
      quantity: number;
      unitPrice: unknown;
      specialInstructions: string | null;
      menuItem: {
        id: string;
        name: string;
        imageUrl: string | null;
        price: unknown;
        isAvailable: boolean;
      };
    }[];
  }) {
    let subtotal = 0;
    const formattedItems = cart.items.map((item) => {
      const priceNum = Number(item.unitPrice);
      const itemSubtotal = priceNum * item.quantity;
      subtotal += itemSubtotal;

      return {
        id: item.id,
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        imageUrl: item.menuItem.imageUrl,
        quantity: item.quantity,
        unitPrice: priceNum,
        itemSubtotal: Math.round(itemSubtotal * 100) / 100,
        specialInstructions: item.specialInstructions,
        isAvailable: item.menuItem.isAvailable,
      };
    });

    const subtotalRounded = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotalRounded * 0.08 * 100) / 100; // 8% tax rate
    const deliveryFee = cart.restaurant ? Number(cart.restaurant.deliveryFee) : 0;
    const grandTotal = Math.round((subtotalRounded + tax + deliveryFee) * 100) / 100;

    return {
      id: cart.id,
      userId: cart.userId,
      restaurant: cart.restaurant
        ? {
            id: cart.restaurant.id,
            name: cart.restaurant.name,
            slug: cart.restaurant.slug,
            deliveryFee: Number(cart.restaurant.deliveryFee),
            minOrderAmount: Number(cart.restaurant.minOrderAmount),
            estimatedDeliveryTimeMinutes: cart.restaurant.estimatedDeliveryTimeMinutes,
          }
        : null,
      items: formattedItems,
      totals: {
        itemCount: formattedItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal: subtotalRounded,
        tax,
        deliveryFee,
        grandTotal,
      },
    };
  }
}

export const cartsService = new CartsService();
