package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Product;
import com.breadfactory.erp.entity.Shop;
import com.breadfactory.erp.repository.ProductRepository;
import com.breadfactory.erp.repository.ShopRepository;
import com.breadfactory.erp.service.PricingService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/pricing")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PricingController {

    private final PricingService pricingService;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceCalculationRequest {
        private Long productId;
        private Long shopId;
        private String customerType; // SHOP, WHOLESALE_DEALER, CUSTOMER
        private BigDecimal requestedPrice;
        private Integer quantity;
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculatePrice(@RequestBody PriceCalculationRequest request) {
        if (request.getProductId() == null) {
            return ResponseEntity.badRequest().body("Product ID is required.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElse(null);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        Shop buyer = null;
        if (request.getShopId() != null) {
            buyer = shopRepository.findById(request.getShopId()).orElse(null);
        } else if (request.getCustomerType() != null) {
            buyer = Shop.builder().customerType(request.getCustomerType()).build();
        }

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                product, 
                buyer, 
                request.getRequestedPrice(), 
                request.getQuantity() != null ? request.getQuantity() : 1
        );

        if (!result.isValid()) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/product/{productId}/buyer/{shopId}")
    public ResponseEntity<PricingService.PriceCalculationResult> getProductPriceForBuyer(
            @PathVariable Long productId,
            @PathVariable Long shopId,
            @RequestParam(required = false) Integer quantity) {

        Product product = productRepository.findById(productId).orElse(null);
        Shop buyer = shopRepository.findById(shopId).orElse(null);

        if (product == null || buyer == null) {
            return ResponseEntity.notFound().build();
        }

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                product, 
                buyer, 
                null, 
                quantity != null ? quantity : 1
        );

        return ResponseEntity.ok(result);
    }
}
