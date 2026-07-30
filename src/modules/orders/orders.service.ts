import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError, BadRequestError } from "../../common/errors/index.js";
import { PolicyEngine } from "../../common/policies/policy-engine.js";
import { orderPolicy } from "../../common/policies/order.policy.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import type {
  CreateOrderInput,
  OrderQueryInput,
  UpdateOrderStatusInput,
} from "./orders.schema.js";
import { OrderStatus } from "../../generated/prisma/client.js";
import { OrderStateMachine } from "./order-state-machine.js";

export class OrdersService {
  /**
   * Create order from active cart within an atomic transaction.
   */
  async createOrder(userId: string, input: CreateOrderInput) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError(
        "Cart is empty. Add items to cart before placing an order.",
      );
    }

    if (!cart.restaurantId || !cart.restaurant) {
      throw new BadRequestError("Cart is not associated with any restaurant");
    }

    // Verify all cart items are currently available
    for (const item of cart.items) {
      if (!item.menuItem.isAvailable) {
        throw new BadRequestError(`Item '${item.menuItem.name}' is no longer available`);
      }
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: input.addressId, userId },
    });

    if (!address) {
      throw new NotFoundError("Delivery address");
    }

    const deliveryAddressSnapshot = {
      title: address.title,
      streetAddress: address.streetAddress,
      apartment: address.apartment,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude ? Number(address.latitude) : null,
      longitude: address.longitude ? Number(address.longitude) : null,
      deliveryInstructions: address.deliveryInstructions,
    };

    // Calculate subtotal, tax, delivery fee, grand total
    let subtotal = 0;
    const orderItemInputs = cart.items.map((item) => {
      const priceNum = Number(item.unitPrice);
      const itemSubtotal = priceNum * item.quantity;
      subtotal += itemSubtotal;

      return {
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        unitPrice: priceNum,
        quantity: item.quantity,
        subtotal: Math.round(itemSubtotal * 100) / 100,
        specialInstructions: item.specialInstructions,
      };
    });

    const subtotalRounded = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotalRounded * 0.08 * 100) / 100;
    const deliveryFee = Number(cart.restaurant.deliveryFee);
    const totalAmount = Math.round((subtotalRounded + tax + deliveryFee) * 100) / 100;

    const orderNumber = `ORD-${Date.now().toString()}-${Math.floor(1000 + Math.random() * 9000).toString()}`;
    const targetRestaurantId = cart.restaurant.id;

    // Execute atomic order creation and cart wipe transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          restaurantId: targetRestaurantId,
          addressId: address.id,
          subtotal: subtotalRounded,
          tax,
          deliveryFee,
          discount: 0,
          totalAmount,
          deliveryAddressSnapshot,
          specialInstructions: input.specialInstructions ?? null,
          items: {
            create: orderItemInputs,
          },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          items: true,
        },
      });

      // Record initial status in audit history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          changedById: userId,
          reason: "Order placed",
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null },
      });

      return newOrder;
    });

    return this.formatOrder(order);
  }

  /**
   * Get order details by ID with ABAC authorization enforcement.
   */
  async getOrderById(userContext: UserContext, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order");
    }

    // Enforce ABAC Policy
    await PolicyEngine.enforce(userContext, orderPolicy, "read", {
      id: order.id,
      customerId: order.userId,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      riderId: order.riderId,
    });

    return this.formatOrder(order);
  }

  /**
   * List customer's order history with pagination.
   */
  async listUserOrders(userId: string, query: OrderQueryInput) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List restaurant's orders for owner/staff/admins.
   */
  async listRestaurantOrders(
    userContext: UserContext,
    restaurantId: string,
    query: OrderQueryInput,
  ) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    // Check if user is owner, staff, or admin
    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isOwner = restaurant.ownerId === userContext.id;

    if (!isAdmin && !isOwner) {
      const staff = await prisma.restaurantStaff.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId,
            userId: userContext.id,
          },
        },
      });

      if (!staff) {
        throw new NotFoundError("Restaurant");
      }
    }

    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      restaurantId,
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status using state machine validation and recording audit history.
   */
  async updateOrderStatus(
    userContext: UserContext,
    orderId: string,
    input: UpdateOrderStatusInput,
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          include: {
            staff: {
              where: { userId: userContext.id },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError("Order");
    }

    const isStaffOrOwner =
      order.restaurant.ownerId === userContext.id || order.restaurant.staff.length > 0;

    // Validate state machine transition graph and role permissions
    OrderStateMachine.validateTransition(order.status, input.status, userContext, {
      id: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      riderId: order.riderId,
      status: order.status,
      isStaffOrOwner,
    });

    // Execute status update and create status history audit entry
    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: input.status },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          items: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: input.status,
          changedById: userContext.id,
          reason: input.reason ?? null,
        },
      });

      return updatedOrder;
    });

    return this.formatOrder(updated);
  }

  /**
   * Cancel an order using state machine transition logic.
   */
  async cancelOrder(userContext: UserContext, orderId: string, reason?: string) {
    return this.updateOrderStatus(userContext, orderId, {
      status: OrderStatus.CANCELLED,
      reason: reason ?? "Order cancelled by user",
    });
  }

  /**
   * Get order status transition audit history.
   */
  async getOrderHistory(userContext: UserContext, orderId: string) {
    // Verify user can read order
    await this.getOrderById(userContext, orderId);

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return history.map((entry) => ({
      id: entry.id,
      orderId: entry.orderId,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      changedBy: {
        id: entry.changedBy.id,
        name: `${entry.changedBy.firstName} ${entry.changedBy.lastName}`,
        email: entry.changedBy.email,
      },
      reason: entry.reason,
      createdAt: entry.createdAt,
    }));
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────

  private formatOrder(order: {
    id: string;
    orderNumber: string;
    userId: string;
    restaurantId: string;
    addressId: string | null;
    riderId: string | null;
    status: string;
    subtotal: unknown;
    tax: unknown;
    deliveryFee: unknown;
    discount: unknown;
    totalAmount: unknown;
    deliveryAddressSnapshot: unknown;
    specialInstructions: string | null;
    createdAt: Date;
    updatedAt: Date;
    restaurant: {
      id: string;
      name: string;
      slug: string;
    };
    items: {
      id: string;
      menuItemId: string;
      name: string;
      unitPrice: unknown;
      quantity: number;
      subtotal: unknown;
      specialInstructions: string | null;
    }[];
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      restaurant: order.restaurant,
      addressId: order.addressId,
      riderId: order.riderId,
      status: order.status,
      pricing: {
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        deliveryFee: Number(order.deliveryFee),
        discount: Number(order.discount),
        totalAmount: Number(order.totalAmount),
      },
      deliveryAddress: order.deliveryAddressSnapshot,
      specialInstructions: order.specialInstructions,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        specialInstructions: item.specialInstructions,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

export const ordersService = new OrdersService();
