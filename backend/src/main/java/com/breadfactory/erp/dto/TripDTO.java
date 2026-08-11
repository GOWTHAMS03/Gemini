package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.TripStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripDTO {
    private Long id;
    private String tripNumber;
    private LocalDate tripDate;
    
    // Dispatch & Route Info
    private Long dispatchGroupId;
    private String dispatchGroupName;
    private Long salesPersonId;
    private String salesPersonName;
    private Long driverId;
    private String driverName;
    private Long vehicleId;
    private String vehicleNumber;
    private String vehicleModel;
    private Long routeGroupId;
    private String routeName;
    private String areaRegion;
    
    // Status & Timing
    private TripStatus status;
    private ZonedDateTime dispatchTime;
    private ZonedDateTime startTime;
    private ZonedDateTime returnTime;
    private ZonedDateTime completionTime;
    
    // Inventory Summary
    private Integer totalLoadedQuantity;
    private Integer totalSoldQuantity;
    private Integer totalReturnedQuantity;
    private Integer totalDamagedQuantity;
    private BigDecimal totalSalesAmount;
    
    // Beta & Financial Collection
    private BigDecimal betaAmount;
    private String betaPaymentStatus;
    private BigDecimal cashCollected;
    private BigDecimal upiCollected;
    private BigDecimal totalCollected;
    private String settlementStatus;
    private Boolean eodCompleted;
    
    // Reconciliation
    private Boolean isReconciled;
    private String reconciliationNotes;
    private Integer totalShops;
    private Integer completedShops;
    
    // Trip Details
    private List<TripItemDTO> items;
    
    @JsonProperty("shopVisits")
    private List<TripShopVisitDTO> shopVisits;

    @JsonProperty("shops")
    public List<TripShopVisitDTO> getShops() {
        return shopVisits;
    }

    @JsonProperty("deliveryStops")
    public List<TripShopVisitDTO> getDeliveryStops() {
        return shopVisits;
    }
    
    // Audit
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
