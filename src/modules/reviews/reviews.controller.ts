import type { Request, Response } from "express";
import { reviewsService } from "./reviews.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewQueryInput,
} from "./reviews.schema.js";

export class ReviewsController {
  /**
   * POST /api/v1/reviews
   */
  async createReview(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as CreateReviewInput;
    const review = await reviewsService.createReview(req.user.id, input);
    sendSuccess(res, review, {
      message: "Review submitted successfully",
      statusCode: 201,
    });
  }

  /**
   * PUT /api/v1/reviews/:id
   */
  async updateReview(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateReviewInput;
    const updated = await reviewsService.updateReview(req.user, id, input);
    sendSuccess(res, updated, { message: "Review updated successfully" });
  }

  /**
   * DELETE /api/v1/reviews/:id
   */
  async deleteReview(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const result = await reviewsService.deleteReview(req.user, id);
    sendSuccess(res, result, { message: "Review deleted successfully" });
  }

  /**
   * GET /api/v1/reviews/restaurant/:restaurantId
   */
  async getRestaurantReviews(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const query = (req.validatedQuery as ReviewQueryInput | undefined) ?? {
      page: 1,
      limit: 20,
    };
    const result = await reviewsService.getRestaurantReviews(restaurantId, query);
    sendSuccess(res, result, { message: "Restaurant reviews retrieved" });
  }

  /**
   * GET /api/v1/reviews/mine
   */
  async getMyReviews(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const query = (req.validatedQuery as ReviewQueryInput | undefined) ?? {
      page: 1,
      limit: 20,
    };
    const result = await reviewsService.getMyReviews(req.user.id, query);
    sendSuccess(res, result, { message: "My reviews retrieved" });
  }
}

export const reviewsController = new ReviewsController();
