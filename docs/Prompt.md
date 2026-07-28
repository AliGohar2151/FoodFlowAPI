# FoodFlow API — AI Agent Master Prompt

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.**
> This is the single authoritative context document for any AI agent working on the FoodFlow API project.

---

## 0. Critical Rules for AI Agents

1. **Read `Memory.md` first.** It is the living state of the project. It tells you what is done and what is next.
2. **The codebase is the source of truth** for implementation status — not this file, not `Memory.md`.
3. **Never implement ahead of the current phase.** Do not add authentication, RBAC, or business modules before the foundation is stable.
4. **Update `Memory.md`** after completing each phase or task.
5. **Never break existing working code** to implement new features.
6. **Ask before deviating** from architecture, naming, or technology decisions documented here.
7. **Do not introduce unapproved dependencies.**
8. **Write code as if it will be reviewed** by a senior engineer who cares deeply about maintainability.

---

## 1. What Is FoodFlow?

FoodFlow is a **multi-vendor food delivery backend** built with production-grade engineering practices.

It connects:

- **Customers** → discover restaurants, browse menus, place orders, make payments, track deliveries.
- **Restaurant Owners** → manage restaurant profile, menus, orders, and staff.
- **Delivery Riders** → accept and complete delivery assignments.
- **Platform Admins** → manage the entire ecosystem (users, restaurants, payments, approvals).

---

## 2. Technology Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Runtime         | Node.js                                |
| Language        | TypeScript (strict mode)               |
| Framework       | Express.js                             |
| Package Manager | **pnpm** (never npm or yarn)           |
| Database        | PostgreSQL                             |
| ORM             | Prisma                                 |
| Validation      | Zod                                    |
| Authentication  | JWT (access + refresh tokens)          |
| Authorization   | RBAC + Permissions + Resource Policies |
| Cache           | Redis                                  |
| Queue           | BullMQ (runs on Redis)                 |
| API Style       | REST                                   |
| API Prefix      | `/api/v1`                              |

---

## 3. Architecture

This is a **modular monolith**. Do not prematurely extract microservices.

```
HTTP Request
    ↓
Request ID Middleware
    ↓
Security Headers (Helmet)
    ↓
CORS
    ↓
Rate Limiting
    ↓
Body Parsing
    ↓
Routes
    ↓
authenticate()          ← JWT middleware
    ↓
authorize(permission)   ← RBAC middleware
    ↓
validate(zodSchema)     ← Zod middleware
    ↓
Controller              ← thin, HTTP-only
    ↓
Service                 ← business logic lives here
    ↓
Domain Logic            ← state machines, policies
    ↓
Repository              ← Prisma queries only
    ↓
PostgreSQL
```

Errors at any layer:

```
throw AppError
    ↓
Global Error Middleware
    ↓
Structured JSON Error Response
```

---

## 4. Project Directory Structure

```
src/
│
├── app.ts                  ← Express app setup
├── server.ts               ← HTTP server bootstrap
│
├── config/
│   ├── env.ts              ← Zod-validated environment variables
│   ├── database.ts
│   ├── redis.ts
│   └── logger.ts
│
├── common/
│   ├── errors/             ← AppError, BadRequestError, etc.
│   ├── middleware/         ← authenticate, authorize, validate, asyncHandler
│   ├── types/              ← shared TypeScript types
│   ├── utils/              ← shared utilities
│   ├── constants/
│   └── responses/          ← sendSuccess(), sendError() helpers
│
├── infrastructure/
│   ├── database/
│   │   └── prisma.ts       ← Prisma client singleton
│   ├── cache/
│   │   └── redis.ts        ← Redis client
│   ├── queue/
│   │   ├── bullmq.ts
│   │   └── workers/
│   ├── logging/
│   └── storage/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── rbac/
│   ├── restaurants/
│   ├── menus/
│   ├── addresses/
│   ├── discovery/
│   ├── carts/
│   ├── orders/
│   ├── payments/
│   ├── deliveries/
│   ├── reviews/
│   ├── coupons/
│   ├── notifications/
│   └── audit-logs/
│
└── routes/
    └── index.ts
```

---

## 5. Module Internal Structure

Every module follows this consistent structure:

```
modules/restaurants/
├── restaurant.routes.ts
├── restaurant.controller.ts
├── restaurant.service.ts
├── restaurant.repository.ts
├── restaurant.schema.ts       ← Zod schemas
├── restaurant.types.ts
├── restaurant.policy.ts       ← ownership/resource policies
├── restaurant.mapper.ts       ← map DB entities → API responses
└── index.ts                   ← public module exports
```

For complex modules (e.g., orders):

```
modules/orders/
├── routes/
├── controllers/
├── services/
├── repositories/
├── schemas/
├── policies/
├── domain/
│   ├── order-state-machine.ts
│   └── order-policy.ts
├── mappers/
├── types/
└── index.ts
```

---

## 6. Layer Responsibilities

### Routes

- Define HTTP method, URL, middleware chain, and controller.
- No business logic, no database calls.

```typescript
router.post(
  "/",
  authenticate,
  authorize("restaurants.create"),
  validate(createRestaurantSchema),
  restaurantController.create,
);
```

### Controllers

- Receive validated request data and authenticated user.
- Call the appropriate service.
- Return a standard response.
- **No Prisma. No business logic. No authorization checks.**

```typescript
async create(req: Request, res: Response) {
  const restaurant = await restaurantService.create({
    userId: req.user.id,
    ...req.validatedBody,
  });
  return sendSuccess(res, restaurant, 201);
}
```

### Services

- Contain all application and business logic.
- May call repositories, domain logic, external service abstractions.
- Execute database transactions.
- **Must not depend on Express (`Request`, `Response`).**

### Repositories

- Prisma queries only.
- Data persistence, reads, updates, deletes.
- **No HTTP, no JWTs, no permission checks.**

### Domain

- Centralize core rules: state machines, policies, calculations.
- Examples: `OrderStateMachine`, `CouponPolicy`, `RestaurantOwnershipPolicy`.

---

## 7. TypeScript Rules

- **Strict mode always on** — never disable it.
- **No `any`** unless documented with a reason. Use `unknown`, generics, or interfaces instead.
- **No type assertions (`as SomeType`)** to bypass compiler errors.
- Use **kebab-case** for filenames: `auth.service.ts`, `create-restaurant.schema.ts`.
- Use **camelCase** for variables and functions.
- Use **PascalCase** for classes and interfaces.
- Use **UPPER_SNAKE_CASE** for global constants.
- Database fields use **snake_case** (Prisma maps to camelCase in TypeScript).

---

## 8. API Response Format

**Success:**

```json
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

**Paginated:**

```json
{
  "success": true,
  "message": "Restaurants retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**HTTP Status Codes:**

- `200` — OK
- `201` — Created
- `204` — No Content
- `400` — Bad Request
- `401` — Unauthorized (not authenticated)
- `403` — Forbidden (authenticated but not allowed)
- `404` — Not Found
- `409` — Conflict
- `422` — Unprocessable Entity
- `429` — Too Many Requests
- `500` — Internal Server Error

---

## 9. Error Handling

Use custom application error classes:

```
AppError (base)
├── BadRequestError        → 400
├── UnauthorizedError      → 401
├── ForbiddenError         → 403
├── NotFoundError          → 404
├── ConflictError          → 409
├── ValidationError        → 422
└── BusinessRuleError      → 400 or custom
```

Global error middleware catches all thrown errors and returns a safe, structured response.

**Never expose:** stack traces, internal DB errors, secrets, or infrastructure details in production responses.

---

## 10. Authentication Rules

- **Access tokens:** short-lived JWTs with minimal claims (`userId`, `email`).
- **Refresh tokens:** longer-lived, stored in DB as a **hash** (never raw).
- **Rotation:** every token use issues a new refresh token; old one is revoked.
- **Token reuse detection:** if a revoked token is reused, revoke the entire session chain.
- **Never decode JWTs inside controllers.** Use `authenticate` middleware only.
- **Passwords:** hash with bcrypt (or argon2). Never store plaintext. Never log. Never return in responses.

Authentication endpoints:

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
POST /api/v1/auth/change-password
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-email
```

---

## 11. Authorization Rules

Authorization has **three independent layers** — all must pass:

```
1. Is the user authenticated?        → authenticate()
2. Does the user have permission X?  → authorize("resource.action")
3. Does the user own/manage this resource? → resource policy
```

**Permission naming convention:** `resource.action`

Examples:

```
users.read          users.update        users.suspend
restaurants.create  restaurants.read    restaurants.update
restaurants.approve restaurants.suspend
menus.create        menus.read          menus.update        menus.delete
orders.read         orders.update       orders.cancel
payments.read       payments.refund
reviews.moderate
```

**RBAC Model:**

```
User → UserRole → Role → RolePermission → Permission
```

**System Roles:**

```
SUPER_ADMIN
ADMIN
RESTAURANT_OWNER
RESTAURANT_MANAGER
DELIVERY_RIDER
CUSTOMER
SUPPORT_AGENT
```

**Critical rule:** `having restaurants.update permission ≠ allowed to update any restaurant`.
A `RESTAURANT_OWNER` can only update restaurants they own. Ownership policies enforce this separately.

---

## 12. Vendor Isolation

This is a non-negotiable security requirement.

A restaurant owner **must never** be able to access resources belonging to another restaurant.

Authorization check order for vendor resources:

```
Has Permission?
    ↓
Has Restaurant Scope (is staff/owner of this restaurant)?
    ↓
Owns / Manages the specific Resource?
    ↓
Allow
```

Do not rely on URL parameters alone to verify ownership.

---

## 13. Key Data Models (Conceptual)

### User

```
id, email, phone, passwordHash, firstName, lastName, avatarUrl,
status (ACTIVE | INACTIVE | SUSPENDED | PENDING_VERIFICATION),
emailVerifiedAt, lastLoginAt, createdAt, updatedAt
```

### Restaurant

```
id, ownerId, name, slug, description, logoUrl, coverImageUrl,
phone, email, address, latitude, longitude,
status (PENDING_APPROVAL | ACTIVE | INACTIVE | SUSPENDED | REJECTED),
isOpen, averageRating, totalRatings, estimatedDeliveryMinutes,
createdAt, updatedAt
```

### Order

```
id, orderNumber, customerId, restaurantId,
deliveryAddressSnapshot (JSON),
subtotal, discountAmount, deliveryFee, taxAmount, totalAmount,
status (PENDING | CONFIRMED | PREPARING | READY_FOR_PICKUP |
        ASSIGNED | PICKED_UP | OUT_FOR_DELIVERY | DELIVERED | CANCELLED),
paymentStatus (PENDING | PROCESSING | PAID | FAILED | REFUNDED),
createdAt, updatedAt
```

### OrderItem (historical snapshot — prices must NOT change with menu)

```
id, orderId, menuItemId, name (snapshot), price (snapshot),
quantity, subtotal, selectedOptions (JSON snapshot)
```

### RefreshToken

```
id, userId, tokenHash, expiresAt, revokedAt, replacedByTokenId,
userAgent, ipAddress, createdAt, lastUsedAt
```

---

## 14. Order Lifecycle (State Machine)

```
PENDING
    ↓ (restaurant confirms)
CONFIRMED
    ↓ (restaurant starts preparing)
PREPARING
    ↓ (food is ready)
READY_FOR_PICKUP
    ↓ (rider is assigned)
ASSIGNED
    ↓ (rider picks up)
PICKED_UP
    ↓
OUT_FOR_DELIVERY
    ↓ (delivered)
DELIVERED

At certain states → CANCELLED (business rules apply)
```

**Invalid transitions must be rejected.** State transitions are controlled by `OrderStateMachine` in domain logic — controllers never set status directly.

---

## 15. Delivery Lifecycle

```
PENDING
    ↓
ASSIGNED
    ↓
ACCEPTED
    ↓
PICKED_UP
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED
```

---

## 16. Payment Rules

- Payment status is **always server-determined**. Never trust client-provided payment status.
- Webhook payloads must be **signature-verified** before processing.
- Payment operations must be **idempotent** (safe to receive duplicate webhooks).
- Payment flow: `Initiate → Provider → Webhook → Verify Signature → Update Server State`.
- Payment providers are accessed through an abstraction layer (`PaymentGateway` interface).
- Use `Prisma Decimal` or integer minor units for all monetary values — **no floating point arithmetic** for money.

---

## 17. Cart Rules

- One cart = one restaurant. A customer cannot mix items from different restaurants.
- If a customer adds an item from a different restaurant, they must explicitly clear or replace the existing cart.
- Cart totals are **always calculated server-side** — never trust client totals.
- At order creation, the server **re-validates** every cart item (existence, availability, price).

---

## 18. Financial Calculation Rules

The server always calculates:

```
Subtotal
Discount (from validated coupon)
Tax
Delivery Fee
Total
```

**Clients never determine the final order amount.**

---

## 19. Historical Data Snapshots

When creating an order, snapshot into `OrderItem`:

- Menu item name
- Menu item price at time of order
- Selected options and their prices
- Delivery address (full snapshot, not a reference)

Future changes to the restaurant's menu or customer's saved addresses **must not** alter historical orders.

---

## 20. Zod Validation Rules

- Validate **all** external input: body, params, query, headers, environment variables, webhook payloads.
- Use a centralized `validate(schema)` middleware — do not duplicate validation in controllers.
- Zod validates **format** (is email valid?). Services validate **business state** (is email unique?).
- Environment variables must be validated at startup. The app must **fail fast** if config is missing.

---

## 21. Security Checklist

Every implementation must consider:

- [ ] Helmet (security headers)
- [ ] CORS (restrict origins in production)
- [ ] Rate limiting (per IP, per route)
- [ ] Zod input validation
- [ ] JWT authentication
- [ ] Permission-based authorization
- [ ] Resource ownership policies
- [ ] Secure password hashing
- [ ] Refresh token rotation
- [ ] Token revocation on logout
- [ ] No sensitive data in JWT payload
- [ ] No secrets in logs or error responses
- [ ] Idempotent payment operations
- [ ] Audit logging for sensitive admin actions

---

## 22. Background Job Rules (BullMQ)

Use queues for:

- Email sending
- Push notifications
- Payment event processing
- Cleanup jobs
- Report generation

Jobs must be:

- **Retryable** with exponential backoff
- **Idempotent** where possible
- **Observable** (failures visible and recoverable)

Keep queue payloads **minimal** — pass IDs, not full objects:

```json
{ "orderId": "abc-123" }
```

not a serialized full order.

**Critical business transactions must not depend on async jobs completing.**

---

## 23. Caching Rules (Redis)

- Do not cache by default. First establish correctness, then measure, then cache selectively.
- Initial cache candidates: restaurant listings, restaurant details, menu data, public config.
- Every cache entry must have a **TTL** and a defined **invalidation strategy**.
- PostgreSQL is always the source of truth.

---

## 24. Testing Strategy

```
Unit Tests       → State machines, permission logic, coupon calculations, domain policies
Integration Tests → Database, auth flows, RBAC, vendor isolation, order creation, payments
E2E Tests        → Full customer journey, restaurant workflow, rider workflow
```

Critical areas requiring strong test coverage:

- Authentication (login, refresh, rotation, revocation)
- RBAC and permission enforcement
- Vendor isolation
- Order creation atomicity
- Order state machine transitions
- Payment webhook idempotency

---

## 25. Implementation Phases (Status Overview)

```
Phase 0  — Project Planning            ✅ COMPLETE
Phase 1  — Project Foundation          🔲 NEXT
Phase 2  — Core Infrastructure         🔲 NOT STARTED
Phase 3  — PostgreSQL + Prisma         🔲 NOT STARTED
Phase 4  — Redis                       🔲 NOT STARTED
Phase 5  — Authentication              🔲 NOT STARTED
Phase 6  — RBAC + Permissions          🔲 NOT STARTED
Phase 7  — Authorization Policies      🔲 NOT STARTED
Phase 8  — Users                       🔲 NOT STARTED
Phase 9  — Restaurants                 🔲 NOT STARTED
Phase 10 — Restaurant Staff            🔲 NOT STARTED
Phase 11 — Menus                       🔲 NOT STARTED
Phase 12 — Addresses                   🔲 NOT STARTED
Phase 13 — Discovery                   🔲 NOT STARTED
Phase 14 — Cart                        🔲 NOT STARTED
Phase 15 — Orders                      🔲 NOT STARTED
Phase 16 — Order State Machine         🔲 NOT STARTED
Phase 17 — Payments                    🔲 NOT STARTED
Phase 18 — Delivery                    🔲 NOT STARTED
Phase 19 — Reviews                     🔲 NOT STARTED
Phase 20 — Coupons                     🔲 NOT STARTED
Phase 21 — Notifications               🔲 NOT STARTED
Phase 22 — Background Jobs             🔲 NOT STARTED
Phase 23 — Audit Logs                  🔲 NOT STARTED
Phase 24 — Caching                     🔲 NOT STARTED
Phase 25 — API Documentation           🔲 NOT STARTED
Phase 26 — Testing                     🔲 NOT STARTED
Phase 27 — Docker                      🔲 NOT STARTED
Phase 28 — CI/CD                       🔲 NOT STARTED
Phase 29 — Production Hardening        🔲 NOT STARTED
Phase 30 — Observability               🔲 NOT STARTED
Phase 31 — Performance                 🔲 NOT STARTED
Phase 32 — Security Review             🔲 NOT STARTED
Phase 33 — Final Documentation         🔲 NOT STARTED
```

> Always check `Memory.md` for the authoritative current status before starting work.

---

## 26. Phase 1 — What to Build Next

**Current task: Initialize the FoodFlow API project.**

### Required Files

```
package.json        ← pnpm, scripts: dev, build, start, typecheck, lint, lint:fix, format, format:check, test, test:watch, test:coverage
tsconfig.json       ← strict mode enabled
eslint.config.*
prettier.config.*
.gitignore
.env.example        ← all required env vars listed
README.md
```

### Required Source Structure

```
src/
├── app.ts
├── server.ts
├── config/
├── common/
├── infrastructure/
├── modules/
└── routes/
```

### Phase 1 Completion Criteria

- [ ] Application starts without errors.
- [ ] TypeScript compiles cleanly.
- [ ] ESLint passes.
- [ ] Prettier passes.
- [ ] Environment variables are validated via Zod at startup (fail fast if missing).
- [ ] Git hooks (Husky + lint-staged) work.

**Do not implement:** auth, RBAC, database models, or any business module during Phase 1.

---

## 27. Key Principles Summary

| Principle         | Rule                                                      |
| ----------------- | --------------------------------------------------------- |
| Business logic    | Lives in Services, never in Controllers                   |
| Authorization     | Always 3-layer: auth + permission + ownership policy      |
| Validation        | Zod at the boundary, before any service call              |
| Money             | Server-calculated only; use Decimal, never float math     |
| Passwords         | bcrypt/argon2 hashed, never stored or logged as plaintext |
| Refresh tokens    | Stored as hash, rotated on every use                      |
| Order history     | Snapshots at creation time, immutable after               |
| Cart              | One restaurant per cart, server-calculated totals         |
| Vendor isolation  | Owners cannot touch other restaurants' data               |
| Error responses   | Consistent JSON format, never expose internals            |
| Cross-module data | Use the module's service API, not direct Prisma queries   |

---

## 28. Reference Files

| File        | Purpose                                                     |
| ----------- | ----------------------------------------------------------- |
| `Memory.md` | Current project state, completed phases, next task          |
| `PRD.md`    | Full product requirements                                   |
| `Phases.md` | Detailed implementation phases with tasks and criteria      |
| `Rules.md`  | Mandatory engineering rules with examples                   |
| `Design.md` | Technical design: models, architecture diagrams, API design |
| `Prompt.md` | This file — the master agent context                        |
