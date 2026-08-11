package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplacementBillingRequest {

    @NotNull
    private Long shopId;

    private Long tripId;
    private Long driverId;

    @NotNull
    private PaymentMode paymentMode;

    private BigDecimal discountAmount;

    // Optional Return details if processing return in same visit
    private SalesReturnCreateRequest returnRequest;

    // Optional existing Credit Note ID to apply
    private Long applyCreditNoteId;

    // Fresh delivery items
    @NotNull
    private List<InvoiceCreateRequest.InvoiceItemRequest> freshItems;
}
