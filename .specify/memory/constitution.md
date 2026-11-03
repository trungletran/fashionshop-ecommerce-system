# FashionShop E-commerce System Constitution

## Core Principles

### I. Contract-First Domain Integrity
Changes affecting user-facing behavior, public API contracts, data models, security boundaries,
or significant architecture MUST have an approved specification before implementation. Small bug
fixes, internal refactoring, documentation updates, and maintenance that do not change external
behavior MAY use a lightweight workflow with scope and acceptance criteria proportionate to risk.
Existing `AGENTS.md` approval requirements MUST still be respected. Backend controllers MUST
remain thin; business rules MUST live in services; entities MUST be mapped to explicit DTOs.
Changes MUST preserve stock validation, order-item price snapshots, and valid transitions defined
by the order state model, including PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED,
and CANCELLED. This keeps the modular monolith understandable and protects domain integrity.

### II. Secure by Default
Authentication, authorization, input validation, and sensitive-data handling MUST be designed
into every protected flow. JWT authentication and CUSTOMER, STAFF, and ADMIN role boundaries
MUST be enforced on the backend. Frontend route protection and role-based UI visibility are
supplementary usability controls and MUST NOT replace backend authorization. Secrets MUST NOT be
committed to shared or deployment configuration; local legacy values MAY remain only as a
temporary development concern and MUST be externalized before deployment. API responses MUST
NOT expose credentials, tokens, or unnecessary personal data.

### III. Type-Safe, Layered Architecture
The backend MUST follow the controller -> service -> repository -> entity flow, with shared
mappers and response types used where the repository already defines them. The frontend MUST
use Next.js App Router, feature-sliced organization, and TypeScript strictness. Zustand MUST
manage appropriate client-side and UI state, such as local interaction state and other state
that belongs in the client. TanStack Query MUST manage server state and API data synchronization,
including fetching, caching, invalidation, and mutation synchronization where applicable.
Authentication and session management MUST follow the repository's existing secure authentication
architecture. This principle MUST NOT be interpreted as requiring JWTs, access tokens, refresh
tokens, or other sensitive credentials to be stored in Zustand or persistent browser storage.
API services MUST use the existing typed client and repository response conventions, including
`ApiResponse<T>` unless a documented protocol requires another shape. New or modified TypeScript
code MUST avoid `any` unless a documented legacy, external, or dynamic boundary requires it, or
no practical type-safe alternative exists. Existing usages MAY be reduced incrementally.

### IV. Verification Before Delivery
New or materially changed behavior MUST receive tests appropriate to its risk, including failure
paths and authorization boundaries where applicable. Backend changes MUST be verified with the
repository's JUnit 5 setup and H2 test profile where applicable. Frontend changes MUST pass the
repository's ESLint and Vitest checks, and feature work MUST satisfy the frontend implementation
checklist. Request validation MUST use the existing Jakarta Bean Validation conventions where
applicable. API failures MUST use the existing centralized exception-to-response conventions
without introducing a new response format or breaking existing contracts. A change is complete
when its relevant tests, types, loading states, error states, and documentation have been
reviewed.

### V. Usable and Observable Product Behavior
Customer, staff, and admin workflows MUST provide explicit loading, success, and error states;
protected actions MUST give clear authentication feedback; interactive controls MUST be
accessible and responsive on supported screen sizes. Cross-feature behavior SHOULD use the
project's integration hooks when they reduce duplicated state, authentication, error, or cache
invalidation logic. Operational failures MUST use the repository's centralized exception and
API error conventions. Any logs added to a change MUST follow existing repository/framework
conventions and MUST NOT expose secrets or unnecessary personal data.

## Technology and Security Constraints

The supported baseline is Spring Boot 3.3.4 with Java 21, Next.js 16 with React 19 and
Tailwind CSS v4, and MySQL 8. The repository is a monorepo with backend, frontend, and database
assets kept in their designated directories. Every database schema change MUST include a
reviewed migration script or equivalent reviewed SQL change. Changes MUST preserve existing data
integrity and backward compatibility where applicable. No new migration tool MAY be introduced
without approval. Existing Hibernate `ddl-auto=update` behavior is legacy development
infrastructure and MUST NOT be treated as the production schema migration process. Local
integration uses backend port 8080, frontend port 3000, and the `ecommerce_db` schema.

## Development Workflow and Quality Gates

Feature work MUST proceed through specification, implementation, quality review, and operational
verification when its scope requires the full workflow. The Product Manager MUST present the
technical specification and MUST wait for explicit user approval before implementation begins.
The Engineer MUST follow the approved architecture and specification. QA MUST review tests,
authorization, validation, sensitive-data handling, and relevant frontend checklist items.
DevOps MUST verify relevant build and local integration requirements. Small maintenance changes
that do not change external behavior MAY use a lightweight workflow, but MUST still meet the
applicable testing and review requirements.

Before merge, contributors MUST run relevant backend tests, frontend lint and tests, and build
checks; a skipped check MUST have its reason and residual risk documented. Pull requests MUST
remain focused. Conventional Commit-style messages are preferred, consistent with repository
contributing guidance.

## Governance

This constitution and `AGENTS.md` are complementary project standards. Explicit Product Manager
approval requirements, security instructions, and user or system instructions remain binding.
Amendments MUST describe the reason, affected principles, adoption or migration impact, and
required documentation updates. The project owner or designated reviewer MUST review amendments
for compatibility with existing features and record the change in the Sync Impact Report before
committing it. The temporary Sync Impact Report MUST be removed before the amended constitution
is committed.

Exceptions MUST be recorded in the relevant specification or pull request, identify the reason
and owner, and include a review or expiry date when temporary. Every implementation review MUST
check compliance with the current constitution and document accepted exceptions.

The constitution follows semantic versioning. A MAJOR version is required for removing or
redefining a principle; a MINOR version is required for adding a principle or materially
expanding governance; a PATCH version is required for clarifications and non-semantic wording
changes.

**Version**: 1.1.1 | **Ratified**: 2026-11-03 | **Last Amended**: 2026-11-03
