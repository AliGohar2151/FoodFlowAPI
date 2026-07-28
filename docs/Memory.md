# FoodFlow API — Project Memory

**Project:** FoodFlow API
**Version:** 1.0
**Status:** Development
**Architecture:** Modular Monolith
**Backend:** Node.js + TypeScript + Express.js
**Database:** PostgreSQL
**ORM:** Prisma
**Validation:** Zod
**Authentication:** JWT
**Authorization:** RBAC + Permissions + Resource Policies
**Cache:** Redis
**Queues:** BullMQ
**API Style:** REST
**API Version:** `/api/v1`

---

# 1. Purpose of This File

This file is the persistent memory of the FoodFlow backend project.

Any AI coding agent working on this project must read this file before making changes.

The agent must also read:

```text
PRD.md
Architecture.md
Rules.md
Phases.md
Design.md
Memory.md
```

The agent must not assume that the current implementation matches the original plan.

The actual codebase is the source of truth for implementation status.

This file records:

- Current project state.
- Completed phases.
- Current phase.
- Next task.
- Important architectural decisions.
- Database decisions.
- Security decisions.
- Known issues.
- Technical debt.
- Deferred features.
- Important lessons learned.

---

# 2. Project Vision

FoodFlow is a multi-vendor food delivery backend.

The platform allows:

```text
Customers
    ↓
Discover Restaurants
    ↓
Browse Menus
    ↓
Add Food to Cart
    ↓
Create Orders
    ↓
Make Payments
    ↓
Track Delivery
    ↓
Receive Food
    ↓
Leave Reviews
```

Restaurants can:

```text
Manage Restaurant
    ↓
Manage Staff
    ↓
Manage Menus
    ↓
Receive Orders
    ↓
Process Orders
    ↓
Prepare Food
    ↓
Hand Order to Rider
```

Delivery riders can:

```text
View Assignments
    ↓
Accept Delivery
    ↓
Pickup Order
    ↓
Deliver Order
    ↓
Complete Delivery
```

Administrators can:

```text
Manage Users
Manage Roles
Manage Permissions
Approve Restaurants
Suspend Restaurants
Manage Orders
Manage Payments
Issue Refunds
View Audit Logs
```

---

# 3. Core Architecture Decision

The project is a **modular monolith**.

Do not convert the application into microservices prematurely.

The current architecture is:

```text
Express API
    ↓
Modules
    ↓
Services
    ↓
Domain Logic
    ↓
Repositories
    ↓
PostgreSQL
```

Infrastructure:

```text
PostgreSQL
Redis
BullMQ
External Services
```

The system should be designed so that individual modules can be extracted into services in the future if required.

The current priority is:

```text
Correctness
    ↓
Security
    ↓
Maintainability
    ↓
Testing
    ↓
Observability
    ↓
Performance
    ↓
Scaling
```

---

# 4. Technology Decisions

## Runtime

```text
Node.js
```

## Language

```text
TypeScript
```

Strict TypeScript mode must be enabled.

Avoid:

```typescript
any;
```

unless there is a documented reason.

---

## Framework

```text
Express.js
```

The API uses Express for HTTP transport.

Business logic must not be placed directly inside Express route handlers.

---

## Package Manager

```text
pnpm
```

Use pnpm consistently.

Do not introduce npm or yarn lockfiles.

---

## Database

```text
PostgreSQL
```

PostgreSQL is the primary source of truth.

---

## ORM

```text
Prisma
```

Prisma is responsible for:

- Database access.
- Schema management.
- Migrations.
- Transactions.

---

## Validation

```text
Zod
```

All external input must be validated.

Validation applies to:

```text
Body
Params
Query
Headers
```

Never trust client input.

---

## Authentication

```text
JWT
```

Authentication uses:

```text
Short-lived Access Token
+
Rotating Refresh Token
```

Access tokens should contain minimal information.

---

## Authorization

Authorization uses:

```text
RBAC
+
Permissions
+
Resource Policies
```

A role alone does not determine whether a user can access a resource.

For vendor-owned resources:

```text
Permission
+
Restaurant Scope
+
Resource Ownership
```

must be evaluated where applicable.

---

## Cache

```text
Redis
```

Redis is used for:

- Caching.
- Rate limiting.
- Temporary data.
- BullMQ infrastructure.

PostgreSQL remains the source of truth.

---

## Background Jobs

```text
BullMQ
```

BullMQ runs on Redis.

Use background jobs for:

- Emails.
- Notifications.
- Non-critical asynchronous work.
- Cleanup.
- Retryable operations.

Critical business transactions should not depend on asynchronous jobs completing successfully.

---

# 5. Current Project Status

## Planning

```text
PRD.md              COMPLETE
Architecture.md     COMPLETE
Rules.md            COMPLETE
Phases.md           COMPLETE
Design.md           COMPLETE
Memory.md           COMPLETE
```

## Implementation

```text
Phase 0  — Planning                  COMPLETE
Phase 1  — Project Foundation        COMPLETE
Phase 2  — Core Infrastructure       COMPLETE
Phase 3  — PostgreSQL + Prisma       COMPLETE
Phase 4  — Redis                     COMPLETE
Phase 5  — Authentication            COMPLETE
Phase 6  — RBAC                      COMPLETE
Phase 7  — Authorization Policies    COMPLETE
Phase 8  — Users                     COMPLETE
Phase 9  — Restaurants               COMPLETE
Phase 10 — Restaurant Staff          COMPLETE
Phase 11 — Menus                     COMPLETE
Phase 12 — Addresses                 COMPLETE
Phase 13 — Discovery                 COMPLETE
Phase 14 — Cart                      COMPLETE
Phase 15 — Orders                    COMPLETE
Phase 16 — Order State Machine       NOT STARTED
Phase 17 — Payments                  NOT STARTED
Phase 18 — Delivery                  NOT STARTED
Phase 19 — Reviews                   NOT STARTED
Phase 20 — Coupons                   NOT STARTED
Phase 21 — Notifications             NOT STARTED
Phase 22 — Background Jobs           NOT STARTED
Phase 23 — Audit Logs                NOT STARTED
Phase 24 — Caching                   NOT STARTED
Phase 25 — API Documentation         NOT STARTED
Phase 26 — Testing                   NOT STARTED
Phase 27 — Docker                    NOT STARTED
Phase 28 — CI/CD                     NOT STARTED
Phase 29 — Production Hardening      NOT STARTED
Phase 30 — Observability             NOT STARTED
Phase 31 — Performance               NOT STARTED
Phase 32 — Security Review           NOT STARTED
Phase 33 — Final Documentation       NOT STARTED
```

---

# 6. Current Development Phase

```text
Current Phase: Phase 16 — Order State Machine Module
Current Status: NOT STARTED
```

Phases 1 through 15 are complete. Order Placement & Management Module (`Order` & `OrderItem` models, atomic checkout order placement flow from cart, price/name snapshotting, address snapshotting, order history listing for users, owners & staff, order details, ABAC Policy enforcement, order cancellation policy) is fully implemented, verified, and test-covered.

Next implementation task: Phase 16 — Order State Machine Module (state transitions: `PENDING` → `CONFIRMED` → `PREPARING` → `READY_FOR_PICKUP` → `ASSIGNED` → `PICKED_UP` → `OUT_FOR_DELIVERY` → `DELIVERED`, role-based state transition permissions, transition history log).

The first implementation milestone is:

```text
Create Project
    ↓
Configure TypeScript
    ↓
Configure ESLint
    ↓
Configure Prettier
    ↓
Configure Git Hooks
    ↓
Configure Environment
    ↓
Start Express Server
    ↓
Create Health Endpoint
```

---

# 7. Current Next Task

The next task is:

```text
Initialize FoodFlow API repository.
```

Expected initial structure:

```text
foodflow-api/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │
│   ├── common/
│   │
│   ├── infrastructure/
│   │
│   ├── modules/
│   │
│   └── routes/
│
├── tests/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── eslint.config.*
├── prettier.config.*
└── README.md
```

Do not implement authentication, RBAC, database models, or business modules before the project foundation is ready.

---

# 8. Architecture Rules

The following rules are mandatory.

## Rule 1

Controllers handle HTTP concerns.

Controllers should:

- Receive validated input.
- Call application services.
- Return responses.

Controllers should not contain complex business logic.

---

## Rule 2

Services contain application/business orchestration.

Services are responsible for:

- Business workflows.
- Transaction coordination.
- Domain rules.
- Calling repositories.

---

## Rule 3

Repositories handle data access.

Repositories should encapsulate:

- Prisma queries.
- Database-specific operations.
- Data persistence.

Do not scatter Prisma queries throughout controllers.

---

## Rule 4

Validation occurs at the boundary.

Use Zod before business logic.

```text
Request
    ↓
Zod
    ↓
Validated Data
    ↓
Service
```

---

## Rule 5

Authorization is mandatory.

A protected endpoint should generally follow:

```text
authenticate()
    ↓
authorize(permission)
    ↓
resource policy
    ↓
controller
```

---

## Rule 6

Never trust client-provided financial values.

The server calculates:

```text
Subtotal
Discount
Tax
Delivery Fee
Total
```

The client must never determine the final order total.

---

## Rule 7

Never trust client-provided authorization.

The server determines:

```text
User
Roles
Permissions
Resource Ownership
```

---

## Rule 8

Use transactions for atomic business operations.

Order creation must be atomic.

Payment state changes must be carefully designed for consistency.

---

## Rule 9

Critical operations should be idempotent.

Examples:

```text
Payment Creation
Payment Webhooks
Refunds
Order Creation
```

where appropriate.

---

## Rule 10

Historical records must be preserved.

Orders should snapshot:

```text
Menu Item Name
Menu Item Price
Selected Options
Delivery Address
Applied Discounts
```

Changing current restaurant data must not modify historical orders.

---

# 9. RBAC Memory

The authorization model is:

```text
User
    ↓
UserRole
    ↓
Role
    ↓
RolePermission
    ↓
Permission
```

A user may have multiple roles.

A role may have multiple permissions.

A permission represents an action on a resource.

Naming convention:

```text
resource.action
```

Examples:

```text
restaurants.read
restaurants.create
restaurants.update
restaurants.approve

menus.read
menus.create
menus.update
menus.delete

orders.read
orders.update
orders.cancel

payments.read
payments.refund
```

Initial system roles:

```text
SUPER_ADMIN
ADMIN
RESTAURANT_OWNER
RESTAURANT_MANAGER
DELIVERY_RIDER
CUSTOMER
SUPPORT_AGENT
```

Permissions are defined by developers.

Roles may be managed by administrators according to authorization rules.

The `SUPER_ADMIN` role should be seeded.

---

# 10. Vendor Isolation Memory

This is a critical business requirement.

A restaurant owner must not be able to access another restaurant's resources.

Example:

```text
Restaurant A Owner
    ↓
Restaurant A
    ├── Menu
    ├── Orders
    └── Staff

Restaurant B
    ├── Menu
    ├── Orders
    └── Staff
```

Restaurant A's owner must not access Restaurant B.

Authorization should follow:

```text
Has Permission?
    ↓
Has Restaurant Scope?
    ↓
Owns / Manages Resource?
    ↓
Allow
```

Do not rely only on URL parameters.

---

# 11. Order Memory

Orders are the central business workflow.

Order lifecycle:

```text
PENDING
    ↓
CONFIRMED
    ↓
PREPARING
    ↓
READY_FOR_PICKUP
    ↓
ASSIGNED
    ↓
PICKED_UP
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED
```

Cancellation is allowed only from valid states.

All transitions must be validated by a centralized state machine.

Do not allow controllers to manually set arbitrary order statuses.

---

# 12. Payment Memory

Payment providers must be abstracted.

Expected architecture:

```text
PaymentService
    ↓
PaymentGateway Interface
    ├── Provider A
    ├── Provider B
    └── Future Providers
```

The business logic should not depend directly on a specific payment provider SDK.

Payment webhooks must:

```text
Verify Signature
    ↓
Validate Payload
    ↓
Check Idempotency
    ↓
Update Payment
    ↓
Update Order
```

Never trust a client request saying:

```text
"Payment successful"
```

Payment success must be verified server-side.

---

# 13. Money Memory

Monetary values must be handled precisely.

Do not rely on JavaScript floating-point arithmetic for financial calculations.

The project should use a consistent approach such as:

```text
Prisma Decimal
```

or:

```text
Integer Minor Units
```

The final implementation decision must be documented before payment and order modules are implemented.

The same strategy must be used consistently across:

```text
Menu Prices
Order Items
Subtotal
Discount
Tax
Delivery Fee
Payment
Refunds
Coupons
```

---

# 14. Time Memory

All timestamps should be stored in UTC.

Local timezone conversion belongs at the presentation boundary.

Restaurant operating hours require timezone-aware logic.

Coupon expiration and scheduled operations must be evaluated consistently.

---

# 15. Database Memory

PostgreSQL is the source of truth.

Important entities:

```text
User
Role
Permission
UserRole
RolePermission
RefreshToken

Restaurant
RestaurantStaff
RestaurantOperatingHour

MenuCategory
MenuItem
MenuItemOption

Address
Cart
CartItem

Order
OrderItem
OrderStatusHistory

Payment

Delivery
RiderProfile

Review

Coupon
OrderCoupon

Notification
AuditLog
```

---

# 16. Important Database Constraints

Expected unique constraints include:

```text
User.email
User.phone

Restaurant.slug

Role.name
Permission.name

UserRole(userId, roleId)

RolePermission(roleId, permissionId)

RestaurantStaff(restaurantId, userId)

Review(orderId)

Coupon.code
```

Database constraints are part of business integrity.

Application-level validation does not replace database constraints.

---

# 17. API Design Memory

All API routes use:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/users/me
/api/v1/restaurants
/api/v1/orders
/api/v1/payments
```

Use RESTful naming.

Use plural resource names.

Prefer:

```text
GET /restaurants
GET /restaurants/:restaurantId
POST /restaurants
PATCH /restaurants/:restaurantId
DELETE /restaurants/:restaurantId
```

Avoid action-heavy routes unless the operation represents a genuine state transition.

For example:

```text
POST /orders/:orderId/cancel
```

may be appropriate because cancellation is a domain operation.

---

# 18. API Response Memory

Success response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": {
    "code": "ERROR_CODE",
    "details": []
  }
}
```

Pagination:

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

The response structure should remain consistent throughout the API.

---

# 19. Error Memory

Use custom application errors.

Expected errors:

```text
BadRequestError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
ValidationError
BusinessRuleError
```

Global error middleware maps application errors to HTTP responses.

Do not expose:

- Stack traces.
- Database internals.
- Secrets.
- Sensitive infrastructure details.

Production error responses should be safe for public clients.

---

# 20. Security Memory

Security is a first-class requirement.

Required protections include:

```text
Helmet
CORS
Rate Limiting
Zod Validation
JWT Authentication
RBAC
Resource Policies
Secure Password Hashing
Refresh Token Rotation
Token Revocation
Database Constraints
Audit Logging
```

Passwords must never be stored in plaintext.

Refresh tokens should be stored securely and preferably hashed at rest.

JWTs must contain minimal claims.

---

# 21. Caching Memory

Redis caching is optional for each individual feature.

Do not add caching automatically.

First establish:

```text
Correctness
```

Then:

```text
Measure Performance
```

Then:

```text
Cache Only Where Useful
```

Initial caching candidates:

```text
Restaurant Details
Restaurant Listings
Menu Data
Public Configuration
```

Every cache must have:

```text
TTL
+
Invalidation Strategy
```

---

# 22. Background Job Memory

BullMQ is used for asynchronous processing.

Potential queues:

```text
email
notifications
payments
cleanup
```

Jobs should be:

- Retryable.
- Idempotent where appropriate.
- Observable.
- Recoverable.

Avoid putting large object graphs into queue payloads.

Prefer:

```json
{
  "orderId": "order-id"
}
```

instead of serializing an entire order object.

---

# 23. Testing Memory

Testing strategy:

```text
Unit Tests
    ↓
Integration Tests
    ↓
End-to-End Tests
```

Critical areas requiring strong coverage:

```text
Authentication
RBAC
Permissions
Vendor Isolation
Order Creation
Order State Machine
Payment Webhooks
Coupon Calculation
Delivery Authorization
```

Every major business rule should have automated tests.

---

# 24. Current Known Decisions

## Decision 1 — Modular Monolith

**Decision:** Use a modular monolith.

**Reason:** The project should remain maintainable while allowing future service extraction.

---

## Decision 2 — PostgreSQL

**Decision:** Use PostgreSQL.

**Reason:** The application has strong relational requirements and transactional workflows.

---

## Decision 3 — Prisma

**Decision:** Use Prisma.

**Reason:** Strong TypeScript integration and productive database development.

---

## Decision 4 — Zod

**Decision:** Use Zod.

**Reason:** Runtime validation combined with TypeScript type inference.

---

## Decision 5 — Permission-Based RBAC

**Decision:** Roles contain permissions.

**Reason:** More flexible than hardcoding role checks throughout the application.

Prefer:

```text
authorize("restaurants.approve")
```

over:

```text
if (user.role === "ADMIN")
```

---

## Decision 6 — Resource Policies

**Decision:** RBAC alone is insufficient.

**Reason:** A restaurant owner may have permission to update restaurants but should only update restaurants they manage.

---

## Decision 7 — Server-Side Price Calculation

**Decision:** The server calculates all financial totals.

**Reason:** Prevent client-side manipulation.

---

## Decision 8 — Order Snapshots

**Decision:** Orders store historical snapshots.

**Reason:** Menu and address data can change after an order is placed.

---

# 25. Deferred Decisions

The following decisions are intentionally deferred.

## Payment Provider

Status:

```text
NOT DECIDED
```

Possible options depend on deployment market and business requirements.

The payment abstraction must be implemented before selecting a provider-specific integration.

---

## Object Storage

Status:

```text
NOT DECIDED
```

Possible use:

```text
Restaurant Images
Menu Images
User Avatars
```

Potential providers can be evaluated later.

---

## Push Notification Provider

Status:

```text
NOT DECIDED
```

The notification service should use an abstraction.

---

## Maps and Location Provider

Status:

```text
NOT DECIDED
```

Required for:

```text
Distance Calculation
Restaurant Discovery
Delivery Tracking
```

Do not tightly couple the application to a specific provider.

---

# 26. Known Technical Debt

Currently:

```text
No implementation yet.
```

Technical debt should be recorded here as it appears.

Format:

```text
[DATE]
Issue:
Impact:
Temporary Solution:
Permanent Solution:
Priority:
```

---

# 27. Known Issues

Currently:

```text
None.
```

Any discovered bug should be recorded.

Format:

```text
Issue:
Severity:
Affected Module:
Reproduction:
Status:
Resolution:
```

---

# 28. Deferred Features

The following features are not required for the first MVP:

```text
Real-Time GPS Rider Tracking
Advanced Recommendation Engine
AI Food Recommendations
Restaurant Analytics
Dynamic Delivery Pricing
Surge Pricing
Loyalty Program
Wallet System
Subscription Plans
Multi-Country Tax Engine
Multi-Currency Support
Advanced Search Engine
```

These may be added later.

Do not implement them prematurely.

---

# 29. Agent Working Rules

Any AI coding agent must follow these rules.

## Before Coding

Read:

```text
PRD.md
Architecture.md
Rules.md
Phases.md
Design.md
Memory.md
```

Then inspect the existing codebase.

Never assume a feature is missing simply because the planning document says it is not implemented.

---

## Before Modifying Code

Identify:

```text
Current Module
Dependencies
Existing Patterns
Tests
Database Models
Authorization Rules
```

Reuse existing patterns.

Do not introduce a new architectural style for every feature.

---

## After Coding

Run applicable checks:

```text
Typecheck
Lint
Tests
Build
```

If a test fails, investigate the root cause.

Do not simply disable the test.

---

# 30. Agent Task Completion Format

When an AI agent completes a task, it should report:

```text
Task:
What was implemented.

Files Changed:
List of files.

Database Changes:
Migrations or schema changes.

API Changes:
New or modified endpoints.

Security:
Authentication and authorization changes.

Tests:
Tests added or modified.

Validation:
Zod schemas added or modified.

Status:
Completed / Blocked.

Next Recommended Task:
Next implementation step.
```

---

# 31. Memory Update Rules

This file must be updated whenever any of the following changes:

- Architecture.
- Database design.
- Authentication strategy.
- Authorization strategy.
- Major technology decision.
- Completed phase.
- Current development phase.
- Known issue.
- Technical debt.
- Deferred feature.
- External service decision.

Do not update this file for trivial implementation details.

The purpose is to preserve important project context.

---

# 32. Current Progress Log

## Phase 0 — Planning

Status:

```text
COMPLETE
```

Completed:

```text
PRD.md
Architecture.md
Rules.md
Phases.md
Design.md
Memory.md
```

---

## Phase 1 — Project Foundation

Status:

```text
NOT STARTED
```

Next:

```text
Initialize Node.js + TypeScript project.
```

---

# 33. Immediate Next Steps

The implementation sequence begins with:

```text
1. Initialize pnpm project
2. Install TypeScript
3. Configure strict TypeScript
4. Install Express
5. Configure ESLint
6. Configure Prettier
7. Configure Husky
8. Create environment configuration
9. Create Express application
10. Create server bootstrap
11. Create health endpoints
12. Add graceful shutdown
13. Add initial tests
14. Commit foundation
```

After Phase 1:

```text
Phase 2 — Core Application Infrastructure
```

Then:

```text
Phase 3 — PostgreSQL + Prisma
```

Then:

```text
Phase 4 — Redis
```

Then:

```text
Phase 5 — Authentication
```

Then:

```text
Phase 6 — RBAC
```

---

# 34. Golden Rule

The project must always maintain this principle:

```text
Do not build features faster than you can maintain them.
```

Every feature should be:

```text
Designed
    ↓
Implemented
    ↓
Validated
    ↓
Authorized
    ↓
Tested
    ↓
Documented
```

FoodFlow should be built as a serious production-grade backend engineering project, not as a collection of CRUD endpoints.

---

# 35. Final Memory State

```text
Project:
FoodFlow API

Architecture:
Modular Monolith

Current Phase:
Phase 1 — Project Foundation

Current Status:
Ready to Begin Implementation

Last Completed:
Planning and Technical Design

Next Task:
Initialize Node.js + TypeScript Project

Primary Goal:
Build a production-grade multi-vendor food delivery backend.

Core Engineering Priorities:
Security
Correctness
Maintainability
Testability
Observability
Scalability
```
