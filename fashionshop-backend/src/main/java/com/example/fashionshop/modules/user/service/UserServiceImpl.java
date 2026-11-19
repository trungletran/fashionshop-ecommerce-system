package com.example.fashionshop.modules.user.service;

import com.example.fashionshop.common.enums.AccountStatus;
import com.example.fashionshop.common.enums.Role;
import com.example.fashionshop.common.exception.AccountDeletionException;
import com.example.fashionshop.common.exception.BadRequestException;
import com.example.fashionshop.common.exception.CustomerAccountRetrievalException;
import com.example.fashionshop.common.exception.InvalidAccountDeletionException;
import com.example.fashionshop.common.exception.ProfileUpdateException;
import com.example.fashionshop.common.exception.ProfileRetrievalException;
import com.example.fashionshop.common.exception.ResourceNotFoundException;
import com.example.fashionshop.common.exception.StaffAccountLoadException;
import com.example.fashionshop.common.exception.UnauthorizedException;
import com.example.fashionshop.common.mapper.UserMapper;
import com.example.fashionshop.common.util.SecurityUtil;
import com.example.fashionshop.modules.order.entity.Order;
import com.example.fashionshop.modules.order.repository.OrderRepository;
import com.example.fashionshop.modules.user.dto.CreateStaffRequest;
import com.example.fashionshop.modules.user.dto.CustomerAccountResponse;
import com.example.fashionshop.modules.user.dto.CustomerProfileResponse;
import com.example.fashionshop.modules.user.dto.StaffAccountResponse;
import com.example.fashionshop.modules.user.dto.UpdateProfileRequest;
import com.example.fashionshop.modules.user.dto.UpdateStaffRequest;
import com.example.fashionshop.modules.user.dto.UserResponse;
import com.example.fashionshop.modules.user.entity.User;
import com.example.fashionshop.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.util.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;

    @Override
    public UserResponse getMyProfile() {
        User user = getCurrentAuthenticatedUser();
        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse updateMyProfile(UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();
        String normalizedEmail = normalizeRequired(request.getEmail());

        if (userRepository.existsByEmailAndIdNot(normalizedEmail, user.getId())) {
            throw new BadRequestException("Email already exists");
        }

        user.setFullName(normalizeRequired(request.getFullName()));
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        user.setAddress(normalizeOptional(request.getAddress()));
        user.setBio(normalizeOptional(request.getBio()));

        try {
            return UserMapper.toResponse(userRepository.save(user));
        } catch (DataAccessException ex) {
            throw new ProfileUpdateException("Profile update failed", ex);
        }
    }

    @Override
    public UserResponse updateMyAvatar(MultipartFile file) {
        User user = getCurrentAuthenticatedUser();
        if (!Boolean.TRUE.equals(user.getIsActive()) || resolveAccountStatus(user) != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }
        if (file == null || file.isEmpty()) {
            throw new AvatarUploadException(HttpStatus.BAD_REQUEST, "AVATAR_FILE_REQUIRED", "Please select an image file");
        }
        final long maxBytes = 5_242_880L;
        if (file.getSize() > maxBytes) {
            throw new AvatarUploadException(HttpStatus.PAYLOAD_TOO_LARGE, "AVATAR_FILE_TOO_LARGE", "Image must be 5 MiB or smaller");
        }
        String type = file.getContentType();
        if (!"image/jpeg".equals(type) && !"image/png".equals(type)) {
            throw new AvatarUploadException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "AVATAR_UNSUPPORTED_TYPE", "Only JPEG and PNG images are supported");
        }
        String filename = file.getOriginalFilename();
        String extension = filename == null ? "" : filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        if (("image/jpeg".equals(type) && !("jpg".equals(extension) || "jpeg".equals(extension)))
                || ("image/png".equals(type) && !"png".equals(extension))) {
            throw new AvatarUploadException(HttpStatus.BAD_REQUEST, "AVATAR_INVALID_IMAGE", "The image type and file extension do not match");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
            int width;
            int height;
            String format;
            try (ImageInputStream imageInput = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                if (imageInput == null) {
                    throw invalidImage();
                }
                var readers = ImageIO.getImageReaders(imageInput);
                if (!readers.hasNext()) {
                    throw invalidImage();
                }
                ImageReader reader = readers.next();
                try {
                    reader.setInput(imageInput, true, true);
                    format = reader.getFormatName().toLowerCase(Locale.ROOT);
                    boolean allowedFormat = "jpeg".equals(format) || "jpg".equals(format) || "png".equals(format);
                    if (!allowedFormat || ("image/png".equals(type) && !"png".equals(format))
                            || ("image/jpeg".equals(type) && !("jpeg".equals(format) || "jpg".equals(format)))) {
                        throw invalidImage();
                    }
                    width = reader.getWidth(0);
                    height = reader.getHeight(0);
                } finally {
                    reader.dispose();
                }
            }
            if (!isDimensionAllowed(width, height)) {
                throw invalidImage();
            }
            if (ImageIO.read(new ByteArrayInputStream(bytes)) == null) {
                throw invalidImage();
            }
        } catch (AvatarUploadException ex) {
            throw ex;
        } catch (IOException | RuntimeException ex) {
            throw invalidImage();
        }
        AvatarStorageService.StoredAvatar stored;
        try {
            stored = avatarStorageService.store(bytes, type, user.getId());
        } catch (Exception ex) {
            log.error("Avatar storage upload failed for userId={} ({} bytes): {}", user.getId(), bytes.length, ex.getMessage());
            throw new AvatarUploadException(HttpStatus.BAD_GATEWAY, "AVATAR_STORAGE_FAILURE", "Avatar upload failed. Please try again.");
        }
        String oldKey = user.getAvatarStorageKey();
        String oldUrl = user.getAvatarUrl();
        user.setAvatarUrl(stored.url());
        user.setAvatarStorageKey(stored.storageKey());
        try {
            UserResponse response = UserMapper.toResponse(userRepository.save(user));
            log.info("Avatar updated for userId={} ({} bytes)", user.getId(), bytes.length);
            if (oldKey != null && oldKey.startsWith("fashionshop/avatars/" + user.getId() + "/")) {
                try {
                    avatarStorageService.delete(oldKey);
                } catch (RuntimeException cleanupEx) {
                    log.warn("Best-effort cleanup of previous avatar failed for userId={}: {}", user.getId(), cleanupEx.getMessage());
                }
            }
            return response;
        } catch (DataAccessException ex) {
            try {
                avatarStorageService.delete(stored.storageKey());
            } catch (RuntimeException cleanupEx) {
                log.warn("Best-effort rollback cleanup of uncommitted avatar failed for userId={}: {}", user.getId(), cleanupEx.getMessage());
            }
            user.setAvatarUrl(oldUrl);
            user.setAvatarStorageKey(oldKey);
            log.error("Avatar persistence failed for userId={}: {}", user.getId(), ex.getMessage());
            throw new AvatarUploadException(HttpStatus.INTERNAL_SERVER_ERROR, "AVATAR_DATABASE_FAILURE", "Avatar could not be saved");
        }
    }

    private AvatarUploadException invalidImage() {
        return new AvatarUploadException(HttpStatus.BAD_REQUEST, "AVATAR_INVALID_IMAGE", "The image is invalid or exceeds the allowed dimensions");
    }

    static boolean isDimensionAllowed(int width, int height) {
        return width > 0 && height > 0 && width <= 4096 && height <= 4096
                && isPixelCountAllowed((long) width * height);
    }

    static boolean isPixelCountAllowed(long pixels) {
        return pixels > 0 && pixels <= 16_777_216L;
    }

    @Override
    public CustomerProfileResponse getCurrentCustomerProfile() {
        User user = getCurrentCustomerUser();

        try {
            List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
            Order latestOrder = orders.isEmpty() ? null : orders.get(0);

            return CustomerProfileResponse.builder()
                    .personalInfo(CustomerProfileResponse.PersonalInfo.builder()
                            .fullName(user.getFullName())
                            .email(user.getEmail())
                            .phoneNumber(user.getPhoneNumber())
                            .dateOfBirth(null)
                            .gender(null)
                            .build())
                    .accountInfo(CustomerProfileResponse.AccountInfo.builder()
                            .accountId(user.getId())
                            .accountRole(user.getRole() != null ? user.getRole().name() : null)
                            .registrationDate(user.getCreatedAt())
                            .accountStatus(resolveAccountStatus(user).name())
                            .build())
                    .addressInfo(CustomerProfileResponse.AddressInfo.builder()
                            .defaultShippingAddress(latestOrder != null ? latestOrder.getShippingAddress() : null)
                            .billingAddress(null)
                            .city(null)
                            .districtOrState(null)
                            .postalCode(null)
                            .country(null)
                            .build())
                    .extras(CustomerProfileResponse.ProfileExtras.builder()
                            .avatarUrl(user.getAvatarUrl())
                            .linkedLoginProvider(null)
                            .newsletterSubscribed(null)
                            .recentActivity(CustomerProfileResponse.RecentActivitySummary.builder()
                                    .totalOrders(orders.size())
                                    .lastOrderDate(latestOrder != null ? latestOrder.getCreatedAt() : null)
                                    .lastOrderStatus(latestOrder != null && latestOrder.getStatus() != null
                                            ? latestOrder.getStatus().name()
                                            : null)
                                    .build())
                            .build())
                    .build();
        } catch (DataAccessException ex) {
            throw new ProfileRetrievalException("Unable to load profile information", ex);
        }
    }

    @Override
    public UserResponse createStaff(CreateStaffRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (request.getRole() == Role.CUSTOMER) {
            throw new BadRequestException("Invalid role for staff account");
        }
        User currentUser = getCurrentAuthenticatedUser();
        User staff = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .isActive(true)
                .accountStatus(AccountStatus.ACTIVE)
                .managedBy(currentUser)
                .build();
        return UserMapper.toResponse(userRepository.save(staff));
    }

    @Override
    public List<UserResponse> getStaffAccounts() {
        return userRepository.findByRole(Role.STAFF).stream().map(UserMapper::toResponse).toList();
    }

    @Override
    public List<StaffAccountResponse> getAllStaffAccounts() {
        try {
            return userRepository.findByRoleOrderByIdDesc(Role.STAFF).stream()
                    .map(this::toStaffAccountResponse)
                    .toList();
        } catch (Exception ex) {
            throw new StaffAccountLoadException("Unable to load staff accounts", ex);
        }
    }

    @Override
    public List<UserResponse> getCustomerAccounts() {
        return userRepository.findByRole(Role.CUSTOMER).stream().map(UserMapper::toResponse).toList();
    }

    @Override
    public List<CustomerAccountResponse> getAllCustomerAccounts() {
        try {
            return userRepository.findByRoleOrderByIdDesc(Role.CUSTOMER).stream()
                    .map(this::toCustomerAccountResponse)
                    .toList();
        } catch (Exception ex) {
            throw new CustomerAccountRetrievalException("Unable to load customer accounts", ex);
        }
    }

    @Override
    public void deactivateUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot deactivate admin account");
        }
        applyAccountStatus(user, AccountStatus.LOCKED);
        userRepository.save(user);
    }

    @Override
    public UserResponse updateStaff(Integer userId, UpdateStaffRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == Role.CUSTOMER || user.getRole() == Role.ADMIN) {
            throw new BadRequestException("User is not a staff account");
        }
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailAndIdNot(normalizedEmail, user.getId())) {
            throw new BadRequestException("Email already exists");
        }
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        if (request.getRole() != null && request.getRole() != Role.CUSTOMER && request.getRole() != Role.ADMIN) {
            user.setRole(request.getRole());
        }
        return UserMapper.toResponse(userRepository.save(user));
    }

    @Override
    public void activateUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot modify admin account");
        }
        applyAccountStatus(user, AccountStatus.ACTIVE);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccountById(Long id, Boolean confirm) {
        requireConfirmation(confirm);
        Integer userId;
        try {
            userId = Math.toIntExact(id);
        } catch (ArithmeticException ex) {
            throw new ResourceNotFoundException("Account not found");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        deleteAccount(user);
    }

    @Override
    @Transactional
    public void deleteAccountByEmail(String email, Boolean confirm) {
        requireConfirmation(confirm);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        deleteAccount(user);
    }

    private void deleteAccount(User user) {
        validateDeletableAccount(user);

        try {
            // Project currently uses soft delete for user account lifecycle.
            applyAccountStatus(user, AccountStatus.DELETED);
            userRepository.save(user);
        } catch (DataAccessException ex) {
            throw new AccountDeletionException("Account deletion failed");
        }
    }

    private void validateDeletableAccount(User user) {
        if (user.getRole() == Role.ADMIN) {
            throw new InvalidAccountDeletionException("Admin account cannot be deleted");
        }

        if (user.getRole() != Role.STAFF && user.getRole() != Role.CUSTOMER) {
            throw new InvalidAccountDeletionException("Only staff or customer accounts can be deleted");
        }
    }

    private void requireConfirmation(Boolean confirm) {
        if (!Boolean.TRUE.equals(confirm)) {
            throw new BadRequestException("Deletion confirmation is required");
        }
    }

    private CustomerAccountResponse toCustomerAccountResponse(User user) {
        java.util.List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
        java.math.BigDecimal totalSpend = orders.stream()
                .map(o -> o.getTotalPrice() != null ? o.getTotalPrice() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        return CustomerAccountResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(resolveAccountStatus(user).name())
                .totalOrders(orders.size())
                .totalSpend(totalSpend)
                .build();
    }

    private StaffAccountResponse toStaffAccountResponse(User user) {
        return StaffAccountResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(resolveAccountStatus(user).name())
                .build();
    }

    private User getCurrentAuthenticatedUser() {
        String email = SecurityUtil.getCurrentUsername();
        if (!StringUtils.hasText(email)) {
            throw new UnauthorizedException("Unauthorized");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private String normalizeRequired(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private User getCurrentCustomerUser() {
        User user = getCurrentAuthenticatedUser();
        if (user.getRole() != Role.CUSTOMER) {
            throw new UnauthorizedException("Unauthorized");
        }
        return user;
    }

    private AccountStatus resolveAccountStatus(User user) {
        if (user.getAccountStatus() != null) {
            return user.getAccountStatus();
        }
        return Boolean.TRUE.equals(user.getIsActive()) ? AccountStatus.ACTIVE : AccountStatus.LOCKED;
    }

    private void applyAccountStatus(User user, AccountStatus accountStatus) {
        user.setAccountStatus(accountStatus);
        user.setIsActive(accountStatus == AccountStatus.ACTIVE);
    }
}
