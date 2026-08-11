package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionCompleteRequest {

    @NotNull(message = "Actual produced quantity is required")
    private Integer actualProduced;

    private Integer rejectedQuantity;
    private Integer wasteQuantity;
    private String defectReason;
    private String defectNotes;
    private String qcInspectorName;
    private Boolean isQcPassed;
    private String notes;
}
