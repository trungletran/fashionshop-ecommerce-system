# SPEC-user-avatar — Đổi avatar cho User

**Trạng thái:** Approved — triển khai theo lựa chọn xác nhận của Product Owner

**Vai trò lập tài liệu:** @pm — Product Manager & Lead Architect

**Ngày khảo sát:** 2026-10-23

## 1. Phân tích kiến trúc hiện tại

### Backend

- Stack thực tế trong `pom.xml` là Spring Boot `3.3.4`, Spring Security/JWT, Spring Data JPA, MySQL và H2 test. `java.version` hiện đang là `17`, dù `AGENTS.md` mô tả Java 21; đặc tả này không tự thay đổi cấu hình đó.
- Entity `User` đã có `avatarUrl` ánh xạ tới `users.avatar_url` (`varchar(512)`), và `UserResponse` đã trả `avatarUrl`.
- `UserController` và `MeController` đã có API đọc/cập nhật hồ sơ. `PUT /api/me` và `PUT /api/users/profile` hiện nhận JSON `UpdateProfileRequest`, trong đó `avatarUrl` chỉ là một URL HTTP/HTTPS do client cung cấp; đây không phải quy trình upload an toàn.
- `UserServiceImpl` xác định user hiện tại bằng email trong `SecurityContextHolder` qua `SecurityUtil.getCurrentUsername()`, sau đó truy vấn `UserRepository.findByEmail(...)`. Không có logic nhận `userId` từ client cho hồ sơ hiện tại.
- JWT subject là email; `JwtAuthenticationFilter` tải `UserDetails` từ email và security config yêu cầu authentication cho `/api/**` ngoài các endpoint public.
- `CustomerProfileResponse.ProfileExtras` có trường `avatarUrl`, nhưng `getCurrentCustomerProfile()` hiện đang gán `null` thay vì lấy từ `user.avatarUrl`.
- Chưa có backend upload controller/service, storage abstraction, multipart configuration riêng, static-resource mapping hoặc thư viện Cloudinary trong backend.
- `GlobalExceptionHandler` đã có quy ước `ApiResponse`, nhưng chưa có mã lỗi chuyên biệt cho file quá lớn, MIME không hỗ trợ, ảnh hỏng, storage failure hoặc database/storage consistency.

### Frontend

- Next.js App Router, TypeScript, TanStack Query và Zustand đã có sẵn; `src/features/users/services.ts` và `hooks.ts` là điểm tích hợp user profile.
- Trang `/account` hiển thị `user.avatarUrl` bằng `next/image`; nếu không có URL thì dùng chữ cái đầu của tên user. Đây là quy ước avatar mặc định hiện có, chưa có file ảnh mặc định riêng.
- Trang `/account/edit` dùng `ProfileForm`, hiện chỉ có các field tên, email và số điện thoại; chưa có chọn file, preview hoặc upload.
- `queryKeys.me` là key server-state chính cho dữ liệu user. `useUpdateMeMutation()` invalidate các query có prefix `me` sau khi cập nhật.
- Zustand auth store persist `token` và `user`. Nếu chỉ cập nhật React Query mà không đồng bộ store, các component đọc session có thể giữ avatar cũ.
- `src/lib/cloudinary.ts` có upload trực tiếp từ browser tới Cloudinary bằng unsigned upload preset, dùng cho product uploader. Đây là bằng chứng dự án có tích hợp Cloudinary ở frontend, nhưng không phải bằng chứng backend đã được cấu hình hoặc có thể tin URL do client gửi.
- `next.config.ts` đã allow `res.cloudinary.com`; frontend hiện đã sẵn sàng hiển thị URL Cloudinary.
- `ImageUploader` hiện giới hạn 5 MB và kiểm tra MIME theo `image/*`, nhưng upload trực tiếp này không kiểm tra nội dung ảnh thực tế ở backend và không phù hợp để quyết định avatar của user.

### Database và migration

- `database/ecommerce_db.sql` và `database/V1__sync_schema_with_entities.sql` đều có `users.avatar_url varchar(512) NULL`.
- Chưa có cột lưu storage key/public ID. Nếu chỉ lưu URL, backend không thể xác định chắc chắn asset cũ để xóa khi đổi ảnh.
- Hiện không có bảng/file metadata riêng cho avatar và không có dữ liệu ảnh dạng BLOB/base64.
- `application.properties` đang dùng `spring.jpa.hibernate.ddl-auto=update`; migration SQL vẫn phải được bổ sung cho schema triển khai và dữ liệu hiện có. Migration không được xóa hoặc đổi kiểu `avatar_url`.

## 2. Phạm vi và yêu cầu nghiệp vụ

### Trong phạm vi

1. User đã đăng nhập xem avatar hiện tại tại `/account` và khu vực chỉnh sửa hồ sơ.
2. Chọn đúng một ảnh từ thiết bị, xem preview cục bộ trước khi gửi.
3. Xác nhận upload hoặc hủy; hủy không gọi API và không thay đổi avatar đang lưu.
4. Upload thành công cập nhật avatar trên hồ sơ hiện tại và các vùng giao diện đang dùng cùng dữ liệu user.
5. Avatar tồn tại sau logout/login vì URL và storage key được lưu bền vững.
6. User chỉ có thể thay đổi avatar của chính mình.
7. User chưa có avatar tiếp tục dùng fallback chữ cái đầu tên, không gửi ảnh mặc định lên server.
8. Lỗi upload không thay thế hoặc xóa avatar hiện tại.

### Ngoài phạm vi

- Crop/rotate/editor nâng cao.
- Xóa avatar về trạng thái không có avatar (có thể mở rộng sau).
- Quản trị viên thay avatar thay cho user khác.
- Lưu ảnh trong MySQL.
- Upload nhiều avatar hoặc thư viện ảnh.

### Quy tắc nghiệp vụ

- Mỗi request chỉ nhận một file.
- Ảnh mới chỉ trở thành avatar chính sau khi storage upload thành công và database save thành công.
- Nếu database save thất bại sau khi storage upload thành công, asset mới phải được best-effort cleanup; avatar cũ vẫn giữ trong DB/UI.
- Nếu cleanup asset cũ thất bại sau khi commit thành công, không rollback avatar mới; ghi log cảnh báo và chạy cơ chế cleanup/retry vận hành sau.

## 3. Quyết định kiến trúc lưu trữ ảnh

### Phương án khuyến nghị: Cloudinary server-side

Tận dụng Cloudinary đang được dùng ở frontend nhưng chuyển quyền kiểm soát upload avatar về backend:

1. Frontend gửi `multipart/form-data` tới backend.
2. Backend kiểm tra kích thước, MIME khai báo, magic bytes và giải mã ảnh thực tế.
3. Backend dùng Cloudinary server-side API/SDK với secret chỉ nằm ở backend để upload vào folder `fashionshop/avatars/{userId}`.
4. Backend lưu `secure_url` vào `users.avatar_url` và `public_id` vào cột mới `users.avatar_storage_key`.
5. Response chỉ trả URL public delivery cần cho frontend; không trả API secret, filesystem path hoặc thông tin credential.

Phương án này phù hợp yêu cầu bền vững khi backend/frontend deploy riêng. Cần bổ sung backend config tương đương `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; giá trị phải lấy từ environment/secret manager, không commit vào repository.

### Phương án thay thế: filesystem local

Có thể lưu ngoài database dưới thư mục cấu hình và expose qua endpoint/handler kiểm soát. Phương án này phù hợp local development nhưng không được chọn cho production nếu runtime có disk ephemeral hoặc nhiều instance; sẽ không đảm bảo ảnh còn sau redeploy/scale. Nếu chọn phương án này, cần object storage hoặc persistent volume và thiết kế URL proxy riêng.

**Điểm cần phê duyệt:** xác nhận Cloudinary server-side là storage production được chọn. Nếu không, cần chỉ định object storage khác trước khi @engineer triển khai.

## 4. Luồng UI/UX

1. Người dùng mở `/account`; avatar URL hiện tại được hiển thị. Nếu `avatarUrl` null/rỗng, hiển thị fallback chữ cái đầu như hiện tại.
2. Người dùng chọn `Edit Profile`. Khu vực Avatar hiển thị ảnh hiện tại/fallback, nút “Choose image” và mô tả giới hạn `JPEG/PNG, tối đa 5 MB`.
3. Khi chọn file, frontend kiểm tra nhanh size/type, tạo `URL.createObjectURL(file)` để preview cục bộ. Preview này chưa phải avatar đã lưu.
4. Hiển thị hai hành động: “Upload avatar” và “Cancel”. Cancel giải phóng object URL, xóa file pending và khôi phục preview avatar hiện tại.
5. Khi xác nhận, disable input/nút, hiển thị loading và gửi multipart tới API. Không optimistic-update avatar chính thức.
6. Thành công: nhận `UserResponse` mới, cập nhật React Query cache cho các query thuộc `me`, đồng bộ `AuthUser` trong Zustand, giải phóng preview URL, hiển thị toast success và cập nhật ảnh ngay trên `/account`/header nếu component đó đang dùng user state.
7. Thất bại: giữ ảnh cũ, giữ form hoạt động, hiển thị thông báo theo lỗi API; không cập nhật cache bằng URL tạm.
8. Accessibility: file input có label/ARIA, nút có trạng thái disabled và live region cho lỗi/thành công; layout hoạt động trên mobile.

## 5. API contract

### Upload avatar

`POST /api/me/avatar`

- Authentication: bắt buộc `Authorization: Bearer <JWT>`.
- Content-Type: `multipart/form-data`.
- Part bắt buộc: `file` (`MultipartFile`). Không nhận `userId`; user được suy ra từ JWT subject/security context.
- Response thành công: `200 OK`.

```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": {
    "id": "3",
    "fullName": "Customer Account",
    "email": "customer@gmail.com",
    "phoneNumber": "0987654321",
    "address": "789 Vo Van Tan, District 3, HCMC",
    "avatarUrl": "https://res.cloudinary.com/<cloud>/image/upload/v.../fashionshop/avatars/3/<generated-id>.jpg",
    "bio": "Fashion Enthusiast",
    "role": "CUSTOMER",
    "isActive": true,
    "accountStatus": "ACTIVE",
    "createdAt": "2026-03-03T14:36:50"
  }
}
```

Response dùng lại `UserResponse`; không trả `avatar_storage_key` ra client. URL nên có version/unique asset identifier để tránh browser/CDN cache ảnh cũ.

### HTTP status và mã lỗi đề xuất

| Status | Code | Khi nào |
|---|---|---|
| 200 | — | Upload và cập nhật DB thành công |
| 400 | `AVATAR_FILE_REQUIRED`, `AVATAR_INVALID_IMAGE` | Thiếu file, file rỗng, ảnh không giải mã được, nội dung không khớp loại ảnh |
| 401 | — | JWT thiếu, hết hạn hoặc không hợp lệ |
| 403 | — | Tài khoản không được phép hoạt động; endpoint không cho đổi user khác |
| 413 | `AVATAR_FILE_TOO_LARGE` | Vượt giới hạn 5 MB |
| 415 | `AVATAR_UNSUPPORTED_TYPE` | Không thuộc MIME/format được phép |
| 500 | `AVATAR_DATABASE_FAILURE` | Không lưu được URL/key sau upload |
| 502 | `AVATAR_STORAGE_FAILURE` | Cloudinary/storage không upload hoặc không phản hồi |

Các lỗi phải dùng envelope `ApiResponse` hiện có, message thân thiện cho người dùng và log server chứa nguyên nhân kỹ thuật; không trả stack trace, secret, local path hoặc raw provider credential.

### Đọc hồ sơ

- Giữ nguyên `GET /api/me`, `GET /api/users/profile`.
- `UserResponse.avatarUrl` trả URL mới nhất hoặc `null`.
- Sửa `GET /api/users/me` để `CustomerProfileResponse.extras.avatarUrl` lấy từ `user.avatarUrl`, thay vì luôn `null`.

## 6. DTO, service và transaction boundary

Đề xuất các thay đổi logic, không phải code trong giai đoạn này:

- Tạo request binding multipart ở controller bằng `@RequestPart("file") MultipartFile file`; không tạo DTO JSON chứa userId.
- Tạo response riêng nếu cần `AvatarUploadResponse { avatarUrl, updatedAt }`, nhưng ưu tiên trả `UserResponse` để đồng bộ với profile hiện tại và giảm DTO trùng lặp.
- Bổ sung method `updateMyAvatar(MultipartFile file)` vào `UserService`.
- Tách `AvatarStorageService`/adapter khỏi `UserService` để business service không phụ thuộc trực tiếp Cloudinary SDK.
- Lưu giá trị cũ trước khi upload. Quy trình: resolve current user → validate bytes → upload asset mới với key generated → save new URL/key → commit → best-effort delete old asset.
- Không dùng tên file gốc làm path/key; chỉ dùng generated ID và user ID lấy từ server.
- Nếu `userRepository.save` lỗi, cố gắng xóa asset mới và ném lỗi ổn định; tuyệt đối không set DB về null hoặc xóa asset cũ trước khi commit.
- Cleanup asset cũ chỉ thực hiện khi có `avatar_storage_key` thuộc namespace avatar của user; URL/key legacy không rõ nguồn gốc thì không xóa tự động.

## 7. Database và migration

### Thay đổi đề xuất

Thêm migration mới, ví dụ `database/migrations/V3__add_user_avatar_storage_key.sql`:

```sql
ALTER TABLE users
    ADD COLUMN avatar_storage_key VARCHAR(255) NULL;
```

Migration phải idempotent theo quy ước dự án hoặc được chạy một lần bởi migration runner. Không đổi `avatar_url`, không xóa dữ liệu hiện có và không lưu binary/base64.

### Dữ liệu hiện có

- Các user có `avatar_url` cũ vẫn hiển thị bình thường.
- `avatar_storage_key` cũ để null; hệ thống không cố suy đoán public ID từ URL.
- Khi user upload lần đầu, cả URL và storage key mới được lưu.
- Cần xác nhận cơ chế migration của môi trường triển khai vì backend hiện chưa thể hiện Flyway/Liquibase dependency trong `pom.xml`; không được dựa duy nhất vào `ddl-auto=update` cho production.

## 8. Validation, bảo mật và xử lý lỗi

### Validation bắt buộc ở backend

- Kích thước request/file tối đa: 5 MB; cấu hình cả Spring multipart max file size/request size và kiểm tra service.
- Chỉ cho phép `image/jpeg` và `image/png` ở phiên bản đầu; không cho SVG, GIF hoặc file tùy ý. Nếu muốn giữ WEBP, phải bổ sung image decoder được kiểm chứng và test tương ứng.
- Không tin `Content-Type` do browser gửi. Kiểm tra magic bytes/file signature và dùng image decoder để đọc metadata/pixel stream thực tế.
- Từ chối file rỗng, file truncated, ảnh không decode được, MIME/extension/signature không nhất quán, kích thước pixel quá lớn gây nguy cơ decompression bomb. Đề xuất giới hạn tối đa 4096×4096 và tổng pixel theo cấu hình.
- Không dùng extension/tên file client để tạo path; generate public ID server-side.
- Không cho phép URL tùy ý từ `UpdateProfileRequest.avatarUrl` trở thành avatar mới cho flow này. Flow upload mới là nguồn chuẩn; nếu cần giữ chỉnh sửa profile cũ, phải loại bỏ field khỏi client hoặc chỉ chấp nhận URL theo policy đã xác minh.

### Authorization và privacy

- Chỉ dùng `SecurityContextHolder`/JWT subject để resolve current user; không nhận `userId` trong request.
- `/api/me/avatar` nằm dưới `/api/**` authenticated; không cần mở public.
- Kiểm tra account status giống profile flow; user deleted/locked không được cập nhật.
- Cloudinary API secret chỉ ở backend. Unsigned direct upload từ browser không được dùng cho avatar production vì client có thể upload ngoài ownership/validation flow.
- URL delivery có thể public để `<img>` hiển thị; không trả internal filesystem path. Nếu storage cần private, phải có signed delivery URL và cơ chế refresh, là một quyết định mở rộng khác.
- Rate limit/anti-abuse cho endpoint nên được cấu hình ở gateway hoặc backend nếu production có nguy cơ spam upload; ít nhất log user ID, size, result và provider request ID, không log binary/token.

## 9. Danh sách file dự kiến tạo mới/chỉnh sửa

### Tạo mới dự kiến

- `docs/specs/SPEC-user-avatar.md` — tài liệu này.
- Backend DTO/exception/storage adapter/config cho multipart và Cloudinary, theo convention module hiện tại.
- `database/migrations/V3__add_user_avatar_storage_key.sql`.
- Backend unit/controller/integration tests cho avatar.
- Frontend component feature-specific, ví dụ `fashionshop-frontend/src/features/users/components/avatar-uploader.tsx`, nếu không gộp vào `ProfileForm`.
- Frontend tests cho picker/preview/cancel/loading/error/success.

### Chỉnh sửa dự kiến

- Backend `User`, `UserService`, `UserServiceImpl`, `UserController` hoặc `MeController`, `CustomerProfileResponse`, `GlobalExceptionHandler`, application config và `pom.xml` nếu thêm Cloudinary SDK/image decoder.
- Frontend `src/features/users/services.ts`, `hooks.ts`, `types/user.ts`, `src/app/(customer)/account/edit/page.tsx`, `src/app/(customer)/account/page.tsx`, `src/features/auth/store.ts` và `src/lib/api/query-keys.ts` nếu cần key riêng.
- Các component avatar/header có dùng `AuthUser` hoặc profile query để đồng bộ ảnh mới.
- Không chỉnh `database/ecommerce_db.sql` để làm migration production; nếu repository yêu cầu dump mẫu đồng bộ, cập nhật sau khi migration được duyệt và kiểm tra dữ liệu.

## 10. Test cases

### Backend unit/service

1. Authenticated user upload JPEG hợp lệ → storage upload, DB save URL/key, response có avatarUrl mới.
2. Authenticated user upload PNG hợp lệ → thành công.
3. Thiếu authentication → `401`, repository/storage không bị gọi.
4. File null/rỗng → `400 AVATAR_FILE_REQUIRED`, avatar cũ không đổi.
5. Vượt 5 MB → `413`, storage không bị gọi.
6. MIME không hỗ trợ, SVG hoặc file text đổi đuôi `.png` → `415/400`, storage không bị gọi.
7. Magic bytes hợp lệ nhưng ảnh hỏng/truncated → `400 AVATAR_INVALID_IMAGE`.
8. Ảnh pixel quá lớn → bị từ chối, không gây OOM.
9. Cloudinary/storage failure → `502`, DB không đổi, avatar cũ còn nguyên.
10. DB save failure sau storage upload → `500`, gọi cleanup asset mới best-effort, avatar cũ không bị xóa.
11. Lưu thành công nhưng cleanup asset cũ lỗi → response vẫn thành công, log cảnh báo, URL mới được giữ.
12. User có URL legacy nhưng không có storage key → upload mới thành công, không cố xóa URL legacy.
13. Request cố truyền userId/field lạ → bị bỏ qua hoặc không ảnh hưởng; user đích luôn là JWT subject.
14. `GET /api/users/me` trả `extras.avatarUrl` đúng giá trị entity.
15. H2 test profile/avatar schema tương thích và không lưu binary/base64.

### Backend controller/security

1. `POST /api/me/avatar` yêu cầu multipart đúng part name `file`.
2. Request JSON hoặc multipart thiếu file trả lỗi chuẩn `ApiResponse`.
3. JWT của user A không thể cập nhật user B vì endpoint không có path/userId.
4. CORS cho frontend origin hiện có vẫn hoạt động với POST multipart.
5. Không lộ stack trace, local path, Cloudinary secret trong response.

### Frontend

1. Hiển thị avatar server hiện tại.
2. Không có avatar → hiển thị chữ cái đầu như quy ước hiện tại.
3. Chọn JPEG/PNG hợp lệ → preview cục bộ trước xác nhận.
4. Chọn file quá lớn/không phải ảnh → báo lỗi trước khi gọi API.
5. Cancel → preview và avatar chính thức trở về ảnh cũ; không gọi API.
6. Xác nhận → gửi `FormData`, không gửi JSON URL/userId.
7. Loading → disable picker/nút và có trạng thái accessible.
8. Upload thành công → toast, cập nhật `/account`, profile query và Zustand session.
9. Upload lỗi/network error → toast lỗi rõ ràng, ảnh cũ vẫn hiển thị, có thể thử lại.
10. Re-render sau logout/login → avatar lấy lại từ API vẫn là ảnh mới.
11. Avatar lỗi tải ảnh → fallback chữ cái đầu; không làm vỡ layout.
12. Responsive và keyboard navigation cho file picker/confirm/cancel.
13. Test React Query invalidation không tạo request lặp vô hạn.

### QA commands sau khi implementation được phê duyệt

- Backend: `mvnw.cmd test` trong `fashionshop-backend/`.
- Frontend: `npm run lint` và `npm test`/`npm run test:run` trong `fashionshop-frontend/`.
- Manual: kiểm tra Network payload multipart, cache sau upload, logout/login, CORS và storage cleanup.

## 11. Tiêu chí nghiệm thu

- [ ] User authenticated có thể xem avatar hiện tại hoặc fallback chữ cái đầu.
- [ ] User chọn ảnh và xem preview trước khi xác nhận.
- [ ] Cancel không thay đổi server hoặc avatar hiện tại.
- [ ] Backend tự xác định user từ JWT; không có khả năng đổi avatar theo userId tùy ý.
- [ ] Backend kiểm tra size, MIME/signature và decode nội dung ảnh thực tế.
- [ ] File không hợp lệ, quá lớn hoặc storage lỗi trả thông báo rõ ràng và không làm mất avatar cũ.
- [ ] Avatar mới được lưu bền vững qua logout/login và URL hiển thị được trên frontend.
- [ ] URL và storage key được lưu, không lưu base64/BLOB; migration tương thích dữ liệu hiện có.
- [ ] Asset cũ chỉ bị xóa sau khi avatar mới đã được commit; lỗi cleanup không làm mất avatar mới.
- [ ] Các query/cache/session/component avatar được cập nhật nhất quán.
- [ ] Test backend/frontend và checklist frontend đạt, không phát sinh lỗi lint/test.

## 12. Quyết định cần Product Owner phê duyệt

1. **Storage production:** phê duyệt Cloudinary server-side như phương án chính, hay chỉ định S3/R2/MinIO/object storage khác?
2. **Định dạng:** phê duyệt chỉ JPEG/PNG ở phiên bản đầu để dùng decoder an toàn sẵn có, hay bắt buộc hỗ trợ WEBP và chấp nhận thêm thư viện decoder/test?
3. **Kích thước:** phê duyệt giới hạn 5 MB và tối đa 4096×4096 pixel.
4. **Privacy:** phê duyệt delivery URL public của avatar; nếu avatar phải private, cần thiết kế signed URL riêng.
5. **API profile legacy:** sau khi có endpoint upload, có cho phép tiếp tục nhận `avatarUrl` tùy ý trong `PUT /api/me` không? Khuyến nghị: không cho client set URL tự do để tránh bypass validation.

Đặc tả này chỉ được chuyển sang trạng thái **Approved** sau khi các quyết định trên được xác nhận. Chưa triển khai code, chưa chạy migration và chưa thay đổi file ứng dụng.
