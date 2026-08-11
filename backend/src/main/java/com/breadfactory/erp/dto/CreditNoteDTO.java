package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.CreditNoteStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditNoteDTO {
    private Long id;
    private String creditNoteNumber;
    private Long salesReturnId;
    private String returnNumber;
    private Long shopId;
    private String shopName;
    private BigDecimal totalAmount;
    private BigDecimal appliedAmount;
    private BigDecimal remainingAmount;
    private CreditNoteStatus status;
    private ZonedDateTime issuedAt;
}
