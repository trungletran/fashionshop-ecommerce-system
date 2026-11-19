# Avatar Upload Contract

## Endpoint

`POST /api/me/avatar`

- Authentication: existing JWT bearer authentication.
- Content type: `multipart/form-data`.
- Parts: exactly one file part named `file`; multiple avatar file parts are rejected.
- Target user: resolved from the authenticated security context; no client user ID.

The server must inspect the complete multipart collection for `file`; a single controller parameter
does not by itself establish duplicate rejection.

## Success

`200 OK` with the existing `ApiResponse<UserResponse>` envelope. The response includes the updated
`avatarUrl` and existing profile fields. It does not include `avatarStorageKey`, Cloudinary API
credentials, provider secrets, or internal file paths.

## Validation

The backend validates before Cloudinary upload:

- JPEG or PNG actual content only.
- File size `<= 5,242,880` bytes.
- Width `<= 4096` pixels.
- Height `<= 4096` pixels.
- Width × height `<= 16,777,216` pixels.
- Missing, empty, malformed, truncated, unsupported, oversized, dimension-invalid, and multiple-
  part requests are rejected through existing API error conventions.

## Error behavior

Use the existing `ApiResponse` error envelope and current exception handling. Existing avatar codes
include `AVATAR_FILE_REQUIRED`, `AVATAR_FILE_TOO_LARGE`, `AVATAR_UNSUPPORTED_TYPE`,
`AVATAR_INVALID_IMAGE`, `AVATAR_STORAGE_FAILURE`, and `AVATAR_DATABASE_FAILURE` where applicable.
Multiple `file` parts use HTTP 400 with the feature-specific `AVATAR_MULTIPLE_FILES` code and the
same `ApiResponse` envelope. A parser-level file-size rejection uses HTTP 413 with
`AVATAR_FILE_TOO_LARGE`, even though the service is not reached.
No raw provider credentials, stack traces, or local paths are exposed.

The validation sequence is: parser/request limits; exact byte size; actual ImageIO reader format;
width; height; width × height; then complete decode/structural validation. The implementation
should inspect width and height through ImageIO reader metadata before full raster decoding. No
image is sent to Cloudinary until all checks pass.

## Legacy profile endpoints

`PUT /api/me` and `PUT /api/users/profile` retain non-avatar profile updates but must not mutate the
stored avatar from client-supplied `avatarUrl`. Valid legacy `avatarUrl` input may be accepted and
ignored for compatibility; invalid values continue through existing DTO validation.
