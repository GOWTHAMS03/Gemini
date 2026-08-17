package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Recipe;
import com.breadfactory.erp.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recipes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecipeController {

    private final RecipeRepository recipeRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeRepository.findAllWithDetails());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Recipe> getRecipeById(@PathVariable Long id) {
        return recipeRepository.findByIdWithDetails(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Recipe> createRecipe(@RequestBody Recipe recipe) {
        if (recipe.getItems() != null) {
            recipe.getItems().forEach(item -> item.setRecipe(recipe));
        }
        Recipe saved = recipeRepository.save(recipe);
        return ResponseEntity.ok(recipeRepository.findByIdWithDetails(saved.getId()).orElse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Recipe> updateRecipe(@PathVariable Long id, @RequestBody Recipe recipeDetails) {
        return recipeRepository.findById(id)
                .map(existing -> {
                    if (recipeDetails.getRecipeName() != null) existing.setRecipeName(recipeDetails.getRecipeName());
                    if (recipeDetails.getProduct() != null) existing.setProduct(recipeDetails.getProduct());
                    if (recipeDetails.getBatchOutputQuantity() != null) existing.setBatchOutputQuantity(recipeDetails.getBatchOutputQuantity());
                    if (recipeDetails.getIsActive() != null) existing.setIsActive(recipeDetails.getIsActive());
                    if (recipeDetails.getItems() != null) {
                        existing.getItems().clear();
                        recipeDetails.getItems().forEach(item -> {
                            item.setRecipe(existing);
                            existing.getItems().add(item);
                        });
                    }
                    Recipe saved = recipeRepository.save(existing);
                    return ResponseEntity.ok(recipeRepository.findByIdWithDetails(saved.getId()).orElse(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        if (recipeRepository.existsById(id)) {
            recipeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

