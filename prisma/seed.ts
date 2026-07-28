/**
 * FoodFlow Database Seed
 *
 * Seeds the initial system roles, permissions, and a SUPER_ADMIN user.
 * Run with: pnpm db:seed
 *
 * This script is idempotent — safe to run multiple times.
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const pool = new pg.Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── System Roles ────────────────────────────────────────────────────────────

const SYSTEM_ROLES = [
  {
    name: "SUPER_ADMIN",
    description: "Platform super administrator — full system access",
    isSystemRole: true,
  },
  {
    name: "ADMIN",
    description: "Platform administrator",
    isSystemRole: true,
  },
  {
    name: "RESTAURANT_OWNER",
    description: "Owner of one or more restaurants",
    isSystemRole: true,
  },
  {
    name: "RESTAURANT_MANAGER",
    description: "Authorized staff member for a restaurant",
    isSystemRole: true,
  },
  {
    name: "DELIVERY_RIDER",
    description: "Delivery rider",
    isSystemRole: true,
  },
  {
    name: "CUSTOMER",
    description: "Platform customer",
    isSystemRole: true,
  },
  {
    name: "SUPPORT_AGENT",
    description: "Customer support agent",
    isSystemRole: true,
  },
] as const;

// ─── System Permissions ──────────────────────────────────────────────────────

const PERMISSIONS = [
  // Users
  {
    name: "users.read",
    resource: "users",
    action: "read",
    description: "Read user profiles",
  },
  {
    name: "users.update",
    resource: "users",
    action: "update",
    description: "Update user profiles",
  },
  {
    name: "users.suspend",
    resource: "users",
    action: "suspend",
    description: "Suspend user accounts",
  },
  {
    name: "users.delete",
    resource: "users",
    action: "delete",
    description: "Delete user accounts",
  },

  // Roles
  { name: "roles.read", resource: "roles", action: "read", description: "Read roles" },
  {
    name: "roles.create",
    resource: "roles",
    action: "create",
    description: "Create roles",
  },
  {
    name: "roles.update",
    resource: "roles",
    action: "update",
    description: "Update roles",
  },
  {
    name: "roles.delete",
    resource: "roles",
    action: "delete",
    description: "Delete roles",
  },
  {
    name: "roles.assign",
    resource: "roles",
    action: "assign",
    description: "Assign roles to users",
  },

  // Permissions
  {
    name: "permissions.read",
    resource: "permissions",
    action: "read",
    description: "Read permissions",
  },
  {
    name: "permissions.assign",
    resource: "permissions",
    action: "assign",
    description: "Assign permissions to roles",
  },

  // Restaurants
  {
    name: "restaurants.create",
    resource: "restaurants",
    action: "create",
    description: "Create restaurants",
  },
  {
    name: "restaurants.read",
    resource: "restaurants",
    action: "read",
    description: "Read restaurant details",
  },
  {
    name: "restaurants.update",
    resource: "restaurants",
    action: "update",
    description: "Update restaurant details",
  },
  {
    name: "restaurants.delete",
    resource: "restaurants",
    action: "delete",
    description: "Delete restaurants",
  },
  {
    name: "restaurants.approve",
    resource: "restaurants",
    action: "approve",
    description: "Approve restaurant applications",
  },
  {
    name: "restaurants.suspend",
    resource: "restaurants",
    action: "suspend",
    description: "Suspend restaurants",
  },

  // Menus
  {
    name: "menus.create",
    resource: "menus",
    action: "create",
    description: "Create menu items",
  },
  {
    name: "menus.read",
    resource: "menus",
    action: "read",
    description: "Read menu items",
  },
  {
    name: "menus.update",
    resource: "menus",
    action: "update",
    description: "Update menu items",
  },
  {
    name: "menus.delete",
    resource: "menus",
    action: "delete",
    description: "Delete menu items",
  },

  // Orders
  { name: "orders.read", resource: "orders", action: "read", description: "Read orders" },
  {
    name: "orders.update",
    resource: "orders",
    action: "update",
    description: "Update order status",
  },
  {
    name: "orders.cancel",
    resource: "orders",
    action: "cancel",
    description: "Cancel orders",
  },

  // Payments
  {
    name: "payments.read",
    resource: "payments",
    action: "read",
    description: "Read payment details",
  },
  {
    name: "payments.refund",
    resource: "payments",
    action: "refund",
    description: "Issue refunds",
  },

  // Deliveries
  {
    name: "deliveries.read",
    resource: "deliveries",
    action: "read",
    description: "Read delivery details",
  },
  {
    name: "deliveries.update",
    resource: "deliveries",
    action: "update",
    description: "Update delivery status",
  },

  // Reviews
  {
    name: "reviews.read",
    resource: "reviews",
    action: "read",
    description: "Read reviews",
  },
  {
    name: "reviews.moderate",
    resource: "reviews",
    action: "moderate",
    description: "Moderate reviews",
  },

  // Coupons
  {
    name: "coupons.create",
    resource: "coupons",
    action: "create",
    description: "Create coupons",
  },
  {
    name: "coupons.read",
    resource: "coupons",
    action: "read",
    description: "Read coupons",
  },
  {
    name: "coupons.update",
    resource: "coupons",
    action: "update",
    description: "Update coupons",
  },
  {
    name: "coupons.delete",
    resource: "coupons",
    action: "delete",
    description: "Delete coupons",
  },

  // Audit
  {
    name: "audit.read",
    resource: "audit",
    action: "read",
    description: "Read audit logs",
  },
] as const;

// ─── Role → Permission Mapping ────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "users.read",
    "users.update",
    "users.suspend",
    "users.delete",
    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",
    "roles.assign",
    "permissions.read",
    "permissions.assign",
    "restaurants.create",
    "restaurants.read",
    "restaurants.update",
    "restaurants.delete",
    "restaurants.approve",
    "restaurants.suspend",
    "menus.create",
    "menus.read",
    "menus.update",
    "menus.delete",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "payments.read",
    "payments.refund",
    "deliveries.read",
    "deliveries.update",
    "reviews.read",
    "reviews.moderate",
    "coupons.create",
    "coupons.read",
    "coupons.update",
    "coupons.delete",
    "audit.read",
  ],
  ADMIN: [
    "users.read",
    "users.update",
    "users.suspend",
    "roles.read",
    "roles.assign",
    "permissions.read",
    "restaurants.read",
    "restaurants.update",
    "restaurants.approve",
    "restaurants.suspend",
    "menus.read",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "payments.read",
    "payments.refund",
    "deliveries.read",
    "deliveries.update",
    "reviews.read",
    "reviews.moderate",
    "coupons.create",
    "coupons.read",
    "coupons.update",
    "coupons.delete",
    "audit.read",
  ],
  RESTAURANT_OWNER: [
    "restaurants.create",
    "restaurants.read",
    "restaurants.update",
    "menus.create",
    "menus.read",
    "menus.update",
    "menus.delete",
    "orders.read",
    "orders.update",
    "deliveries.read",
    "reviews.read",
  ],
  RESTAURANT_MANAGER: [
    "restaurants.read",
    "menus.create",
    "menus.read",
    "menus.update",
    "menus.delete",
    "orders.read",
    "orders.update",
    "deliveries.read",
  ],
  DELIVERY_RIDER: ["deliveries.read", "deliveries.update"],
  CUSTOMER: [
    "restaurants.read",
    "menus.read",
    "orders.read",
    "orders.cancel",
    "payments.read",
    "deliveries.read",
    "reviews.read",
  ],
  SUPPORT_AGENT: [
    "users.read",
    "restaurants.read",
    "orders.read",
    "payments.read",
    "deliveries.read",
    "reviews.read",
  ],
};

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log("🌱 Starting database seed...\n");

  // 1. Upsert Roles
  console.log("📋 Seeding roles...");
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log(`   ✅ ${SYSTEM_ROLES.length} roles seeded\n`);

  // 2. Upsert Permissions
  console.log("🔑 Seeding permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
      },
      create: perm,
    });
  }
  console.log(`   ✅ ${PERMISSIONS.length} permissions seeded\n`);

  // 3. Assign Permissions to Roles
  console.log("🔗 Assigning permissions to roles...");
  for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`   ⚠️  Role ${roleName} not found — skipping`);
      continue;
    }

    for (const permName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (!permission) {
        console.warn(`   ⚠️  Permission ${permName} not found — skipping`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    console.log(`   ✅ ${roleName}: ${permissionNames.length} permissions assigned`);
  }

  console.log("\n✅ Database seed complete!");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
