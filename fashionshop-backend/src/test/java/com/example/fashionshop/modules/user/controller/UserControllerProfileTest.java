package com.example.fashionshop.modules.user.controller;

import com.example.fashionshop.common.exception.GlobalExceptionHandler;
import com.example.fashionshop.common.exception.ProfileRetrievalException;
import com.example.fashionshop.modules.user.dto.CustomerProfileResponse;
import com.example.fashionshop.modules.user.dto.UserResponse;
import com.example.fashionshop.modules.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class, com.example.fashionshop.config.TestSecurityConfig.class})
class UserControllerProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void getCurrentCustomerProfile_shouldReturnProfile() throws Exception {
        CustomerProfileResponse profile = CustomerProfileResponse.builder()
                .personalInfo(CustomerProfileResponse.PersonalInfo.builder()
                        .fullName("Jane Customer")
                        .email("jane@example.com")
                        .phoneNumber("0900123456")
                        .build())
                .accountInfo(CustomerProfileResponse.AccountInfo.builder()
                        .accountId(101)
                        .accountRole("CUSTOMER")
                        .accountStatus("ACTIVE")
                        .registrationDate(LocalDateTime.of(2026, 1, 10, 8, 30))
                        .build())
                .addressInfo(CustomerProfileResponse.AddressInfo.builder()
                        .defaultShippingAddress("123 Main St")
                        .build())
                .extras(CustomerProfileResponse.ProfileExtras.builder()
                        .recentActivity(CustomerProfileResponse.RecentActivitySummary.builder()
                                .totalOrders(2)
                                .lastOrderStatus("DELIVERED")
                                .build())
                        .build())
                .build();

        when(userService.getCurrentCustomerProfile()).thenReturn(profile);

        mockMvc.perform(get("/api/users/me").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile fetched successfully"))
                .andExpect(jsonPath("$.data.personalInfo.fullName").value("Jane Customer"))
                .andExpect(jsonPath("$.data.accountInfo.accountId").value(101))
                .andExpect(jsonPath("$.data.extras.recentActivity.totalOrders").value(2));
    }

    @Test
    void getCurrentCustomerProfile_shouldReturnFriendlyErrorWhenProfileLoadFails() throws Exception {
        when(userService.getCurrentCustomerProfile())
                .thenThrow(new ProfileRetrievalException("Unable to load profile information", new RuntimeException()));

        mockMvc.perform(get("/api/users/me").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unable to load profile information"));
    }

    @Test
    void updateProfile_shouldRejectInvalidAvatarUrl() throws Exception {
        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Jane Customer",
                                  "email": "jane@example.com",
                                  "avatarUrl": "javascript:alert(1)"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Avatar must be a valid http/https URL"));

        verifyNoInteractions(userService);
    }

    @Test
    void updateProfile_shouldDelegateValidLegacyPayload() throws Exception {
        when(userService.updateMyProfile(any())).thenReturn(UserResponse.builder()
                .id(101)
                .fullName("Jane Updated")
                .email("jane@example.com")
                .avatarUrl("https://res.cloudinary.com/demo/image/upload/v1/fashionshop/avatars/101/original.png")
                .build());

        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Jane Updated",
                                  "email": "jane@example.com",
                                  "avatarUrl": "https://evil.example/override.png"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Jane Updated"))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://res.cloudinary.com/demo/image/upload/v1/fashionshop/avatars/101/original.png"));
    }
}
