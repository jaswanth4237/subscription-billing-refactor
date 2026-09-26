# Grant Management Portal

A secure, multi-user web application for managing grant opportunities and funding applications. Built with Node.js, Express, PostgreSQL, Redis, and Docker Compose using Model-View-Controller (MVC) architecture, Role-Based Access Control (RBAC), and OAuth 2.0 authentication.

---

## Features & Core Architecture

1. **Role-Based Access Control (RBAC)**:
   - Three distinct roles: `ADMIN`, `GRANTOR`, `GRANTEE`.
   - Reusable JWT authentication and RBAC middleware enforcing endpoint access controls.
   - Admin-only role assignment capabilities (`POST /api/users/:userId/roles`).

2. **Authentication & OAuth 2.0 Integration**:
   - Email/password user registration and authentication (`POST /api/auth/register`, `POST /api/auth/login`).
   - OAuth 2.0 authorization code flow integration (`GET /api/auth/google`, `GET /api/auth/google/callback`).
   - Standard JWT payload scheme containing `userId` and `roles` array.

3. **Grant & Application Management**:
   - **GRANTOR**: Create, update, and delete grant opportunities owned by the user. View proposals submitted for their grants.
   - **GRANTEE**: Browse published grants, submit funding proposals (`POST /api/grants/:id/apply`).
   - **ADMIN**: Manage user roles and administrative grant operations.

4. **Containerized Infrastructure & Database Seeding**:
   - Fully containerized using Docker Compose orchestrating `app` (Express API), `db` (PostgreSQL 15), and `cache` (Redis 7).
   - Automated health checks and database seeding (`roles` and default `ADMIN` user) on container startup.

---

## Quick Start & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+) (optional, for running unit tests locally)

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Start Application with Docker Compose
Run the following command in the repository root:
```bash
docker-compose up --build
```
This will build the application image, launch PostgreSQL and Redis containers, run database seeding, and start the API server on `http://localhost:3000`.

---

## Database Seeding & Default Credentials

Upon startup, the system seeds the following default roles and administrative user:

| Entity | Details |
|---|---|
| **Roles** | `ADMIN` (id: 1), `GRANTOR` (id: 2), `GRANTEE` (id: 3) |
| **Admin User Email** | `admin@portal.com` |
| **Admin User Password** | `AdminPassword123!` |

---

## API Documentation & Endpoints

### 🔑 Authentication Routes (`/api/auth`)
- **`POST /api/auth/register`**: Register a new user (Default role: `GRANTEE`).
  - *Body*: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
- **`POST /api/auth/login`**: Authenticate user and receive JWT.
  - *Body*: `{ "email": "john@example.com", "password": "password123" }`
- **`GET /api/auth/:provider`**: Redirects to OAuth 2.0 authorization flow.
- **`GET /api/auth/:provider/callback?code=...`**: Exchanges authorization code for JWT.

### 👤 User Management Routes (`/api/users`)
- **`POST /api/users/:userId/roles`**: Assign role to a user.
  - *Headers*: `Authorization: Bearer <ADMIN_JWT>`
  - *Body*: `{ "roleName": "GRANTOR" }`

### 💰 Grant Routes (`/api/grants`)
- **`POST /api/grants`**: Create a grant (Requires `GRANTOR` role).
  - *Headers*: `Authorization: Bearer <GRANTOR_JWT>`
  - *Body*: `{ "title": "Tech Innovation Grant", "description": "Funding for tech startups", "amount": 50000 }`
- **`GET /api/grants`**: Get all grants (Requires `GRANTEE`, `GRANTOR`, or `ADMIN`).
- **`GET /api/grants/:grantId`**: Get grant details.
- **`PUT /api/grants/:grantId`**: Update grant details (Requires `GRANTOR` owner).
- **`DELETE /api/grants/:grantId`**: Delete grant (Requires `GRANTOR` owner or `ADMIN`).
- **`POST /api/grants/:grantId/apply`**: Submit a grant application (Requires `GRANTEE` role).
  - *Body*: `{ "proposal": "Our project focuses on AI accessibility..." }`
- **`GET /api/grants/:grantId/applications`**: View submitted applications (Requires `GRANTOR` owner).

### 📄 Application Routes (`/api/applications`)
- **`GET /api/applications/:appId`**: View application details (Requires applicant `GRANTEE`, parent grant `GRANTOR` owner, or `ADMIN`).

---

## Testing & Code Coverage

Run the test suite and verify test coverage (minimum 70% requirement):
```bash
npm run test:coverage
```
Coverage reports will be generated in the `/coverage` directory.
