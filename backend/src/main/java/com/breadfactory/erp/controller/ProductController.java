package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Product;
import com.breadfactory.erp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        List<Product> products = productRepository.findAll();
        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            products = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category.trim()))
                    .toList();
        }
        if (search != null && !search.isBlank()) {
            String query = search.trim().toLowerCase();
            products = products.stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(query))
                            || (p.getProductCode() != null && p.getProductCode().toLowerCase().contains(query))
                            || (p.getCategory() != null && p.getCategory().toLowerCase().contains(query)))
                    .toList();
        }
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        return productRepository.findById(id)
                .map(existing -> {
                    if (productDetails.getProductCode() != null) existing.setProductCode(productDetails.getProductCode());
                    if (productDetails.getName() != null) existing.setName(productDetails.getName());
                    if (productDetails.getBarcode() != null) existing.setBarcode(productDetails.getBarcode());
                    if (productDetails.getImageUrl() != null) existing.setImageUrl(productDetails.getImageUrl());
                    if (productDetails.getCategory() != null) existing.setCategory(productDetails.getCategory());
                    if (productDetails.getWeightGrams() != null) existing.setWeightGrams(productDetails.getWeightGrams());
                    if (productDetails.getMrp() != null) existing.setMrp(productDetails.getMrp());
                    if (productDetails.getMinimumSellingPrice() != null) existing.setMinimumSellingPrice(productDetails.getMinimumSellingPrice());
                    if (productDetails.getDealerPrice() != null) existing.setDealerPrice(productDetails.getDealerPrice());
                    if (productDetails.getWholesalePrice() != null) existing.setWholesalePrice(productDetails.getWholesalePrice());
                    if (productDetails.getRetailPrice() != null) existing.setRetailPrice(productDetails.getRetailPrice());
                    if (productDetails.getShelfLifeDays() != null) existing.setShelfLifeDays(productDetails.getShelfLifeDays());
                    return ResponseEntity.ok(productRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
