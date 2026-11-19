# Research: User Avatar Management

## Decision 1: Reuse the existing server-side Cloudinary path

- **Decision**: Reuse `AvatarStorageService`, `CloudinaryAvatarStorageService`, `CloudinaryConfig`,
  the existing Cloudinary SDK dependency, and the existing environment properties.
- **Rationale**: All components are present in the repository and already return a secure delivery
  URL plus provider public ID/storage key. The Constitution prohibits unnecessary new providers,
  dependencies, or authentication mechanisms.
- **Alternatives considered**: Browser-direct unsigned upload, a new object-storage provider, or
  a new upload abstraction. Rejected because they would violate the approved architecture and
  credential boundary.

## Decision 2: Keep the current-user API contract

- **Decision**: Retain `POST /api/me/avatar` with JWT authentication, multipart form data, and a
  required `file` part. Resolve the target user from the security context.
- **Rationale**: `MeController` already maps this endpoint and the service already uses
  `SecurityUtil` plus repository lookup. No client-supplied user ID is needed.
- **Alternatives considered**: A user-ID route or an admin-targeted avatar endpoint. Rejected as
  outside scope and inconsistent with ownership requirements.

## Decision 2A: Explicitly inspect duplicate multipart parts

- **Decision**: Do not rely on a single `@RequestPart("file") MultipartFile` parameter to reject
  duplicates. Inspect the multipart request's complete `file` collection and require exactly one
  part. Return HTTP 400 with `ApiResponse.error("AVATAR_MULTIPLE_FILES", ...)` for duplicates.
- **Rationale**: The current controller has a single `@RequestPart` parameter, but source inspection
  does not prove that duplicate parts are rejected with the required API envelope. Collection-level
  inspection makes the behavior explicit and testable.
- **Alternatives considered**: Keeping the single parameter and assuming framework behavior, or
  silently selecting the first file. Rejected because duplicate acceptance is ambiguous and could
  bypass the exact-one-file requirement.

## Decision 2C: Use the existing avatar exception convention

- **Decision**: Represent duplicate-file rejection with `AvatarUploadException` using HTTP 400,
  code `AVATAR_MULTIPLE_FILES`, and the existing `GlobalExceptionHandler` mapping to
  `ApiResponse.error(code, message)`.
- **Rationale**: The repository already uses feature-specific avatar codes for required file,
  size, format, storage, and persistence failures. The handler already preserves the status and
  code, so no new error-handling architecture is needed.
- **Alternatives considered**: A new exception hierarchy, a new response envelope, or silently
  selecting the first duplicate. Rejected as inconsistent or unsafe.

## Decision 2B: Preserve multipart limits and map parser failures

- **Decision**: Retain the existing `max-file-size=5MB` and `max-request-size=6MB` settings. Map
  Spring's pre-controller multipart size exception to HTTP 413 with `AVATAR_FILE_TOO_LARGE` through
  the existing centralized `ApiResponse` handler. Keep service-level byte validation for requests
  that parse successfully.
- **Rationale**: The configured 5MB Spring data size represents the approved 5 MiB limit, but
  over-limit requests may fail before the service executes. The repository currently has no
  dedicated multipart-size handler, so the plan must cover this path without changing global limits.
- **Alternatives considered**: Raising the global limit, relying only on service validation, or
  returning an unstructured framework error. Rejected because each would weaken the approved
  contract or require unnecessary configuration changes.

## Decision 3: Validate bytes and decoded image dimensions before storage

- **Decision**: Enforce 5 MiB (5,242,880 bytes), JPEG/PNG content validation, width ≤ 4096,
  height ≤ 4096, and width × height ≤ 16,777,216 before calling Cloudinary.
- **Rationale**: The current service already reads the image with `ImageIO` and checks MIME and
  width/height. The total-pixel check is required by the approved specification but is not yet
  evidenced in the source. The backend must remain authoritative.
- **Alternatives considered**: Trusting client MIME/extension, relying only on multipart server
  limits, or validating after Cloudinary upload. Rejected because they do not provide sufficient
  content or resource protection.

## Decision 3A: Bound image processing before full decode

- **Decision**: Validate parser limits, exact byte size, actual ImageIO reader format, width,
  height, and width × height in that order. Fully decode only after all dimensions pass, then
  upload to Cloudinary only after structural decode succeeds.
- **Rationale**: Java ImageIO is already available. Reader metadata can be inspected before full
  raster allocation, reducing unnecessary memory-intensive work for oversized dimensions while
  retaining actual-content validation.
- **Alternatives considered**: Calling `ImageIO.read` before dimensions, trusting MIME/extension,
  or validating after storage. Rejected because they increase resource risk or weaken validation.

## Decision 4: Preserve legacy profile update compatibility

- **Decision**: Keep the existing `avatarUrl` request field validation if required for compatibility,
  but ensure `PUT /api/me` and `PUT /api/users/profile` never assign it to the entity. The dedicated
  upload operation is the only avatar mutation path.
- **Rationale**: Current `UserServiceImpl.updateMyProfile` updates other profile fields and does not
  assign `avatarUrl`. This behavior must be protected by tests rather than silently changing the
  public request shape.
- **Alternatives considered**: Removing `avatarUrl` immediately from all DTOs and callers. Deferred
  because it may break existing clients and is not required to prevent mutation.

## Decision 5: Use the existing manual SQL deployment convention

- **Decision**: Do not add a schema change. Verify and manually apply the existing
  `database/migrations/V3__add_user_avatar_storage_key.sql` per environment.
- **Rationale**: V3 already adds the nullable `avatar_storage_key` column, and the backend README
  documents manual application. No Flyway or Liquibase runner exists.
- **Alternatives considered**: Adding a new migration tool or replacing the existing SQL. Rejected
  because approval is required for a new migration tool and no new schema change is needed.

## Decision 6: Test with repository-native tooling

- **Decision**: Use JUnit 5/H2 backend tests and the existing frontend Vitest, Testing Library,
  ESLint, and build commands.
- **Rationale**: These tools are already configured in the repository and required by AGENTS.md and
  the Constitution.
- **Alternatives considered**: Introducing a new test framework or external image-validation
  dependency. Rejected as unnecessary.

## Decision 7: Use the Maven-configured Java 21 implementation baseline

- **Decision**: Treat Java 21 as the actual backend build baseline. `pom.xml` sets
  `<java.version>21</java.version>` and no Maven compiler override is present.
- **Rationale**: AGENTS.md, the root README, and the backend README's setup sections also state
  Java 21. The only Java 17 reference is a backend README CI/CD step that says “Set up Temurin JDK
  17”; the referenced `.github/workflows/maven.yml` does not exist, so that instruction is stale or
  otherwise unverified. The Product Owner's Java 17 statement is not supported by the inspected
  repository files.
- **Alternatives considered**: Downgrading to Java 17 or changing Maven configuration. Rejected;
  that would modify project configuration and contradict the actual Maven build target.
