import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";
import type { CreateAddressInput, UpdateAddressInput } from "./addresses.schema.js";

export class AddressesService {
  /**
   * Create a delivery address for a user.
   */
  async createAddress(userId: string, input: CreateAddressInput) {
    const count = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = input.isDefault || count === 0;

    return prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          title: input.title,
          streetAddress: input.streetAddress,
          apartment: input.apartment ?? null,
          city: input.city,
          state: input.state ?? null,
          postalCode: input.postalCode,
          country: input.country,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          deliveryInstructions: input.deliveryInstructions ?? null,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  /**
   * Get all delivery addresses for a user.
   */
  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Get address by ID for a user.
   */
  async getAddressById(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundError("Address");
    }

    return address;
  }

  /**
   * Update an address.
   */
  async updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
    const existing = await this.getAddressById(userId, addressId);

    return prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          title: input.title ?? existing.title,
          streetAddress: input.streetAddress ?? existing.streetAddress,
          apartment: input.apartment !== undefined ? input.apartment : existing.apartment,
          city: input.city ?? existing.city,
          state: input.state !== undefined ? input.state : existing.state,
          postalCode: input.postalCode ?? existing.postalCode,
          country: input.country ?? existing.country,
          latitude: input.latitude !== undefined ? input.latitude : existing.latitude,
          longitude: input.longitude !== undefined ? input.longitude : existing.longitude,
          deliveryInstructions:
            input.deliveryInstructions !== undefined
              ? input.deliveryInstructions
              : existing.deliveryInstructions,
          isDefault: input.isDefault ?? existing.isDefault,
        },
      });
    });
  }

  /**
   * Set an address as default.
   */
  async setDefaultAddress(userId: string, addressId: string) {
    await this.getAddressById(userId, addressId);

    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  /**
   * Delete an address.
   */
  async deleteAddress(userId: string, addressId: string) {
    const target = await this.getAddressById(userId, addressId);

    return prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      // If target was default, assign default to newest remaining address
      if (target.isDefault) {
        const newest = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (newest) {
          await tx.address.update({
            where: { id: newest.id },
            data: { isDefault: true },
          });
        }
      }

      return { message: "Address deleted successfully" };
    });
  }
}

export const addressesService = new AddressesService();
