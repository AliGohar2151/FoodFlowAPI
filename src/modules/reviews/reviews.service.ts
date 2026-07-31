import { prisma } from "../../infrastructure/database/index.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewQueryInput,
} from "./reviews.schema.js";
import { OrderStatus } from "../../generated/prisma/client.js";

export class ReviewsService {
  /**
   * Create a review for an eligible delivered order.
   */
  async createReview(userId: string, input: CreateReviewInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.userId !== userId) {
      throw new ForbiddenError("You can only review your own orders");
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestError("Reviews are only allowed for delivered orders");
    }

    const existingReview = await prisma.review.findUnique({
      where: { orderId: input.orderId },
    });

    if (existingReview) {
      throw new BadRequestError("This order has already been reviewed");
    }

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        userId,
        restaurantId: order.restaurantId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
    });

    await this.recalculateRestaurantRating(order.restaurantId);

    return review;
  }

  /**
   * Update an existing review.
   */
  async updateReview(
    userContext: UserContext,
    reviewId: string,
    input: UpdateReviewInput,
  ) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError("Review");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isOwner = review.userId === userContext.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError("You are not authorized to edit this review");
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.comment !== undefined && { comment: input.comment }),
      },
    });

    if (input.rating !== undefined) {
      await this.recalculateRestaurantRating(review.restaurantId);
    }

    return updated;
  }

  /**
   * Delete a review.
   */
  async deleteReview(userContext: UserContext, reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError("Review");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isOwner = review.userId === userContext.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError("You are not authorized to delete this review");
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    await this.recalculateRestaurantRating(review.restaurantId);

    return { id: reviewId };
  }

  /**
   * Get reviews and rating summary for a restaurant.
   */
  async getRestaurantReviews(restaurantId: string, query: ReviewQueryInput) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { restaurantId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { restaurantId } }),
    ]);

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        averageRating: Number(restaurant.rating),
        ratingCount: restaurant.ratingCount,
      },
      reviews,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get reviews created by requesting user.
   */
  async getMyReviews(userId: string, query: ReviewQueryInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Internal helper to update average rating and count on Restaurant model.
   */
  private async recalculateRestaurantRating(restaurantId: string) {
    const aggregate = await prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = aggregate._avg.rating ?? 0;
    const ratingCount = aggregate._count.rating;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        rating: averageRating,
        ratingCount,
      },
    });
  }
}

export const reviewsService = new ReviewsService();
