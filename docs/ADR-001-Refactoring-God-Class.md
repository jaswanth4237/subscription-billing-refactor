# Context

The legacy `SubscriptionManager` mixed database queries, payment calls, system time, and billing rules in one class. That made the business behavior difficult to test without a live database, credentials, and a controllable clock.

# Decision

Use Ports and Adapters (Hexagonal Architecture) with constructor Dependency Injection. The domain service depends on `ISubscriptionRepository`, `IUserRepository`, `IPaymentGateway`, and `ITimeProvider`. PostgreSQL, the system clock, and the payment implementation live in infrastructure adapters.

# Consequences

The project has more files and explicit contracts, but the core renewal rules are deterministic and unit-testable. Infrastructure can change independently, and isolated tests run without a database or network. Adapter integration tests remain appropriate for SQL and deployment wiring.

# Code Smells Addressed

- Hidden infrastructure dependencies are replaced by injected ports.
- Temporal coupling from `new Date()` is replaced by `ITimeProvider`.
- I/O interleaving is moved into repository and payment adapters.
- The God class is split by responsibility into domain service, ports, adapters, and API composition.
