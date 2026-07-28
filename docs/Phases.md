# FoodFlow API — Implementation Phases

**Version:** 1.0
**Status:** Active
**Project:** FoodFlow API
**Architecture:** Modular Monolith
**Backend:** Node.js + TypeScript + Express
**Database:** PostgreSQL + Prisma
**Validation:** Zod
**Authentication:** JWT
**Authorization:** RBAC + Permissions + Resource Policies
**Cache:** Redis
**Queue:** BullMQ
**Containerization:** Docker

---

# 1. Implementation Strategy

FoodFlow will be developed incrementally.

Each phase must produce a working and testable system.

The project should never spend a large number of phases with a completely broken application.

The development strategy is:

```text
Foundation
    ↓
Infrastructure
    ↓
Authentication
    ↓
RBAC
    ↓
User Management
    ↓
Restaurant / Vendor
    ↓
Menu
    ↓
Customer
    ↓
Cart
    ↓
Orders
    ↓
Payments
    ↓
Delivery
    ↓
Reviews / Coupons
    ↓
Notifications
    ↓
Background Jobs
    ↓
Observability
    ↓
Testing
    ↓
Docker
    ↓
CI/CD
    ↓
Production Hardening
```

---

# 2. Phase 0 — Project Planning

## Objective

Establish project requirements and architecture before implementation.

## Tasks

- Create `PRD.md`.
- Create `Architecture.md`.
- Create `Rules.md`.
- Create `Phases.md`.
- Create `Design.md`.
- Create `Memory.md`.

## Deliverables

```text
PRD.md
Architecture.md
Rules.md
Phases.md
Design.md
Memory.md
```

## Completion Criteria

- Product requirements are defined.
- Architecture is defined.
- Engineering rules are defined.
- Database design is documented.
- Implementation phases are defined.
- AI agent context is documented.

---

# 3. Phase 1 — Repository and Project Foundation

## Objective

Create the initial production-grade Node.js + TypeScript project.

## Technology

```text
Node.js
TypeScript
Express
pnpm
ESLint
Prettier
Husky
lint-staged
```

## Tasks

Initialize:

```text
package.json
tsconfig.json
eslint.config.*
prettier.config.*
.gitignore
.env.example
README.md
```

Create:

```text
src/
├── app.ts
├── server.ts
├── config/
├── common/
├── infrastructure/
├── modules/
└── routes/
```

Configure:

- TypeScript strict mode.
- Development scripts.
- Production build.
- Linting.
- Formatting.
- Git hooks.
- Environment configuration.

## Scripts

Expected scripts:

```text
dev
build
start
typecheck
lint
lint:fix
format
format:check
test
test:watch
test:coverage
```

## Completion Criteria

- Application starts successfully.
- TypeScript compiles.
- ESLint passes.
- Prettier passes.
- Git hooks work.
- Environment variables are validated.

---

# 4. Phase 2 — Core Application Infrastructure

## Objective

Build reusable infrastructure before implementing business features.

## Tasks

Implement:

- Express application.
- Server bootstrap.
- Environment validation.
- Global error handler.
- Custom application errors.
- Standard API response.
- Async controller handling.
- Request ID middleware.
- Logger.
- 404 handler.
- Security middleware.
- CORS.
- Rate limiting.
- Request body limits.

## Middleware Flow

```text
Request
   ↓
Request ID
   ↓
Security Headers
   ↓
CORS
   ↓
Rate Limiting
   ↓
Body Parsing
   ↓
Routes
   ↓
404 Handler
   ↓
Global Error Handler
```

## Completion Criteria

The API should expose:

```text
GET /health
GET /health/live
GET /health/ready
```

All errors must return a consistent format.

---

# 5. Phase 3 — PostgreSQL and Prisma

## Objective

Connect the application to PostgreSQL.

## Tasks

- Configure Prisma.
- Create initial schema.
- Configure database connection.
- Create migration workflow.
- Create database seed system.
- Create Prisma client singleton.
- Implement graceful database shutdown.

## Initial Database Domains

```text
users
roles
permissions
user_roles
role_permissions
refresh_tokens
```

## Completion Criteria

- PostgreSQL runs successfully.
- Prisma connects successfully.
- Migration executes successfully.
- Seed script works.
- Database disconnects gracefully.

---

# 6. Phase 4 — Redis Infrastructure

## Objective

Introduce Redis for shared infrastructure.

## Tasks

- Redis connection.
- Redis configuration.
- Redis client abstraction.
- Connection health check.
- Graceful shutdown.

Redis will initially support:

- Rate limiting.
- Temporary data.
- Refresh token/session support where appropriate.
- Future caching.
- BullMQ infrastructure.

## Completion Criteria

- Redis connects successfully.
- Redis health check works.
- Application handles Redis connection failure appropriately.

---

# 7. Phase 5 — Authentication

## Objective

Implement secure authentication.

## Features

### Registration

```text
POST /api/v1/auth/register
```

### Login

```text
POST /api/v1/auth/login
```

### Refresh Token

```text
POST /api/v1/auth/refresh
```

### Logout

```text
POST /api/v1/auth/logout
```

### Logout All Sessions

```text
POST /api/v1/auth/logout-all
```

### Password Change

```text
POST /api/v1/auth/change-password
```

### Forgot Password

```text
POST /api/v1/auth/forgot-password
```

### Reset Password

```text
POST /api/v1/auth/reset-password
```

### Email Verification

```text
POST /api/v1/auth/verify-email
```

## Tasks

- Password hashing.
- JWT access tokens.
- Refresh tokens.
- Refresh token rotation.
- Refresh token revocation.
- Session management.
- Authentication middleware.
- Authentication context.
- Account status checks.

## Completion Criteria

The system supports:

```text
Register
   ↓
Login
   ↓
Access Token
   +
Refresh Token
   ↓
Protected Route
   ↓
Refresh
   ↓
Token Rotation
   ↓
Logout
```

Security tests must cover token reuse and revoked sessions.

---

# 8. Phase 6 — RBAC and Permissions

## Objective

Implement permission-based authorization.

## Database

Implement:

```text
roles
permissions
user_roles
role_permissions
```

## Initial Roles

```text
SUPER_ADMIN
ADMIN
RESTAURANT_OWNER
RESTAURANT_MANAGER
DELIVERY_RIDER
CUSTOMER
SUPPORT_AGENT
```

## Permission Examples

```text
users.read
users.update
users.suspend

roles.read
roles.create
roles.update
roles.delete

permissions.read

restaurants.create
restaurants.read
restaurants.update
restaurants.delete
restaurants.approve
restaurants.suspend

menus.create
menus.read
menus.update
menus.delete

orders.read
orders.update
orders.cancel

payments.read
payments.refund
```

## Middleware

Implement:

```text
authenticate()
authorize(permission)
```

## Completion Criteria

The system can:

- Assign roles to users.
- Assign permissions to roles.
- Resolve effective user permissions.
- Protect routes using permissions.
- Reject unauthorized requests.

---

# 9. Phase 7 — Authorization Policies and Ownership

## Objective

Implement resource-level authorization.

## Policies

Create policies for:

```text
RestaurantOwnershipPolicy
RestaurantStaffPolicy
OrderOwnershipPolicy
CartOwnershipPolicy
AddressOwnershipPolicy
ReviewOwnershipPolicy
```

## Example

```text
Restaurant Owner
    ↓
restaurants.update
    ↓
Owns Restaurant?
    ├── Yes → Allow
    └── No → Reject
```

## Completion Criteria

Tests must verify:

- Customer cannot access another customer's order.
- Restaurant owner cannot access another restaurant.
- Restaurant manager cannot modify unrelated restaurants.
- Admin can access resources according to permissions.

---

# 10. Phase 8 — User Management

## Objective

Implement user profiles and account management.

## Features

- Get current user.
- Update profile.
- Change phone number.
- Change email.
- Account status.
- User administration.

## Endpoints

```text
GET /api/v1/users/me
PATCH /api/v1/users/me

GET /api/v1/users
GET /api/v1/users/:userId

PATCH /api/v1/users/:userId/status
```

## Completion Criteria

- Users can manage their profiles.
- Admins can manage users according to permissions.
- Ownership rules are enforced.

---

# 11. Phase 9 — Restaurant / Vendor Management

## Objective

Build the multi-vendor foundation.

## Features

- Restaurant creation.
- Restaurant onboarding.
- Restaurant approval.
- Restaurant rejection.
- Restaurant suspension.
- Restaurant activation.
- Restaurant profile.
- Operating hours.
- Restaurant availability.

## Restaurant Lifecycle

```text
PENDING_APPROVAL
      ↓
ACTIVE
      ↓
INACTIVE
      ↓
SUSPENDED
```

## Completion Criteria

- Restaurant owners can create restaurants.
- Admins can approve restaurants.
- Only approved restaurants are publicly visible.
- Vendor isolation works correctly.

---

# 12. Phase 10 — Restaurant Staff

## Objective

Allow restaurant owners to manage staff.

## Features

- Add restaurant manager.
- Remove restaurant manager.
- Assign staff role.
- View restaurant staff.

## Relationship

```text
User
   │
   ▼
RestaurantStaff
   │
   ▼
Restaurant
```

## Completion Criteria

Restaurant owners can manage staff for their restaurants without accessing unrelated restaurants.

---

# 13. Phase 11 — Menu Management

## Objective

Build restaurant menus.

## Features

- Categories.
- Menu items.
- Prices.
- Images.
- Availability.
- Preparation time.
- Add-ons.
- Variations.

## Endpoints

```text
POST /restaurants/:restaurantId/categories
GET /restaurants/:restaurantId/categories

POST /restaurants/:restaurantId/menu-items
PATCH /menu-items/:menuItemId
DELETE /menu-items/:menuItemId
```

## Completion Criteria

- Restaurant owners can manage menus.
- Managers can manage menus according to permissions.
- Customers can view active menus.
- Vendor isolation is enforced.

---

# 14. Phase 12 — Address Management

## Objective

Allow customers to manage delivery addresses.

## Features

- Create address.
- Update address.
- Delete address.
- Set default address.
- List addresses.

## Completion Criteria

Customers can only access their own addresses.

---

# 15. Phase 13 — Restaurant Discovery

## Objective

Build public restaurant browsing.

## Features

- Restaurant listing.
- Restaurant details.
- Search.
- Filtering.
- Sorting.
- Pagination.

## Filters

```text
Cuisine
Rating
Availability
Distance
Delivery Time
```

## Completion Criteria

Customers can discover active restaurants.

Inactive or suspended restaurants must not appear in normal public discovery.

---

# 16. Phase 14 — Cart

## Objective

Implement customer shopping carts.

## Rule

One cart belongs to one restaurant.

## Features

- Add item.
- Remove item.
- Update quantity.
- Clear cart.
- Get cart.

## Validation

The server must validate:

- Menu item exists.
- Menu item belongs to restaurant.
- Menu item is available.
- Quantity is valid.

## Completion Criteria

Cart totals are calculated server-side.

---

# 17. Phase 15 — Order Creation

## Objective

Create the core order system.

## Features

- Create order from cart.
- Validate cart.
- Snapshot menu item data.
- Snapshot address.
- Calculate totals.
- Create order items.
- Clear cart.

## Transaction

```text
BEGIN
    ↓
Validate Cart
    ↓
Validate Items
    ↓
Calculate Totals
    ↓
Create Order
    ↓
Create Order Items
    ↓
Clear Cart
    ↓
COMMIT
```

## Completion Criteria

Order creation is atomic.

Historical prices and addresses are preserved.

---

# 18. Phase 16 — Order State Machine

## Objective

Implement controlled order lifecycle.

## States

```text
PENDING
CONFIRMED
PREPARING
READY_FOR_PICKUP
ASSIGNED
PICKED_UP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

## Tasks

- State machine.
- Transition validation.
- Role-based transition permissions.
- Cancellation rules.
- Transition history.

## Completion Criteria

Invalid state transitions are rejected.

Every transition is auditable.

---

# 19. Phase 17 — Payment System

## Objective

Integrate payment processing.

## Architecture

```text
PaymentService
      ↓
PaymentGateway
      ↓
Payment Provider
```

## Features

- Create payment.
- Verify payment.
- Payment status.
- Webhook handling.
- Refunds.
- Idempotency.

## Completion Criteria

- Payment status is server-trusted.
- Webhooks are verified.
- Duplicate webhooks are safely handled.
- Refund operations are auditable.

---

# 20. Phase 18 — Delivery System

## Objective

Implement delivery operations.

## Features

- Rider management.
- Rider availability.
- Delivery creation.
- Rider assignment.
- Delivery acceptance.
- Pickup confirmation.
- Delivery completion.

## Delivery Lifecycle

```text
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

## Completion Criteria

- Riders can only access assigned deliveries.
- Restaurants can view relevant delivery status.
- Customers can view delivery progress.

---

# 21. Phase 19 — Reviews and Ratings

## Objective

Implement customer reviews.

## Rules

A customer can review only eligible completed orders.

## Features

- Create review.
- Update review.
- Delete review where permitted.
- Restaurant rating aggregation.
- Admin moderation.

## Completion Criteria

The system prevents unauthorized or invalid reviews.

---

# 22. Phase 20 — Coupons and Promotions

## Objective

Implement discount functionality.

## Features

- Create coupon.
- Update coupon.
- Activate/deactivate coupon.
- Apply coupon.
- Usage limits.
- Expiration.
- Restaurant restrictions.

## Completion Criteria

Coupon calculations are performed server-side.

Invalid coupons are rejected.

Coupon usage is tracked safely.

---

# 23. Phase 21 — Notifications

## Objective

Build the notification system.

## Channels

```text
Email
Push
In-App
```

## Events

```text
user.created
user.verified

order.created
order.confirmed
order.preparing
order.ready
order.delivered
order.cancelled

payment.completed
payment.failed

delivery.assigned
delivery.completed
```

## Completion Criteria

Notifications are asynchronous.

Notification failures do not break critical business operations.

---

# 24. Phase 22 — BullMQ Background Jobs

## Objective

Introduce reliable asynchronous processing.

## Queues

Potential queues:

```text
email
notifications
payments
orders
cleanup
```

## Tasks

- Queue configuration.
- Worker architecture.
- Retry policies.
- Exponential backoff.
- Failed job handling.
- Job monitoring.

## Completion Criteria

Jobs can be retried safely.

Failed jobs are visible and recoverable.

---

# 25. Phase 23 — Audit Logging

## Objective

Implement auditability.

## Events

```text
User Suspended
Role Changed
Permission Changed
Restaurant Approved
Restaurant Suspended
Order Cancelled
Payment Refunded
```

## Completion Criteria

Sensitive administrative actions create audit records.

Audit logs cannot be modified by normal users.

---

# 26. Phase 24 — Caching

## Objective

Introduce selective Redis caching.

## Initial Candidates

```text
Restaurant Listings
Restaurant Details
Menu Data
Public Configuration
```

## Tasks

- Cache abstraction.
- TTL strategy.
- Cache invalidation.
- Cache key conventions.

## Completion Criteria

Caching improves performance without causing unacceptable consistency problems.

---

# 27. Phase 25 — API Documentation

## Objective

Complete OpenAPI documentation.

Document:

- Authentication.
- Users.
- Roles.
- Permissions.
- Restaurants.
- Menus.
- Carts.
- Orders.
- Payments.
- Deliveries.
- Reviews.
- Coupons.

## Completion Criteria

Every public endpoint is documented.

---

# 28. Phase 26 — Testing

## Objective

Build comprehensive test coverage.

## Unit Tests

Test:

- State machines.
- Permission logic.
- Coupon calculations.
- Price calculations.
- Domain policies.

## Integration Tests

Test:

- Database.
- Authentication.
- RBAC.
- Restaurant isolation.
- Order creation.
- Payment workflows.

## E2E Tests

Test complete workflows.

### Customer Journey

```text
Register
   ↓
Login
   ↓
Browse Restaurants
   ↓
View Menu
   ↓
Add to Cart
   ↓
Create Order
   ↓
Pay
   ↓
Track Delivery
   ↓
Receive Order
   ↓
Review
```

### Restaurant Journey

```text
Register
   ↓
Create Restaurant
   ↓
Admin Approval
   ↓
Create Menu
   ↓
Receive Order
   ↓
Confirm
   ↓
Prepare
   ↓
Ready for Pickup
```

### Rider Journey

```text
Login
   ↓
Receive Assignment
   ↓
Accept
   ↓
Pickup
   ↓
Out for Delivery
   ↓
Complete
```

## Completion Criteria

Critical business workflows have automated tests.

---

# 29. Phase 27 — Dockerization

## Objective

Containerize the application.

## Services

```text
API
PostgreSQL
Redis
Worker
```

## Files

```text
Dockerfile
docker-compose.yml
.dockerignore
```

## Completion Criteria

A new developer can run the entire development environment using Docker Compose.

---

# 30. Phase 28 — CI/CD

## Objective

Automate quality checks.

## Pipeline

```text
Push
  ↓
Install Dependencies
  ↓
Lint
  ↓
Typecheck
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Build
  ↓
Docker Build
```

## Future Deployment

```text
GitHub
   ↓
CI
   ↓
Docker Image
   ↓
Container Registry
   ↓
Deployment
```

---

# 31. Phase 29 — Production Hardening

## Objective

Prepare the application for production deployment.

## Tasks

- Security review.
- Dependency audit.
- Rate limit review.
- Database index review.
- Query optimization.
- Error handling review.
- Logging review.
- Health checks.
- Graceful shutdown.
- Secret management.
- Backup strategy.
- Migration strategy.

## Completion Criteria

The application can be deployed safely.

---

# 32. Phase 30 — Observability

## Objective

Introduce production monitoring.

## Initial

- Structured logs.
- Request IDs.
- Health checks.
- Readiness checks.

## Future

- Metrics.
- Distributed tracing.
- Error monitoring.
- Performance monitoring.

Potential architecture:

```text
API
 │
 ├── Logs ────────► Log Platform
 │
 ├── Metrics ─────► Metrics Platform
 │
 └── Traces ──────► Tracing Platform
```

---

# 33. Phase 31 — Performance Optimization

## Objective

Optimize only after correctness and observability are established.

## Tasks

- Database indexes.
- Query optimization.
- Pagination.
- N+1 query detection.
- Redis caching.
- Connection pool tuning.
- Load testing.

## Performance Tests

Measure:

```text
Authentication
Restaurant Listing
Menu Retrieval
Cart Operations
Order Creation
Order Retrieval
```

---

# 34. Phase 32 — Final Security Review

## Objective

Perform a security-focused review.

## Review Areas

```text
Authentication
Authorization
RBAC
Ownership
Input Validation
Rate Limiting
CORS
Headers
Secrets
Logging
Payments
Webhooks
File Uploads
Database
```

## Completion Criteria

No known critical security vulnerabilities remain.

---

# 35. Phase 33 — Final Documentation

## Objective

Prepare the project for professional presentation.

Update:

```text
README.md
API Documentation
Architecture Documentation
Environment Setup
Docker Setup
Database Setup
Testing Guide
Deployment Guide
```

Include:

- Architecture diagram.
- Feature list.
- Technology stack.
- Setup instructions.
- API documentation.
- Testing instructions.
- Deployment instructions.

---

# 36. Recommended Implementation Order

The actual implementation should follow this order:

```text
PHASE 0
Planning
    ↓
PHASE 1
Project Foundation
    ↓
PHASE 2
Core Infrastructure
    ↓
PHASE 3
PostgreSQL + Prisma
    ↓
PHASE 4
Redis
    ↓
PHASE 5
Authentication
    ↓
PHASE 6
RBAC
    ↓
PHASE 7
Authorization Policies
    ↓
PHASE 8
Users
    ↓
PHASE 9
Restaurants
    ↓
PHASE 10
Restaurant Staff
    ↓
PHASE 11
Menus
    ↓
PHASE 12
Addresses
    ↓
PHASE 13
Discovery
    ↓
PHASE 14
Cart
    ↓
PHASE 15
Orders
    ↓
PHASE 16
Order State Machine
    ↓
PHASE 17
Payments
    ↓
PHASE 18
Delivery
    ↓
PHASE 19
Reviews
    ↓
PHASE 20
Coupons
    ↓
PHASE 21
Notifications
    ↓
PHASE 22
Background Jobs
    ↓
PHASE 23
Audit Logs
    ↓
PHASE 24
Caching
    ↓
PHASE 25
API Documentation
    ↓
PHASE 26
Testing
    ↓
PHASE 27
Docker
    ↓
PHASE 28
CI/CD
    ↓
PHASE 29
Production Hardening
    ↓
PHASE 30
Observability
    ↓
PHASE 31
Performance
    ↓
PHASE 32
Security Review
    ↓
PHASE 33
Final Documentation
```

---

# 37. Phase Completion Rules

A phase cannot be considered complete simply because the code compiles.

Each phase must satisfy:

```text
Implementation
    +
Validation
    +
Authorization
    +
Error Handling
    +
Testing
    +
Documentation
```

where applicable.

---

# 38. Vertical Slice Strategy

Where possible, features should be implemented as vertical slices.

Instead of:

```text
Build all database models
    ↓
Build all controllers
    ↓
Build all services
    ↓
Build all tests
```

Prefer:

```text
Feature
  │
  ├── Database
  ├── Validation
  ├── Authorization
  ├── Controller
  ├── Service
  ├── Repository
  ├── Tests
  └── Documentation
```

This allows every completed feature to be independently tested.

---

# 39. MVP Milestone

The first major milestone is a complete customer-to-delivery workflow.

```text
Authentication
      ↓
Restaurant
      ↓
Menu
      ↓
Cart
      ↓
Order
      ↓
Payment
      ↓
Restaurant Processing
      ↓
Delivery
      ↓
Completed
```

The MVP should include:

- Authentication.
- RBAC.
- Restaurant management.
- Menu management.
- Customer addresses.
- Cart.
- Orders.
- Basic payment integration.
- Delivery workflow.

---

# 40. Production Milestone

The production milestone includes:

```text
MVP
  +
Redis
  +
BullMQ
  +
Notifications
  +
Audit Logs
  +
Caching
  +
Testing
  +
Docker
  +
CI/CD
  +
Observability
  +
Security Review
```

---

# 41. Final Project Milestone

The final portfolio-ready system should demonstrate:

```text
Node.js
TypeScript
Express
PostgreSQL
Prisma
Zod
JWT
RBAC
Permission System
Resource Policies
Redis
BullMQ
REST APIs
OpenAPI
Automated Testing
Docker
CI/CD
Structured Logging
Observability
Security
```

The project should be capable of being presented as a serious backend engineering project rather than a simple CRUD application.

---

# 42. Development Philosophy

The project should follow this development philosophy:

```text
Build Correctly
      ↓
Test Thoroughly
      ↓
Observe
      ↓
Measure
      ↓
Optimize
```

Do not prematurely optimize.

Do not prematurely introduce microservices.

Do not sacrifice security for development speed.

Do not sacrifice data integrity for convenience.

Build the modular monolith first.

Extract services only when there is a measurable reason to do so.

---

# 43. Final Definition of Done

FoodFlow is considered complete when:

- All core business workflows function correctly.
- Authentication is secure.
- RBAC is implemented.
- Permissions are enforced.
- Resource ownership is enforced.
- Vendor data is isolated.
- Orders have controlled state transitions.
- Payments are verified securely.
- Delivery workflows are functional.
- Background jobs are reliable.
- Critical operations are idempotent.
- Audit logging is implemented.
- API documentation is complete.
- Automated tests cover critical paths.
- Docker deployment works.
- CI/CD is configured.
- Health checks are implemented.
- Structured logging is implemented.
- Security review is completed.
- Production deployment documentation exists.

The final system should be maintainable, testable, observable, and capable of evolving beyond the initial modular monolith architecture.
