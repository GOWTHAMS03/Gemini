package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.*;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalesReturnService {

    private final SalesReturnRepository salesReturnRepository;
    private final CreditNoteRepository creditNoteRepository;
    private final InvoiceRepository invoiceRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ShopLedgerRepository shopLedgerRepository;
    private final ProductStockLedgerRepository productStockLedgerRepository;
    private final ExpiredProductTrackingRepository expiredProductTrackingRepository;
    private final SalesInvoiceService salesInvoiceService;

    @Transactional(readOnly = true)
    public List<SalesReturnResponse> getAllReturns() {
        return salesReturnRepository.findAllByOrderByReturnDateDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalesReturnResponse> getReturnsByShop(Long shopId) {
        return salesReturnRepository.findByShopIdOrderByReturnDateDesc(shopId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Invoice> getEligibleInvoicesForShop(Long shopId) {
        // Return invoices for this shop that have non-returned items
        List<Invoice> invoices = invoiceRepository.findByShopId(shopId);
        return invoices.stream()
                .filter(inv -> inv.getItems().stream().anyMatch(item -> 
                    item.getReturnedQuantity() == null || item.getReturnedQuantity() < item.getQuantity()))
                .collect(Collectors.toList());
    }

    @Transactional
    public SalesReturnResponse createReturn(SalesReturnCreateRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found with ID: " + request.getShopId()));

        Invoice originalInvoice = invoiceRepository.findById(request.getOriginalInvoiceId())
                .orElseThrow(() -> new RuntimeException("Original sales invoice not found with ID: " + request.getOriginalInvoiceId()));

        if (!originalInvoice.getShop().getId().equals(shop.getId())) {
            throw new IllegalArgumentException("Original invoice does not belong to Shop ID: " + shop.getId());
        }

        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findById(request.getTripId()).orElse(null);
        }

        User driver = null;
        if (request.getDriverId() != null) {
            driver = userRepository.findById(request.getDriverId()).orElse(null);
        }

        String returnNumber = "RET-" + System.currentTimeMillis();

        SalesReturn salesReturn = SalesReturn.builder()
                .returnNumber(returnNumber)
                .originalInvoice(originalInvoice)
                .shop(shop)
                .driver(driver)
                .trip(trip)
                .subtotal(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalReturnAmount(BigDecimal.ZERO)
                .reason(request.getReason() != null ? request.getReason() : "EXPIRED")
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (SalesReturnCreateRequest.ReturnItemRequest itemReq : request.getItems()) {
            InvoiceItem origItem = originalInvoice.getItems().stream()
                    .filter(i -> i.getId().equals(itemReq.getOriginalInvoiceItemId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Original invoice item not found: " + itemReq.getOriginalInvoiceItemId()));

            int previouslyReturned = origItem.getReturnedQuantity() != null ? origItem.getReturnedQuantity() : 0;
            int remainingReturnable = origItem.getQuantity() - previouslyReturned;

            if (itemReq.getReturnedQuantity() <= 0) {
                throw new IllegalArgumentException("Returned quantity must be greater than 0");
            }

            if (itemReq.getReturnedQuantity() > remainingReturnable) {
                throw new IllegalArgumentException(String.format(
                        "Cannot return %d units of product '%s'. Only %d non-returned units remaining on original invoice line item.",
                        itemReq.getReturnedQuantity(), origItem.getProduct().getName(), remainingReturnable
                ));
            }

            // CRITICAL BUSINESS RULE: Calculate return credit using original selling price from original invoice
            BigDecimal originalUnitPrice = origItem.getUnitPrice();
            BigDecimal itemTotalCredit = originalUnitPrice.multiply(BigDecimal.valueOf(itemReq.getReturnedQuantity()));

            subtotal = subtotal.add(itemTotalCredit);

            // Deduct returned quantity from original invoice item
            origItem.setReturnedQuantity(previouslyReturned + itemReq.getReturnedQuantity());

            SalesReturnItem returnItem = SalesReturnItem.builder()
                    .salesReturn(salesReturn)
                    .originalInvoiceItem(origItem)
                    .product(origItem.getProduct())
                    .returnedQuantity(itemReq.getReturnedQuantity())
                    .originalUnitPrice(originalUnitPrice)
                    .totalCreditAmount(itemTotalCredit)
                    .build();

            salesReturn.getItems().add(returnItem);

            // Audit in Expired Product Tracking
            ExpiredProductTracking expiredTracking = ExpiredProductTracking.builder()
                    .shop(shop)
                    .product(origItem.getProduct())
                    .salesReturn(salesReturn)
                    .quantity(itemReq.getReturnedQuantity())
                    .originalUnitPrice(originalUnitPrice)
                    .totalLossValue(itemTotalCredit)
                    .disposalStatus(ExpiredDisposalStatus.COLLECTED_BY_DRIVER)
                    .notes("Returned from Invoice " + originalInvoice.getInvoiceNumber() + ". Reason: " + salesReturn.getReason())
                    .build();
            expiredProductTrackingRepository.save(expiredTracking);

            // Audit in Product Stock Ledger (Return to Truck/Warehouse)
            ProductStockLedger stockLedger = ProductStockLedger.builder()
                    .product(origItem.getProduct())
                    .shop(shop)
                    .trip(trip)
                    .movementType(StockMovementType.RETURN_EXPIRED)
                    .quantity(itemReq.getReturnedQuantity())
                    .referenceNumber(returnNumber)
                    .notes("Expired bread return against " + originalInvoice.getInvoiceNumber())
                    .build();
            productStockLedgerRepository.save(stockLedger);

            // Update TripItem returnedQuantity if trip is present
            if (trip != null) {
                trip.getItems().stream()
                        .filter(ti -> ti.getProduct().getId().equals(origItem.getProduct().getId()))
                        .findFirst()
                        .ifPresent(tripItem -> {
                            int newReturned = (tripItem.getReturnedQuantity() != null ? tripItem.getReturnedQuantity() : 0) + itemReq.getReturnedQuantity();
                            tripItem.setReturnedQuantity(newReturned);
                        });
            }
        }

        if (trip != null) {
            tripRepository.save(trip);
        }

        BigDecimal taxAmount = subtotal.multiply(BigDecimal.valueOf(0.05)); // 5% GST tax credit
        BigDecimal totalReturnAmount = subtotal.add(taxAmount);

        salesReturn.setSubtotal(subtotal);
        salesReturn.setTaxAmount(taxAmount);
        salesReturn.setTotalReturnAmount(totalReturnAmount);

        SalesReturn savedReturn = salesReturnRepository.save(salesReturn);

        // Generate Credit Note
        String creditNoteNumber = "CN-" + System.currentTimeMillis();
        CreditNote creditNote = CreditNote.builder()
                .creditNoteNumber(creditNoteNumber)
                .salesReturn(savedReturn)
                .shop(shop)
                .totalAmount(totalReturnAmount)
                .appliedAmount(BigDecimal.ZERO)
                .remainingAmount(totalReturnAmount)
                .status(CreditNoteStatus.ISSUED)
                .build();
        CreditNote savedCreditNote = creditNoteRepository.save(creditNote);

        // Update Shop Outstanding Balance (Decreased by Return Credit)
        BigDecimal currentOutstanding = shop.getOutstandingAmount() != null ? shop.getOutstandingAmount() : BigDecimal.ZERO;
        BigDecimal newOutstanding = currentOutstanding.subtract(totalReturnAmount);
        shop.setOutstandingAmount(newOutstanding);
        shopRepository.save(shop);

        // Record Shop Ledger Entry for Credit Note Issued
        ShopLedger ledgerEntry = ShopLedger.builder()
                .shop(shop)
                .transactionType(ShopLedgerType.CREDIT_NOTE_ISSUED)
                .referenceNumber(creditNoteNumber)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(totalReturnAmount)
                .runningBalance(newOutstanding)
                .description("Credit Note issued for expired returns (Ref Invoice: " + originalInvoice.getInvoiceNumber() + ")")
                .build();
        shopLedgerRepository.save(ledgerEntry);

        return mapToResponse(savedReturn);
    }

    @Transactional
    public ReplacementBillingResponse processReplacementBilling(ReplacementBillingRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found: " + request.getShopId()));

        SalesReturnResponse returnResp = null;
        CreditNote creditNoteToApply = null;

        // Step 1: Handle Return if requested
        if (request.getReturnRequest() != null) {
            request.getReturnRequest().setShopId(shop.getId());
            if (request.getTripId() != null) request.getReturnRequest().setTripId(request.getTripId());
            if (request.getDriverId() != null) request.getReturnRequest().setDriverId(request.getDriverId());

            returnResp = createReturn(request.getReturnRequest());
            creditNoteToApply = creditNoteRepository.findByCreditNoteNumber(returnResp.getCreditNoteNumber()).orElse(null);
        } else if (request.getApplyCreditNoteId() != null) {
            creditNoteToApply = creditNoteRepository.findById(request.getApplyCreditNoteId()).orElse(null);
        }

        // Step 2: Create Fresh Delivery Invoice
        InvoiceCreateRequest freshInvoiceReq = InvoiceCreateRequest.builder()
                .shopId(shop.getId())
                .tripId(request.getTripId())
                .driverId(request.getDriverId())
                .paymentMode(request.getPaymentMode())
                .discountAmount(request.getDiscountAmount())
                .items(request.getFreshItems())
                .build();

        Invoice freshInvoice = salesInvoiceService.createInvoice(freshInvoiceReq);

        BigDecimal freshDeliveryTotal = freshInvoice.getTotalAmount();
        BigDecimal creditApplied = BigDecimal.ZERO;

        // Step 3: Apply Return Credit to New Invoice
        if (creditNoteToApply != null && creditNoteToApply.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal availableCredit = creditNoteToApply.getRemainingAmount();
            if (availableCredit.compareTo(freshDeliveryTotal) >= 0) {
                creditApplied = freshDeliveryTotal;
                creditNoteToApply.setAppliedAmount(creditNoteToApply.getAppliedAmount().add(creditApplied));
                creditNoteToApply.setRemainingAmount(availableCredit.subtract(creditApplied));
                creditNoteToApply.setStatus(CreditNoteStatus.FULLY_APPLIED);
            } else {
                creditApplied = availableCredit;
                creditNoteToApply.setAppliedAmount(creditNoteToApply.getAppliedAmount().add(creditApplied));
                creditNoteToApply.setRemainingAmount(BigDecimal.ZERO);
                creditNoteToApply.setStatus(CreditNoteStatus.FULLY_APPLIED);
            }
            creditNoteRepository.save(creditNoteToApply);

            freshInvoice.setReturnCreditApplied(creditApplied);
            freshInvoice.setCreditNote(creditNoteToApply);

            // Record Return Credit Application in Shop Ledger
            BigDecimal currentBal = shopRepository.findById(shop.getId()).map(Shop::getOutstandingAmount).orElse(BigDecimal.ZERO);
            ShopLedger creditAppLedger = ShopLedger.builder()
                    .shop(shop)
                    .transactionType(ShopLedgerType.CREDIT_NOTE_APPLIED)
                    .referenceNumber(freshInvoice.getInvoiceNumber())
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(creditApplied)
                    .runningBalance(currentBal)
                    .description("Applied Return Credit Note " + creditNoteToApply.getCreditNoteNumber() + " against Invoice " + freshInvoice.getInvoiceNumber())
                    .build();
            shopLedgerRepository.save(creditAppLedger);
        }

        BigDecimal netPayable = freshDeliveryTotal.subtract(creditApplied);
        if (netPayable.compareTo(BigDecimal.ZERO) < 0) netPayable = BigDecimal.ZERO;

        freshInvoice.setNetPayableAmount(netPayable);

        // Update link on sales return if created in same request
        if (returnResp != null) {
            salesReturnRepository.findById(returnResp.getId()).ifPresent(sr -> {
                sr.setReplacementInvoice(freshInvoice);
                salesReturnRepository.save(sr);
            });
        }

        Invoice savedFreshInvoice = invoiceRepository.save(freshInvoice);
        Shop updatedShop = shopRepository.findById(shop.getId()).orElse(shop);

        CreditNoteDTO cnDto = null;
        if (creditNoteToApply != null) {
            cnDto = CreditNoteDTO.builder()
                    .id(creditNoteToApply.getId())
                    .creditNoteNumber(creditNoteToApply.getCreditNoteNumber())
                    .shopId(shop.getId())
                    .shopName(shop.getName())
                    .totalAmount(creditNoteToApply.getTotalAmount())
                    .appliedAmount(creditNoteToApply.getAppliedAmount())
                    .remainingAmount(creditNoteToApply.getRemainingAmount())
                    .status(creditNoteToApply.getStatus())
                    .issuedAt(creditNoteToApply.getIssuedAt())
                    .build();
        }

        return ReplacementBillingResponse.builder()
                .invoice(savedFreshInvoice)
                .salesReturn(returnResp)
                .creditNote(cnDto)
                .freshDeliveryTotal(freshDeliveryTotal)
                .returnCreditApplied(creditApplied)
                .netPayableAmount(netPayable)
                .shopOutstandingBalance(updatedShop.getOutstandingAmount())
                .build();
    }

    private SalesReturnResponse mapToResponse(SalesReturn sr) {
        String cnNum = creditNoteRepository.findAll().stream()
                .filter(cn -> cn.getSalesReturn().getId().equals(sr.getId()))
                .findFirst()
                .map(CreditNote::getCreditNoteNumber)
                .orElse(null);

        List<SalesReturnResponse.ReturnItemResponse> itemResponses = sr.getItems().stream()
                .map(item -> SalesReturnResponse.ReturnItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .returnedQuantity(item.getReturnedQuantity())
                        .originalUnitPrice(item.getOriginalUnitPrice())
                        .totalCreditAmount(item.getTotalCreditAmount())
                        .build())
                .collect(Collectors.toList());

        return SalesReturnResponse.builder()
                .id(sr.getId())
                .returnNumber(sr.getReturnNumber())
                .originalInvoiceId(sr.getOriginalInvoice().getId())
                .originalInvoiceNumber(sr.getOriginalInvoice().getInvoiceNumber())
                .shopId(sr.getShop().getId())
                .shopName(sr.getShop().getName())
                .subtotal(sr.getSubtotal())
                .taxAmount(sr.getTaxAmount())
                .totalReturnAmount(sr.getTotalReturnAmount())
                .reason(sr.getReason())
                .returnDate(sr.getReturnDate())
                .creditNoteNumber(cnNum)
                .items(itemResponses)
                .build();
    }
}
