# Grant Management Portal

[![Node.js Version](https://img.shields.io/badge/node-v18%2B-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-compose-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

A secure, multi-user web application for publishing grant opportunities and submitting funding applications. Built following the Model-View-Controller (MVC) pattern, Role-Based Access Control (RBAC), OAuth 2.0 third-party authentication, and containerized with Docker Compose.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Technologies Used](#technologies-used)
- [System Requirements & Prerequisites](#system-requirements--prerequisites)
- [Getting Started](#getting-started)
  - [1. Environment Setup](#1-environment-setup)
  - [2. Running via Docker Compose](#2-running-via-docker-compose)
  - [3. Running Locally (Development Mode)](#3-running-locally-development-mode)
- [Database Schema & Automatic Seeding](#database-schema--automatic-seeding)
- [Role-Based Access Control (RBAC) Matrix](#role-based-access-control-rbac-matrix)
- [API Documentation](#api-documentation)
  - [Authentication & OAuth 2.0 (`/api/auth`)](#authentication--oauth-20-apiauth)
  - [User Management (`/api/users`)](#user-management-apiusers)
  - [Grant Management (`/api/grants`)](#grant-management-apigrants)
  - [Applications (`/api/applications`)](#applications-apiapplications)
- [Testing & Code Coverage](#testing--code-coverage)
- [Agile Planning & User Stories](#agile-planning--user-stories)

---

## Overview & Architecture

The Grant Management Portal separates business logic, data presentation, and HTTP route execution using the **Model-View-Controller (MVC)** architectural pattern:

- **Model Layer (`src/models/`, `src/services/`)**: Encapsulates business logic, data validation, database queries (PostgreSQL), and Redis caching.
- **View Layer**: Data serialization into clean JSON responses adhering to REST standards.
- **Controller Layer (`src/controllers/`)**: Manages request handlers, delegates execution to service modules, and passes response payloads.
- **Middlewares (`src/middlewares/`)**: Centralized JWT authentication token verification, RBAC role authorization checks, and global error handling.

---

## Technologies Used

- **Runtime & Server**: Node.js, Express.js
- **Database**: PostgreSQL 15 (`pg` driver)
- **Caching**: Redis 7 (`redis` package)
- **Authentication & Security**: JSON Web Token (`jsonwebtoken`), Bcrypt (`bcryptjs`), OAuth 2.0 (`axios`)
- **Containerization**: Docker, Docker Compose
- **Testing**: Jest, Supertest

---

## System Requirements & Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v18+) and **npm** (optional, for local unit testing)

---

## Getting Started

### 1. Environment Setup

Copy the example environment configuration file to `.env`:

```bash
cp .env.example .env
```

Ensure `.env` contains necessary values:

```env
DATABASE_URL=postgresql://grant_user:grant_password@db:5432/grant_db
DB_HOST=db
DB_PORT=5432
DB_USER=grant_user
DB_PASSWORD=grant_password
DB_NAME=grant_db

REDIS_URL=redis://cache:6379
REDIS_HOST=cache
REDIS_PORT=6379

JWT_SECRET=super_secret_jwt_key_grant_management_2026
JWT_EXPIRES_IN=24h

OAUTH_CLIENT_ID=your_oauth_client_id_here
OAUTH_CLIENT_SECRET=your_oauth_client_secret_here
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

PORT=3000
NODE_ENV=development
```

---

### 2. Running via Docker Compose

Spin up the containerized application stack (App API + PostgreSQL + Redis):

```bash
docker-compose up --build
```

This will automatically:
1. Build the multi-stage Node.js Docker container.
2. Initialize PostgreSQL and Redis services.
3. Perform database schema migration and automatic data seeding (`roles` & default `ADMIN` user).
4. Monitor health check endpoints (`/health`).
5. Expose the API at `http://localhost:3000`.

---

### 3. Running Locally (Development Mode)

```bash
# 1. Install dependencies
npm install

# 2. Run test suite
npm test

# 3. Start development server
npm run dev
```

---

## Database Schema & Automatic Seeding

The system maintains 5 normalized PostgreSQL database tables with foreign key constraints:

1. **`users`**: User profiles (`id`, `name`, `email`, `password_hash`, `oauth_provider`, `oauth_id`, `created_at`, `updated_at`).
2. **`roles`**: Available roles (`id`, `name`: `ADMIN`, `GRANTOR`, `GRANTEE`).
3. **`user_roles`**: Join table mapping users to roles (`user_id`, `role_id`).
4. **`grants`**: Grant opportunities (`id`, `title`, `description`, `amount`, `grantor_id`, `created_at`, `updated_at`).
5. **`applications`**: Proposal submissions (`id`, `grant_id`, `grantee_id`, `proposal`, `status`, `created_at`, `updated_at`).

### Default Seed Data

On startup, `init-db.sql` automatically populates default roles and the initial administrator account:

| User Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@portal.com` | `AdminPassword123!` |

---

## Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Allowed Roles / Permissions |
|---|---|---|
| `/api/auth/register` | `POST` | Public |
| `/api/auth/login` | `POST` | Public |
| `/api/auth/:provider/callback` | `GET` | Public |
| `/api/users/:userId/roles` | `POST` | **ADMIN** only |
| `/api/grants` | `POST` | **GRANTOR** only |
| `/api/grants` | `GET` | **GRANTEE**, **GRANTOR**, **ADMIN** |
| `/api/grants/:grantId` | `GET` | **GRANTEE**, **GRANTOR**, **ADMIN** |
| `/api/grants/:grantId` | `PUT` | **GRANTOR** (Owner of grant only) |
| `/api/grants/:grantId` | `DELETE` | **GRANTOR** (Owner) or **ADMIN** |
| `/api/grants/:grantId/apply` | `POST` | **GRANTEE** only |
| `/api/grants/:grantId/applications` | `GET` | **GRANTOR** (Owner of grant only) |
| `/api/applications/:appId` | `GET` | Submitting **GRANTEE**, Grant Owner **GRANTOR**, or **ADMIN** |

---

## API Documentation

All protected endpoints require an `Authorization` header containing a valid Bearer JWT:

```http
Authorization: Bearer <accessToken>
```

---

### Authentication & OAuth 2.0 (`/api/auth`)

#### 1. User Registration
`POST /api/auth/register`

- **Request Body**:
  ```json
  {
    "name": "Jane Grantee",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "name": "Jane Grantee",
    "email": "jane@example.com"
  }
  ```

#### 2. User Login
`POST /api/auth/login`

- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 3. OAuth 2.0 Authorization & Callback
- Redirect to provider: `GET /api/auth/google`
- Callback handler: `GET /api/auth/google/callback?code=...`
  - Exchanges authorization code, creates user if non-existent with default `GRANTEE` role, and issues a JWT token.

---

### User Management (`/api/users`)

#### Assign Role to User (ADMIN Only)
`POST /api/users/:userId/roles`

- **Headers**: `Authorization: Bearer <ADMIN_JWT>`
- **Request Body**:
  ```json
  {
    "roleName": "GRANTOR"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Role 'GRANTOR' assigned successfully",
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "name": "Jane Grantee",
      "email": "jane@example.com",
      "roles": ["GRANTEE", "GRANTOR"]
    }
  }
  ```

---

### Grant Management (`/api/grants`)

#### 1. Create a Grant (GRANTOR Only)
`POST /api/grants`

- **Headers**: `Authorization: Bearer <GRANTOR_JWT>`
- **Request Body**:
  ```json
  {
    "title": "Clean Energy Startup Grant",
    "description": "Funding support for renewable energy initiatives",
    "amount": 75000
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "title": "Clean Energy Startup Grant",
    "description": "Funding support for renewable energy initiatives",
    "amount": 75000,
    "grantor_id": "b4c9e2c7-1c4c-5c2b-ac2b-2b3c4d5e6f7a",
    "created_at": "2026-09-26T23:50:00.000Z",
    "updated_at": "2026-09-26T23:50:00.000Z"
  }
  ```

#### 2. Get All Grants
`GET /api/grants`

- **Headers**: `Authorization: Bearer <JWT>`
- **Response (200 OK)**: Array of published grant objects.

#### 3. Update a Grant (Grant Owner GRANTOR Only)
`PUT /api/grants/:grantId`

- **Headers**: `Authorization: Bearer <GRANTOR_JWT>`
- **Request Body**:
  ```json
  {
    "title": "Updated Clean Energy Grant Title",
    "description": "Updated description text",
    "amount": 80000
  }
  ```

---

### Applications (`/api/applications`)

#### 1. Submit Grant Proposal (GRANTEE Only)
`POST /api/grants/:grantId/apply`

- **Headers**: `Authorization: Bearer <GRANTEE_JWT>`
- **Request Body**:
  ```json
  {
    "proposal": "Our project will deploy solar microgrids in underserved communities..."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "c5dae3d8-2d5d-6d3c-bd3c-3c4d5e6f7a8b",
    "grant_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "grantee_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "proposal": "Our project will deploy solar microgrids in underserved communities...",
    "status": "submitted",
    "created_at": "2026-09-26T23:51:00.000Z"
  }
  ```

#### 2. View Applications for Grant (Grant Owner GRANTOR Only)
`GET /api/grants/:grantId/applications`

- **Headers**: `Authorization: Bearer <GRANTOR_JWT>`
- **Response (200 OK)**: Array of application submissions for the specified grant.

---

## Testing & Code Coverage

Run the automated test suite and generate statements code coverage reports:

```bash
npm run test:coverage
```

### Test Suite Highlights:
- **`tests/auth.test.js`**: Registration, login credential check, OAuth callback token generation, JWT payload verification.
- **`tests/rbac.test.js`**: 401 Unauthorized missing token checks, 403 Forbidden role checks, Admin role assignment.
- **`tests/grants.test.js`**: Grant creation, listing, retrieval, owner-restricted updates & deletions.
- **`tests/applications.test.js`**: Proposal submission, grantor application listing, applicant/grantor access rules.

Coverage output is written to `/coverage`.

---

## Agile Planning & User Stories

See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the complete Agile roadmap detailing User Stories and Acceptance Criteria across 4 core epics:
1. User Authentication & OAuth 2.0 Integration
2. Role-Based Access Control (RBAC) & Administration
3. Grant Management
4. Application Submission & Evaluation
