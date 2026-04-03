# Finance Data Processing and Access Control Backend

A backend service for a finance dashboard that manages users, roles, financial records, and summary analytics with clear role-based access control.

## 1. Project Overview

This service powers a finance dashboard where different user types (viewer, analyst, admin) interact with financial data at varying permission levels. It focuses on:

- Clean separation between HTTP layer, business services, and data models
- Explicit role-based access control
- Efficient financial aggregations for dashboards
- Good validation, error handling, and predictable API behavior

The implementation is intentionally compact but production-minded: it uses a layered architecture, explicit schemas, and defensive coding patterns.

## 2. Architecture

**Stack**
- Node.js + Express
- MongoDB + Mongoose
- Joi for validation
- JWT for authentication

**Folder structure**
- `src/app.js` – Express app wiring
- `src/server.js` – Process bootstrap and DB connect
- `src/config/db.js` – Mongoose connection
- `src/models` – Mongoose schemas for core entities
- `src/services` – Business logic, independent of HTTP
- `src/controllers` – HTTP adapters using services
- `src/routes` – Route definitions and middleware composition
- `src/middleware` – Auth, RBAC, validation, error handling
- `src/utils` – Small shared helpers/constants
- `.env.example` – Environment reference

**Layered flow**
1. Route attaches middleware: auth → RBAC → validation.
2. Controller translates HTTP into service calls.
3. Service encapsulates business rules and data access.
4. Models (Mongoose) handle persistence and indexing.
5. Errors bubble to a global error handler for consistent responses.

This keeps business logic testable and minimizes Express-specific code in the core domain.

## 3. Data Modeling

### Role

Defined in `src/models/role.model.js`.

Fields:
- `name` (`viewer | analyst | admin`, unique, indexed): primary identifier used by RBAC.
- `description` (string): human-readable label.
- `permissions` (string[]): optional fine-grained capabilities (e.g. `records:manage`).
- Timestamps: `createdAt`, `updatedAt`.

### User

Defined in `src/models/user.model.js`.

Fields:
- `name` (string, required): display name.
- `email` (string, unique, indexed, required): login and primary identity.
- `passwordHash` (string, required, not selected by default): bcrypt hash; never expose raw passwords.
- `role` (ObjectId → Role, indexed, required): links user to role document.
- `status` (`active | inactive`, indexed): supports disabling accounts without deletion.
- `lastLoginAt` (Date): audit/analytics.
- Timestamps: `createdAt`, `updatedAt`.

Indexes:
- Unique index on `email` for login and user uniqueness.
- Index on `role` and `status` for admin queries over user lists.

### FinancialRecord

Defined in `src/models/financialRecord.model.js`.

Fields:
- `createdBy` (ObjectId → User, indexed, required): ownership / origin of the record.
- `amount` (Number, required, `>= 0`): stored as positive value; `type` encodes direction.
- `type` (`income | expense`, indexed): used heavily in aggregations.
- `category` (string, indexed, required): semantic grouping (e.g. salary, rent).
- `date` (Date, indexed, required): transaction date; basis for trends.
- `description` (string, optional): human context.
- `isDeleted` (boolean, indexed): soft-delete flag for safer operations.
- `updatedBy` (ObjectId → User): who last changed it.
- Timestamps: `createdAt`, `updatedAt`.

Indexes:
- `{ createdBy: 1, date: -1 }`: efficient user-by-time queries and recent activity.
- `{ createdBy: 1, category: 1 }`: supports category filters per user.
- `{ createdBy: 1, type: 1, date: -1 }`: supports type-specific historical charts.

These indexes directly support dashboard analytics and paginated listings with predictable performance.

## 4. Data Flow Between Layers

### Request lifecycle

1. **Client → Route**: HTTP request hits an Express route under `/api/*`.
2. **Auth middleware** (`src/middleware/auth.js`):
   - Extracts `Authorization: Bearer <token>`.
   - Verifies JWT and loads the user (and role) from MongoDB.
   - Rejects missing/invalid tokens or inactive users.
3. **RBAC middleware** (`src/middleware/rbac.js`):
   - Checks `req.user.role` against allowed roles for the endpoint.
   - Returns 403 when the role is insufficient.
4. **Validation middleware** (`src/middleware/validate.js`):
   - Applies Joi schemas to `req.body`, `req.query`, etc.
   - Normalizes data and strips unknown fields.
5. **Controller** (`src/controllers/*.js`):
   - Uses `catchAsync` to forward errors.
   - Calls the appropriate service with validated data and current user context.
6. **Service** (`src/services/*.js`):
   - Implements business rules and aggregates (e.g. soft delete, pagination).
   - Interacts with Mongoose models.
   - Throws `ApiError` on invalid operations.
7. **Error handler** (`src/middleware/errorHandler.js`):
   - Catches any error.
   - Formats JSON responses with a stable structure and proper HTTP status codes.

This separation keeps controllers thin, enables reuse of services, and centralizes cross-cutting concerns (auth, RBAC, validation, error handling).

## 5. REST API Design

Base URL: `/api`

### 5.1 Authentication

**POST** `/api/auth/login`
- Body:
  ```json
  { "email": "admin@example.com", "password": "admin123" }
  ```
- Responses:
  - `200 OK`:
    ```json
    { "success": true, "data": { "token": "...", "user": { "id": "...", "email": "...", "role": "admin" } } }
    ```
  - `401 Unauthorized` – invalid email/password.
- Access: public.

**POST** `/api/auth/seed-admin` (non-production only)
- Creates default admin role + `admin@local` user if missing.
  - In this reference implementation: `admin@example.com` / `admin123`.
- Responses:
  - `201 Created` – admin ensured.
- Access: public (for local setup; guarded by `NODE_ENV`).

### 5.2 User Management (Admin only)

All endpoints require:
- Header: `Authorization: Bearer <token>` with role `admin`.

**POST** `/api/users`
- Body:
  ```json
  {
    "name": "Analyst One",
    "email": "analyst@example.com",
    "password": "secret123",
    "roleName": "analyst"
  }
  ```
- Responses:
  - `201 Created` – returns created user (without password).
  - `400 Bad Request` – validation error.
  - `409 Conflict` – email already exists.

**GET** `/api/users`
- Query params: `page`, `limit`.
- Responses:
  - `200 OK` – `{ success, data: [users], meta: { page, limit, total, pages } }`.

**GET** `/api/users/:id`
- Responses:
  - `200 OK` – single user.
  - `404 Not Found` – user missing.

**PATCH** `/api/users/:id`
- Body (any subset):
  ```json
  {
    "name": "Updated Name",
    "roleName": "viewer",
    "status": "inactive"
  }
  ```
- Responses:
  - `200 OK` – updated user.
  - `400 Bad Request` – invalid role/status.
  - `404 Not Found` – user missing.

### 5.3 Financial Records

Authentication: required (Bearer token).

Access rules:
- Viewer: **no** access to raw records.
- Analyst: read-only access (list and view).
- Admin: full CRUD.

**GET** `/api/records`
- Roles: `analyst`, `admin`.
- Query params:
  - `type` (`income|expense`)
  - `category`
  - `startDate`, `endDate` (ISO dates)
  - `minAmount`, `maxAmount`
  - `page`, `limit`
- Responses:
  - `200 OK` – `{ success, data: [records], meta: { page, limit, total, pages } }`.

**GET** `/api/records/:id`
- Roles: `analyst`, `admin`.
- Responses:
  - `200 OK` – record.
  - `404 Not Found` – missing or soft-deleted record.

**POST** `/api/records`
- Roles: `admin`.
- Body:
  ```json
  {
    "amount": 1200,
    "type": "income",
    "category": "salary",
    "date": "2026-04-01T00:00:00.000Z",
    "description": "April salary"
  }
  ```
- Responses:
  - `201 Created` – created record.
  - `400 Bad Request` – validation error.

**PATCH** `/api/records/:id`
- Roles: `admin`.
- Body: any subset of record fields.
- Responses:
  - `200 OK` – updated record.
  - `404 Not Found` – missing/soft-deleted.

**DELETE** `/api/records/:id`
- Roles: `admin`.
- Behavior: soft delete (`isDeleted: true`).
- Responses:
  - `200 OK` – deleted record.
  - `404 Not Found` – missing/already deleted.

### 5.4 Dashboard Summary APIs

All endpoints require authentication. Roles: `viewer`, `analyst`, `admin`.

Each endpoint accepts optional query params:
- `startDate`, `endDate` (ISO strings) for time-window filtering.

**GET** `/api/dashboard/summary`
- Returns:
  ```json
  {
    "success": true,
    "data": {
      "totalIncome": 5000,
      "totalExpense": 3200,
      "netBalance": 1800
    }
  }
  ```

**GET** `/api/dashboard/category-totals`
- Returns per-category, per-type aggregates:
  ```json
  {
    "success": true,
    "data": [
      { "category": "salary", "type": "income", "totalAmount": 5000 },
      { "category": "rent", "type": "expense", "totalAmount": 2000 }
    ]
  }
  ```

**GET** `/api/dashboard/monthly-trends`
- Returns per-month, per-type totals:
  ```json
  {
    "success": true,
    "data": [
      { "year": 2026, "month": 1, "type": "income", "totalAmount": 3000 },
      { "year": 2026, "month": 1, "type": "expense", "totalAmount": 1500 }
    ]
  }
  ```

**GET** `/api/dashboard/recent-activity`
- Query: `limit` (default 10), `startDate`, `endDate`.
- Returns chronologically recent records for widgets.

## 6. Role-Based Access Control

RBAC is enforced in middleware rather than hard-coded in controllers.

- `src/middleware/auth.js`
  - Validates JWT and loads user + role.
  - Attaches `{ id, email, role }` to `req.user`.

- `src/middleware/rbac.js`
  - `requireRoles(...roles)` returns middleware that checks `req.user.role`.
  - Common patterns:
    - `/users/*`: `requireRoles('admin')`.
    - `/records/*`: `requireRoles('analyst', 'admin')` for reads, `requireRoles('admin')` for writes.
    - `/dashboard/*`: `requireRoles('viewer', 'analyst', 'admin')`.

Roles and behavior:
- **Viewer**: read-only dashboard analytics (no raw records).
- **Analyst**: read records + all dashboard analytics.
- **Admin**: full access including user management and record mutations.

## 7. Validation and Error Handling

**Validation**
- Implemented via `src/middleware/validate.js` and Joi schemas in `src/validations`.
- Each route opts into explicit validation for `body`/`query`.
- Invalid payloads return:
  - `400 Bad Request` with `{ success: false, message: "Validation error", details: ["..."] }`.

**Global Error Handling**
- Centralized in `src/middleware/errorHandler.js`.
- Handles:
  - `ApiError` instances with custom status codes.
  - Joi validation errors.
  - Mongoose `CastError` for invalid IDs.
  - Fallback `500 Internal Server Error` for unexpected failures.

This yields predictable, debuggable responses for both clients and developers.

## 8. Setup & Running Locally

### Prerequisites
- Node.js 18+
- MongoDB instance (local or remote)

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and configure:
   ```bash
   cp .env.example .env
   # Edit .env to point to your MongoDB and adjust JWT_SECRET
   ```
3. Start MongoDB locally or ensure your MongoDB URI is reachable.
4. Seed default admin (only once, dev only):
   ```bash
   npm run dev
   # In another terminal, call the seed endpoint via HTTP:
   # POST http://localhost:4000/api/auth/seed-admin
   ```
5. Login using:
   - email: `admin@local`
   - password: `admin123`
6. Use the issued JWT to call protected APIs.

### Scripts
- `npm run dev` – start API with nodemon.
- `npm start` – start API with Node.

## 9. Assumptions & Tradeoffs

Assumptions:
- Simple JWT-based stateless auth is sufficient for this assignment.
- Only admins can create/update/delete users and records.
- Analysts can view all records; viewers see only aggregated dashboard data.
- Soft deletes are enough for records; physical deletes are not required.

Tradeoffs:
- A single service handles all analytics queries instead of separate microservices for OLAP.
- Roles are modeled as documents to allow future extension (permissions, custom role names), but the app mostly uses the `name` field.
- For simplicity, there is no refresh-token or password-reset flow.

## 10. Future Improvements

- Add automated tests (unit + integration) for services and controllers.
- Introduce a structured logger and request IDs for observability.
- Support multi-tenant separation for different organizations.
- Implement refresh tokens and secure password reset flows.
- Extend RBAC to permission-level checks instead of only role names.

## 11. API Documentation

- OpenAPI 3 specification: [docs/openapi.yaml](docs/openapi.yaml)
  - Import into Swagger UI, Insomnia, or other tools to explore and test endpoints.
- Postman collection: [docs/postman_collection.json](docs/postman_collection.json)
  - Import into Postman, set `baseUrl` and `token` variables, then run the prepared requests.
