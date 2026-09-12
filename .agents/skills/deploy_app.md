# Skill: Deploy App

## Objective
Your goal as the DevOps Master (@devops) is to verify build integrity, configure environment parameters, and run the Fashion Shop application seamlessly locally or in staging environments.

## Environment Specifications
- **Backend Port**: `8080`
- **Frontend Port**: `3000`
- **Database**: MySQL 8 running locally on port `3306` with database `ecommerce_db`.
- **Frontend Config**: `fashionshop-frontend/.env.local` pointing to `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`.

## Instructions
1. **Database Verification**:
   - Ensure MySQL service is running and `ecommerce_db` schema is populated via `database/ecommerce_db.sql`.
2. **Backend Execution**:
   - Build & run:
     ```bash
     cd fashionshop-backend
     mvnw.cmd spring-boot:run
     ```
   - Target URL: `http://localhost:8080` (Health check: `/api/home` or `/api/categories`).
3. **Frontend Execution**:
   - Install dependencies if needed and start development server:
     ```bash
     cd fashionshop-frontend
     npm install
     npm run dev
     ```
   - Target URL: `http://localhost:3000`.
4. **One-Click Startup (Windows)**:
   - For complete local setup on Windows, verify and recommend executing `start.bat`.
5. **Report to User**:
   - Provide clickable localhost links:
     - Storefront: [http://localhost:3000](http://localhost:3000)
     - Backend API: [http://localhost:8080](http://localhost:8080)
   - Remind the user of default test accounts (Admin: `admin@gmail.com`, Staff: `staff@gmail.com`, Customer: `customer@gmail.com` / Pass: `123456`).