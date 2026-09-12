package com.example.fashionshop.modules.category.service;

import com.example.fashionshop.common.exception.ResourceNotFoundException;
import com.example.fashionshop.modules.category.dto.CategoryRequest;
import com.example.fashionshop.modules.category.dto.CategoryResponse;
import com.example.fashionshop.modules.category.entity.Category;
import com.example.fashionshop.modules.category.repository.CategoryRepository;
import com.example.fashionshop.modules.product.repository.ProductRepository;
import com.example.fashionshop.modules.user.entity.User;
import com.example.fashionshop.modules.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void create_shouldCreateCategorySuccessfully() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("admin@shop.com", "password"));

        User admin = User.builder().id(1).email("admin@shop.com").build();
        when(userRepository.findByEmail("admin@shop.com")).thenReturn(Optional.of(admin));

        Category category = Category.builder()
                .id(10)
                .name("Accessories")
                .description("Bags and belts")
                .isActive(true)
                .createdBy(admin)
                .build();

        when(categoryRepository.save(any(Category.class))).thenReturn(category);

        CategoryRequest request = new CategoryRequest();
        request.setName("Accessories");
        request.setDescription("Bags and belts");

        CategoryResponse response = categoryService.create(request);

        assertNotNull(response);
        assertEquals(10, response.getId());
        assertEquals("Accessories", response.getName());
        assertEquals("Bags and belts", response.getDescription());
        assertTrue(response.getIsActive());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void create_shouldThrowWhenUserNotFound() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("ghost@shop.com", "password"));

        when(userRepository.findByEmail("ghost@shop.com")).thenReturn(Optional.empty());

        CategoryRequest request = new CategoryRequest();
        request.setName("Shoes");

        assertThrows(ResourceNotFoundException.class, () -> categoryService.create(request));
    }

    @Test
    void getAll_shouldReturnOnlyActiveCategories() {
        Category cat1 = Category.builder().id(1).name("Jeans").isActive(true).build();
        Category cat2 = Category.builder().id(2).name("Shirts").isActive(true).build();

        when(categoryRepository.findByIsActiveTrueOrderByNameAsc()).thenReturn(List.of(cat1, cat2));

        List<CategoryResponse> list = categoryService.getAll();

        assertEquals(2, list.size());
        assertEquals("Jeans", list.get(0).getName());
        assertEquals("Shirts", list.get(1).getName());
    }

    @Test
    void getManageCategories_shouldReturnAllCategories() {
        Category cat1 = Category.builder().id(1).name("Jeans").isActive(true).build();
        Category cat2 = Category.builder().id(2).name("Old Style").isActive(false).build();

        when(categoryRepository.findAll()).thenReturn(List.of(cat1, cat2));

        List<CategoryResponse> list = categoryService.getManageCategories();

        assertEquals(2, list.size());
        assertTrue(list.get(0).getIsActive());
        assertFalse(list.get(1).getIsActive());
    }

    @Test
    void delete_shouldDeactivateCategoryAndItsProducts() {
        Category category = Category.builder().id(5).name("Jackets").isActive(true).build();
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));

        categoryService.delete(5);

        assertFalse(category.getIsActive());
        verify(categoryRepository).save(category);
        verify(productRepository).updateIsActiveByCategoryId(5, false);
    }

    @Test
    void delete_shouldThrowWhenCategoryNotFound() {
        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.delete(99));
    }

    @Test
    void activate_shouldActivateCategorySuccessfully() {
        Category category = Category.builder().id(5).name("Jackets").isActive(false).build();
        when(categoryRepository.findById(5)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(Category.class))).thenReturn(category);

        CategoryResponse response = categoryService.activate(5);

        assertTrue(category.getIsActive());
        assertTrue(response.getIsActive());
        verify(categoryRepository).save(category);
    }
}
