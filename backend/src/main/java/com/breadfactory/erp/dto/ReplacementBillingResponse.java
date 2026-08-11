package com.breadfactory.erp.dto;

import com.breadfactory.erp.entity.Invoice;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplacementBillingResponse {
    private Invoice invoice;
    private SalesReturnResponse salesReturn;
    private CreditNoteDTO creditNote;
    private BigDecimal freshDeliveryTotal;
    private BigDecimal returnCreditApplied;
    private BigDecimal netPayableAmount;
    private BigDecimal shopOutstandingBalance;
}
