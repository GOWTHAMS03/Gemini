package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.InvoiceCreateRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesInvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ShopLedgerRepository shopLedgerRepository;
    private final PricingService pricingService;
    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final AccountingAutomationService accountingService;

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByShop(Long shopId) {
        return invoiceRepository.findByShopId(shopId);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByTrip(Long tripId) {
        return invoiceRepository.findByTripId(tripId);
    }

    @Transactional
    public Invoice createInvoice(InvoiceCreateRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found with ID: " + request.getShopId()));

        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findById(request.getTripId()).orElse(null);
        }

        User driver = null;
        if (request.getDriverId() != null) {
            driver = userRepository.findById(request.getDriverId()).orElse(null);
        }

        String invoiceNumber = "INV-" + System.currentTimeMillis();

        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceItem> invoiceItems = new ArrayList<>();

        for (InvoiceCreateRequest.InvoiceItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + itemReq.getProductId()));

            // Centralized pricing validation and calculation
            PricingService.PriceCalculationResult priceResult = pricingService.calculatePrice(
                    product, 
                    shop, 
                    itemReq.getUnitPrice(), 
                    itemReq.getQuantity()
            );

            if (!priceResult.isValid()) {
                throw new IllegalArgumentException(priceResult.getValidationMessage());
            }

            BigDecimal unitPrice = priceResult.getUnitSellingPrice();
            BigDecimal lineTotal = priceResult.getTotalPrice();
            subtotal = subtotal.add(lineTotal);

            InvoiceItem item = InvoiceItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .build();

            invoiceItems.add(item);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal taxableAmount = subtotal.subtract(discount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            taxableAmount = BigDecimal.ZERO;
        }

        BigDecimal tax = taxableAmount.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP); // 5% GST
        BigDecimal total = taxableAmount.add(tax).setScale(2, RoundingMode.HALF_UP);

        PaymentStatus pStatus = (request.getPaymentMode() == PaymentMode.CREDIT) ? PaymentStatus.PENDING : PaymentStatus.PAID;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .trip(trip)
                .shop(shop)
                .driver(driver)
                .customerType(shop.getCustomerType() != null ? shop.getCustomerType() : "SHOP")
                .discountPercent(shop.getDiscountPercent() != null ? shop.getDiscountPercent() : BigDecimal.ZERO)
                .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
                .discountAmount(discount.setScale(2, RoundingMode.HALF_UP))
                .taxAmount(tax)
                .totalAmount(total)
                .netPayableAmount(total)
                .paymentMode(request.getPaymentMode())
                .paymentStatus(pStatus)
                .items(new ArrayList<>())
                .build();

        for (InvoiceItem item : invoiceItems) {
            item.setInvoice(invoice);
            invoice.getItems().add(item);
        }

        // Real-Time Trip Synchronization & Truck Inventory Update
        if (trip != null) {
            BigDecimal currentSales = trip.getTotalSalesAmount() != null ? trip.getTotalSalesAmount() : BigDecimal.ZERO;
            trip.setTotalSalesAmount(currentSales.add(total));

            if (request.getPaymentMode() == PaymentMode.CASH) {
                BigDecimal curCash = trip.getCashCollected() != null ? trip.getCashCollected() : BigDecimal.ZERO;
                trip.setCashCollected(curCash.add(total));
            } else if (request.getPaymentMode() == PaymentMode.UPI) {
                BigDecimal curUpi = trip.getUpiCollected() != null ? trip.getUpiCollected() : BigDecimal.ZERO;
                trip.setUpiCollected(curUpi.add(total));
            }
            BigDecimal cashCol = trip.getCashCollected() != null ? trip.getCashCollected() : BigDecimal.ZERO;
            BigDecimal upiCol = trip.getUpiCollected() != null ? trip.getUpiCollected() : BigDecimal.ZERO;
            trip.setTotalCollected(cashCol.add(upiCol));

            if (trip.getItems() != null) {
                for (InvoiceCreateRequest.InvoiceItemRequest itemReq : request.getItems()) {
                    Optional<TripItem> optItem = trip.getItems().stream()
                            .filter(ti -> ti.getProduct() != null && ti.getProduct().getId().equals(itemReq.getProductId()))
                            .findFirst();
                    if (optItem.isPresent()) {
                        TripItem tripItem = optItem.get();
                        int loaded = tripItem.getLoadedQuantity() != null ? tripItem.getLoadedQuantity() : 0;
                        int currentSold = tripItem.getSoldQuantity() != null ? tripItem.getSoldQuantity() : 0;
                        int returned = tripItem.getReturnedQuantity() != null ? tripItem.getReturnedQuantity() : 0;
                        int damaged = tripItem.getDamagedQuantity() != null ? tripItem.getDamagedQuantity() : 0;
                        int availableStock = loaded - currentSold - returned - damaged;

                        if (itemReq.getQuantity() > availableStock) {
                            throw new RuntimeException("Insufficient stock for " +
                                    (tripItem.getProduct() != null ? tripItem.getProduct().getName() : "Product #" + itemReq.getProductId()) +
                                    ". Available truck stock: " + Math.max(0, availableStock) + ", Requested: " + itemReq.getQuantity());
                        }

                        int newSold = currentSold + itemReq.getQuantity();
                        tripItem.setSoldQuantity(newSold);
                        tripItem.setAvailableQuantity(Math.max(0, loaded - newSold - returned - damaged));

                        BigDecimal curSaleAmt = tripItem.getTotalSaleAmount() != null ? tripItem.getTotalSaleAmount() : BigDecimal.ZERO;
                        tripItem.setTotalSaleAmount(curSaleAmt.add(
                                (itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.valueOf(100))
                                        .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                        ));
                    }
                }
            }

            // Auto transition trip status to IN_PROGRESS if not already completed
            if (trip.getStatus() != com.breadfactory.erp.enums.TripStatus.IN_PROGRESS && trip.getStatus() != com.breadfactory.erp.enums.TripStatus.COMPLETED) {
                trip.setStatus(com.breadfactory.erp.enums.TripStatus.IN_PROGRESS);
            }

            // Update associated shop visit status to COMPLETED
            if (trip.getShopVisits() != null) {
                trip.getShopVisits().stream()
                        .filter(v -> v.getShop() != null && v.getShop().getId().equals(shop.getId()))
                        .findFirst()
                        .ifPresent(v -> {
                            v.setStatus(ShopVisitStatus.COMPLETED);
                            if (v.getActualDepartureTime() == null) {
                                v.setActualDepartureTime(ZonedDateTime.now());
                            }
                        });
            }

            // Check if all shops completed or all loaded stock sold -> auto transition trip to COMPLETED
            boolean allVisitsDone = trip.getShopVisits() != null && !trip.getShopVisits().isEmpty() &&
                    trip.getShopVisits().stream().allMatch(v -> v.getStatus() == ShopVisitStatus.COMPLETED || v.getStatus() == ShopVisitStatus.CANCELLED);
            boolean allStockSold = trip.getItems() != null && !trip.getItems().isEmpty() &&
                    trip.getItems().stream().allMatch(ti -> {
                        int loaded = ti.getLoadedQuantity() != null ? ti.getLoadedQuantity() : 0;
                        int sold = ti.getSoldQuantity() != null ? ti.getSoldQuantity() : 0;
                        int returned = ti.getReturnedQuantity() != null ? ti.getReturnedQuantity() : 0;
                        int damaged = ti.getDamagedQuantity() != null ? ti.getDamagedQuantity() : 0;
                        return (loaded - sold - returned - damaged) <= 0;
                    });

            if (allVisitsDone || allStockSold) {
                trip.setStatus(com.breadfactory.erp.enums.TripStatus.COMPLETED);
                trip.setCompletionTime(ZonedDateTime.now());
            }

            tripRepository.save(trip);
            log.info("Trip {} updated from invoice {}: Total Sales ₹{}, Total Collected ₹{}, Completed: {}",
                    trip.getTripNumber(), invoiceNumber, trip.getTotalSalesAmount(), trip.getTotalCollected(), trip.getStatus());
        }

        // Update Shop Outstanding Balance if Credit
        if (request.getPaymentMode() == PaymentMode.CREDIT) {
            BigDecimal currentOutstanding = shop.getOutstandingAmount() != null ? shop.getOutstandingAmount() : BigDecimal.ZERO;
            shop.setOutstandingAmount(currentOutstanding.add(total));
            shopRepository.save(shop);
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Record Shop Ledger Debit Transaction
        BigDecimal currentBal = shop.getOutstandingAmount() != null ? shop.getOutstandingAmount() : BigDecimal.ZERO;
        ShopLedger ledgerEntry = ShopLedger.builder()
                .shop(shop)
                .transactionType(ShopLedgerType.INVOICE)
                .referenceNumber(savedInvoice.getInvoiceNumber())
                .debitAmount(total)
                .creditAmount(BigDecimal.ZERO)
                .runningBalance(currentBal)
                .description("Sales Invoice generated for " + savedInvoice.getItems().size() + " item(s)")
                .build();
        shopLedgerRepository.save(ledgerEntry);

        // Auto-Post Double-Entry Journal Entry for Sales Invoice
        boolean isCredit = (request.getPaymentMode() == PaymentMode.CREDIT);
        boolean isBank = (request.getPaymentMode() == PaymentMode.UPI || request.getPaymentMode() == PaymentMode.BANK_TRANSFER || request.getPaymentMode() == PaymentMode.CHEQUE);
        accountingService.recordSalesInvoice(
                invoiceNumber,
                shop.getName(),
                total,
                taxableAmount,
                tax,
                isCredit,
                isBank
        );

        // Record Cash/Bank Treasury Inflow for Immediate Payments (CASH / UPI)
        if (request.getPaymentMode() == PaymentMode.CASH || request.getPaymentMode() == PaymentMode.UPI) {
            CashBankType accType = (request.getPaymentMode() == PaymentMode.CASH) ? CashBankType.CASH : CashBankType.BANK;
            BigDecimal lastCash = cashBankTransactionRepository.findTopByOrderByCreatedAtDescIdDesc()
                    .map(CashBankTransaction::getRunningCashBalance).orElse(BigDecimal.ZERO);
            BigDecimal lastBank = cashBankTransactionRepository.findTopByOrderByCreatedAtDescIdDesc()
                    .map(CashBankTransaction::getRunningBankBalance).orElse(BigDecimal.ZERO);

            BigDecimal newCash = (accType == CashBankType.CASH) ? lastCash.add(total) : lastCash;
            BigDecimal newBank = (accType == CashBankType.BANK) ? lastBank.add(total) : lastBank;

            CashBankTransaction txn = CashBankTransaction.builder()
                    .transactionNumber("TXN-" + System.currentTimeMillis())
                    .accountType(accType)
                    .transactionType(accType == CashBankType.CASH ? CashTransactionType.CASH_IN : CashTransactionType.BANK_DEPOSIT)
                    .amount(total)
                    .referenceType("SALES_INVOICE")
                    .referenceNumber(invoiceNumber)
                    .runningCashBalance(newCash)
                    .runningBankBalance(newBank)
                    .reconciliationStatus("RECONCILED")
                    .notes("Sales Collection from " + shop.getName() + " via " + request.getPaymentMode())
                    .build();
            cashBankTransactionRepository.save(txn);
        }

        return savedInvoice;
    }
}
