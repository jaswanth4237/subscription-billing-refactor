# Subscription Billing Refactor

Node.js and Express implementation of a subscription renewal service refactored from a tightly coupled legacy God class into a Ports and Adapters architecture.

## What This Demonstrates

- Domain logic isolated from PostgreSQL, payment providers, and the system clock.
- Constructor-based dependency injection.
- Explicit ports for repositories, payment, and time.
- Deterministic unit tests using stubs and spies.
- A real HTTP composition root with PostgreSQL adapters.
- Docker Compose startup with database schema creation and seed data.

## Architecture

```text
src/
	domain/
		models/       Plain User and Subscription models
		ports/        ISubscriptionRepository, IUserRepository,
									IPaymentGateway, and ITimeProvider contracts
		services/     SubscriptionBillingService business rules
	infrastructure/
		adapters/     PostgreSQL, mock payment, and system-time adapters
		database/     PostgreSQL pool
	api/             Express app and dependency composition root
tests/
	unit/            Isolated domain tests
	integration/     HTTP boundary tests with injected test doubles
```

The domain layer does not import Express, PostgreSQL, HTTP clients, or environment configuration. Infrastructure depends on the domain contracts, and `src/api/server.js` wires the concrete adapters together.

## Business Rules

`SubscriptionBillingService`:

1. Rejects an unknown user.
2. Rejects a missing subscription.
3. Rejects a subscription that has not expired.
4. Applies a 10% discount when the injected current date is in December.
5. Charges the payment gateway and reports payment failures safely.
6. Extends the subscription by exactly one year from the injected current time after successful payment.

## Run Tests

```bash
npm install
npm test
npm run test:coverage
```

The tests do not require PostgreSQL, Docker, network access, or payment credentials. The domain service has 100% statement, branch, function, and line coverage in the current test suite.

## Run With Docker Compose

Docker Desktop must be running first.

```bash
docker compose up --build
```

Compose starts:

- `api`: Express server on `http://localhost:3000`
- `db`: PostgreSQL with a healthcheck and automatic schema/seed initialization

Stop the services with:

```bash
docker compose down
```

Use `docker compose down -v` when you need to discard the database volume and rerun the seed script from scratch.

## API

### Renew a subscription

```http
POST /api/renew
Content-Type: application/json
```

Request:

```json
{ "userId": "user-expired-123" }
```

Successful response, HTTP 200:

```json
{ "success": true, "message": "Renewal successful" }
```

Business-rule failure, HTTP 400:

```json
{ "success": false, "message": "Subscription is not yet expired" }
```

The health endpoint is `GET /health`.

## Seed Data

The database is initialized by [init-db.sql](init-db.sql). The evaluator IDs are recorded in [submission.json](submission.json):

- `user-expired-123`: successful renewal path
- `user-active-123`: unexpired subscription failure path
- `user-does-not-exist`: missing user path

## Configuration

Copy `.env.example` to `.env` for local configuration. Docker Compose supplies the database host as `db`; local non-Docker development should use a PostgreSQL instance reachable at the configured `DATABASE_URL`.

## Documentation

The architectural rationale and trade-offs are documented in [docs/ADR-001-Refactoring-God-Class.md](docs/ADR-001-Refactoring-God-Class.md).
