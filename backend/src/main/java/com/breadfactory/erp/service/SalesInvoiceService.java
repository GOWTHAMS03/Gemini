package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.InvoiceCreateRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.PaymentStatus;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class SalesInvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public Invoice createInvoice(InvoiceCreateRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found"));

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
        for (InvoiceCreateRequest.InvoiceItemRequest itemReq : request.getItems()) {
            BigDecimal lineTotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal tax = subtotal.subtract(discount).multiply(BigDecimal.valueOf(0.05)); // 5% GST on bakery
        BigDecimal total = subtotal.subtract(discount).add(tax);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .trip(trip)
                .shop(shop)
                .driver(driver)
                .subtotal(subtotal)
                .discountAmount(discount)
                .taxAmount(tax)
                .totalAmount(total)
                .paymentMode(request.getPaymentMode())
                .paymentStatus(PaymentStatus.PAID)
                .items(new ArrayList<>())
                .build();

        for (InvoiceCreateRequest.InvoiceItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())))
                    .build();

            invoice.getItems().add(item);
        }

        // Update Shop Outstanding Balance if Credit
        if (request.getPaymentMode() == com.breadfactory.erp.enums.PaymentMode.CREDIT) {
            invoice.setPaymentStatus(PaymentStatus.PENDING);
            shop.setOutstandingAmount(shop.getOutstandingAmount().add(total));
            shopRepository.save(shop);
        }

        return invoiceRepository.save(invoice);
    }
}
