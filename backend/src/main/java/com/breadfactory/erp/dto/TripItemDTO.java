package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripItemDTO {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private BigDecimal productMrp;
    
    // Inventory Quantities
    private Integer loadedQuantity;
    private Integer availableQuantity;
    private Integer soldQuantity;
    private Integer returnedQuantity;
    private Integer damagedQuantity;
    private Integer remainingQuantity;
    
    // Reconciliation
    private Boolean isReconciled;
    
    // Financial
    private BigDecimal totalSaleAmount;
    private BigDecimal totalReturnedAmount;
    
    // Audit
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
