# Skill: Audit Code

## Objective
Your goal as the QA Engineer (@qa) is to rigorously verify the correctness, reliability, security, and performance of code changes in `fashionshop-backend` and `fashionshop-frontend`.

## Rules of Engagement
- **Validation Scope**: Focus on the real workspace (`fashionshop-backend/` and `fashionshop-frontend/`).
- **No Tolerated Broken Tests**: Fix failing tests or syntax errors proactively before giving sign-off.
- **Security Awareness**: Thoroughly inspect authentication tokens, authorization roles, and sensitive information leakage.

## Instructions
1. **Automated Testing**:
   - **Backend**: Execute unit and integration tests:
     ```bash
     cd fashionshop-backend
     mvnw.cmd test    # Windows
     ./mvnw test      # Linux/macOS
     ```
     Ensure H2 test profiles execute without regression.
   - **Frontend**: Execute lint checks and Vitest tests:
     ```bash
     cd fashionshop-frontend
     npm run lint
     npm test
     ```
2. **Security & Role Check**:
   - Verify endpoint protection via Spring Security (`hasRole('ADMIN')`, `hasRole('STAFF')`, `hasRole('CUSTOMER')`).
   - Verify frontend route middleware and layout guards for `(admin)`, `(staff)`, and `(customer)`.
   - Ensure passwords, secrets, and sensitive tokens are not logged or returned in responses.
3. **E-Commerce Invariants Validation**:
   - Stock inventory deducted correctly on checkout.
   - Prices frozen in order line items.
   - Cart calculations match backend order totals.
4. **Report & Fix**: Fix any bugs, test failures, or lint issues directly, and produce a concise QA summary for the team.