---
description: Execute the autonomous 4-phase e-commerce development cycle (PM -> Engineer -> QA -> DevOps)
---

# Autonomous E-Commerce Development Pipeline

When the user triggers:

`/startcycle <feature_idea>`

Execute the following 4-phase workflow strictly adhering to [AGENTS.md](file:///c:/Users/ASUS/OneDrive/code/pet%20prj/fashionshop-ecommerce-system/AGENTS.md) and the dedicated skills in [.agents/skills/](file:///c:/Users/ASUS/OneDrive/code/pet%20prj/fashionshop-ecommerce-system/.agents/skills/).

---

## Phase 1 – Product Manager (@pm)

Execute `write_specs.md`.

### Core Responsibilities
Analyze and document:
* Business objectives & user value
* User personas & user stories (Customer, Staff, Admin)
* Functional & Non-functional requirements
* Detailed REST API Contracts (Endpoint, HTTP Method, Request Body, Response Envelope, Status Codes)
* UI/UX layout & component requirements
* Acceptance criteria & edge cases

### FashionShop E-Commerce Domain Alignment
Ensure requirements conform to existing monorepo domains:
* **Customer Storefront**: Browsing, searching, cart, wishlist, checkout summary, order placement, invoice viewing.
* **Staff/Admin Portal**: Product & category catalog management, order status transitions, account management, dashboards.
* **Transaction Invariants**:
  - Validating stock availability before order creation.
  - Freezing unit price snapshots inside order items.
  - Consistent state transitions (`PENDING` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED` / `CANCELLED`).

### Output & Approval Gate
1. Save the specification to `docs/specs/SPEC-<feature-name>.md`.
2. Present the specification to the user.
3. **Wait for explicit user approval**. If the user provides feedback or inline comments, revise the spec and ask again.
4. Do NOT proceed to Phase 2 until the user replies:
   `Approved` (or confirms to proceed).

---

## Phase 2 – Full-Stack Engineer (@engineer)

Upon receiving approval, execute `generate_code.md`.

### Core Responsibilities
* Implement production-ready code directly into `fashionshop-backend/` and `fashionshop-frontend/`.
* Follow established project standards:
  - **Backend**: Spring Boot 3.3.4 (Java 21), Spring Data JPA, thin controllers, business logic in services, DTO mapping.
  - **Frontend**: Next.js 16 App Router, TypeScript, Tailwind CSS v4, Zustand client store, TanStack Query server state.
  - **Database**: Add or update Flyway/SQL migration scripts in `database/` if schema changes are necessary.
* Ensure type safety, input validation, and proper error handling with unified API response envelopes.

---

## Phase 3 – QA Engineer (@qa)

Execute `audit_code.md`.

### Core Responsibilities
* Audit code changes against the approved specification.
* Run automated test suites:
  - Backend: `mvnw.cmd test` (ensure JUnit 5 tests pass with H2 in-memory db).
  - Frontend: `npm run lint` and `npm test` (Vitest).
* Verify security & access control:
  - Validate JWT authentication and role authorization (`CUSTOMER`, `STAFF`, `ADMIN`).
  - Check route grouping protections: `(public)`, `(customer)`, `(staff)`, `(admin)`.
* Detect edge cases: race conditions on stock, negative cart quantities, unhandled API error states.
* Provide an audit summary report with any fixes made.

---

## Phase 4 – DevOps Master (@devops)

Execute `deploy_app.md`.

### Core Responsibilities
* Verify local environment readiness:
  - MySQL database (`ecommerce_db`) accessible on port 3306.
  - Backend running on `http://localhost:8080`.
  - Frontend running on `http://localhost:3000` with valid `NEXT_PUBLIC_API_BASE_URL`.
* Test build integrity:
  - Backend: `mvnw.cmd clean package -DskipTests` (or verify packaging).
  - Frontend: `npm run build`.
* Provide exact local startup commands or verify `start.bat`.
* Present final verified URLs and demo login credentials to the user.

---

## Completion Summary

Deliver to the user:
1. Link to the approved specification (`docs/specs/SPEC-<feature-name>.md`).
2. Summary of code changes in `fashionshop-backend` and `fashionshop-frontend`.
3. QA test and lint audit results.
4. Operational guide & local verification URLs.