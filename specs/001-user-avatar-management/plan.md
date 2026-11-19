# Implementation Plan: User Avatar Management

**Branch**: `001-user-avatar-management` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Approved Version 1.0 feature specification from `/specs/001-user-avatar-management/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Extend the existing authenticated profile flow so users can safely upload a JPEG or PNG avatar
through `POST /api/me/avatar`, while preserving the current Cloudinary-backed storage model,
profile response contracts, and frontend session/query synchronization. The implementation is
primarily a validation and protection increment: enforce the exact 5 MiB byte limit, decoded
dimension and total-pixel limits before storage, reject multiple multipart avatar parts, and prove
that legacy profile update endpoints cannot mutate the stored avatar URL.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Java 21 / Spring Boot 3.3.4; TypeScript / React 19 / Next.js 16.2.4.
The backend's Maven build target is Java 21; no compiler override was found.

**Primary Dependencies**: Spring Web, Spring Security, Spring Data JPA, Jakarta Validation,
Cloudinary HTTP 44 SDK 1.39.0, Axios, TanStack Query 5, Zustand 5, React Hook Form, Zod

**Storage**: MySQL 8 schema `ecommerce_db`; Cloudinary stores avatar binary content; `users.avatar_url`
and nullable `users.avatar_storage_key` store delivery URL and provider key. Existing V3 SQL is
manually applied per environment; no migration runner is present.

**Testing**: JUnit 5 with Spring Boot test starter and H2 `create-drop` test profile; frontend
Vitest 3.2.4, Testing Library, ESLint 9, and the repository frontend implementation checklist

**Target Platform**: Spring Boot service on port 8080 and Next.js App Router frontend on port 3000

**Project Type**: Monorepo web application with layered Spring Boot backend and feature-sliced
Next.js frontend

**Performance Goals**: Reject invalid uploads before Cloudinary transfer; preserve existing upload
and profile response behavior. No new throughput target is specified.

**Constraints**: JPEG/PNG only; exact maximum 5 MiB (5,242,880 bytes); decoded width and height
at most 4096; decoded width × height at most 16,777,216; exactly one multipart `file` part;
server-side JWT authorization and Cloudinary credentials; no new provider, migration tool, or
dependency.

**Scale/Scope**: Current-user avatar upload and profile synchronization only; no avatar history,
deletion UI, crop editor, private delivery URLs, or administrator replacement flow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The gate passes with the following decisions:

| Constitution requirement | Plan alignment |
|---|---|
| Approved specification before behavior/security/API changes | Product Owner approval was explicitly provided on 2026-11-03; this plan does not alter the approved specification. |
| Thin controllers, service-owned business rules, explicit DTO mapping | Retain `MeController` delegation, place validation/orchestration in `UserServiceImpl`, and retain `UserMapper`/`UserResponse`. |
| Backend authorization authoritative | Use existing JWT filter/security chain and current-user lookup; no client user ID. |
| Existing typed frontend architecture | Reuse feature-sliced users services/hooks, `ApiResponse<T>`, TanStack Query, and existing auth store/session architecture. |
| Verification before delivery | Add/extend backend JUnit tests, frontend Vitest coverage where practical, lint/type/build checks, and checklist review. |
| Reviewed SQL for schema changes | No schema change is planned; verify existing V3 manually per environment and do not add a migration tool. |

No constitution violation or exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-avatar-management/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)

```text
fashionshop-backend/
├── src/main/java/com/example/fashionshop/
│   ├── config/CloudinaryConfig.java, SecurityConfig.java
│   ├── modules/user/controller/MeController.java, UserController.java
│   ├── modules/user/service/UserServiceImpl.java
│   ├── modules/user/service/AvatarStorageService.java
│   ├── modules/user/service/CloudinaryAvatarStorageService.java
│   ├── modules/user/entity/User.java
│   ├── modules/user/dto/UpdateProfileRequest.java, UserResponse.java
│   └── common/mapper/UserMapper.java, exception/GlobalExceptionHandler.java
└── src/test/java/com/example/fashionshop/modules/user/
    ├── service/UserAvatarServiceTest.java, UserServiceImplTest.java
    └── controller/MeControllerValidationTest.java, UserControllerProfileTest.java

fashionshop-frontend/
├── src/features/users/
│   ├── services.ts
│   ├── hooks.ts
│   └── components/profile-form.tsx
├── src/features/auth/store.ts
├── src/lib/api/http.ts, types.ts, query-keys.ts
└── src/types/common.ts, user.ts

database/
└── migrations/V3__add_user_avatar_storage_key.sql (existing; no edit planned)
```

**Structure Decision**: Use the existing layered backend and feature-sliced frontend. The feature
does not add a new module, entity, storage provider, migration runner, or authentication flow.
Existing source files are expected to change only where required to close the specified validation,
multipart, legacy-profile, UI wording/state, and test gaps.

## Architecture and Data Flow

1. The authenticated frontend profile form selects one local JPEG/PNG file, performs the existing
   immediate type/size usability check, and creates a temporary object-URL preview.
2. The users service sends one `FormData` request containing exactly one `file` part to
   `POST /api/me/avatar` through the existing Axios client. It does not send a user ID or provider
   credentials.
3. Spring Security authenticates the JWT before the controller delegates to `UserServiceImpl`.
   The service resolves the current user from `SecurityUtil` and `UserRepository`.
4. The controller-level request handling must inspect all multipart files named `file` rather than
   relying on `@RequestPart("file") MultipartFile` alone. A concrete implementation should accept
   the multipart request or file collection, require `getFiles("file").size() == 1`, pass that one
   file to the service, and throw `AvatarUploadException` otherwise. Multiple `file` parts return
   HTTP 400 with the existing `ApiResponse` error envelope, code `AVATAR_MULTIPLE_FILES`, and a
   message such as `Exactly one avatar file must be provided`.
5. The service rejects missing, empty, unsupported, oversized, malformed, or undecodable
   input in a bounded order: after parser limits, check exact byte size; identify the actual JPEG
   or PNG reader; inspect width; inspect height; calculate width × height using `long`; then fully
   decode only after all dimension limits pass to validate the image structure. The exact 5 MiB
   byte limit and all decoded dimension/total-pixel limits pass before invoking
   `AvatarStorageService`. Reuse Java ImageIO already present in the backend; add no image library.
6. `CloudinaryAvatarStorageService` uploads with the existing server-side `Cloudinary` bean and
   returns secure delivery URL plus public ID/storage key. The service updates the existing user
   fields and maps the result to `ApiResponse<UserResponse>`.
7. If persistence fails, the new asset is deleted best effort and prior avatar values remain. If
   persistence succeeds, deletion of a known old owned asset remains best effort.
8. The frontend writes the returned profile into the relevant TanStack Query `me` variants and
   the existing auth user state, invalidates the `me` query family, releases the preview, and
   displays the saved avatar.
9. `PUT /api/me` and `PUT /api/users/profile` continue updating supported profile fields while
   never assigning client-supplied `avatarUrl` to the entity.

## Multipart Size and Exception Handling

The repository currently configures `spring.servlet.multipart.max-file-size=5MB` and
`spring.servlet.multipart.max-request-size=6MB` in
`fashionshop-backend/src/main/resources/application.properties`. Spring's `5MB` data-size value
represents the required 5 MiB file limit. A request that exceeds the file limit may be rejected by
multipart parsing before `MeController` or `UserServiceImpl` runs, so service-level validation
alone is insufficient.

The implementation plan retains the existing global limits and adds an existing-convention
`ApiResponse` mapping for Spring's multipart size exception (`MaxUploadSizeExceededException` or
the enclosing multipart exception) to HTTP 413, `AVATAR_FILE_TOO_LARGE`, and the approved size-limit
message. The handler must not expose parser details. Requests that parse successfully are still
checked by the service for the exact byte limit before Cloudinary upload. A duplicate request that
also exceeds the global request limit returns the parser-level 413 because parsing ends first;
two small `file` parts return HTTP 400 `AVATAR_MULTIPLE_FILES`.

`AVATAR_MULTIPLE_FILES` follows the current repository convention rather than introducing a new
error architecture: the controller/service raises `AvatarUploadException(HttpStatus.BAD_REQUEST,
"AVATAR_MULTIPLE_FILES", message)`, and `GlobalExceptionHandler.handleAvatarUpload` returns
`ApiResponse.error(code, message)`. The exact message is `Exactly one avatar file must be provided`.

## Safe Image Validation Order

1. Let Spring multipart parsing enforce the existing per-file and request limits; map a parser-level
   file-size failure to the existing HTTP 413 `AVATAR_FILE_TOO_LARGE` envelope.
2. For a parsed file, reject empty input and any byte count greater than 5,242,880 before image
   processing.
3. Use Java ImageIO's existing reader APIs and the file content, not only the client MIME type or
   extension, to identify JPEG or PNG. Reject if no allowed reader can identify the content.
4. Ask the selected `ImageReader` for width and reject values above 4096.
5. Ask the reader for height and reject values above 4096.
6. Calculate width × height in `long` and reject values above 16,777,216.
7. Only after the dimension checks pass, fully decode/read the image to detect malformed or
   truncated content. Do not upload until this structural decode succeeds.

This ordering bounds the input before full raster allocation while preserving actual-content
validation. It reuses Java ImageIO and the existing byte array already bounded by the upload limit.

## Java Version Fact-Check

The repository evidence does not support a Java 17 build baseline. `fashionshop-backend/pom.xml`
sets `<java.version>21</java.version>`, no Maven compiler override was found, AGENTS.md and the
root README identify Java 21, and the backend README's general setup sections identify Java 21.
The backend README's CI/CD section separately says to set up Temurin JDK 17 and references
`.github/workflows/maven.yml`, which is not present in the repository. That stale CI instruction is
the only Java 17 reference found. This feature does not change the Java version; implementation
and validation must remain compatible with the Maven-configured Java 21 baseline.

## Expected Source Changes

### Backend

- `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/UserServiceImpl.java`:
  centralize exact byte/dimension/pixel checks before storage and preserve cleanup behavior.
- `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/controller/MeController.java`:
  inspect the complete multipart request's `file` collection, require exactly one part, and return
  the documented 400 `AVATAR_MULTIPLE_FILES` response for duplicates without accepting a target
  user ID.
- `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/dto/UpdateProfileRequest.java`
  and profile mapping/service callers: preserve compatibility while ensuring `avatarUrl` cannot be
  client-mutated; avoid unnecessary contract-breaking removal without approval.
- Existing `AvatarStorageService`, `CloudinaryAvatarStorageService`, `CloudinaryConfig`, `User`,
  `UserMapper`, `UserResponse`, `GlobalExceptionHandler`, and V3 SQL are reused, not replaced.
- Backend tests under the user service/controller test paths will be extended for boundary and
  legacy protection behavior.

### Frontend

- `fashionshop-frontend/src/features/users/components/profile-form.tsx`: preserve existing
  preview/upload/cancel behavior and align displayed size wording with 5 MiB where needed.
- `fashionshop-frontend/src/features/users/services.ts` and `hooks.ts`: preserve typed
  `ApiResponse<AuthUser>`, one-file FormData, query invalidation, and auth-store synchronization.
- `fashionshop-frontend/src/types/user.ts` and profile update callers: ensure avatar URL is not
  treated as a client-settable profile mutation while preserving other profile fields.
- Add or extend focused frontend tests only where the repository's existing Vitest patterns support
  them; do not add a new test framework.

### Database and Deployment

- No database or migration file changes are planned.
- Verify `database/migrations/V3__add_user_avatar_storage_key.sql` is applied manually per target
  environment before relying on storage-key cleanup. Do not claim universal application state.
- Keep local Hibernate `ddl-auto=update` behavior as existing development infrastructure; it is
  not the production migration process.

## Testing Strategy

- Backend unit tests: exact 5 MiB boundary and one-byte-over rejection; width/height boundary;
  total-pixel boundary; validation-order proof that storage is never called for a dimension-invalid
  image; malformed/truncated input; MIME/content mismatch; storage failure;
  persistence failure cleanup; inactive account; and preserved prior avatar.
- Backend controller/integration tests: authenticated current-user resolution, unauthenticated
  rejection, missing `file`, a multipart request containing two `file` parts that returns HTTP 400
  `AVATAR_MULTIPLE_FILES` and leaves the previous avatar unchanged, parser-level over-limit
  rejection mapped to HTTP 413 `AVATAR_FILE_TOO_LARGE`, `ApiResponse<UserResponse>` success/error
  shape, and both legacy profile endpoints rejecting avatar mutation while allowing other fields.
- Frontend tests: JPEG/PNG and exact size usability checks, preview/cancel cleanup, disabled
  controls during upload, success state update, failure feedback, and one FormData file part.
- Repository checks: backend `mvnw.cmd test`; frontend `npm run lint`, `npm run test:run`, and
  `npm run build` when the environment supports them; review the frontend implementation checklist.

## Risks, Dependencies, and Unresolved Technical Issues

- The current service checks MIME and decoded dimensions but does not yet evidence the required
  total-pixel check; implementation must add it before Cloudinary upload.
- The current controller accepts a single `@RequestPart("file")`; explicit rejection of requests
  with multiple avatar file parts must inspect the complete multipart collection and be tested
  without changing the public endpoint contract.
- Multipart parsing can reject over-limit requests before controller/service code; centralized
  exception mapping must cover that path while retaining the existing 5 MiB/6 MiB configuration.
- The current frontend uses a 5 MiB arithmetic limit but displays “5 MB”; UI wording and tests
  should be aligned without changing the backend authority.
- `UpdateProfileRequest` still exposes an `avatarUrl` field for compatibility and validates its
  format, while `UserServiceImpl.updateMyProfile` currently ignores it. Tests must prove this
  remains true for both legacy endpoints.
- The actual applied state of V3 in each deployment environment cannot be established from source;
  deployment verification remains required.
- Java version documentation is inconsistent: Maven and project-level instructions use Java 21,
  while one backend README CI/CD step mentions Temurin 17 and a missing workflow. The feature
  follows Java 21 and does not change either configuration or stale documentation.
- Cloudinary credentials must exist in secure runtime environment configuration; no credential
  values belong in source, frontend state, or persistent browser storage.

There are no unresolved Product Owner decisions. The items above are implementation risks or
verification dependencies, not scope decisions.

## Complexity Tracking

No constitution violations or additional architectural complexity are proposed.
