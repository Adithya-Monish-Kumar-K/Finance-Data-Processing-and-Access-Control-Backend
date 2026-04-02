# Finance Data Processing and Access Control Backend

A well-structured, well-reasoned finance dashboard backend built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **SQLite**. Designed to demonstrate clean backend architecture, role-based access control, and thoughtful engineering decisions.

> **Design Philosophy**: Every technical choice in this project has a purpose. A well-reasoned solution is valued more than unnecessary complexity.

**📖 API Documentation**: [Live Swagger Docs](https://finance-data-processing-and-access-yxda.onrender.com/api-docs) · **🌐 Live API**: [https://finance-data-processing-and-access-yxda.onrender.com](https://finance-data-processing-and-access-yxda.onrender.com)

---

## 🚀 Quick Start

### Option 1: Run locally (recommended)

```bash
# 1. Clone and install
git clone https://github.com/Adithya-Monish-Kumar-K/Finance-Data-Processing-and-Access-Control-Backend.git
cd Finance-Data-Processing-and-Access-Control-Backend
npm install

# 2. Set up database
npx prisma migrate dev --name init
npm run seed

# 3. Start the server
npm run dev
```

The server starts at **http://localhost:3000** and API docs at **http://localhost:3000/api-docs**.

### Option 2: Docker

```bash
docker-compose up --build
```

### Option 3: Live API (Cloud)

The API is deployed on Render and available for immediate testing:

- **Base URL**: `https://finance-data-processing-and-access-yxda.onrender.com`
- **Swagger Docs**: `https://finance-data-processing-and-access-yxda.onrender.com/api-docs`
- **Health Check**: `https://finance-data-processing-and-access-yxda.onrender.com/api/v1/health`

> Note: The free tier may take ~30 seconds to cold-start on first request.

### Pre-seeded Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | Admin123! |
| **Analyst** | analyst@example.com | Analyst123! |
| **Viewer** | viewer@example.com | Viewer123! |

---

## 📐 Architecture Overview

```
src/
├── config/          # Centralized config, DB client, Swagger setup
├── controllers/     # Thin HTTP layer — handles req/res, delegates to services
├── errors/          # Custom error classes (NotFound, Unauthorized, Forbidden, etc.)
├── middleware/       # Auth, authorization, validation, error handling
├── routes/          # Route definitions with Swagger JSDoc annotations
├── services/        # Business logic — all data operations live here
├── utils/           # Response helpers, pagination utilities
├── validators/      # Zod schemas for request validation
├── app.ts           # Express app setup with middleware stack
└── server.ts        # Entry point with graceful shutdown
```

### Layered Architecture

```
Request  → Middleware (Auth → Authorize → Validate) → Controller → Service → Prisma → SQLite
                                                          ↑                              ↓
Response ← Error Handler ←──────────────────────── Controller ← Service ← Prisma ← Response
```

**Why this structure?** Separation of concerns. Controllers handle HTTP concerns (request parsing, response formatting), services handle business logic (data operations, rules), and middleware handles cross-cutting concerns (auth, validation). This means:
- Business logic is testable without HTTP
- Middleware is reusable across routes
- Changes to one layer don't cascade to others

---

## 🔐 Role-Based Access Control

### Role Permissions Matrix

| Endpoint | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| **Auth** (register/login/refresh/logout) | ✅ | ✅ | ✅ |
| **Dashboard Overview** | ✅ | ✅ | ✅ |
| **Recent Activity** | ✅ | ✅ | ✅ |
| **Category Breakdown** | ❌ | ✅ | ✅ |
| **Monthly Trends** | ❌ | ✅ | ✅ |
| **Top Categories** | ❌ | ✅ | ✅ |
| **View Records (list/detail)** | ❌ | ✅ | ✅ |
| **Create/Update/Delete Records** | ❌ | ❌ | ✅ |
| **User Management** | ❌ | ❌ | ✅ |

**Design decision**: Access control is *graduated*, not binary. Viewers see high-level summaries but can't access raw records. Analysts can analyze data but can't modify it. This mirrors real-world finance dashboard permissions where data integrity is critical.

---

## 📡 API Reference

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT tokens |
| POST | `/refresh` | Refresh an expired access token |
| POST | `/logout` | Revoke refresh token |

### Users (`/api/v1/users`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin | List users (paginated, filterable) |
| GET | `/:id` | Authenticated | Get user by ID |
| POST | `/` | Admin | Create a user |
| PATCH | `/:id` | Admin | Update user profile |
| PATCH | `/:id/role` | Admin | Change user role |
| PATCH | `/:id/status` | Admin | Activate/deactivate user |
| DELETE | `/:id` | Admin | Soft delete user |

### Financial Records (`/api/v1/records`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | Analyst, Admin | List records (paginated, filterable, sortable) |
| GET | `/:id` | Analyst, Admin | Get record by ID |
| POST | `/` | Admin | Create a record |
| PATCH | `/:id` | Admin | Update a record |
| DELETE | `/:id` | Admin | Soft delete a record |

**Filtering parameters**: `type`, `category`, `startDate`, `endDate`, `search`, `sortBy`, `sortOrder`

### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/overview` | All | Total income, expenses, net balance |
| GET | `/category-breakdown` | Analyst, Admin | Per-category totals |
| GET | `/monthly-trends` | Analyst, Admin | Time-series trend data |
| GET | `/recent-activity` | All | Latest transactions |
| GET | `/top-categories` | Analyst, Admin | Highest-value categories |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check (server + DB status) |
| GET | `/api-docs` | Interactive Swagger documentation |

---

## 🛠️ Tech Stack & Justifications

| Technology | Why This Choice |
|------------|----------------|
| **Node.js + Express** | Industry standard, widely understood, excellent ecosystem |
| **TypeScript** | Catches bugs at compile time, self-documenting code via types |
| **Prisma ORM** | Type-safe queries, readable schema, auto-generated types. Eliminates raw SQL mistakes |
| **SQLite** | Zero-config — reviewers can `clone → install → run` without setting up a database server |
| **JWT (access + refresh tokens)** | Stateless auth with token rotation for security. Refresh tokens in DB enable revocation |
| **bcrypt** | Industry-standard password hashing (12 salt rounds — good security vs. speed tradeoff) |
| **Zod** | Runtime validation that generates TypeScript types — define shape once, get both |
| **Swagger/OpenAPI** | Auto-generated interactive API docs from JSDoc in route files |
| **Helmet** | Security headers (XSS, HSTS, etc.) with zero configuration |
| **Docker** | Containerized for consistent deployments, demonstrates DevOps awareness |
| **Jest + Supertest** | Unit + integration tests proving the system works correctly |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage
```

### Test Structure

```
tests/
├── unit/
│   └── middleware/
│       └── authorize.test.ts    # Role-based auth logic (no I/O)
└── integration/
    ├── auth.test.ts             # Full auth lifecycle
    ├── records.test.ts          # CRUD + access control
    └── dashboard.test.ts        # Analytics + graduated permissions
```

---

## 🧠 Assumptions & Tradeoffs

### Assumptions
1. **Single-tenant system** — all users share the same dataset (appropriate for a company finance dashboard)
2. **Email as unique identifier** — standard for most applications
3. **Soft deletes preferred** — financial data should never be permanently lost for audit purposes
4. **UTC dates** — all dates stored in UTC. Frontend handles timezone conversion

### Tradeoffs
1. **SQLite over PostgreSQL** — Zero-config portability for reviewers vs. concurrency limits. *In production: switch to PostgreSQL for concurrent access, full-text search, and JSON operations*
2. **Soft deletes** — Slightly more complex queries (every query filters `deletedAt: null`) vs. data preservation for audit trails
3. **JWT in DB for refresh** — Enables token revocation (important for security) at the cost of a DB lookup per refresh. *Access tokens remain stateless*
4. **Float for amounts** — SQLite doesn't support Decimal. *In production with PostgreSQL: use Decimal for precise financial calculations*
5. **No email verification** — Simplified for assessment. *In production: add email verification + password reset flows*

### What I Would Improve With More Time
- **PostgreSQL** with Decimal types for precise financial math
- **Redis** caching for dashboard aggregations (avoid repeated heavy queries)
- **Audit log table** tracking who changed what, when
- **Email verification** and password reset flow
- **WebSocket** for real-time dashboard updates
- **CI/CD pipeline** (GitHub Actions) for automated testing and deployment
- **Load testing** (k6 or Artillery) to verify rate limiting effectiveness

---

## ☁️ Cloud Deployment

The application is deployed on **Render** using the included `render.yaml` Blueprint:

- SQLite runs on Render's ephemeral filesystem
- The startup script (`scripts/start.sh`) runs migrations and seeds the database on every deploy
- JWT secrets are auto-generated per deployment

To deploy your own instance:
1. Fork this repo
2. Create a new Web Service on [Render](https://render.com)
3. Connect your fork → Render auto-detects `render.yaml`
4. Click Deploy

---

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm test` | Run all tests |
| `npm run seed` | Seed database with sample data |
| `npm run migrate` | Run Prisma migrations |
| `npm run studio` | Open Prisma Studio (DB GUI) |

---

## 📜 License

MIT
