package com.example.fashionshop.modules.category.service;

import com.example.fashionshop.modules.category.dto.CategoryRequest;
import com.example.fashionshop.modules.category.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse create(CategoryRequest request);

    List<CategoryResponse> getAll();

    List<CategoryResponse> getManageCategories();

    void delete(Integer categoryId);

    CategoryResponse activate(Integer categoryId);
}