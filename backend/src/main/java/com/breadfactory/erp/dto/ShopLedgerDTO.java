package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ShopLedgerType;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopLedgerDTO {
    private Long id;
    private Long shopId;
    private String shopName;
    private ShopLedgerType transactionType;
    private String referenceNumber;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal runningBalance;
    private String description;
    private ZonedDateTime createdAt;
}
