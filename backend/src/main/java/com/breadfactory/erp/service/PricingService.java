package com.breadfactory.erp.service;

import com.breadfactory.erp.entity.Product;
import com.breadfactory.erp.entity.Shop;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Centralized Pricing Engine & Business Rules Service.
 * Implements buyer-type based pricing calculations and strict minimum selling price validations.
 */
@Service
public class PricingService {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceCalculationResult {
        private Long productId;
        private String productCode;
        private String productName;
        private String customerType; // SHOP, WHOLESALE_DEALER, CUSTOMER
        private BigDecimal mrp;
        private BigDecimal minimumSellingPrice;
        private BigDecimal discountPercent;
        private BigDecimal basePrice;
        private BigDecimal unitSellingPrice;
        private BigDecimal totalPrice;
        private Integer quantity;
        private boolean valid;
        private String validationMessage;
    }

    /**
     * Calculates the unit selling price and line total according to buyer type rules.
     */
    public PriceCalculationResult calculatePrice(Product product, Shop buyer, BigDecimal requestedPrice, Integer quantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null for price calculation.");
        }
        int qty = (quantity != null && quantity > 0) ? quantity : 1;
        String rawType = buyer != null && buyer.getCustomerType() != null ? buyer.getCustomerType().toUpperCase() : "SHOP";

        // Normalize customer type
        String custType;
        if (rawType.contains("WHOLESALE") || rawType.contains("DEALER") || rawType.contains("AGENT")) {
            custType = "WHOLESALE_DEALER";
        } else if (rawType.contains("CUSTOMER") || rawType.contains("RETAIL_CUSTOMER")) {
            custType = "CUSTOMER";
        } else {
            custType = "SHOP";
        }

        BigDecimal mrp = product.getMrp() != null ? product.getMrp() : BigDecimal.valueOf(50.00);
        BigDecimal minSellingPrice = product.getMinimumSellingPrice() != null 
                ? product.getMinimumSellingPrice() 
                : (product.getDealerPrice() != null ? product.getDealerPrice() : mrp);

        PriceCalculationResult.PriceCalculationResultBuilder builder = PriceCalculationResult.builder()
                .productId(product.getId())
                .productCode(product.getProductCode())
                .productName(product.getName())
                .customerType(custType)
                .mrp(mrp)
                .minimumSellingPrice(minSellingPrice)
                .quantity(qty);

        // ── 1. WHOLESALE DEALER PRICING ──────────────────────────────────────────────
        // System calculates individual discount percentage and derives actual unit selling amount
        if ("WHOLESALE_DEALER".equals(custType)) {
            BigDecimal dealerDiscount = buyer != null && buyer.getDiscountPercent() != null 
                    ? buyer.getDiscountPercent() 
                    : BigDecimal.valueOf(10.00); // default 10% if not configured

            BigDecimal base = mrp;
            BigDecimal discountFraction = dealerDiscount.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal discountAmountPerUnit = base.multiply(discountFraction).setScale(2, RoundingMode.HALF_UP);
            BigDecimal finalUnitPrice = base.subtract(discountAmountPerUnit).setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = finalUnitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);

            return builder
                    .discountPercent(dealerDiscount)
                    .basePrice(base)
                    .unitSellingPrice(finalUnitPrice)
                    .totalPrice(total)
                    .valid(true)
                    .build();
        }

        // ── 2. SHOP PRICING ──────────────────────────────────────────────────────────
        // Enforces minimum selling price rule: selling price >= minimumSellingPrice
        if ("SHOP".equals(custType)) {
            BigDecimal unitPrice = requestedPrice != null ? requestedPrice : minSellingPrice;

            if (unitPrice.compareTo(minSellingPrice) < 0) {
                return builder
                        .unitSellingPrice(unitPrice)
                        .totalPrice(unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP))
                        .valid(false)
                        .validationMessage("Minimum selling price for this product is ₹" + minSellingPrice.setScale(2, RoundingMode.HALF_UP) + ".")
                        .build();
            }

            BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
            return builder
                    .unitSellingPrice(unitPrice.setScale(2, RoundingMode.HALF_UP))
                    .totalPrice(total)
                    .valid(true)
                    .build();
        }

        // ── 3. CUSTOMER PRICING ──────────────────────────────────────────────────────
        // Manual price entry directly from user
        BigDecimal custPrice = requestedPrice != null 
                ? requestedPrice 
                : (product.getRetailPrice() != null ? product.getRetailPrice() : mrp);

        BigDecimal total = custPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
        return builder
                .unitSellingPrice(custPrice.setScale(2, RoundingMode.HALF_UP))
                .totalPrice(total)
                .valid(true)
                .build();
    }
}
