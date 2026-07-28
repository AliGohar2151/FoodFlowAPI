# FoodFlow API — Technical Design

**Version:** 1.0
**Status:** Active
**Architecture:** Modular Monolith
**Runtime:** Node.js
**Language:** TypeScript
**Framework:** Express.js
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

# 1. Design Goals

The FoodFlow backend must be:

- Secure.
- Modular.
- Maintainable.
- Testable.
- Scalable.
- Observable.
- Vendor-isolated.
- Transaction-safe.
- API-consistent.

The initial implementation will use a **modular monolith**.

The architecture should allow future extraction of independent services if the system grows.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Client Apps     │
                         │                     │
                         │ Customer Web/Mobile │
                         │ Vendor Dashboard    │
                         │ Admin Dashboard     │
                         │ Rider App           │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Express API    │
                         │      /api/v1        │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        Authentication       Authorization       Validation
        Middleware           Middleware          Middleware
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Controllers      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Application Services│
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
           Domain Logic       Repositories       External Services
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
             PostgreSQL          Redis             BullMQ
                                                    │
                                                    ▼
                                                  Workers
```

---

# 3. Request Processing Flow

Every request should follow a predictable pipeline.

```text
HTTP Request
    ↓
Request ID
    ↓
Security Middleware
    ↓
CORS
    ↓
Rate Limiting
    ↓
Body Parsing
    ↓
Route
    ↓
Authentication
    ↓
Authorization
    ↓
Zod Validation
    ↓
Controller
    ↓
Service
    ↓
Domain Logic
    ↓
Repository
    ↓
PostgreSQL
    ↓
Service Result
    ↓
Controller
    ↓
Standard Response
```

Errors follow:

```text
Any Layer
    ↓
throw AppError
    ↓
Global Error Middleware
    ↓
Error Mapping
    ↓
Structured API Error
```

---

# 4. Project Structure

The recommended project structure is:

```text
src/
│
├── app.ts
├── server.ts
│
├── config/
│   ├── env.ts
│   ├── database.ts
│   ├── redis.ts
│   └── logger.ts
│
├── common/
│   ├── errors/
│   ├── middleware/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── responses/
│
├── infrastructure/
│   ├── database/
│   │   └── prisma.ts
│   │
│   ├── cache/
│   │   └── redis.ts
│   │
│   ├── queue/
│   │   ├── bullmq.ts
│   │   └── workers/
│   │
│   ├── logging/
│   │
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

# 5. Module Structure

Each module should follow a consistent structure.

Example:

```text
modules/restaurants/

├── restaurant.routes.ts
├── restaurant.controller.ts
├── restaurant.service.ts
├── restaurant.repository.ts
├── restaurant.schema.ts
├── restaurant.types.ts
├── restaurant.policy.ts
├── restaurant.mapper.ts
└── index.ts
```

For more complex modules:

```text
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

The complexity of a module should grow only when the domain requires it.

---

# 6. Database Design

PostgreSQL is the system of record.

The database is divided conceptually into:

```text
Identity
├── User
├── Role
├── Permission
├── RefreshToken
│
Vendor
├── Restaurant
├── RestaurantStaff
├── RestaurantOperatingHour
│
Catalog
├── MenuCategory
├── MenuItem
├── MenuItemOption
│
Customer
├── Address
├── Cart
├── CartItem
│
Commerce
├── Order
├── OrderItem
├── Payment
├── Coupon
├── OrderCoupon
│
Delivery
├── Delivery
│
Engagement
├── Review
│
System
├── Notification
├── AuditLog
```

---

# 7. User Model

The `User` represents an authenticated account.

Conceptual fields:

```text
User
├── id
├── email
├── phone
├── passwordHash
├── firstName
├── lastName
├── avatarUrl
├── status
├── emailVerifiedAt
├── phoneVerifiedAt
├── lastLoginAt
├── createdAt
└── updatedAt
```

User status:

```text
ACTIVE
INACTIVE
SUSPENDED
PENDING_VERIFICATION
```

Rules:

- Email must be unique.
- Phone should be unique when provided.
- Password is never returned through API responses.
- Suspended users cannot authenticate normally.
- Soft deletion may be used where business requirements require account retention.

---

# 8. Role Model

A role is a logical collection of permissions.

```text
Role
├── id
├── name
├── description
├── isSystemRole
├── createdAt
└── updatedAt
```

Examples:

```text
SUPER_ADMIN
ADMIN
RESTAURANT_OWNER
RESTAURANT_MANAGER
DELIVERY_RIDER
CUSTOMER
SUPPORT_AGENT
```

System roles should be protected from accidental deletion.

---

# 9. Permission Model

Permissions define what actions a user can perform.

```text
Permission
├── id
├── name
├── description
├── resource
├── action
├── createdAt
└── updatedAt
```

Naming convention:

```text
resource.action
```

Examples:

```text
users.read
users.update
users.suspend

restaurants.create
restaurants.read
restaurants.update
restaurants.approve

menus.create
menus.update
menus.delete

orders.read
orders.update
orders.cancel

payments.read
payments.refund
```

Permissions are assigned to roles.

---

# 10. User-Role Relationship

Many-to-many relationship:

```text
User
 │
 ├──── UserRole ────┐
 │                  │
 ▼                  ▼
User             Role
```

A user may have multiple roles.

Example:

```text
Ali
├── RESTAURANT_OWNER
└── SUPPORT_AGENT
```

Effective permissions are calculated from all active roles.

---

# 11. Role-Permission Relationship

```text
Role
 │
 ├──── RolePermission ────┐
 │                        │
 ▼                        ▼
Role                  Permission
```

Example:

```text
RESTAURANT_OWNER
├── restaurants.create
├── restaurants.read
├── restaurants.update
├── menus.create
├── menus.update
├── menus.delete
└── orders.read
```

---

# 12. Refresh Token Model

Refresh tokens represent long-lived authentication sessions.

Conceptual fields:

```text
RefreshToken
├── id
├── userId
├── tokenHash
├── expiresAt
├── revokedAt
├── replacedByTokenId
├── userAgent
├── ipAddress
├── createdAt
└── lastUsedAt
```

Refresh token rotation:

```text
Refresh Token A
      ↓
Used
      ↓
Revoke A
      ↓
Create Refresh Token B
      ↓
Return B
```

If a previously revoked token is reused, the system should consider revoking the entire token family/session chain.

---

# 13. Restaurant Model

A restaurant is the primary vendor entity.

```text
Restaurant
├── id
├── ownerId
├── name
├── slug
├── description
├── logoUrl
├── coverImageUrl
├── phone
├── email
├── address
├── latitude
├── longitude
├── status
├── isOpen
├── averageRating
├── totalRatings
├── estimatedDeliveryMinutes
├── createdAt
└── updatedAt
```

Restaurant status:

```text
PENDING_APPROVAL
ACTIVE
INACTIVE
SUSPENDED
REJECTED
```

Public discovery should only expose restaurants according to status and availability rules.

---

# 14. Restaurant Staff Model

Restaurant staff connects users to restaurants.

```text
RestaurantStaff
├── id
├── restaurantId
├── userId
├── role
├── status
├── createdAt
└── updatedAt
```

Restaurant staff roles may include:

```text
OWNER
MANAGER
STAFF
```

RBAC determines permissions.

Restaurant policies determine which restaurant resources the user may access.

---

# 15. Restaurant Operating Hours

Restaurants require operating schedules.

```text
RestaurantOperatingHour
├── id
├── restaurantId
├── dayOfWeek
├── opensAt
├── closesAt
└── isClosed
```

The system should calculate restaurant availability based on:

- Operating hours.
- Manual open/close status.
- Restaurant status.

---

# 16. Menu Category

A category organizes menu items.

```text
MenuCategory
├── id
├── restaurantId
├── name
├── description
├── sortOrder
├── isActive
├── createdAt
└── updatedAt
```

Examples:

```text
Biryani
Burgers
Pizza
Drinks
Desserts
```

---

# 17. Menu Item

A menu item represents a product that customers can order.

```text
MenuItem
├── id
├── restaurantId
├── categoryId
├── name
├── description
├── imageUrl
├── price
├── preparationTimeMinutes
├── isAvailable
├── createdAt
└── updatedAt
```

Important rule:

The current menu item price is not the historical order price.

When an order is created, the item information must be snapshotted into `OrderItem`.

---

# 18. Menu Item Options

Optional add-ons or variations.

```text
MenuItemOption
├── id
├── menuItemId
├── name
├── price
├── isAvailable
└── createdAt
```

Examples:

```text
Extra Cheese
+ $1.50

Extra Sauce
+ $0.50

Large Size
+ $2.00
```

The actual price used by an order must be stored in the order snapshot.

---

# 19. Address Model

Customers can maintain multiple addresses.

```text
Address
├── id
├── userId
├── label
├── recipientName
├── phone
├── addressLine1
├── addressLine2
├── city
├── postalCode
├── latitude
├── longitude
├── isDefault
├── createdAt
└── updatedAt
```

Examples:

```text
Home
Office
University
```

An order must snapshot the address at checkout.

---

# 20. Cart Model

A cart belongs to one customer.

```text
Cart
├── id
├── userId
├── restaurantId
├── createdAt
└── updatedAt
```

Rule:

```text
One active cart
      ↓
One restaurant
```

A customer cannot add items from multiple restaurants to the same cart.

---

# 21. Cart Item

```text
CartItem
├── id
├── cartId
├── menuItemId
├── quantity
├── createdAt
└── updatedAt
```

At checkout, the server must revalidate:

```text
Menu Item Exists
      ↓
Belongs to Restaurant
      ↓
Available
      ↓
Price
      ↓
Quantity
```

Never trust cart totals from the client.

---

# 22. Order Model

The order is the central commerce entity.

```text
Order
├── id
├── orderNumber
├── customerId
├── restaurantId
├── deliveryAddressSnapshot
├── subtotal
├── discountAmount
├── deliveryFee
├── taxAmount
├── totalAmount
├── status
├── paymentStatus
├── notes
├── createdAt
└── updatedAt
```

Order statuses:

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

Payment statuses:

```text
PENDING
AUTHORIZED
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

---

# 23. Order Item

Order items are historical snapshots.

```text
OrderItem
├── id
├── orderId
├── menuItemId
├── nameSnapshot
├── priceSnapshot
├── quantity
├── optionsSnapshot
├── subtotal
└── createdAt
```

The system must preserve the historical state.

If the restaurant changes:

```text
Menu Item Name
Price
Description
```

old orders must remain unchanged.

---

# 24. Order State Machine

The order lifecycle must be centralized.

Valid transitions:

```text
PENDING
  ├── CONFIRMED
  └── CANCELLED

CONFIRMED
  ├── PREPARING
  └── CANCELLED

PREPARING
  └── READY_FOR_PICKUP

READY_FOR_PICKUP
  └── ASSIGNED

ASSIGNED
  └── PICKED_UP

PICKED_UP
  └── OUT_FOR_DELIVERY

OUT_FOR_DELIVERY
  └── DELIVERED
```

Invalid transitions must be rejected.

Example:

```text
DELIVERED
    ↓
PREPARING
```

must never be allowed.

---

# 25. Order Status History

Every significant transition should be recorded.

```text
OrderStatusHistory
├── id
├── orderId
├── fromStatus
├── toStatus
├── changedByUserId
├── reason
└── createdAt
```

This provides:

- Auditability.
- Debugging.
- Customer tracking.
- Operational visibility.

---

# 26. Payment Model

```text
Payment
├── id
├── orderId
├── userId
├── provider
├── providerPaymentId
├── amount
├── currency
├── status
├── paidAt
├── failureReason
├── createdAt
└── updatedAt
```

Payment provider integration must use an abstraction.

```text
PaymentService
      ↓
PaymentGateway Interface
      ↓
StripeGateway
JazzCashGateway
OtherGateway
```

The application should not tightly couple business logic to a single provider.

---

# 27. Payment Webhooks

Webhook flow:

```text
Payment Provider
      ↓
Webhook Endpoint
      ↓
Verify Signature
      ↓
Validate Payload
      ↓
Check Idempotency
      ↓
Update Payment
      ↓
Update Order
      ↓
Publish Event
```

Webhook processing must be idempotent.

---

# 28. Delivery Model

```text
Delivery
├── id
├── orderId
├── riderId
├── status
├── assignedAt
├── acceptedAt
├── pickedUpAt
├── deliveredAt
├── deliveryNotes
├── createdAt
└── updatedAt
```

Delivery status:

```text
PENDING
ASSIGNED
ACCEPTED
PICKED_UP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

---

# 29. Rider Model

Rider-specific information may be stored separately from the main user entity.

```text
RiderProfile
├── id
├── userId
├── vehicleType
├── vehicleNumber
├── availabilityStatus
├── verificationStatus
└── createdAt
```

Availability:

```text
AVAILABLE
BUSY
OFFLINE
```

---

# 30. Review Model

Reviews belong to completed orders.

```text
Review
├── id
├── orderId
├── customerId
├── restaurantId
├── rating
├── comment
├── status
├── createdAt
└── updatedAt
```

Rules:

- Only customers may review.
- Customer must own the order.
- Order must be delivered.
- One review per order.
- Restaurant rating is calculated from valid reviews.

---

# 31. Coupon Model

```text
Coupon
├── id
├── code
├── description
├── discountType
├── discountValue
├── minimumOrderAmount
├── maximumDiscountAmount
├── usageLimit
├── perUserLimit
├── startsAt
├── expiresAt
├── isActive
├── restaurantId
├── createdAt
└── updatedAt
```

Discount types:

```text
PERCENTAGE
FIXED_AMOUNT
```

Coupon validation:

```text
Code Exists
    ↓
Active
    ↓
Within Date Range
    ↓
Restaurant Eligible
    ↓
Minimum Amount Met
    ↓
Usage Limit Available
    ↓
User Limit Available
    ↓
Calculate Discount
```

---

# 32. Order Coupon

A separate relationship should track coupon usage.

```text
OrderCoupon
├── id
├── orderId
├── couponId
├── userId
├── discountAmount
└── createdAt
```

This provides historical records of coupon usage.

---

# 33. Notification Model

```text
Notification
├── id
├── userId
├── type
├── title
├── message
├── data
├── readAt
└── createdAt
```

Notification delivery may use:

```text
NotificationService
      ↓
Notification Channel
      ├── In-App
      ├── Email
      └── Push
```

---

# 34. Audit Log Model

```text
AuditLog
├── id
├── actorUserId
├── action
├── resourceType
├── resourceId
├── metadata
├── ipAddress
├── userAgent
└── createdAt
```

Examples:

```text
RESTAURANT_APPROVED
USER_SUSPENDED
ROLE_ASSIGNED
PERMISSION_CHANGED
PAYMENT_REFUNDED
ORDER_CANCELLED
```

Audit logs should be append-only.

---

# 35. Database Relationship Overview

```text
User
│
├── UserRole ─── Role ─── RolePermission ─── Permission
│
├── RefreshToken
│
├── RestaurantStaff ─── Restaurant
│                           │
│                           ├── RestaurantOperatingHour
│                           ├── MenuCategory
│                           │       │
│                           │       └── MenuItem
│                           │              │
│                           │              └── MenuItemOption
│                           │
│                           └── Orders
│
├── Address
│
├── Cart ─── CartItem ─── MenuItem
│
├── Orders
│    │
│    ├── OrderItem
│    ├── Payment
│    ├── Delivery
│    ├── Review
│    └── OrderCoupon
│
├── Notifications
│
└── AuditLogs
```

---

# 36. Multi-Vendor Data Isolation

Every vendor-owned resource must be traceable to a restaurant.

Example:

```text
Restaurant
    │
    ├── Category
    ├── Menu Item
    ├── Order
    ├── Coupon
    └── Review
```

Authorization flow:

```text
Authenticated User
       ↓
Permission Check
       ↓
Restaurant Scope Check
       ↓
Resource Ownership Check
       ↓
Allow / Deny
```

Example:

```typescript
await restaurantPolicy.assertCanManage(user, restaurantId);
```

---

# 37. Authentication Design

Authentication consists of:

```text
Access Token
+
Refresh Token
+
Session Management
```

Access token:

- Short-lived.
- Used for API requests.

Refresh token:

- Long-lived.
- Stored securely.
- Rotated.
- Revoked when necessary.

JWT payload should contain minimal information.

Example:

```json
{
  "sub": "user-id",
  "sessionId": "session-id",
  "type": "access"
}
```

Do not put sensitive data in JWTs.

---

# 38. Authorization Design

Authorization consists of:

```text
Authentication
      ↓
User Identity
      ↓
Role Resolution
      ↓
Permission Resolution
      ↓
Permission Check
      ↓
Resource Policy
      ↓
Decision
```

Example:

```text
PATCH /restaurants/:restaurantId

authenticate()
      ↓
authorize("restaurants.update")
      ↓
restaurantPolicy.assertCanManage()
      ↓
Controller
```

---

# 39. Zod Validation Architecture

Validation is performed at the API boundary.

Example:

```text
Request
  ↓
Zod Schema
  ↓
Validated Input
  ↓
Controller
  ↓
Service
```

Schemas should exist for:

```text
Create
Update
Query
Params
Authentication
```

Example:

```text
createRestaurantSchema
updateRestaurantSchema
restaurantIdParamSchema
restaurantQuerySchema
```

---

# 40. Standard API Response

Success:

```json
{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {
    "id": "restaurant-id"
  }
}
```

Paginated response:

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

---

# 41. Error Architecture

Base error:

```typescript
AppError;
```

Specialized errors:

```text
BadRequestError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
ValidationError
BusinessRuleError
```

Global handler maps errors to HTTP responses.

Example:

```text
Prisma Unique Constraint
        ↓
ConflictError
        ↓
409 Conflict
```

Internal errors should not expose implementation details.

---

# 42. Transaction Design

Transactions are required when multiple database operations must succeed together.

Order creation:

```text
BEGIN
  ↓
Validate Cart
  ↓
Validate Menu Items
  ↓
Calculate Total
  ↓
Create Order
  ↓
Create Order Items
  ↓
Create Order Status History
  ↓
Clear Cart
  ↓
COMMIT
```

If any step fails:

```text
ROLLBACK
```

No partial order should remain.

---

# 43. Event-Driven Internal Communication

The modular monolith may use internal domain events.

Example:

```text
Order Created
      ↓
order.created
      ├── Notification Job
      ├── Restaurant Notification
      ├── Analytics
      └── Audit Log
```

The core order transaction should not depend on non-critical external operations.

---

# 44. Background Job Architecture

```text
Application
    ↓
BullMQ Queue
    ↓
Redis
    ↓
Worker
    ↓
Job Handler
    ↓
External Service
```

Queues:

```text
emailQueue
notificationQueue
paymentQueue
cleanupQueue
```

Jobs should contain IDs rather than large object payloads where possible.

Example:

```json
{
  "orderId": "order-id"
}
```

The worker retrieves current data when processing.

---

# 45. Caching Architecture

Public restaurant data may be cached.

Example:

```text
GET /restaurants/:id
        ↓
Redis
        │
        ├── Cache Hit → Return
        │
        └── Cache Miss
                ↓
             Database
                ↓
             Redis Set
                ↓
             Return
```

When restaurant data changes:

```text
Update Restaurant
      ↓
Database Commit
      ↓
Invalidate Cache
```

Database remains the source of truth.

---

# 46. Pagination Design

All collection endpoints should support pagination.

Recommended query parameters:

```text
?page=1&limit=20
```

Maximum limit:

```text
100
```

The API should never allow unlimited result sets.

---

# 47. Search and Filtering

Restaurant discovery should support:

```text
search
cuisine
rating
availability
distance
sort
page
limit
```

Example:

```text
GET /api/v1/restaurants
  ?search=biryani
  &rating=4
  &sort=rating
  &page=1
  &limit=20
```

All query parameters must be validated with Zod.

---

# 48. API Versioning

All public APIs should be versioned.

Initial version:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
/api/v1/restaurants
/api/v1/orders
```

Breaking changes should introduce a new API version.

---

# 49. Idempotency Design

Critical write operations should support idempotency.

Example:

```text
POST /payments
Idempotency-Key: abc123
```

Flow:

```text
Request
  ↓
Idempotency Key
  ↓
Check Existing Result
  │
  ├── Exists → Return Previous Result
  │
  └── Not Exists
          ↓
       Process
          ↓
       Store Result
          ↓
       Return
```

---

# 50. Security Architecture

Security layers:

```text
HTTPS
  ↓
Helmet
  ↓
CORS
  ↓
Rate Limiting
  ↓
Input Validation
  ↓
Authentication
  ↓
Authorization
  ↓
Ownership Policies
  ↓
Database Constraints
  ↓
Audit Logging
```

No single security mechanism should be considered sufficient.

---

# 51. Restaurant Order Flow

```text
Customer
    ↓
Browse Restaurant
    ↓
View Menu
    ↓
Add Items
    ↓
Cart
    ↓
Checkout
    ↓
Server Validates
    ↓
Create Order
    ↓
Payment
    ↓
Restaurant Receives Order
    ↓
Confirm
    ↓
Prepare
    ↓
Ready
    ↓
Rider Assigned
    ↓
Pickup
    ↓
Delivery
    ↓
Customer Receives Order
    ↓
Review
```

---

# 52. Order Creation Flow

```text
POST /orders
       ↓
Authenticate
       ↓
Validate Input
       ↓
Load Cart
       ↓
Validate Cart Ownership
       ↓
Validate Restaurant
       ↓
Validate Menu Items
       ↓
Fetch Current Prices
       ↓
Calculate Subtotal
       ↓
Validate Coupon
       ↓
Calculate Discount
       ↓
Calculate Tax
       ↓
Calculate Delivery Fee
       ↓
Calculate Final Total
       ↓
Create Order Transaction
       ↓
Create Payment
       ↓
Publish order.created
       ↓
Return Order
```

The client must never control the final price.

---

# 53. Restaurant Processing Flow

```text
Order Created
      ↓
Restaurant Receives Notification
      ↓
Restaurant Confirms
      ↓
Order PREPARING
      ↓
Food Prepared
      ↓
READY_FOR_PICKUP
      ↓
Delivery Assigned
```

Only authorized restaurant users can perform restaurant-side transitions.

---

# 54. Delivery Flow

```text
Delivery Created
      ↓
Find Available Rider
      ↓
Assign Rider
      ↓
Rider Accepts
      ↓
Restaurant Marks Ready
      ↓
Rider Picks Up
      ↓
OUT_FOR_DELIVERY
      ↓
Customer Receives
      ↓
DELIVERED
```

Rider permissions are restricted to assigned deliveries.

---

# 55. Payment Flow

```text
Customer
    ↓
Create Order
    ↓
Create Payment Intent
    ↓
Payment Provider
    ↓
Customer Pays
    ↓
Provider Webhook
    ↓
Verify Signature
    ↓
Check Idempotency
    ↓
Update Payment
    ↓
Update Order Payment Status
    ↓
Publish payment.completed
```

Payment status must always be verified server-side.

---

# 56. Database Index Strategy

Indexes should be created based on actual query patterns.

Initial candidates:

```text
User.email
User.phone

Restaurant.ownerId
Restaurant.status
Restaurant.slug

RestaurantStaff.restaurantId
RestaurantStaff.userId

MenuCategory.restaurantId

MenuItem.restaurantId
MenuItem.categoryId
MenuItem.isAvailable

Cart.userId

Order.customerId
Order.restaurantId
Order.status
Order.createdAt

Payment.orderId
Payment.providerPaymentId

Delivery.riderId
Delivery.status

Review.restaurantId

Coupon.code
Coupon.restaurantId
```

Composite indexes should be introduced where query patterns justify them.

---

# 57. Database Constraints

Important business invariants should be enforced at database level.

Examples:

```text
Unique User.email
Unique Restaurant.slug
Unique Coupon.code
Unique Role.name
Unique Permission.name
Unique UserRole(userId, roleId)
Unique RolePermission(roleId, permissionId)
Unique RestaurantStaff(restaurantId, userId)
Unique Review(orderId)
```

Application-level checks do not replace database constraints.

---

# 58. Soft Delete Strategy

Soft deletion should be used selectively.

Good candidates:

```text
User
Restaurant
MenuItem
Coupon
```

Avoid soft deletion when it creates unnecessary complexity.

Historical records such as orders and payments should generally remain immutable.

---

# 59. Money Handling

All monetary calculations must be precise.

Do not use JavaScript floating-point arithmetic for financial calculations.

Prefer:

```text
Decimal
```

or integer minor units.

Example:

```text
$12.50
```

may be represented as:

```text
1250 cents
```

The selected approach must be consistent across the entire payment and order system.

---

# 60. Time Handling

Store timestamps in UTC.

Convert timestamps to local time only at presentation boundaries.

Use timezone-aware logic for:

- Restaurant operating hours.
- Coupon expiration.
- Delivery estimates.
- Scheduled operations.

---

# 61. External Service Abstractions

External services must be hidden behind interfaces.

Examples:

```text
PaymentGateway
EmailProvider
PushNotificationProvider
ObjectStorageProvider
MapsProvider
```

This allows providers to be replaced without rewriting business logic.

---

# 62. Dependency Direction

Dependencies should flow inward.

```text
Routes
   ↓
Controllers
   ↓
Application Services
   ↓
Domain
   ↓
Repositories / Interfaces
   ↓
Infrastructure Implementations
```

Infrastructure must not dictate business logic.

---

# 63. Design Principle: Domain Ownership

Each business concept should have one clear owner.

```text
Authentication
→ Auth Module

Users
→ Users Module

Permissions
→ RBAC Module

Restaurants
→ Restaurants Module

Menus
→ Menus Module

Orders
→ Orders Module

Payments
→ Payments Module

Delivery
→ Deliveries Module
```

Other modules interact through public services or domain events.

---

# 64. Design Principle: Server Authority

The server is the final authority for:

- Prices.
- Discounts.
- Taxes.
- Delivery fees.
- Permissions.
- Order status.
- Payment status.
- Restaurant availability.

Client-provided values must never be blindly trusted.

---

# 65. Design Principle: Historical Integrity

Historical business records must remain stable.

Examples:

```text
Order Item Price
Order Item Name
Delivery Address
Payment Amount
Applied Coupon
```

These should be snapshotted when the transaction occurs.

---

# 66. Design Principle: Vendor Isolation

The multi-vendor architecture must prevent cross-vendor data access.

The following checks must be considered:

```text
Does user have permission?
        ↓
Does user belong to restaurant?
        ↓
Does resource belong to restaurant?
        ↓
Is operation allowed?
```

A permission alone is not sufficient.

---

# 67. Initial API Namespace

```text
/api/v1
```

Modules:

```text
/auth
/users
/roles
/permissions
/restaurants
/restaurants/:restaurantId/staff
/restaurants/:restaurantId/categories
/restaurants/:restaurantId/menu-items
/addresses
/carts
/orders
/payments
/deliveries
/reviews
/coupons
/notifications
/audit-logs
```

---

# 68. Initial Public API

Customers can:

```text
Register
Login
Manage Profile
Manage Addresses
Browse Restaurants
View Menus
Manage Cart
Create Orders
Pay
Track Orders
Review Orders
```

---

# 69. Initial Vendor API

Restaurant owners/managers can:

```text
Manage Restaurant
Manage Staff
Manage Operating Hours
Manage Categories
Manage Menu Items
View Orders
Update Order Status
View Restaurant Analytics
```

Access is restricted by:

```text
Permission
+
Restaurant Scope
```

---

# 70. Initial Admin API

Administrators can:

```text
Manage Users
Manage Roles
Manage Permissions
Approve Restaurants
Suspend Restaurants
Manage Vendors
Manage Orders
Manage Payments
Issue Refunds
View Audit Logs
```

Access is controlled by explicit permissions.

---

# 71. Initial Rider API

Riders can:

```text
View Assigned Deliveries
Accept Delivery
Update Pickup Status
Update Delivery Status
Complete Delivery
```

Riders cannot access unrelated deliveries.

---

# 72. Final Architecture

The final initial architecture is:

```text
                         FoodFlow API
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
       Authentication      RBAC           Validation
             │                │                │
             └────────────────┼────────────────┘
                              │
                              ▼
                     Modular Monolith
                              │
     ┌────────┬────────┬──────┼──────┬────────┬────────┐
     │        │        │      │      │        │        │
     ▼        ▼        ▼      ▼      ▼        ▼        ▼
    Auth    Users  Restaurants Menus Carts   Orders  Payments
     │        │        │      │      │        │        │
     └────────┴────────┴──────┼──────┴────────┴────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
               PostgreSQL             Redis
                    │                   │
                    │                   ▼
                    │                BullMQ
                    │                   │
                    │                   ▼
                    │                Workers
                    │
                    ▼
              Source of Truth
```

---

# 73. Final Design Standard

The FoodFlow backend should be built around these principles:

```text
Modular Monolith
        +
Strong Module Boundaries
        +
Type Safety
        +
Zod Validation
        +
JWT Authentication
        +
Permission-Based RBAC
        +
Resource Ownership Policies
        +
PostgreSQL Data Integrity
        +
Transactional Business Operations
        +
Idempotent Critical Operations
        +
Redis for Infrastructure
        +
BullMQ for Async Work
        +
Structured Logging
        +
Auditability
        +
Automated Testing
```

The architecture should remain simple enough for one development team to understand while being structured enough to evolve into a larger distributed system when real scaling requirements appear.
