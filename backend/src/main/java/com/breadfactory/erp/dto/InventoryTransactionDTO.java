package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.InventoryTransactionType;
import lombok.*;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionDTO {
    private Long id;
    private InventoryTransactionType transactionType;
    private Long productId;
    private String productCode;
    private String productName;
    private Integer quantity;
    private String source;
    private String destination;
    private Long tripId;
    private String tripNumber;
    private Long vehicleId;
    private String vehicleNumber;
    private Long warehouseId;
    private String referenceNumber;
    private String notes;
    private ZonedDateTime createdAt;
    private String createdBy;
}
