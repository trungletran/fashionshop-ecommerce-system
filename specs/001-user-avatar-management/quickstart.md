# Quickstart Validation: User Avatar Management

## Prerequisites

1. Apply the existing `database/migrations/V3__add_user_avatar_storage_key.sql` manually to the
   target `ecommerce_db` environment if it has not already been applied. Do not assume it is
   applied from source inspection alone.
2. Configure backend Cloudinary runtime values using `CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Keep the API secret backend-only.
3. Start the backend on port 8080 and frontend on port 3000 using the repository instructions.

## Automated checks

From `fashionshop-backend/`:

PowerShell:

```powershell
.\mvnw.cmd test
```

Windows CMD:

```cmd
mvnw.cmd test
```

Verify focused user avatar and profile tests cover:

- 5,242,880-byte acceptance and 5,242,881-byte rejection.
- Width/height 4096 acceptance and 4097 rejection.
- Total pixels 16,777,216 acceptance and 16,777,217 rejection.
- Malformed content, MIME mismatch, missing file, and multiple `file` parts.
- JWT/current-user ownership and inactive-account rejection.
- Cloudinary/storage failure and database-failure cleanup.
- Both legacy profile PUT endpoints ignoring a valid arbitrary avatar URL while updating other
  valid fields.

From `fashionshop-frontend/`:

PowerShell:

```powershell
npm run lint
npm run test:run
npm run build
```

Windows CMD:

```cmd
npm run lint
npm run test:run
npm run build
```

Verify the frontend checklist and focused avatar behavior: file selection, 5 MiB boundary,
preview/cancel cleanup, disabled controls during upload, success synchronization, and visible
failure feedback.

## Manual API checks

1. Authenticate through the existing login flow and use the resulting JWT.
2. Send one JPEG or PNG as `file` to `POST http://localhost:8080/api/me/avatar`.
3. Confirm `200 OK`, `ApiResponse<UserResponse>`, and updated `avatarUrl`.
4. Send a two-part request whose total request size remains under 6 MiB and confirm HTTP 400,
   `AVATAR_MULTIPLE_FILES`, and no avatar change.
5. Send a file over 5 MiB and confirm parser-level HTTP 413 `AVATAR_FILE_TOO_LARGE` or the same
   service-level contract, with no avatar change. Confirm a request over the 6 MiB total request
   limit is also returned through the same 413 envelope.
6. Send invalid, malformed, and dimension-invalid images and confirm the prior avatar remains
   unchanged.
7. Send valid profile updates with an arbitrary `avatarUrl` to both `PUT /api/me` and
   `PUT /api/users/profile`; confirm other fields update but the stored avatar does not.
8. Repeat an upload without a valid JWT and confirm existing authentication rejection.

## Expected outcome

All valid boundary cases succeed, all invalid or unauthorized cases fail without destructive state
changes, and the updated avatar remains visible after profile refresh.
