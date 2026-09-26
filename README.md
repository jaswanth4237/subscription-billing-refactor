# Refactored Subscription Engine (Hexagonal Architecture / Ports & Adapters)

This repository contains the refactored, highly modular, and fully unit-testable Subscription Billing Engine. The original legacy God-class (`LegacySubscriptionManager`) mixed direct SQL queries, third-party payment HTTP calls, non-deterministic system clock calls (`new Date()`), and complex business logic inside a single monolithic class.

We refactored the engine using **SOLID principles**, **Ports and Adapters (Hexagonal Architecture)**, and **Dependency Injection (DI)** with **Express.js**.

---

## 🏗️ Architecture Overview

```
+-------------------------------------------------------------------+
|                        Infrastructure Layer                      |
|                                                                   |
|   +-------------------+  +------------------+  +---------------+  |
|   | PostgresSubRepo   |  | MockPaymentGtwy  |  | SystemTime    |  |
|   | (PostgreSQL Adapter)|  | (Payment Adapter)|  | (Clock Adap.) |  |
|   +---------+---------+  +--------+---------+  +-------+-------+  |
+-------------|---------------------|--------------------|----------+
              | Implements          | Implements         | Implements
              v                     v                    v
+-------------------------------------------------------------------+
|                        Domain Layer (Pure Logic)                  |
|                                                                   |
|   +-------------------+  +------------------+  +---------------+  |
|   | ISubscriptionRepo |  | IPaymentGateway  |  | ITimeProvider |  |
|   | (Port / Interface)|  | (Port / Interface)| |(Port/Interface)| |
|   +---------+---------+  +--------+---------+  +-------+-------+  |
|             ^                     ^                    ^          |
|             | Uses Abstractions   | Uses Abstractions  | Uses     |
|             +---------------------+--------------------+          |
|                                   |                               |
|                     +-------------+-------------+                 |
|                     | SubscriptionBillingService|                 |
|                     |     (Core Domain Logic)   |                 |
|                     +---------------------------+                 |
+-------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
├── docs/
│   └── ADR-001-Refactoring-God-Class.md  # Architectural Decision Record
├── legacy/
│   └── LegacySubscriptionManager.js      # Original legacy God-class (for reference)
├── src/
│   ├── domain/
│   │   ├── models/                       # Plain domain models (User, Subscription)
│   │   │   ├── User.js
│   │   │   └── Subscription.js
│   │   ├── ports/                        # Pure Interfaces / Ports
│   │   │   ├── ITimeProvider.js
│   │   │   ├── IPaymentGateway.js
│   │   │   ├── ISubscriptionRepository.js
│   │   │   └── IUserRepository.js
│   │   └── services/                     # Core business logic (DI)
│   │       └── SubscriptionBillingService.js
│   ├── infrastructure/
│   │   ├── adapters/                     # Concrete technology adapters
│   │   │   ├── SystemTimeProvider.js
│   │   │   ├── MockPaymentGateway.js
│   │   │   ├── PostgresSubscriptionRepository.js
│   │   │   └── PostgresUserRepository.js
│   │   └── database/                     # DB client pool & seed scripts
│   │       ├── db.js
│   │       ├── init.sql
│   │       └── seed.js
│   └── api/
│       ├── controllers/                  # Controller composition root
│       │   └── subscriptionController.js
│       └── server.js                     # Express API entrypoint
├── tests/
│   ├── unit/                             # Fast unit tests using test doubles
│   │   └── SubscriptionBillingService.test.js
│   └── integration/                      # API integration tests
│       └── api.test.js
├── .env.example                          # Documented environment variables
├── .env                                  # Active environment config
├── docker-compose.yml                    # Docker orchestration
├── Dockerfile                            # API Container Dockerfile
├── package.json                          # Dependencies & scripts
└── submission.json                       # Seeded test data mappings
```

---

## 🚀 Getting Started & Execution

### 1. Run Unit & Integration Tests
```bash
npm test
```
To check unit test code coverage:
```bash
npm run test:coverage
```

### 2. Run via Docker Compose
```bash
docker-compose up --build -d
```

### 3. API Endpoint Specification

**Endpoint**: `POST /api/renew`

#### Request:
```json
{
  "userId": "user-expired-123"
}
```

#### Response (200 OK - Success):
```json
{
  "success": true,
  "message": "Renewal successful"
}
```

#### Response (400 Bad Request - Business Rule Failure):
```json
{
  "success": false,
  "message": "Subscription is not yet expired"
}
```

---

## 🎯 Verification Checklist

- [x] **Domain Ports**: Abstract interfaces defined in `src/domain/ports/` with zero infrastructure dependencies.
- [x] **SubscriptionBillingService**: Uses Dependency Injection, zero direct clock (`new Date()`) or database calls.
- [x] **Business Rules Implemented**:
  1. Fail if user or subscription not found.
  2. Fail if subscription is active/not expired.
  3. Apply 10% discount in December (`month === 11`).
  4. Extend expiration by exactly 1 year from current time upon successful payment.
- [x] **Infrastructure Adapters**: Concrete implementations in `src/infrastructure/adapters/`.
- [x] **Isolated Unit Tests**: 100% test coverage on `SubscriptionBillingService.js`.
- [x] **Architecture Decision Record**: Detailed ADR in `docs/ADR-001-Refactoring-God-Class.md` matching required sections (`# Context`, `# Decision`, `# Consequences`, `# Code Smells Addressed`).
- [x] **Docker Compose Setup**: Automated startup, Postgres healthcheck, volume mounts, and automated schema/seed execution.
- [x] **Submission & Environment Mapping**: `submission.json` and `.env.example` provided.
