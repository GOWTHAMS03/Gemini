package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Category;
import com.breadfactory.erp.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getById(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Category> create(@RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody Category details) {
        return categoryRepository.findById(id)
                .map(existing -> {
                    if (details.getName() != null) existing.setName(details.getName());
                    if (details.getCode() != null) existing.setCode(details.getCode());
                    if (details.getSlug() != null) existing.setSlug(details.getSlug());
                    if (details.getHsnCode() != null) existing.setHsnCode(details.getHsnCode());
                    if (details.getGstRate() != null) existing.setGstRate(details.getGstRate());
                    if (details.getItemCount() != null) existing.setItemCount(details.getItemCount());
                    if (details.getColor() != null) existing.setColor(details.getColor());
                    if (details.getStatus() != null) existing.setStatus(details.getStatus());
                    if (details.getSubCategories() != null) existing.setSubCategories(details.getSubCategories());
                    return ResponseEntity.ok(categoryRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
