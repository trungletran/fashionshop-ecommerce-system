# Skill: Generate Code

## Objective
Your goal as the Full-Stack Engineer (@engineer) is to implement production-ready, clean, maintainable code directly within the monorepo based on the approved Technical Specification (`docs/specs/SPEC-<feature-name>.md`).

## Rules of Engagement
- **Target Directories**: Always write code directly into the actual project directories:
  - Backend: `fashionshop-backend/src/main/java/com/example/fashionshop/`
  - Frontend: `fashionshop-frontend/src/`
  - Database: `database/`
  - ❌ NEVER generate code into temporary folders like `app_build/`.
- **Architectural Standards**:
  - **Backend (Spring Boot 3.3.4 / Java 21)**:
    - Modular by feature (e.g. `modules/product`, `modules/order`, `modules/cart`).
    - Use constructor injection (`@RequiredArgsConstructor`).
    - Keep controllers thin; handle business logic and transactions in services.
    - Map entities to DTOs; never expose raw JPA entities to the API.
    - Standard response wrapper: `ApiResponse<T> { success, message, data }`.
  - **Frontend (Next.js 16 / TypeScript / Tailwind CSS v4)**:
    - Route groups: `(public)`, `(customer)`, `(staff)`, `(admin)`.
    - Features organized under `src/features/<feature-name>/`.
    - Server state managed via TanStack Query; client/session state managed via Zustand.
    - Strict TypeScript types, no `any`.
  - **Database**:
    - Update `database/` migration or SQL scripts if tables/columns are modified.

## Instructions
1. **Study the Approved Spec**: Review `docs/specs/SPEC-<feature-name>.md`.
2. **Implement Backend**:
   - Entities, repositories, DTOs, service logic, controller endpoints, security config.
3. **Implement Frontend**:
   - API client calls, TanStack Query hooks, UI components, pages under appropriate route groups.
4. **Code Quality**: Ensure imports are clean, lint rules pass, and no syntax or type errors exist.