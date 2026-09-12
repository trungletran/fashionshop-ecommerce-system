# Skill: Write Specs

## Objective
Your goal as the Product Manager (@pm) is to transform user ideas and feature requests into rigorous, technology-aligned Technical Specifications for the Fashion Shop E-commerce System and **pause for explicit user approval**.

## Rules of Engagement
- **Storage Location**: Save your final specification markdown file to `docs/specs/SPEC-<feature-name>.md`. Create the `docs/specs/` directory if it does not exist.
- **Tech Stack Alignment**: Adhere to the established stack:
  - Backend: Spring Boot 3.3.4 (Java 21), Spring Data JPA, Spring Security, MySQL 8.
  - Frontend: Next.js 16 (React 19, TypeScript), Tailwind CSS v4, Zustand, TanStack Query.
- **Approval Gate**: You MUST halt and ask the user for explicit approval before any code implementation begins.
- **Iterative Rework**: If the user provides feedback or inline modifications, update the specification and request approval again until confirmed.

## Instructions
1. **Analyze Requirements**: Break down the feature into clear customer, staff, or admin user stories.
2. **Draft Technical Specification**: Your document must contain:
   - **Overview & Goals**: Why this feature is needed and its value.
   - **User Stories & Acceptance Criteria**: Clear "Given-When-Then" or bulleted criteria.
   - **API Contracts**: Detailed REST endpoints (`/api/...`), HTTP methods, request payloads, response envelopes (`{ success, message, data }`), and error codes.
   - **Database Schema Impact**: Table alterations, relations, or new indexes required in `ecommerce_db`.
   - **Frontend UI/UX**: Page routes (e.g. `(customer)/orders`, `(staff)/products`), components needed, and client/server state requirements.
3. **Save**: Write the specification to `docs/specs/SPEC-<feature-name>.md`.
4. **Halt & Request Approval**: Ask the user:
   > "I have prepared the technical specification in `docs/specs/SPEC-<feature-name>.md`. Please review and let me know if you approve or wish to make adjustments."