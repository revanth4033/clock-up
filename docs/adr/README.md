# Architecture Decision Records

This folder records the significant engineering decisions made while building
ClockUp. Each ADR captures the context at the time, the decision, the
alternatives weighed, and the consequences — so future maintainers understand
_why_ the system is shaped the way it is, not just _what_ it does.

Format: Status · Context · Decision · Alternatives Considered · Consequences ·
Future Considerations. ADRs are immutable once accepted; a reversal is recorded
as a new ADR that supersedes the old one.

| ADR | Title | Status |
| --- | ----- | ------ |
| [ADR-001](./ADR-001-layered-architecture.md) | Layered Architecture (UI → Service → Repository → DB) | Accepted |
| [ADR-002](./ADR-002-attendance-engine-in-postgresql.md) | Attendance Engine in PostgreSQL | Accepted |
| [ADR-003](./ADR-003-server-authoritative-points.md) | Server-Authoritative Points System | Accepted (points formula superseded by ADR-009) |
| [ADR-004](./ADR-004-repository-pattern.md) | Repository Pattern | Accepted |
| [ADR-005](./ADR-005-security-definer-strategy.md) | SECURITY DEFINER Strategy (no service-role key) | Accepted |
| [ADR-006](./ADR-006-theme-persistence.md) | Theme Persistence | Accepted |
| [ADR-007](./ADR-007-authentication-architecture.md) | Authentication Architecture | Accepted |
| [ADR-008](./ADR-008-time-credits.md) | Time Credits System (staged migration) | Superseded by ADR-009 |
| [ADR-009](./ADR-009-credit-redemption-and-points.md) | Time Credit Redemption & the Flat-100 Points Model | Accepted — implemented (v1.1.0) |

The canonical product & design specification lives in the parent `/docs` folder
(PRD, FSD, BRD, UFD, DDD, ASD, TADG, DSD, DRPG).
