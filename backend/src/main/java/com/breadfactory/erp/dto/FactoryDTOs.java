package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.FactoryStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

public class FactoryDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FactoryCreateRequest {
        private String factoryCode;
        private String factoryName;
        private String location;
        private String address;
        private Double latitude;
        private Double longitude;
        private String contactPerson;
        private String contactPhone;
        private Integer dailyCapacityBags;
        private FactoryStatus status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FactoryResponse {
        private Long id;
        private String factoryCode;
        private String factoryName;
        private String location;
        private String address;
        private Double latitude;
        private Double longitude;
        private String contactPerson;
        private String contactPhone;
        private Integer dailyCapacityBags;
        private FactoryStatus status;
        private Boolean isActive;
        private ZonedDateTime createdAt;

        // Grouped Summaries
        private Integer vehicleCount;
        private Integer activeVehicleCount;
        private Integer rawMaterialTypesCount;
        private Double totalRawMaterialStock;
        private BigDecimal totalRawMaterialValue;
        private Integer finishedGoodsTypesCount;
        private Double totalFinishedGoodsStock;
        private BigDecimal totalFinishedGoodsValue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MaterialItemDTO {
        private Long id;
        private String itemCode;
        private String name;
        private String category;
        private Double quantity;
        private String unit;
        private Double minStockLevel;
        private BigDecimal unitPrice;
        private BigDecimal totalValue;
        private String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FinishedGoodItemDTO {
        private Long id;
        private String productCode;
        private String productName;
        private String category;
        private Integer availableQuantity;
        private BigDecimal unitPrice;
        private BigDecimal totalValue;
        private String batchCode;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignedVehicleDTO {
        private Long id;
        private String vehicleNumber;
        private String model;
        private String vehicleType;
        private Double capacityTons;
        private String driverName;
        private String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FactoryDetailBreakdownResponse {
        private FactoryResponse factory;
        private List<AssignedVehicleDTO> vehicles;
        private List<MaterialItemDTO> rawMaterials;
        private List<FinishedGoodItemDTO> finishedGoods;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FactoryOverviewSummaryResponse {
        private Integer totalFactories;
        private Integer operationalFactories;
        private Integer totalVehiclesAssigned;
        private Integer activeVehiclesCount;
        private Integer totalRawMaterialLines;
        private BigDecimal totalRawMaterialValuation;
        private Double totalFinishedGoodsUnits;
        private BigDecimal totalFinishedGoodsValuation;
        private Integer totalDailyCapacityBags;
        private List<FactoryResponse> factories;
    }
}
