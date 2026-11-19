# Feature Specification: User Avatar Management

**Feature Branch**: `001-user-avatar-management`

**Created**: 2026-11-03

**Status**: Approved

**Version**: 1.0

**Approved**: 2026-11-03

**Input**: User description: "Create a feature specification for User Avatar Management (Change User Avatar) in the existing FashionShop E-commerce System."

## Confirmed Product Owner Decisions

The Product Owner approved this specification and its confirmed decisions on 2026-11-03.

## Repository Fact-Check

The following repository facts were verified before finalizing this draft:

| Component or behavior | Verified evidence | Classification |
|---|---|---|
| `AvatarStorageService` | `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/AvatarStorageService.java` | Existing component reused |
| `CloudinaryAvatarStorageService` | `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/service/CloudinaryAvatarStorageService.java` | Existing component reused |
| `CloudinaryConfig` | `fashionshop-backend/src/main/java/com/example/fashionshop/config/CloudinaryConfig.java` | Existing component reused |
| Cloudinary SDK | `fashionshop-backend/pom.xml`, dependency `com.cloudinary:cloudinary-http44:1.39.0` | Existing dependency reused |
| Cloudinary environment configuration | `fashionshop-backend/src/main/resources/application.properties` and `fashionshop-backend/README.md` | Existing configuration reused |
| `User.avatarStorageKey` | `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/entity/User.java` | Existing entity field reused |
| `users.avatar_storage_key` | `database/migrations/V3__add_user_avatar_storage_key.sql` | Existing nullable database column change |
| `POST /api/me/avatar` | `fashionshop-backend/src/main/java/com/example/fashionshop/modules/user/controller/MeController.java` | Existing endpoint; not a new endpoint |
| Manual migration instruction | `fashionshop-backend/README.md` lines 95–99 and 254 onward | Existing documented manual process |

No requested storage, configuration, entity, migration, or endpoint component is missing from the
repository. The remaining implementation scope is limited to meeting the requirements and tests
that are not yet fully evidenced by the current implementation, including the total-pixel limit
and the legacy profile-update protection requirement.

1. **Storage**: Use the existing server-side Cloudinary integration. The frontend sends the
   image to the FashionShop backend as multipart form data; the backend validates it and uploads
   it with server-side credentials. The Cloudinary API secret MUST remain backend-only. Unsigned
   direct browser upload is not used for avatars. The secure delivery URL and public ID/storage
   key are persisted.
2. **Image formats**: JPEG and PNG only. SVG, GIF, WEBP, and other formats are rejected. The
   backend validates actual image content, not only the client MIME type or filename extension.
3. **Image limits**: Maximum file size is exactly 5 MiB (5,242,880 bytes); maximum width and
   height are 4096 pixels; maximum total pixels are 16,777,216. Malformed, truncated,
   unsupported, or excessively large images
   are rejected safely.
4. **Privacy**: Avatar delivery URLs are public Cloudinary URLs. Cloudinary credentials, API
   secrets, and internal storage information MUST never be exposed to clients.
5. **Legacy profile API**: The avatar upload endpoint is the only supported way to change an
   avatar. `PUT /api/me` and `PUT /api/users/profile` MUST NOT change the stored avatar from a
   client-supplied `avatarUrl`; updates to other profile fields remain supported.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and change my avatar (Priority: P1)

An authenticated user can see the avatar currently associated with their own profile, select a
new JPEG or PNG image, preview it locally, and explicitly upload it. After a successful upload,
the new avatar is visible on the account page and other profile surfaces that use the same user
data.

**Why this priority**: Changing a profile avatar is the primary user value of this feature.

**Independent Test**: Sign in as a valid user, open the account page, select a valid image,
upload it, and verify the returned profile displays the new avatar after the request succeeds.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an existing avatar, **when** the user opens the account
   or edit-profile page, **then** the current avatar is displayed.
2. **Given** an authenticated user without an avatar, **when** the user opens the account or
   edit-profile page, **then** the existing initial-letter fallback is displayed.
3. **Given** an authenticated user selects a valid JPEG or PNG no larger than 5 MiB
   (5,242,880 bytes), **when** the
   user chooses Upload avatar, **then** a single upload request is sent for that file.
4. **Given** the upload succeeds, **when** the profile response is received, **then** the new
   avatar is displayed without requiring a new login.
5. **Given** a selected file and no upload in progress, **when** the user chooses Cancel, **then**
   no upload request is sent and the stored avatar remains unchanged.

---

### User Story 2 - Receive safe feedback for invalid files and failures (Priority: P1)

The user receives clear feedback when a file is invalid or the upload cannot be completed, while
the previously saved avatar remains visible and intact.

**Why this priority**: Avatar files are user-controlled input and failed uploads must not destroy
the user's existing profile state.

**Independent Test**: Try unsupported, malformed, oversized, and provider-failure cases and
verify that each case gives feedback without replacing the saved avatar.

**Acceptance Scenarios**:

1. **Given** a selected file with an unsupported type, **when** the user selects it or submits
   it, **then** the file is rejected and the user sees a validation message.
2. **Given** a selected file larger than 5 MiB (5,242,880 bytes), **when** the user selects it
   or submits it,
   **then** the file is rejected and the existing avatar is unchanged.
3. **Given** a file whose declared type is an image but whose contents cannot be decoded,
   **when** the upload reaches the backend, **then** the backend rejects it and preserves the
   existing avatar.
4. **Given** an authenticated upload request and a storage or database failure, **when** the
   request fails, **then** the user receives an error through the existing API error envelope
   and the previous avatar remains the effective profile avatar.
5. **Given** an upload in progress, **when** the user interacts with the file input or upload
   controls, **then** duplicate submissions are prevented until the request finishes.

6. **Given** a request contains multiple avatar file parts, **when** the request is submitted,
   **then** the request is rejected and the existing avatar remains unchanged.

---

### User Story 3 - Protect ownership and session consistency (Priority: P1)

An authenticated user can change only their own avatar, and the updated profile data remains
consistent across the authenticated session, profile queries, and subsequent visits.

**Why this priority**: Avatar updates are personal-data mutations and must follow the existing
JWT and current-user authorization model.

**Independent Test**: Call the upload endpoint with a valid authenticated principal and verify
that the updated user is the principal from the security context; verify unauthenticated access
is rejected and no client-supplied user identifier is accepted.

**Acceptance Scenarios**:

1. **Given** a valid authenticated principal, **when** the principal uploads an avatar, **then**
   only that principal's profile record is changed.
2. **Given** an upload request without a valid JWT, **when** the request reaches the backend,
   **then** the request is rejected by the existing authentication architecture.
3. **Given** a request containing a client-supplied user identifier, **when** the request is
   processed, **then** the identifier is ignored or rejected and cannot redirect the mutation
   to another account.
4. **Given** a successful upload, **when** the user refreshes the account page or signs in
   again later, **then** the saved avatar remains available through the profile response.

### Edge Cases

- No file part, an empty file, or a request containing more than one `file` part; multiple avatar
  file parts MUST be rejected.
- A file with a valid extension but an incorrect or undecodable image body.
- A JPEG or PNG larger than 5 MiB (5,242,880 bytes), or with width greater than 4096 pixels,
  height greater than 4096 pixels, or total pixels greater than 16,777,216.
- An image whose total pixel count exceeds 16,777,216 even when its width and height are each
  individually within the allowed limit.
- A user whose account is locked, inactive, or deleted at upload time.
- A storage upload succeeds but persistence fails; the new uncommitted asset must be cleaned up
  best effort and the old profile values must remain effective.
- Persistence succeeds but deletion of the old storage asset fails; the new avatar remains
  active and cleanup is treated as an operational follow-up rather than a rollback.
- The user changes or cancels the selected file before submitting it.
- A stale profile query or auth-store value exists when the upload succeeds; the returned user
  profile must become the current client value.
- The user has a legacy avatar URL without a known storage key; the legacy asset must not be
  deleted speculatively.
- A legacy profile update includes a valid `avatarUrl`; other valid profile fields are updated,
  but the stored avatar remains unchanged.
- A legacy profile update includes an invalid `avatarUrl`; the existing DTO validation response
  is returned and other fields are not partially applied.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated user to view their current `avatarUrl`
  through the existing profile responses used by the account and profile pages.
- **FR-002**: The system MUST preserve the existing initial-letter fallback when the current
  user has no avatar URL.
- **FR-003**: The frontend MUST allow selection of one avatar file and MUST provide a local
  preview before upload without treating the preview as the saved avatar.
- **FR-004**: The frontend MUST perform an immediate usability check for JPEG or PNG type and a
  maximum size of 5 MiB (5,242,880 bytes), while the backend remains the authoritative validator.
- **FR-005**: The existing `POST /api/me/avatar` operation MUST accept exactly one multipart
  file part named `file` and MUST reject requests containing multiple avatar file parts. It
  MUST infer the target user from the authenticated security context rather than a client-
  supplied user ID.
- **FR-006**: The backend MUST require authentication for avatar upload and MUST reject inactive
  or otherwise unauthorized accounts using the existing authentication and authorization
  architecture.
- **FR-007**: The backend MUST reject missing, empty, multiple, unsupported, oversized,
  malformed, or undecodable image files using the existing `ApiResponse` error convention.
- **FR-008**: The backend MUST enforce JPEG and PNG only and reject any file exceeding exactly
  5 MiB (5,242,880 bytes). It MUST validate decoded image dimensions before uploading to
  Cloudinary: width MUST be less than or equal to 4096 pixels, height MUST be less than or
  equal to 4096 pixels, and width multiplied by height MUST be less than or equal to
  16,777,216 pixels. It MUST validate actual image content and MUST NOT rely only on a
  client-provided MIME type or file extension.
- **FR-009**: A successful upload MUST update the authenticated user's existing profile data,
  including `avatarUrl` and the associated storage key, without exposing storage credentials or
  internal storage identifiers in the client response.
- **FR-010**: The successful response MUST use the existing `ApiResponse<UserResponse>` shape
  and return the updated user profile, including the new `avatarUrl`.
- **FR-011**: The storage operation MUST use the existing server-side avatar storage abstraction
  and Cloudinary adapter. This feature MUST NOT introduce a new storage provider, browser-direct
  avatar upload flow, or authentication mechanism.
- **FR-012**: If persistence fails after a new asset is stored, the system MUST attempt best-
  effort cleanup of the new asset and MUST preserve the previous avatar values.
- **FR-013**: If the new profile is committed, cleanup of a known old avatar asset MAY be best
  effort; failure to delete the old asset MUST NOT undo the successful new avatar update.
- **FR-014**: On successful upload, the frontend MUST update the relevant TanStack Query profile
  data and the existing authenticated user profile state, then display the new avatar.
- **FR-015**: On cancellation or failure, the frontend MUST release any local preview, preserve
  the saved avatar, prevent duplicate submissions during upload, and provide user-readable
  feedback through existing form and toast conventions.
- **FR-016**: The UI MUST provide an accessible file label, clear upload and cancel actions,
  loading feedback, error feedback, and a responsive layout consistent with the existing profile
  form.
- **FR-017**: No schema redesign or new user/avatar entity is required. The existing `users`
  avatar fields and the reviewed `avatar_storage_key` migration MUST remain compatible with
  existing data and deployment procedures.
- **FR-018**: `PUT /api/me` and `PUT /api/users/profile` MUST preserve the existing behavior for
  all supported non-avatar profile fields but MUST NOT assign a client-supplied `avatarUrl` to
  the stored user avatar. A valid legacy `avatarUrl` field MAY be accepted and ignored for
  backward compatibility; the stored avatar MUST remain unchanged. An invalid `avatarUrl` MUST
  continue to produce the existing request-validation error.
- **FR-019**: Backend and frontend tests MUST prove that a valid arbitrary URL submitted through
  either legacy profile update endpoint cannot change the stored avatar, while other valid
  profile fields continue to update normally.

### Existing API Contract

#### Upload avatar

`POST /api/me/avatar`

- Authentication: existing JWT bearer authentication; no `userId` request field.
- Content type: `multipart/form-data`.
- Required parts: exactly one multipart file part named `file`; requests containing multiple
  avatar file parts are rejected.
- Success: `200 OK` with the existing envelope:

```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": {
    "id": 3,
    "fullName": "Customer Account",
    "email": "customer@gmail.com",
    "phoneNumber": "0987654321",
    "address": "789 Vo Van Tan, District 3, HCMC",
    "avatarUrl": "https://res.cloudinary.com/example/image/upload/v1/fashionshop/avatars/3/avatar.jpg",
    "bio": "Fashion Enthusiast",
    "role": "CUSTOMER",
    "isActive": true,
    "accountStatus": "ACTIVE",
    "createdAt": "2026-11-03T14:36:50"
  }
}
```

- The response uses the existing `UserResponse` fields. The storage key is persisted for
  ownership-safe cleanup but is not returned to the client.

#### Existing profile reads

- `GET /api/me` returns the current authenticated user as `ApiResponse<UserResponse>`.
- `GET /api/users/profile` returns the same current-user response convention.
- `GET /api/users/me` returns the existing customer profile shape and MUST expose the current
  avatar URL through its profile extras where that response is used.

#### Expected error behavior

| Status | Existing or required code | Condition |
|---|---|---|
| 400 | `AVATAR_FILE_REQUIRED` | Missing or empty file |
| 400 | `AVATAR_MULTIPLE_FILES` | Request contains more than one multipart `file` part |
| 400 | `AVATAR_INVALID_IMAGE` | Undecodable or dimension-invalid image |
| 401 | Existing authentication response | Missing, invalid, or expired JWT |
| 413 | `AVATAR_FILE_TOO_LARGE` | File exceeds 5 MiB (5,242,880 bytes) |
| 415 | `AVATAR_UNSUPPORTED_TYPE` | File is not JPEG or PNG |
| 500 | `AVATAR_DATABASE_FAILURE` | Profile persistence fails |
| 502 | `AVATAR_STORAGE_FAILURE` | Avatar storage operation fails |

All errors MUST use the existing `ApiResponse` envelope and MUST NOT expose stack traces,
credentials, storage secrets, local file paths, or raw provider credentials.

### Backend Behavior

- The controller remains thin and delegates to the existing `UserService`.
- The service resolves the current user through the existing security utility and repository
  lookup; it does not accept a target user ID from the client.
- Duplicate multipart parts MUST be detected by inspecting the complete `file` collection before
  selecting a file for service processing. A request with more than one `file` part MUST use the
  existing `AvatarUploadException` -> `GlobalExceptionHandler` -> `ApiResponse.error(code, message)`
  path and return HTTP 400 with code `AVATAR_MULTIPLE_FILES`.
- Validation MUST occur in this order: (1) multipart parser/request limits, (2) exact file byte
  size, (3) actual image-reader format validation for JPEG or PNG, (4) decoded width, (5) decoded
  height, (6) decoded width multiplied by height using a sufficiently wide numeric type, and (7)
  complete image decode/structural validation. Width, height, and total pixels MUST pass before
  Cloudinary upload. The implementation SHOULD inspect image metadata through an `ImageReader`
  before allocating a full decoded raster; full decoding is performed only after the dimension
  limits pass and before storage.
- The existing `User` entity, `UserResponse`, `UserMapper`, `AvatarStorageService`,
  `CloudinaryAvatarStorageService`, and `GlobalExceptionHandler` conventions are reused.
- The existing `users.avatar_url` and `users.avatar_storage_key` fields remain the persisted
  representation. No binary or base64 image data is stored in MySQL.
- The existing Cloudinary SDK dependency, `CloudinaryConfig`, environment properties, and
  `CloudinaryAvatarStorageService` are reused. No new provider or dependency is introduced.

### Frontend Behavior

- The existing account page displays `AuthUser.avatarUrl` and the current fallback.
- The existing profile form provides JPEG/PNG selection, a 5 MiB (5,242,880-byte) client-side check, object-URL
  preview, upload, cancel, loading, toast, and error behavior.
- The existing user service sends `FormData` to `/api/me/avatar` through the shared API client.
- The existing user hook updates the `me` query variants, invalidates profile data, and updates
  the authenticated user state after success.
- Authentication/session behavior remains owned by the existing auth store and storage/session
  architecture. Avatar upload MUST NOT add or relocate credential storage.

### Legacy Profile Update Behavior

- `UpdateProfileRequest` currently contains an `avatarUrl` field and applies URL validation.
- The existing `UserServiceImpl.updateMyProfile` updates full name, email, phone, address, and
  bio but does not assign `avatarUrl`; this behavior is the compatibility baseline to preserve.
- A legacy request containing a valid HTTP/HTTPS `avatarUrl` MUST leave the stored avatar URL and
  storage key unchanged while allowing other valid profile fields to update.
- A legacy request containing an invalid `avatarUrl` MUST receive the existing validation error
  rather than bypassing validation or partially changing the avatar.
- New frontend profile update callers MUST use the dedicated avatar upload operation and MUST
  not treat `avatarUrl` as a client-settable profile field.

### Database and Migration Behavior

- `users.avatar_url` already exists in `database/ecommerce_db.sql` and
  `database/V1__sync_schema_with_entities.sql`; existing values MUST be preserved.
- `database/migrations/V2__create_newsletter_subscriptions_table.sql` and
  `database/migrations/V3__add_user_avatar_storage_key.sql` show the repository's newer
  migration-file convention, while `database/V1__sync_schema_with_entities.sql` is a legacy
  root-level script.
- No Flyway, Liquibase, or other migration runner is present in `pom.xml`. The backend README
  states that Hibernate `ddl-auto=update` is used locally and separately instructs operators to
  apply the avatar storage-key SQL before deployment.
- This feature does not require a new schema file because the existing
  `database/migrations/V3__add_user_avatar_storage_key.sql` already adds the required nullable
  column. Each environment MUST verify and apply that reviewed SQL file through the repository's
  existing manual database/deployment process before relying on storage-key cleanup.
- If a future change requires another schema alteration, the proposed script SHOULD use the
  `database/migrations/V<next-sequence>__<description>.sql` location and naming convention used
  by V2 and V3, with explicit review and manual application instructions. No migration tool is
  introduced by this feature, and production schema changes MUST NOT rely solely on
  `ddl-auto=update`.

## Non-Functional Requirements

- **Security**: Only the authenticated current user may mutate their avatar. Server-side checks
  are authoritative; frontend route guards are supplementary.
- **Privacy**: Responses expose only the profile fields already approved by the existing DTO
  contract. Storage credentials and internal storage keys remain server-side.
- **Reliability**: Failed storage or persistence must not replace a previously valid avatar.
- **Compatibility**: Existing profile endpoints, response envelope, user DTO fields, role model,
  storage configuration, and manual SQL migration workflow remain compatible. Legacy profile
  updates preserve non-avatar fields without permitting arbitrary avatar URL mutation.
- **Usability**: Invalid files are rejected before unnecessary upload when possible, while the
  backend repeats all security-relevant validation. The user receives visible state changes for
  loading, success, cancellation, and failure.
- **Accessibility**: The file input has a visible label or equivalent accessible name, controls
  expose disabled/loading state, and validation feedback is available to assistive technology.

## Key Entities

- **User**: The authenticated account whose existing profile record contains `avatarUrl`, an
  optional `avatarStorageKey`, role, activity state, and account status.
- **UserResponse**: The existing public profile response containing `avatarUrl` and other
  approved profile fields; it does not expose the storage key.
- **Stored Avatar**: The existing storage abstraction result containing a delivery URL and an
  internal storage key used for persistence and safe cleanup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of valid JPEG and PNG files at or below 5 MiB
  (5,242,880 bytes) are
  either uploaded successfully or receive a diagnosable existing-provider error without silent
  failure.
- **SC-002**: 100% of files that are missing, empty, multiple, unsupported, over 5 MiB
  (5,242,880 bytes), undecodable, or over any dimension or total-pixel limit are rejected
  without changing the previously saved avatar.
- **SC-003**: 100% of tested unauthenticated requests and attempts to target another user are
  rejected without modifying any user avatar record.
- **SC-004**: After a successful upload, the updated avatar is visible on the account view and
  remains visible after a page refresh and a later authenticated profile read.
- **SC-005**: In failure-path testing, the previous avatar remains effective in 100% of storage
  and persistence failure cases covered by the test suite.
- **SC-006**: Users receive visible upload progress state, success feedback, or an actionable
  error message for every upload attempt.

## Assumptions

- The feature applies to every authenticated account role supported by the current `/api/me`
  profile flow; no new role-specific permission is introduced.
- Cloudinary server-side storage and the existing environment configuration are the approved
  storage mechanism for the current implementation.
- The existing `database/migrations/V3__add_user_avatar_storage_key.sql` is the reviewed schema
  change for this feature and will be manually verified/applied per environment before operation.
- Public Cloudinary delivery URLs remain the current profile-image contract; private signed
  delivery URLs are outside this feature.
- Avatar deletion, crop/rotate editing, multiple-avatar history, and administrator replacement
  of another user's avatar are out of scope.

## Remaining Non-Blocking Future Scope

No Product Owner decision remains unresolved for this specification. Avatar deletion, crop/rotate
editing, multiple-avatar history, private delivery URLs, and upload rate limiting are explicitly
out of scope and MUST be specified separately before implementation.
