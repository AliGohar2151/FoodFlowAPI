import type { Request, Response } from "express";
import { addressesService } from "./addresses.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type { CreateAddressInput, UpdateAddressInput } from "./addresses.schema.js";

export class AddressesController {
  /**
   * POST /api/v1/addresses
   */
  async createAddress(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as CreateAddressInput;
    const address = await addressesService.createAddress(req.user.id, input);
    sendSuccess(res, address, {
      message: "Delivery address added successfully",
      statusCode: 201,
    });
  }

  /**
   * GET /api/v1/addresses
   */
  async getAddresses(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const addresses = await addressesService.getAddresses(req.user.id);
    sendSuccess(res, addresses, { message: "Addresses retrieved successfully" });
  }

  /**
   * GET /api/v1/addresses/:id
   */
  async getAddressById(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const address = await addressesService.getAddressById(req.user.id, id);
    sendSuccess(res, address, { message: "Address details retrieved" });
  }

  /**
   * PUT /api/v1/addresses/:id
   */
  async updateAddress(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateAddressInput;
    const updated = await addressesService.updateAddress(req.user.id, id, input);
    sendSuccess(res, updated, { message: "Address updated successfully" });
  }

  /**
   * PATCH /api/v1/addresses/:id/default
   */
  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const updated = await addressesService.setDefaultAddress(req.user.id, id);
    sendSuccess(res, updated, { message: "Default address updated" });
  }

  /**
   * DELETE /api/v1/addresses/:id
   */
  async deleteAddress(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const result = await addressesService.deleteAddress(req.user.id, id);
    sendSuccess(res, result, { message: "Address deleted successfully" });
  }
}

export const addressesController = new AddressesController();
