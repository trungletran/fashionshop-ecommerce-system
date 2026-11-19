---

description: "Task list for User Avatar Management implementation"
---

# Tasks: User Avatar Management

**Input**: Approved Version 1.0 design documents from `/specs/001-user-avatar-management/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/avatar-upload.md`, and `quickstart.md`

**Baseline**: Java 21 / Spring Boot 3.3.4, existing Cloudinary integration, JWT security, `ApiResponse<T>`, Java ImageIO, Next.js 16, TypeScript, TanStack Query, and Zustand. Do not add a provider, dependency, migration tool, or authentication mechanism.

**Tests**: Test tasks are included because the approved specification and Constitution require validation of security boundaries, failure paths, API contracts, and frontend behavior.

## Phase 1: Setup and Preparation

**Purpose**: Confirm the approved implementation context and deployment preconditions without changing application or database configuration.

- [X] T001 Review the approved requirements and design artifacts in `specs/001-user-avatar-management/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/avatar-upload.md`, and `quickstart.md`; preserve all approved decisions.
- [X] T002 Verify the Java 21 Maven baseline in `fashionshop-backend/pom.xml`, the existing Cloudinary dependency, and multipart configuration in `fashionshop-backend/src/main/resources/application.properties`; make no configuration changes.
- [X] T003 [P] Verify `database/migrations/V3__add_user_avatar_storage_key.sql` adds nullable `users.avatar_storage_key` and record the target-environment precondition in `specs/001-user-avatar-management/quickstart.md`; do not edit or execute the migration.
- [X] T004 [P] Verify frontend commands and checklist in `fashionshop-frontend/package.json` and `fashionshop-frontend/FEATURE_IMPLEMENTATION_CHECKLIST.md`; use the existing lint, Vitest, and build commands.

---

## Phase 2: Foundational Test Preparation

**Purpose**: Prepare reusable test infrastructure and verify test prerequisites. Production validation and error handling are implemented in User Story 2.

- [X] T005 [P] Add reusable bounded JPEG/PNG test-image fixture helpers in `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/service/AvatarTestFixtures.java` (planned new test helper) for byte-size and valid-image cases without adding dependencies.
- [X] T006 [P] Add reusable multipart request fixture helpers in `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/controller/AvatarMultipartTestFixtures.java` (planned new test helper) for one-part and duplicate-`file` requests without changing the public API.
- [X] T007 [P] Verify the existing H2/JUnit 5 test profile in `fashionshop-backend/src/test/resources/application.properties` and the existing frontend Vitest setup before story tests are added; do not introduce a new test framework.

**Checkpoint**: Reusable backend test fixtures and multipart helpers are ready, H2/JUnit 5 and frontend Vitest prerequisites are verified, and production validation/error handling remain owned by User Story 2.

---

## Phase 3: User Story 1 - View and Change My Avatar (Priority: P1) 🎯 MVP

**Goal**: An authenticated user can view the current avatar, select one valid image, upload it through the existing backend path, and see the returned avatar without signing in again.

**Independent Test**: With an authenticated user, verify the current avatar/fallback, upload a valid JPEG or PNG at or below 5 MiB, receive `ApiResponse<UserResponse>`, and verify account/profile surfaces display the returned URL.

### Tests for User Story 1

- [X] T008 [P] [US1] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/service/UserAvatarServiceTest.java` with success and ownership tests proving the authenticated security-context user is updated, the stored URL/key are persisted, and the storage adapter receives the current user ID.
- [X] T009 [P] [US1] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/controller/MeControllerValidationTest.java` with endpoint contract tests proving authenticated `POST /api/me/avatar` accepts exactly one `file` part and returns the existing `ApiResponse<UserResponse>` success shape.
- [X] T010 [P] [US1] Create the new frontend test files `fashionshop-frontend/src/features/users/components/profile-form.test.tsx` and `fashionshop-frontend/src/features/users/services.test.ts`, then add tests for current-avatar display, initial fallback, one-file FormData submission, and success response handling.

### Implementation for User Story 1

- [X] T011 [US1] Preserve and complete the backend current-user upload flow in `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/UserServiceImpl.java`, reusing `SecurityUtil`, `UserRepository`, `AvatarStorageService`, `UserMapper`, `UserResponse`, and the existing Cloudinary adapter.
- [X] T012 [US1] Preserve the typed upload API call in `fashionshop-frontend/src/features/users/services.ts` as one `FormData` request with exactly one `file` field to `/api/me/avatar`, using the existing `ApiResponse<AuthUser>` and shared API client.
- [X] T013 [US1] Preserve and refine query/session synchronization in `fashionshop-frontend/src/features/users/hooks.ts`: update the `me` query variants, invalidate the `me` query family, and update the existing authenticated user state without storing credentials in new state.
- [X] T014 [US1] Preserve and refine avatar preview and saved-avatar presentation in `fashionshop-frontend/src/features/users/components/profile-form.tsx` and `fashionshop-frontend/src/app/(customer)/account/page.tsx`, including fallback rendering and accessible upload controls.

**Checkpoint**: User Story 1 works independently with an authenticated user and a valid image; no Cloudinary credentials or storage key appear in frontend state or response DTOs.

---

## Phase 4: User Story 2 - Safe Validation and Failure Feedback (Priority: P1)

**Goal**: Invalid files and storage/persistence failures are rejected safely, return the existing API error envelope, and never replace the previous avatar.

**Independent Test**: Exercise every size, format, dimension, multipart, malformed-image, storage-failure, and database-failure case and verify the previous avatar remains effective.

### Tests for User Story 2

- [X] T015 [US2] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/service/UserAvatarServiceTest.java` with exact boundary tests: accept `5,242,880` bytes; reject `5,242,881`; accept/reject width at `4096/4097`; accept/reject height at `4096/4097`; test the total-pixel guard independently through a package-private pixel-count seam or mocked `ImageReader` with synthetic calculated values `16,777,216/16,777,217`; and verify storage is never called for invalid input.
- [X] T016 [US2] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/service/UserAvatarServiceTest.java` with explicit actual-content rejection tests for SVG, GIF, WEBP, other unsupported formats, MIME type/extension mismatches, malformed JPEG/PNG data, truncated JPEG/PNG data, and empty input; verify validation completes before storage.
- [X] T017 [US2] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/controller/MeControllerValidationTest.java` with a request containing two `file` parts; verify HTTP 400, `AVATAR_MULTIPLE_FILES`, the existing `ApiResponse` error shape, no service upload, and unchanged prior avatar.
- [X] T018 [US2] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/service/UserAvatarServiceTest.java` with storage failure, persistence failure cleanup, old-asset cleanup failure, inactive-account, and legacy-key ownership safety cases.
- [X] T019 [P] [US2] Add the planned new test file `fashionshop-backend/src/test/java/com/example/fashionshop/common/exception/GlobalExceptionHandlerTest.java` for parser-level multipart size failures; verify HTTP 413 and `AVATAR_FILE_TOO_LARGE` without stack traces or provider details.
- [X] T020 [US2] Extend the `fashionshop-frontend/src/features/users/components/profile-form.test.tsx` file created by T010 with invalid-file and failure-state tests for JPEG/PNG-only selection, 5 MiB client check, preview cleanup, cancellation, disabled duplicate submission, visible error feedback, and preserved saved avatar.

### Implementation for User Story 2

- [X] T021 [US2] Implement the bounded ImageIO validation sequence in `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/UserServiceImpl.java`: reject bytes first, identify actual JPEG/PNG content, inspect `ImageReader` width/height, calculate total pixels with `long` through a testable package-private seam, fully decode only after dimension checks, then upload to Cloudinary.
- [X] T022 [US2] Implement explicit duplicate-part detection in `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/controller/MeController.java` by inspecting all `file` parts and rejecting any count other than one with `AvatarUploadException(HttpStatus.BAD_REQUEST, "AVATAR_MULTIPLE_FILES", "Exactly one avatar file must be provided")`.
- [X] T023 [US2] Add parser-level multipart exception mapping in `fashionshop-backend/src/main/java/com/example/fashionshop/common/exception/GlobalExceptionHandler.java` for the repository-resolved Spring multipart size exception, returning HTTP 413 and `AVATAR_FILE_TOO_LARGE` through `ApiResponse`.
- [X] T024 [US2] Preserve transactional cleanup in `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/UserServiceImpl.java`: delete a newly stored asset best effort after persistence failure, restore previous URL/key, and delete a known old owned asset only after successful persistence.
- [X] T025 [US2] Preserve user-facing failure and loading behavior in `fashionshop-frontend/src/features/users/components/profile-form.tsx`, including exact 5 MiB messaging, cancel/revoke handling, duplicate-submit prevention, and existing toast/form error conventions.

**Checkpoint**: All invalid and failure paths are independently testable and preserve the previous avatar; no upload reaches Cloudinary before all backend validation passes.

---

## Phase 5: User Story 3 - Ownership, Legacy Profile Protection, and Session Consistency (Priority: P1)

**Goal**: Only the authenticated user can change their own avatar, legacy profile endpoints cannot mutate it through `avatarUrl`, and profile/session data remains consistent after success.

**Independent Test**: Use authenticated, unauthenticated, inactive, and client-targeting requests; update both legacy profile endpoints with an arbitrary valid URL plus another valid field; verify only permitted fields change.

### Tests for User Story 3

- [X] T026 [P] [US3] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/service/UserServiceImplTest.java` with a valid arbitrary `avatarUrl` ignored by `updateMyProfile`, unchanged stored avatar URL/key, and successful non-avatar field updates.
- [X] T027 [US3] Extend the existing `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/controller/MeControllerValidationTest.java` and `fashionshop-backend/src/test/java/com/example/fashionshop/modules/user/controller/UserControllerProfileTest.java` with both legacy PUT endpoint cases, invalid `avatarUrl` validation, unauthenticated upload rejection, and no client-supplied user ID targeting.
- [X] T028 [US3] Extend the `fashionshop-frontend/src/features/users/services.test.ts` and `fashionshop-frontend/src/features/users/components/profile-form.test.tsx` files created by T010 to verify legacy profile calls do not include an avatar mutation path and successful upload synchronizes profile query data and the existing auth user state.

### Implementation for User Story 3

- [X] T029 [US3] Preserve the legacy request compatibility boundary across the actual shared path: inspect `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/controller/MeController.java` (`PUT /api/me`) and `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/controller/UserController.java` (`PUT /api/users/profile`), retain their thin delegation, and update `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/dto/UpdateProfileRequest.java` and `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/UserServiceImpl.java` only as needed so existing `avatarUrl` validation remains, non-avatar fields update, and client `avatarUrl` is never assigned.
- [X] T030 [US3] Verify the existing JWT/current-user security flow in `fashionshop-backend/src/main/java/com/example/fashionshop/config/SecurityConfig.java`, `fashionshop-backend/src/main/java/com/example/fashionshop/security/filter/JwtAuthenticationFilter.java`, and `fashionshop-backend/src/main/java/com/example/fashionshop/common/util/SecurityUtil.java` remains authoritative for avatar ownership; do not add frontend-only authorization.
- [X] T031 [US3] Preserve response mapping across `fashionshop-backend/src/main/java/com/example/fashionshop/common/mapper/UserMapper.java`, `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/dto/UserResponse.java`, `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/dto/CustomerProfileResponse.java`, and `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/UserServiceImpl.java` customer profile extras so `avatarUrl` is exposed; verify frontend consumers `fashionshop-frontend/src/types/common.ts`, `fashionshop-frontend/src/types/user.ts`, and `fashionshop-frontend/src/app/(customer)/account/page.tsx` contain no `avatarStorageKey` and display only the public avatar URL.

**Checkpoint**: Ownership and legacy profile protections pass independently for `/api/me`, `/api/users/profile`, and `/api/me/avatar`; successful updates survive profile refresh.

---

## Phase 6: Integration and End-to-End Verification

**Purpose**: Validate the completed stories against repository commands, migration preconditions, frontend checklist, and approved quickstart scenarios.

- [X] T032 [P] Run backend verification from `fashionshop-backend/` with `mvnw.cmd test` under Java 21 and confirm all avatar, controller, exception, security, and profile tests pass.
- [X] T033 [P] Run frontend verification from `fashionshop-frontend/` with `npm run lint`, `npm run test:run`, and `npm run build`; confirm the avatar flow passes `fashionshop-frontend/FEATURE_IMPLEMENTATION_CHECKLIST.md`.
- [ ] T034 [P] Execute the manual API scenarios in `specs/001-user-avatar-management/quickstart.md`, including one-file success, two-file rejection, parser-level over-limit rejection, dimension boundaries, failure cleanup, legacy profile protection, and unauthenticated rejection.
- [ ] T035 Verify the target environment has manually applied `database/migrations/V3__add_user_avatar_storage_key.sql` before deployment or storage-key cleanup; record environment evidence without editing or rerunning the migration.
- [X] T036 Review the final implementation against every requirement in `specs/001-user-avatar-management/spec.md`, every contract in `specs/001-user-avatar-management/contracts/avatar-upload.md`, and the Constitution/AGENTS.md constraints; document any skipped check and residual risk.

**Checkpoint**: Backend, frontend, API, security, cleanup, migration, and documentation verification are complete with no unrecorded failures.

---

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1 has no implementation dependency and must be completed first.
- Phase 2 depends on Phase 1 and blocks all User Story phases.
- User Story 1 depends on Phase 2 and is the MVP increment.
- User Story 2 depends on the shared upload flow from User Story 1 and hardens its validation/failure paths.
- User Story 3 depends on the authenticated profile/upload flow and protects legacy endpoints and session consistency.
- Phase 6 depends on the desired User Story phases being complete.

### Task Dependencies

- T005–T007 establish only reusable test preparation before story tests/implementation; they do not implement production validation or error handling.
- T008, T009, and T010 are test-first tasks and must be written before T011–T014.
- T010 creates both frontend test files; T020 and T028 may extend those files only after T010 completes.
- `UserAvatarServiceTest.java` is sequential: T008 → T015 → T016 → T018. These tasks must not run in parallel.
- `MeControllerValidationTest.java` is sequential: T009 → T017 → T027. T022 modifies the controller after T017 and must not overlap with these tests.
- `GlobalExceptionHandler.java` handling is owned only by T023; T019 must be completed before T023.
- `UserServiceImpl.java` implementation is sequential: T011 → T021 → T024 → T029. T026 must be completed before T029; T029 must not run in parallel with any of these tasks.
- Frontend test-file ownership is sequential: T010 creates `profile-form.test.tsx` and `services.test.ts`; T020 extends `profile-form.test.tsx` after T010; T028 extends both files after T010 and must be serialized after T020 for the shared `profile-form.test.tsx`. The production UI file `profile-form.tsx` remains sequential: T014 → T025.
- T015–T020 are test-first tasks for User Story 2 and must be completed before their corresponding T021–T025 implementation tasks.
- T026–T028 are test-first tasks for User Story 3 and must be completed before T029–T031 where applicable.
- T032–T036 run only after the implementation and tests they verify are complete.

### Parallel Opportunities

- T003 and T004 can run in parallel because they inspect separate deployment/documentation areas.
- T005, T006, and T007 can run in parallel because they create/verify separate reusable test infrastructure files.
- T008, T009, and T010 can run in parallel because they target separate backend service, backend controller, and frontend test files; T020 and T028 cannot run in parallel with T010 or each other where they extend the files created by T010.
- T019 can run in parallel with T015–T018 because it targets the planned new exception test file; T015, T016, T017, and T018 share `UserAvatarServiceTest.java` or `MeControllerValidationTest.java` and must be serialized.
- T026 can run in parallel with other User Story 3 test work because it targets `UserServiceImplTest.java`; T027 and T028 must be serialized with their shared existing/planned test files.
- T032, T033, and T034 can run in parallel after implementation is complete; T035 may run in parallel if deployment access is available.

## Functional Requirement Coverage

| Requirement | Covered by tasks |
|---|---|
| FR-001–FR-003 | T008, T010, T011–T014 |
| FR-004 | T010, T015, T020, T025 |
| FR-005 | T009, T017, T022 |
| FR-006 | T008, T027, T030 |
| FR-007–FR-008 | T015–T019, T021–T023 |
| FR-009–FR-013 | T008, T011, T018, T024, T031 |
| FR-014–FR-016 | T010, T013–T014, T020, T025, T028 |
| FR-017 | T003, T035 |
| FR-018–FR-019 | T026–T029 |

## User Story Coverage

- **US1**: T008–T014 — current avatar/fallback, upload contract, persistence, frontend display, and synchronization.
- **US2**: T015–T025 — exact validation, actual content, dimensions, total pixels, duplicate parts, parser errors, cleanup, and user feedback.
- **US3**: T026–T031 — JWT/current-user ownership, inactive/unauthenticated boundaries, legacy profile protection, DTO mapping, and session consistency.

## Implementation Strategy

### MVP First

1. Complete Phases 1–2.
2. Complete and validate User Story 1.
3. Stop for an MVP review with authenticated upload, persistence, response mapping, and frontend synchronization verified.

### Incremental Delivery

1. Add User Story 2 validation and failure safety.
2. Add User Story 3 legacy profile and ownership protections.
3. Run Phase 6 integration and deployment verification.

## Notes

- `[P]` marks tasks that can run in parallel only when they do not edit the same files or depend on incomplete work.
- T010 is the sole task responsible for creating `profile-form.test.tsx` and `services.test.ts`; T020 and T028 are extension tasks for those files.
- Existing backend test files are explicitly identified as existing, while T005, T006, T010, and T019 explicitly identify planned new test files/helpers.
- Every task includes a concrete repository path and all task lines follow the Spec Kit checkbox/ID/label format.
- No task changes the approved specification or planning artifacts, Constitution, AGENTS.md, Java version, database schema, migration files, or dependencies.
- No task implements a new storage provider, authentication mechanism, migration tool, or response format.
