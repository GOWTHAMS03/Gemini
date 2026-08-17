package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    Optional<Recipe> findByProductIdAndIsActiveTrue(Long productId);

    @Query("SELECT DISTINCT r FROM Recipe r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.items i LEFT JOIN FETCH i.rawMaterial")
    List<Recipe> findAllWithDetails();

    @Query("SELECT r FROM Recipe r LEFT JOIN FETCH r.product LEFT JOIN FETCH r.items i LEFT JOIN FETCH i.rawMaterial WHERE r.id = :id")
    Optional<Recipe> findByIdWithDetails(@Param("id") Long id);
}

