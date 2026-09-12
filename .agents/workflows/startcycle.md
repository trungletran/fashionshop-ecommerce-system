---
description: Do as the ty
---

# Autonomous E-Commerce Development Pipeline

When the user types:

`/startcycle <idea>`

execute the following workflow strictly using `.agents/agents.md` and all relevant skills under `.agents/skills/`.

## Phase 1 – Product Manager

Act as the Product Manager and execute `write_specs.md`.

### Responsibilities

Analyze and document:

* Business goals
* Target users
* User stories
* Functional requirements
* Non-functional requirements
* Acceptance criteria
* System constraints
* Assumptions

### E-Commerce Requirements

If the idea involves an e-commerce platform, always include:

#### Customer Features

* Registration and authentication
* Product browsing
* Product search and filtering
* Shopping cart
* Checkout
* Order tracking
* Wishlist (optional)

#### Merchant Features

* Product management
* Inventory management
* Order management
* Sales analytics

#### Admin Features

* User management
* Merchant management
* Product moderation
* Order monitoring

#### Payment & Order Flow

* Cart → Checkout → Payment → Order Creation
* Store order status transitions
* Preserve product price snapshots within orders
* Validate inventory before checkout

### Approval Loop

After generating the specification:

1. Present the specification to the user.
2. Wait for explicit approval.
3. If the user provides comments, modifications, or feedback:

   * Re-read the latest specification.
   * Update the specification accordingly.
   * Present the revised version.
4. Repeat until the user replies:

`Approved`

Do not continue to the next phase until approval is received.

---

## Phase 2 – Full-Stack Engineer

After approval:

Execute `generate_code.md`.

Responsibilities:

* Generate production-ready code.
* Follow project architecture and coding standards.
* Create backend, frontend, database schema, and APIs.
* Implement authentication, authorization, and business logic.

For e-commerce systems ensure:

* Product module
* Cart module
* Order module
* Payment integration abstraction
* Inventory management
* Role-based access control

---

## Phase 3 – QA Engineer

Execute `audit_code.md`.

Responsibilities:

* Review architecture
* Review code quality
* Detect bugs and security risks
* Validate acceptance criteria
* Produce an audit report

For e-commerce systems specifically verify:

* Checkout correctness
* Inventory consistency
* Order state transitions
* Authentication and authorization
* Payment workflow validation

---

## Phase 4 – DevOps Master

Execute `deploy_app.md`.

Responsibilities:

* Containerization
* Environment configuration
* CI/CD setup
* Deployment documentation
* Monitoring and logging configuration

Deliver:

* Deployment instructions
* Environment variable template
* Production readiness checklist

---

## Completion

Provide:

1. Final specification
2. Generated code summary
3. QA audit report
4. Deployment guide
5. Remaining risks and future improvements