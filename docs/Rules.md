# FoodFlow API — Engineering Rules

**Version:** 1.0
**Status:** Active
**Project:** FoodFlow API
**Architecture:** Modular Monolith
**Runtime:** Node.js
**Language:** TypeScript
**Framework:** Express.js
**Database:** PostgreSQL
**ORM:** Prisma
**Validation:** Zod
**Authentication:** JWT
**Authorization:** RBAC + Permissions + Policies
**Cache:** Redis
**Queue:** BullMQ

---

# 1. Purpose

This document defines the mandatory engineering rules for the FoodFlow backend.

These rules apply to:

- Human developers.
- AI coding agents.
- Automated code generation.
- Code reviews.
- Refactoring.
- New features.
- Bug fixes.

The objective is to maintain:

- Consistency.
- Security.
- Maintainability.
- Testability.
- Scalability.
- Reliability.
- Clear architecture.

When a new feature conflicts with these rules, the architecture must be reconsidered before implementation.

---

# 2. Core Engineering Principles

The following principles are mandatory.

## Rule 2.1 — Prefer Simplicity

Do not introduce complexity without a concrete requirement.

Avoid:

- Premature microservices.
- Unnecessary abstractions.
- Over-engineered design patterns.
- Generic frameworks built only for theoretical reuse.

Every abstraction should have a clear purpose.

---

## Rule 2.2 — Separation of Concerns

Each layer must have one primary responsibility.

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service / Use Case
  ↓
Domain Logic
  ↓
Repository
  ↓
Database
```

Do not bypass layers without a documented architectural reason.

---

## Rule 2.3 — Business Logic Must Not Live in Controllers

Controllers must remain thin.

Bad:

```typescript
async createOrder(req, res) {
  const cart = await prisma.cart.findUnique(...);

  const total = cart.items.reduce(...);

  if (total > 5000) {
    // business rule
  }

  await prisma.order.create(...);
}
```

Good:

```typescript
async createOrder(req, res) {
  const order = await orderService.createOrder({
    userId: req.user.id,
    ...req.body,
  });

  return sendSuccess(res, order);
}
```

Business logic belongs in services and domain components.

---

# 3. TypeScript Rules

## Rule 3.1 — Strict Mode

TypeScript strict mode must remain enabled.

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Do not disable strict checks to make code compile.

---

## Rule 3.2 — Avoid `any`

The use of `any` is prohibited unless there is a documented technical reason.

Prefer:

- `unknown`.
- Explicit interfaces.
- Generic types.
- Type narrowing.

Bad:

```typescript
const data: any = req.body;
```

Good:

```typescript
const data: CreateRestaurantInput = req.body;
```

---

## Rule 3.3 — Prefer Type Inference

Do not unnecessarily annotate obvious types.

Avoid:

```typescript
const name: string = "Ali";
```

Prefer:

```typescript
const name = "Ali";
```

Explicit types should be used where they improve clarity or define contracts.

---

## Rule 3.4 — Avoid Type Assertions

Avoid unnecessary:

```typescript
as SomeType
```

Type assertions should not be used to bypass compiler errors.

---

## Rule 3.5 — Use `unknown` for External Data

Data from:

- APIs.
- Webhooks.
- JSON parsing.
- External services.

should initially be treated as untrusted.

Validate and narrow the type before use.

---

# 4. Naming Conventions

## Rule 4.1 — Files

Use lowercase kebab-case.

Examples:

```text
auth.service.ts
create-user.schema.ts
restaurant.controller.ts
order-state-machine.ts
```

---

## Rule 4.2 — Variables and Functions

Use camelCase.

```typescript
const restaurantId = "...";

function createRestaurant() {}
```

---

## Rule 4.3 — Classes

Use PascalCase.

```typescript
class OrderService {}
```

---

## Rule 4.4 — Constants

Use UPPER_SNAKE_CASE for global constants.

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
```

---

## Rule 4.5 — Database Fields

Database naming conventions must remain consistent.

Use snake_case where appropriate.

Example:

```text
created_at
updated_at
restaurant_id
user_id
```

Prisma mappings may expose camelCase to TypeScript.

---

# 5. Module Rules

Every business domain must have a clearly defined module.

Example:

```text
modules/
├── auth/
├── users/
├── restaurants/
├── menus/
├── carts/
├── orders/
└── payments/
```

Each module owns its domain logic.

---

## Rule 5.1 — No Direct Cross-Module Database Access

A module must not directly query another module's tables for business operations.

Bad:

```typescript
// Order module
prisma.restaurant.findUnique(...)
```

when restaurant logic belongs to the Restaurant module.

Prefer:

```typescript
restaurantService.getRestaurant(...)
```

or a defined module interface.

Exceptions may be allowed for read-only queries when explicitly justified.

---

## Rule 5.2 — Avoid Circular Dependencies

Do not create:

```text
Order → Restaurant → Order
```

If two modules require each other, consider:

- Shared domain abstractions.
- Application events.
- Interfaces.
- Refactoring ownership.

---

## Rule 5.3 — Public Module APIs

Modules should expose a clear public interface.

Internal implementation details should not be imported by unrelated modules.

Conceptually:

```text
Restaurant Module
│
├── Internal
│   ├── repository
│   └── implementation
│
└── Public API
    └── restaurant.service
```

---

# 6. Route Rules

Routes are responsible only for endpoint composition.

Routes may define:

- HTTP method.
- URL.
- Middleware.
- Controller.

Routes must not contain:

- Database queries.
- Business logic.
- Complex conditionals.

Example:

```typescript
router.post(
  "/",
  authenticate,
  authorize("restaurants.create"),
  validate(createRestaurantSchema),
  restaurantController.create,
);
```

---

# 7. Controller Rules

Controllers must:

1. Receive the HTTP request.
2. Read validated data.
3. Read authenticated user context.
4. Call the appropriate service.
5. Return a standardized response.

Controllers must not:

- Access Prisma directly.
- Implement business rules.
- Perform complex calculations.
- Contain authorization logic.
- Call external APIs directly.

---

# 8. Service Rules

Services contain application logic.

Services may:

- Coordinate multiple repositories.
- Execute transactions.
- Call domain services.
- Call external service abstractions.
- Publish events.
- Enforce application-level business rules.

Services must not depend on Express.

Avoid:

```typescript
async create(req: Request, res: Response)
```

Prefer:

```typescript
async create(input: CreateRestaurantInput)
```

---

# 9. Domain Rules

Core business rules must be centralized.

Examples:

```text
OrderStateMachine
CouponPolicy
RestaurantOwnershipPolicy
PaymentStateMachine
DeliveryStateMachine
PermissionPolicy
```

Do not duplicate the same business rule in multiple controllers or services.

---

# 10. Repository Rules

Repositories handle persistence.

Repositories may:

- Query PostgreSQL.
- Write data.
- Update data.
- Delete data.
- Execute database transactions where appropriate.

Repositories must not:

- Handle HTTP.
- Check JWTs.
- Decide user permissions.
- Return HTTP responses.

---

# 11. Zod Validation Rules

Zod is the standard validation library.

All external input must be validated.

This includes:

- Request body.
- Route parameters.
- Query parameters.
- Environment variables.
- Webhook payloads.
- External API responses where practical.

---

## Rule 11.1 — Never Trust `req.body`

Never directly use:

```typescript
req.body;
```

as trusted application input.

Use validated data:

```typescript
const input = createRestaurantSchema.parse(req.body);
```

or centralized validation middleware.

---

## Rule 11.2 — Validate Environment Variables

Environment variables must be validated at application startup.

The application should fail fast if required configuration is missing or invalid.

Example:

```typescript
const env = envSchema.parse(process.env);
```

---

## Rule 11.3 — Do Not Duplicate Validation

Validation should have a single source of truth where practical.

Avoid defining the same field constraints separately in:

- Zod.
- Controllers.
- Services.

Business rules that depend on database state belong in services/domain logic.

Example:

```text
Zod
→ email must be valid

Service
→ email must be unique
```

---

# 12. Authentication Rules

Authentication must be centralized.

Protected routes must use:

```text
authenticate
```

middleware.

Never manually decode JWTs inside controllers.

Bad:

```typescript
jwt.verify(token, secret);
```

inside individual controllers.

Authentication logic belongs in the authentication module.

---

## Rule 12.1 — Short-Lived Access Tokens

Access tokens should have a relatively short lifetime.

Refresh tokens should handle long-lived sessions.

---

## Rule 12.2 — Refresh Token Rotation

Refresh tokens must be rotated.

When a refresh token is used:

```text
Old Refresh Token
      ↓
Revoke
      ↓
New Refresh Token
```

---

## Rule 12.3 — Never Store Raw Refresh Tokens

Store a secure hash or equivalent server-side representation.

---

## Rule 12.4 — Password Security

Passwords must be hashed using a modern password hashing algorithm.

Never:

- Store plaintext passwords.
- Log passwords.
- Return passwords in responses.
- Store passwords in JWT payloads.

---

# 13. RBAC Rules

Authorization is permission-based.

Do not rely exclusively on role names.

Bad:

```typescript
if (user.role === "ADMIN") {
  // allow
}
```

Preferred:

```typescript
authorize("restaurants.approve");
```

---

## Rule 13.1 — Roles Are Collections of Permissions

Roles should not be hardcoded into every authorization decision.

Example:

```text
ADMIN
 ├── users.read
 ├── restaurants.approve
 └── orders.read
```

---

## Rule 13.2 — Permissions Are Stable

Permission names must follow:

```text
resource.action
```

Example:

```text
orders.read
orders.update
orders.cancel
```

Do not casually rename permissions after deployment.

---

## Rule 13.3 — Permission Does Not Equal Ownership

Having:

```text
restaurants.update
```

does not automatically mean a restaurant owner can update every restaurant.

Ownership policies must still apply.

---

# 14. Authorization Policy Rules

Authorization has three layers.

```text
Authentication
      ↓
Permission
      ↓
Resource Policy
```

Example:

```text
Is the user authenticated?
        ↓
Does the user have restaurants.update?
        ↓
Does the user own/manage this restaurant?
```

All required checks must pass.

---

# 15. API Response Rules

All API responses must use a consistent structure.

Success:

```json
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {}
}
```

Error:

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

Do not return inconsistent response structures between modules.

---

# 16. HTTP Status Code Rules

Use semantically correct status codes.

```text
200 OK
201 CREATED
202 ACCEPTED
204 NO_CONTENT

400 BAD_REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
422 UNPROCESSABLE_ENTITY
429 TOO_MANY_REQUESTS

500 INTERNAL_SERVER_ERROR
```

Do not return `200 OK` for failed operations.

---

# 17. Error Handling Rules

All application errors must use standardized error classes.

Examples:

```text
BadRequestError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
ValidationError
BusinessRuleError
```

Errors must be processed by a centralized error middleware.

Never expose:

- Stack traces.
- Database errors.
- SQL queries.
- Internal file paths.
- Secrets.

in production responses.

---

# 18. Database Rules

PostgreSQL is the source of truth.

Do not store critical business data exclusively in Redis.

---

## Rule 18.1 — Use Database Constraints

Important invariants should be enforced at the database level where possible.

Examples:

- Unique email.
- Unique role name.
- Unique permission name.
- Foreign keys.
- Required fields.

Application validation does not replace database constraints.

---

## Rule 18.2 — Use Transactions for Atomic Operations

Operations requiring atomicity must use transactions.

Example:

```text
Create Order
    ├── Create Order
    ├── Create Order Items
    └── Clear Cart
```

These should be treated as one atomic operation where appropriate.

---

## Rule 18.3 — Avoid Long Transactions

Do not perform slow external API calls inside database transactions.

Bad:

```text
BEGIN
  Database operation
  Call Payment Provider
  Send Email
COMMIT
```

Prefer:

```text
Database Transaction
      ↓
Commit
      ↓
External Operations
```

Use events/jobs for asynchronous operations.

---

# 19. Prisma Rules

Prisma is the only ORM/data access technology used by the application.

Do not mix Prisma with another ORM.

Prisma queries should remain inside repositories or approved infrastructure abstractions.

Do not call Prisma directly from controllers.

---

# 20. Migration Rules

Database schema changes must use Prisma migrations.

Never manually modify production databases without a documented migration process.

Migration names should clearly describe the change.

Example:

```text
add_restaurant_operating_hours
add_order_payment_status
add_refresh_token_sessions
```

---

# 21. Order Rules

Orders are immutable historical records.

Once an order is created:

- Historical item prices must not change.
- Historical item names should be preserved.
- Historical delivery address should be preserved.

Order totals must be calculated server-side.

Never trust client-provided:

```text
subtotal
tax
discount
deliveryFee
total
```

The server must calculate these values.

---

# 22. Order State Rules

Order states must be controlled through a state machine or equivalent centralized logic.

Never directly update order status from arbitrary code.

Bad:

```typescript
await prisma.order.update({
  data: {
    status: "DELIVERED",
  },
});
```

Preferred:

```typescript
orderStateMachine.transition(currentStatus, "DELIVERED");
```

The transition must be validated before persistence.

---

# 23. Payment Rules

Never trust payment status supplied by clients.

The backend must verify payments through:

- Provider APIs.
- Signed webhooks.
- Secure verification mechanisms.

Payment webhooks must be:

- Authenticated.
- Signature-verified.
- Idempotent.

---

# 24. Idempotency Rules

Critical operations must support idempotency where retries can cause duplicate effects.

Examples:

```text
Payment creation
Payment webhook
Refund
Order creation
External provider operations
```

Repeated requests with the same idempotency key must not create duplicate side effects.

---

# 25. Redis Rules

Redis is not the primary database.

Use Redis for:

- Cache.
- Rate limiting.
- Temporary data.
- Queue infrastructure.
- Distributed coordination where necessary.

Critical business data belongs in PostgreSQL.

---

# 26. Caching Rules

Do not cache everything.

Cache only data where there is a clear performance benefit.

Every cache entry must have:

- A defined key.
- A defined TTL.
- An invalidation strategy.

Example:

```text
restaurant:{id}
menu:{restaurantId}
```

Cache invalidation must occur when relevant data changes.

---

# 27. BullMQ Rules

Background jobs must be safe to retry.

Jobs should be idempotent whenever possible.

Jobs must define:

- Retry count.
- Backoff strategy.
- Failure behavior.

Example:

```text
Email Job
    ↓
Attempt 1
    ↓
Failure
    ↓
Backoff
    ↓
Attempt 2
    ↓
Failure
    ↓
Attempt 3
    ↓
Failed Job
```

A failed background job must not silently disappear.

---

# 28. Event Rules

Events should represent meaningful business occurrences.

Good:

```text
order.created
order.delivered
payment.completed
```

Avoid overly technical events such as:

```text
database.row.updated
```

Events should describe business meaning.

---

# 29. Logging Rules

Use structured logging.

Every request should have a request ID.

Logs should include context such as:

```text
requestId
userId
module
action
```

Never log:

- Passwords.
- JWTs.
- Refresh tokens.
- API keys.
- Payment credentials.
- Sensitive personal information.

---

# 30. Security Rules

The application must follow defense-in-depth principles.

Mandatory controls include:

- Helmet.
- CORS.
- Rate limiting.
- Request size limits.
- Input validation.
- Secure authentication.
- Permission checks.
- Ownership checks.
- Secure secrets management.

Never commit:

```text
.env
.env.production
API keys
Private keys
JWT secrets
Database credentials
```

Only `.env.example` may be committed.

---

# 31. Secrets Management

Secrets must be provided through environment variables or a secure secret manager.

Never hardcode:

```typescript
const JWT_SECRET = "my-secret";
```

Use:

```typescript
const JWT_SECRET = env.JWT_SECRET;
```

---

# 32. File Upload Rules

Uploaded files must be validated.

Validation should consider:

- MIME type.
- File size.
- File extension.
- File content where appropriate.

Never trust the filename extension alone.

Images should be stored in external object storage rather than the application container filesystem in production.

---

# 33. API Security Rules

Public endpoints must be protected against abuse.

Apply rate limiting appropriately.

Sensitive endpoints should have stricter limits.

Examples:

```text
Login
Password Reset
OTP
Registration
Payment
```

Do not use one global rate limit for every endpoint if different risk levels exist.

---

# 34. Multi-Vendor Isolation Rules

Every vendor resource must be scoped.

Example:

```text
Restaurant
Menu
Menu Item
Restaurant Staff
Restaurant Orders
```

must maintain appropriate restaurant ownership relationships.

A vendor must never access another vendor's private data.

---

# 35. Audit Rules

Sensitive actions must generate audit records.

Examples:

```text
Role changed
Permission changed
Restaurant approved
Restaurant suspended
Payment refunded
Order cancelled by admin
User suspended
```

Audit logs must be append-oriented.

Normal users must not be able to modify audit records.

---

# 36. Testing Rules

Critical business logic must be tested.

Minimum test categories:

```text
Unit Tests
Integration Tests
API Tests
```

Critical flows must include end-to-end coverage.

At minimum:

```text
Authentication
RBAC
Restaurant isolation
Order creation
Order state transitions
Payment verification
Delivery lifecycle
```

---

# 37. Test Isolation Rules

Tests must not depend on the developer's local production-like database.

Use:

- Test database.
- Test containers.
- Dedicated test infrastructure.

Tests must clean up after themselves.

Tests should be deterministic.

---

# 38. API Documentation Rules

Every public API endpoint must be documented.

Documentation must include:

- HTTP method.
- URL.
- Authentication requirements.
- Request parameters.
- Request body.
- Validation rules.
- Success response.
- Error responses.

Documentation must be updated with API changes.

---

# 39. Git Rules

Commits should be small and focused.

Preferred format:

```text
feat(auth): add refresh token rotation
feat(rbac): add permission middleware
fix(order): prevent invalid status transition
test(order): add order state transition tests
refactor(users): extract user repository
docs(api): update restaurant endpoints
```

Avoid commits like:

```text
update stuff
fix things
changes
final
```

---

# 40. Pull Request Rules

Every significant feature should be reviewable independently.

Pull requests should include:

- What changed.
- Why it changed.
- API changes.
- Database changes.
- Security considerations.
- Testing performed.

Large unrelated changes should not be mixed together.

---

# 41. AI Coding Agent Rules

AI coding agents must follow these rules.

## Rule 41.1 — Read Before Editing

Before modifying code, the agent must inspect relevant:

- Architecture.
- Module structure.
- Existing implementation.
- Rules.
- Tests.

---

## Rule 41.2 — Do Not Rewrite Unrelated Code

An agent must not modify unrelated files simply to improve style.

---

## Rule 41.3 — Preserve Existing Architecture

Do not introduce a new architectural pattern without justification.

---

## Rule 41.4 — Never Bypass Security

An agent must never remove or bypass:

- Authentication.
- Authorization.
- Validation.
- Ownership checks.

to make a feature work.

---

## Rule 41.5 — Tests Must Be Updated

When behavior changes, relevant tests must be updated or created.

---

## Rule 41.6 — No Fake Implementations

Do not create fake:

- Payment success.
- Authentication bypasses.
- Authorization bypasses.
- Database fallbacks.

unless explicitly implemented as a test-only mock.

---

## Rule 41.7 — No Silent Assumptions

If a requirement is ambiguous and materially affects architecture or business behavior, the agent should identify the ambiguity before implementing it.

---

# 42. API Agent Rules

When an AI agent creates a new endpoint, it must consider:

```text
Route
Middleware
Authentication
Authorization
Validation
Controller
Service
Domain Rules
Repository
Response
Error Handling
Tests
Documentation
```

A feature is not complete if only the controller is implemented.

---

# 43. Feature Completion Checklist

Before marking a feature complete:

```text
[ ] Requirements understood
[ ] Architecture reviewed
[ ] Database changes implemented
[ ] Migration created
[ ] Validation added
[ ] Authentication enforced
[ ] Authorization enforced
[ ] Ownership checks implemented
[ ] Business logic implemented
[ ] Error handling implemented
[ ] Logging considered
[ ] Tests added
[ ] API documentation updated
[ ] Security reviewed
```

---

# 44. Definition of Production-Ready

A feature is production-ready only when:

- It follows the architecture.
- Inputs are validated.
- Authorization is enforced.
- Resource ownership is enforced.
- Business rules are centralized.
- Database operations are safe.
- Critical operations are idempotent.
- Errors are handled consistently.
- Sensitive information is protected.
- Tests cover critical paths.
- Documentation is updated.
- Observability is sufficient.

---

# 45. Rule Priority

When rules conflict, use this priority:

```text
1. Security
2. Data Integrity
3. Correctness
4. Business Requirements
5. Architecture
6. Maintainability
7. Performance
8. Developer Convenience
```

Developer convenience must never override security or data integrity.

---

# 46. Final Engineering Standard

FoodFlow is intended to demonstrate professional backend engineering.

The codebase should prioritize:

```text
Correctness
    ↓
Security
    ↓
Data Integrity
    ↓
Maintainability
    ↓
Testability
    ↓
Performance
    ↓
Optimization
```

The system should be built deliberately.

Every major architectural decision should have a reason.

Every security boundary should be explicit.

Every business-critical operation should be reliable.

Every module should have clear ownership.

The goal is not to write the most code.

The goal is to build a backend that another professional engineer can understand, maintain, test, deploy, and extend confidently.
