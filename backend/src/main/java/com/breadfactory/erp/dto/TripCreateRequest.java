package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripCreateRequest {

    @NotNull
    private Long driverId;

    @NotNull
    private Long vehicleId;

    @NotBlank
    private String routeName;

    private List<TripItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripItemRequest {
        @NotNull
        private Long productId;

        @NotNull
        private Integer loadedQuantity;
    }
}
