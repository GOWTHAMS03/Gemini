package com.breadfactory.erp.service;

import com.breadfactory.erp.entity.Product;
import com.breadfactory.erp.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PricingServiceTest {

    private PricingService pricingService;
    private Product bread;

    @BeforeEach
    void setUp() {
        pricingService = new PricingService();
        bread = Product.builder()
                .id(101L)
                .productCode("PRD-BREAD")
                .name("White Bread 400g")
                .mrp(BigDecimal.valueOf(50.00))
                .minimumSellingPrice(BigDecimal.valueOf(48.00))
                .dealerPrice(BigDecimal.valueOf(35.00))
                .retailPrice(BigDecimal.valueOf(50.00))
                .build();
    }

    // ─── 1. SHOP PRICING SCENARIOS ───────────────────────────────────────────

    @Test
    @DisplayName("Shop: Selling price above minimum price is ALLOWED")
    void testShopPriceAboveMinimum() {
        Shop shop = Shop.builder().id(1L).name("Sri Stores").customerType("SHOP").build();
        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, shop, BigDecimal.valueOf(49.00), 10
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("49.00"), result.getUnitSellingPrice());
        assertEquals(new BigDecimal("490.00"), result.getTotalPrice());
    }

    @Test
    @DisplayName("Shop: Selling price equal to minimum price is ALLOWED")
    void testShopPriceEqualToMinimum() {
        Shop shop = Shop.builder().id(1L).name("Sri Stores").customerType("SHOP").build();
        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, shop, BigDecimal.valueOf(48.00), 10
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("48.00"), result.getUnitSellingPrice());
        assertEquals(new BigDecimal("480.00"), result.getTotalPrice());
    }

    @Test
    @DisplayName("Shop: Selling price below minimum price is STRICTLY REJECTED")
    void testShopPriceBelowMinimumRejected() {
        Shop shop = Shop.builder().id(1L).name("Sri Stores").customerType("SHOP").build();
        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, shop, BigDecimal.valueOf(47.00), 10
        );

        assertFalse(result.isValid());
        assertNotNull(result.getValidationMessage());
        assertTrue(result.getValidationMessage().contains("48.00"));
    }

    // ─── 2. WHOLESALE DEALER PRICING SCENARIOS ────────────────────────────────

    @Test
    @DisplayName("Wholesale Dealer A (10% discount): ₹50 base price yields ₹45.00")
    void testWholesaleDealer10PercentDiscount() {
        Shop dealerA = Shop.builder()
                .id(2L)
                .name("ABC Distributors")
                .customerType("WHOLESALE_DEALER")
                .discountPercent(BigDecimal.valueOf(10.00))
                .build();

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, dealerA, null, 20
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("45.00"), result.getUnitSellingPrice());
        assertEquals(new BigDecimal("900.00"), result.getTotalPrice());
    }

    @Test
    @DisplayName("Wholesale Dealer B (15% discount): ₹50 base price yields ₹42.50")
    void testWholesaleDealer15PercentDiscount() {
        Shop dealerB = Shop.builder()
                .id(3L)
                .name("XYZ Traders")
                .customerType("WHOLESALE_DEALER")
                .discountPercent(BigDecimal.valueOf(15.00))
                .build();

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, dealerB, null, 20
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("42.50"), result.getUnitSellingPrice());
        assertEquals(new BigDecimal("850.00"), result.getTotalPrice());
    }

    @Test
    @DisplayName("Wholesale Dealer C (20% discount): ₹50 base price yields ₹40.00")
    void testWholesaleDealer20PercentDiscount() {
        Shop dealerC = Shop.builder()
                .id(4L)
                .name("Super Wholesale Hub")
                .customerType("WHOLESALE_DEALER")
                .discountPercent(BigDecimal.valueOf(20.00))
                .build();

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, dealerC, null, 10
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("40.00"), result.getUnitSellingPrice());
        assertEquals(new BigDecimal("400.00"), result.getTotalPrice());
    }

    // ─── 3. DIRECT CUSTOMER PRICING SCENARIOS ─────────────────────────────────

    @Test
    @DisplayName("Direct Customer: Manual price entry ₹47.00 for qty 5 yields ₹235.00")
    void testDirectCustomerManualPrice() {
        Shop directCustomer = Shop.builder().customerType("CUSTOMER").name("Ravi").build();

        PricingService.PriceCalculationResult result = pricingService.calculatePrice(
                bread, directCustomer, BigDecimal.valueOf(47.00), 5
        );

        assertTrue(result.isValid());
        assertEquals(new BigDecimal("47.00"), result.getUnitSellingPrice());
        assertEquals(new BigDecimal("235.00"), result.getTotalPrice());
    }
}
