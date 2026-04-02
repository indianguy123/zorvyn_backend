# Zorvyn — Finance Dashboard

A production-grade full-stack Finance Dashboard application with role-based access control, financial record management, analytics visualizations, and document storage.

> **Monorepo structure** — two independent projects under one root: `server/` (API) and `client/` (UI).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| **Backend** | Node.js, Express 4, TypeScript |
| **ORM** | Prisma with PostgreSQL |
| **Database** | Aiven (serverless PostgreSQL) |
| **Auth** | JWT (Bearer token) |
| **Validation** | Zod (request + environment) |
| **File Storage** | Cloudinary (document uploads) |
| **Scheduling** | node-cron (nightly cleanup jobs) |
| **Security** | Helmet, CORS, bcrypt (12 rounds), rate limiting |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  Login ─── Dashboard ─── Records ─── Users (admin only)     │
│  AuthContext → Axios interceptor (JWT in localStorage)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                     SERVER (Express)                         │
│                                                              │
│  Middleware Pipeline:                                        │
│  helmet → cors → express.json → rateLimiter                  │
│  → authenticate → authorize → validate → controller          │
│                                                              │
│  Routes → Controllers → Services → Prisma → PostgreSQL      │
│                                                              │
│  Cross-cutting:                                              │
│  • AppError (custom error class with factory methods)        │
│  • asyncHandler (eliminates repetitive try-catch)            │
│  • Global error handler (structured JSON responses)          │
│  • Cron scheduler (nightly soft-delete purge at 3 AM)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
               ┌───────────▼───────────┐
               │  Aiven PostgreSQL DB   │
               │  + Cloudinary CDN     │
               └───────────────────────┘
```

### Layered Architecture (Backend)

Every API request passes through this pipeline:

```
Route  →  Middleware (auth + validation)  →  Controller  →  Service  →  Prisma
```

- **Routes** — HTTP method + path definitions, middleware chaining
- **Controllers** — Extract request data, call services, send responses
- **Services** — All business logic lives here (single responsibility)
- **Prisma** — Database queries only, no business logic

**Zero `try-catch` in controllers** — all async handlers are wrapped with `asyncHandler`, and errors are caught by the global `errorHandler`.

---

## Role-Based Access Control (RBAC)

Three roles with progressively increasing access:

| Capability | Viewer 👁 | Analyst 📊 | Admin 🔑 |
|---|:---:|:---:|:---:|
| View dashboard summary | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| View financial records | ✅ | ✅ | ✅ |
| Trend charts (income vs expense) | ❌ | ✅ | ✅ |
| Category breakdown chart | ❌ | ✅ | ✅ |
| Export records as CSV | ❌ | ✅ | ✅ |
| Create / Edit / Delete records | ❌ | ❌ | ✅ |
| Upload documents to records | ❌ | ❌ | ✅ |
| Manage users (roles, status) | ❌ | ❌ | ✅ |

**Frontend enforcement**: The UI conditionally renders buttons, charts, and navigation items based on the user's role.

**Backend enforcement**: The `authorize()` middleware rejects requests from unauthorized roles with `403 Forbidden`, regardless of frontend state.

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A [Aiven](https://Aiven.tech) PostgreSQL database
- A [Cloudinary](https://cloudinary.com) account

### 1. Clone & Install

```bash
git clone <repository-url>
cd zorvyn_assignment

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** — Create `server/.env`:

```env
# Database — Aiven PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT
JWT_SECRET="your-secret-key-min-8-chars"
JWT_EXPIRES_IN="30d"

# Server
PORT=5000
NODE_ENV="development"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

> All environment variables are validated at startup using Zod. The server will **fail fast** with clear error messages if any required variable is missing or malformed.

**Client** — Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Initialize Database

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Push schema to Aiven database
npx prisma db push

# Seed demo data (3 users + 20 financial records)
npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

### 5. Open the Application

Navigate to `http://localhost:5173` and use the demo credentials:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@finance.com` | `admin123` |
| Analyst | `analyst@finance.com` | `analyst123` |
| Viewer | `viewer@finance.com` | `viewer123` |

---

## API Reference

**Base URL**: `http://localhost:5000/api`

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Server health status |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register a new user |
| `POST` | `/auth/login` | None | Authenticate and receive JWT |

**Register** — Body: `{ email, password, name, role? }` (role defaults to `viewer`)

**Login** — Body: `{ email, password }` → Returns `{ token, user }`

### Financial Records

All endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/records` | All | List records (paginated, filterable) |
| `GET` | `/records/export` | Analyst, Admin | Download filtered records as CSV |
| `GET` | `/records/:id` | All | Get single record by ID |
| `POST` | `/records` | Admin | Create record (multipart, accepts `document` file) |
| `PATCH` | `/records/:id` | Admin | Update record (partial update) |
| `DELETE` | `/records/:id` | Admin | Soft-delete record |

**Query params for `GET /records`**:
- `page` (default: 1), `limit` (default: 10)
- `type` — `income` or `expense`
- `category` — text search (case-insensitive)
- `dateFrom`, `dateTo` — date range filter (ISO format)

### Dashboard

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | All | Total income, expenses, net balance, record count |
| `GET` | `/dashboard/recent-activity` | All | Latest financial activity feed |
| `GET` | `/dashboard/trends` | Analyst, Admin | Income vs expense trends (monthly/weekly) |
| `GET` | `/dashboard/category-breakdown` | Analyst, Admin | Grouped totals by category |

**Query params**:
- `dateFrom`, `dateTo` — filter by date range
- `period` — `monthly` (default) or `weekly` (trends only)
- `limit` — number of items (recent activity, default: 8)

### User Management

All endpoints require Admin role.

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List users (paginated, searchable) |
| `GET` | `/users/:id` | Admin | Get single user |
| `PATCH` | `/users/:id` | Admin | Update user role or status |
| `PATCH` | `/users/:id/deactivate` | Admin | Deactivate a user account |

---

## Project Structure

```
zorvyn_assignment/
├── server/                            # Backend API
│   ├── prisma/
│   │   └── schema.prisma             # Database models (User, FinancialRecord)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                # Zod-validated environment variables
│   │   │   ├── db.ts                 # Prisma client singleton + connect/disconnect
│   │   │   └── cloudinary.ts         # Cloudinary SDK configuration
│   │   ├── middleware/
│   │   │   ├── authenticate.ts       # JWT verification + user attachment
│   │   │   ├── authorize.ts          # Role-based access guard
│   │   │   ├── validate.ts           # Zod schema validation (body/query/params)
│   │   │   ├── errorHandler.ts       # Global error response handler
│   │   │   ├── rateLimiter.ts        # express-rate-limit configuration
│   │   │   └── upload.ts             # Multer file upload middleware
│   │   ├── modules/
│   │   │   ├── auth/                 # Register, login, JWT generation
│   │   │   ├── records/              # CRUD, soft-delete, CSV export
│   │   │   ├── dashboard/            # Summary, trends, category breakdown
│   │   │   └── users/                # User management (admin only)
│   │   ├── shared/
│   │   │   ├── appError.ts           # Custom error class with factory methods
│   │   │   ├── asyncHandler.ts       # Async wrapper (eliminates try-catch)
│   │   │   ├── responseHelper.ts     # Standardized JSON response format
│   │   │   └── constants.ts          # Role/status enums
│   │   ├── cron/
│   │   │   ├── index.ts              # Cron job initializer
│   │   │   └── purgeDeletedRecords.ts # Nightly cleanup of soft-deleted records
│   │   ├── db/
│   │   │   └── seed.ts               # Database seeder (3 users + 20 records)
│   │   ├── app.ts                    # Express app setup + middleware pipeline
│   │   └── server.ts                 # Entry point (DB connect → listen → cron init)
│   └── package.json
│
├── client/                            # Frontend UI
│   ├── src/
│   │   ├── api/                      # Axios instance + API functions by module
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Sidebar + mobile hamburger + user info
│   │   │   └── ProtectedRoute.tsx    # Route guard with role check
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # JWT storage, role helpers, login/logout
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # Shortcut to AuthContext
│   │   │   └── useDebounce.ts        # 400ms debounce for search inputs
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx         # Login + registration + demo credentials
│   │   │   ├── DashboardPage.tsx     # Summary cards, charts, recent activity
│   │   │   ├── RecordsPage.tsx       # CRUD table/cards, filters, CSV export
│   │   │   └── UsersPage.tsx         # User management table/cards (admin)
│   │   ├── types/                    # Shared TypeScript interfaces
│   │   ├── App.tsx                   # React Router setup
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Global styles, glassmorphism, utilities
│   └── package.json
│
└── README.md
```

---

## Design Principles Applied

| Principle | Implementation |
|---|---|
| **Single Responsibility (SRP)** | Each function/module does one thing: controllers don't contain business logic, services don't send HTTP responses |
| **Open-Closed (OCP)** | `authorize()` and `validate()` accept parameters — add new roles or schemas without modifying middleware code |
| **Dependency Inversion** | Services depend on abstractions (Prisma interface), not concrete DB drivers |
| **DRY** | `asyncHandler` eliminates duplicated try-catch, `AppError` factory methods centralize error creation |
| **Fail Fast** | Environment variables validated at startup with Zod; invalid input rejected at the middleware layer |
| **Layered Architecture** | Routes → Controllers → Services → Prisma — clear boundaries, no layer skipping |
| **Soft Delete** | Financial records are never permanently deleted during normal operation; a nightly cron purges them |

---

## Key Features

### Backend

- **Zod-validated environment** — Server won't start if env vars are missing or invalid
- **Parameterized queries** — Prisma ORM prevents SQL injection; the one raw query uses `Prisma.sql` tagged templates
- **Soft delete** — `DELETE /records/:id` sets `isDeleted = true`; a cron job at 3 AM permanently purges deleted records
- **Cloudinary document storage** — Upload PDFs, images, Excel files attached to financial records
- **CSV export** — Analysts and admins can download filtered records as CSV
- **Debounced search** — Frontend waits 400ms after typing stops before firing API calls
- **Structured error responses** — All errors follow `{ success, message, errors? }` format

### Frontend

- **Responsive design** — Mobile-first with card layouts on small screens, tables on desktop
- **Glassmorphism UI** — Dark theme with blurred glass panels, gradient cards, smooth animations
- **Conditional rendering** — UI adapts to user role (locked analytics for viewers, hidden admin controls)
- **Mobile sidebar** — Hamburger menu with slide-in navigation and backdrop overlay
- **Demo credentials** — One-click login for all three roles on the login page

---

## Assumptions

1. **Single-tenant** — All users share one database; no multi-organization support.
2. **JWT in localStorage** — Acceptable for this assignment; production would use HTTP-only cookies.
3. **Registration is open** — Any user can register and pick their role. In production, admin-only registration or invitation-based signup would be appropriate.
4. **Server-time cron** — The 3 AM purge job runs based on server timezone, not user timezone.
5. **Cloudinary for all files** — Documents (PDFs, images, spreadsheets) are uploaded to Cloudinary. For large-scale production, a dedicated object store (S3) would be more cost-effective.
6. **Password requirements** — Minimum 6 characters enforced by Zod. Production would add complexity rules (uppercase, special characters).
7. **No email verification** — Registration doesn't require email confirmation.
8. **Soft-delete grace period** — Soft-deleted records survive until the next 3 AM cron run, providing same-day recovery potential.

---

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| **Prisma ORM** over raw SQL | Gains type safety and migration tooling, but loses fine-grained query control (e.g., `date_trunc` required a raw query for trends) |
| **JWT over sessions** | Stateless and scalable, but requires client-side storage and lacks server-side revocation (logout is client-only) |
| **Soft delete** over hard delete | Enables recovery and audit trails, but increases query complexity (every query must filter `isDeleted`) and storage usage |
| **localStorage** for JWT | Simpler implementation, but vulnerable to XSS. HTTP-only cookies would be more secure |
| **Aiven (serverless PG)** | Zero infrastructure management and auto-scaling, but adds cold-start latency and less control than a self-managed PostgreSQL |
| **Cloudinary** for documents | Managed CDN with transforms and auto-optimization, but adds vendor lock-in and cost per-transform vs. self-hosted S3 |
| **Rate limiting disabled** (dev) | Removes friction during development, but must be re-enabled before production (`app.ts` and `auth.routes.ts`) |
| **Monorepo (two folders)** | Simple to clone and understand, but no shared types between client/server (types are duplicated) |
| **Role selection at registration** | Convenient for demo/testing, but insecure for production — should be admin-controlled |
| **Debounce (400ms)** on search | Reduces API calls significantly, but adds a slight perceived delay before results update |
| **Card layout on mobile** vs. tables | Much better UX on small screens, but doubles the rendering logic (desktop table + mobile cards) |

---

## Available Scripts

### Server (`cd server`)

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm run seed` | Seed database with demo data |
| `npx prisma studio` | Open Prisma Studio (visual DB editor) |

### Client (`cd client`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## Security Checklist

- [x] Password hashing with bcrypt (12 salt rounds)
- [x] JWT authentication on all protected routes
- [x] Role-based authorization (per-route middleware)
- [x] Zod input validation (body, query, params)
- [x] SQL injection protection (Prisma parameterized queries)
- [x] Helmet security headers
- [x] CORS configured with allowed origin
- [x] Rate limiting (configured, disabled for dev)
- [x] Environment variable validation at startup
- [ ] HTTP-only cookies for JWT (recommended for production)
- [ ] CSRF protection (needed if using cookies)
- [ ] Email verification on registration

---

## License

ISC
