## Project Overview

Fashion Shop E-commerce System - Full-stack application with Spring Boot backend and Next.js frontend.

## Tech Stack

### Backend

- Java 17
- Spring Boot
- MySQL
- Maven

### Frontend

- Next.js 14+
- React 18+
- TypeScript
- TailwindCSS
- Redux Toolkit (state management)

## Backend Structure & Conventions

### Folder Organization

- `controller/`: REST API endpoints
- `service/`: Business logic & domain services
- `repository/`: JPA interfaces for data access
- `entity/`: JPA entity models

### Code Style

- Use camelCase for variables and methods
- Use constructor injection via `@Autowired` or constructor
- Follow REST naming conventions (RESTful APIs)
- Keep controllers thin - no business logic
- Use DTOs for API request/response

### Commands (from fashionshop-backend/)

```bash
mvn clean install      # Build project
mvn spring-boot:run    # Start backend server
mvn test               # Run unit tests
```

### Testing

- Framework: JUnit 5
- Write unit tests for service layer
- Minimum coverage: 80%

## Frontend Structure & Conventions

### Folder Organization

- `app/`: Next.js App Router pages & layouts
  - `(public)/`: Public pages (homepage, products, login, register)
  - `(customer)/`: Customer dashboard (account, orders, cart, wishlist, invoices)
  - `(admin)/`: Admin panel
  - `(staff)/`: Staff section
  - `(storefront)/`: Auth-related routes
  - `api/`: API routes & handlers

- `components/`: Reusable React components
  - Organized by feature (auth, products, cart, layout, etc.)
  - Use TypeScript for type safety

- `features/`: State management (Zustand) & API integration
  - Each feature has: `store.ts` (Zustand), `services.ts` (API calls), `hooks.ts` (React Query)
  - Custom integration hooks: `use-*.ts` files for composed logic
  - `auth/`: Authentication state & API
  - `cart/`: Shopping cart (Zustand store + React Query)
  - `orders/`: Order management & checkout
  - `products/`: Product data & actions
  - `wishlist/`: Wishlist functionality
  - `users/`: User profile & settings
  - Others: dashboard, categories, payments, invoices

- `types/`: TypeScript interfaces & types
  - auth.ts, cart.ts, order.ts, product.ts, etc.

- `lib/`: Utilities & helpers
  - `api/`: API client setup & requests
  - `auth/`: Authentication utilities
  - `constants/`: App constants
  - `utils/`: Helper functions
  - `constants.ts`: Global constants

- `hooks/`: Custom React hooks
  - use-debounce.ts, etc.

- `styles/`: Global & token styles
  - Tailwind CSS configuration

- `public/`: Static assets

### Code Style (Frontend)

- Use camelCase for variables
- Use PascalCase for component names
- Write functional components with hooks
- Use TypeScript for type safety
- Create reusable components
- Follow Next.js App Router conventions

### Commands (from fashionshop-frontend/)

```bash
npm install            # Install dependencies
npm run dev            # Start dev server (localhost:3000)
npm run build          # Build for production
npm run lint           # Run ESLint
npm test               # Run tests with Vitest
```

## API Integration

- Backend runs on: http://localhost:8080 (or configured port)
- Frontend API calls go through `lib/api/` utilities
- Authentication: JWT tokens stored in cookies/localStorage
- Environment variables: Copy `env.example` to `.env.local`

## Shared Rules

- ❌ Do NOT modify existing APIs without approval
- ❌ Do NOT change database schema without migration
- ❌ Do NOT commit sensitive data (API keys, credentials)

## Workflow

1. Create feature branch from `main`
2. Write tests before implementation (TDD)
3. Follow code style conventions
4. Pass all linting & tests
5. Open PR with clear description
6. Get approval before merging

## Important Notes

- **Authentication**: JWT-based
- **Payment**: Handled by external service
- **Database**: MySQL with JPA/Hibernate
- **State Management**: Zustand (client state) + React Query (server state)
- **Styling**: TailwindCSS (utility-first approach)
- **API Documentation**: Check docs/ folder in both backend & frontend

## Architecture & Integration Documentation

- **[FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)**: Complete guide on how state management, data fetching, and components work together
  - Zustand store patterns
  - React Query hooks patterns
  - Integration hooks for composed logic
  - Component examples in `src/components/examples/`

- **[FEATURE_IMPLEMENTATION_CHECKLIST.md](FEATURE_IMPLEMENTATION_CHECKLIST.md)**: Step-by-step checklist for implementing new features
  - State setup (store, services, hooks)
  - Component implementation best practices
  - Testing guidelines
  - Performance optimization tips

## Reference Components

Example implementations showing proper integration:

- `src/components/examples/ProductCard.tsx` - Cart + Wishlist integration
- `src/components/examples/CartSummary.tsx` - Zustand store usage
- `src/components/examples/CheckoutFlow.tsx` - Complete checkout flow

**Always refer to these when implementing similar features.**
