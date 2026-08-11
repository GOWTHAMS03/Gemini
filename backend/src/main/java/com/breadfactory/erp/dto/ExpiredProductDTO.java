package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ExpiredDisposalStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpiredProductDTO {
    private Long id;
    private Long shopId;
    private String shopName;
    private Long productId;
    private String productName;
    private Long salesReturnId;
    private String returnNumber;
    private Integer quantity;
    private BigDecimal originalUnitPrice;
    private BigDecimal totalLossValue;
    private ExpiredDisposalStatus disposalStatus;
    private LocalDate mfgDate;
    private LocalDate expiryDate;
    private String notes;
    private ZonedDateTime createdAt;
}
