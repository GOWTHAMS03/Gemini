package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripCreateRequest {

    @NotNull(message = "Trip date is required")
    private LocalDate tripDate;

    @NotNull(message = "Dispatch group ID is required")
    private Long dispatchGroupId;

    @NotNull(message = "Route group ID is required")
    private Long routeGroupId;

    // Legacy fields - kept for backward compatibility
    private Long driverId;
    private Long vehicleId;
    private String routeName;

    // Trip Beta & Allowance
    private java.math.BigDecimal betaAmount;
    private String notes;

    // Items to load into trip
    private List<TripItemRequest> items;

    // Custom arranged shop sequence from Step 3
    private List<TripShopVisitRequest> shops;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Loaded quantity is required")
        private Integer loadedQuantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripShopVisitRequest {
        private Long shopId;
        private Integer visitSequence;
        private String expectedVisitTime;
    }
}
