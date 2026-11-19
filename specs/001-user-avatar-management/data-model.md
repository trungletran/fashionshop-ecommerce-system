# Data Model: User Avatar Management

## Existing User fields

No new entity is required.

| Entity | Field | Current representation | Feature use |
|---|---|---|---|
| `User` | `avatarUrl` | Nullable `String`, database column `avatar_url` length 512 | Public Cloudinary delivery URL returned through existing profile DTOs |
| `User` | `avatarStorageKey` | Nullable `String`, database column `avatar_storage_key` length 255 | Internal provider public ID used for ownership-safe cleanup; never returned to clients |
| `User` | `id` | Existing integer identifier | Storage folder scoping and current-user ownership checks |
| `User` | `isActive` / `accountStatus` | Existing account state fields | Upload authorization and inactive-account rejection |

## Stored avatar value

`AvatarStorageService.StoredAvatar` is an existing value containing:

- `url`: secure/public delivery URL persisted to `User.avatarUrl`.
- `storageKey`: provider public ID persisted to `User.avatarStorageKey`.

The binary image remains in Cloudinary. MySQL stores no binary or base64 avatar content.

## Validation invariants

- Content type and decoded content must represent JPEG or PNG; extension and client MIME alone are
  insufficient.
- File size must be `<= 5,242,880` bytes.
- Decoded width must be `<= 4096` pixels.
- Decoded height must be `<= 4096` pixels.
- Decoded `width * height` must be `<= 16,777,216` pixels.
- Exactly one multipart part named `file` is accepted.
- Invalid input must not alter the previously persisted URL or storage key.

Multipart parser failures are distinct from entity validation: requests exceeding the configured
5 MiB per-file limit may fail before a `User` is loaded or changed and must still be represented by
the existing API error envelope.

Validation state progresses as: parser accepted → byte limit accepted → allowed ImageIO reader
identified → width accepted → height accepted → total pixels accepted → full decode accepted.
Only the final accepted state may transition to Cloudinary storage. Width × height is calculated
with `long` to avoid arithmetic overflow; full raster decoding is deferred until after dimension
checks.

## State transition

`existing avatar` → `validated upload` → `stored new asset` → `persisted new URL/key` →
`client cache/session synchronized`

Failure transitions preserve the previous URL/key. A newly stored asset is deleted best effort if
database persistence fails. Deleting an old known asset is best effort after successful commit.

## Schema and migration

The required nullable storage-key column is already defined by
`database/migrations/V3__add_user_avatar_storage_key.sql`. This plan does not modify or create SQL.
