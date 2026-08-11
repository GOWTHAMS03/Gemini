package com.breadfactory.erp.dto;

import lombok.*;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DamagedProductDTO {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private Integer quantity;
    private String reason;  // DAMAGED, EXPIRED, DEFECTIVE, etc.
    private Long tripId;
    private String tripNumber;
    private Long vehicleId;
    private String vehicleNumber;
    private String batchNumber;
    private String notes;
    private ZonedDateTime createdAt;
    private String createdBy;
}
