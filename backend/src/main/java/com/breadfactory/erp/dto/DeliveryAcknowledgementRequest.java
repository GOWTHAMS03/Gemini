package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryAcknowledgementRequest {

    @NotNull
    private Long deliveryId;

    @NotNull
    private Integer acceptedQuantity;

    private Integer damagedQuantity;
    private Integer missingQuantity;
    private String digitalSignatureUrl;
    private String photoProofUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Long verifiedByShopUserId;
}
