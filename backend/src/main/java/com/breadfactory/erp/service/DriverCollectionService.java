package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.DriverSettlementRequest;
import com.breadfactory.erp.entity.DriverCollection;
import com.breadfactory.erp.entity.Invoice;
import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.SettlementStatus;

import com.breadfactory.erp.repository.DriverCollectionRepository;
import com.breadfactory.erp.repository.InvoiceRepository;
import com.breadfactory.erp.repository.TripRepository;
import com.breadfactory.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverCollectionService {

    private final DriverCollectionRepository collectionRepository;
    private final TripRepository tripRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Transactional
    public DriverCollection settleDriverCollection(DriverSettlementRequest request) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        List<Invoice> tripInvoices = invoiceRepository.findByTripId(trip.getId());

        BigDecimal expectedTotal = tripInvoices.stream()
                .filter(i -> i.getPaymentMode() != com.breadfactory.erp.enums.PaymentMode.CREDIT)
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal actualTotal = request.getCashCollected()
                .add(request.getUpiCollected())
                .add(request.getChequeCollected());

        BigDecimal shortageExcess = actualTotal.subtract(expectedTotal);
        SettlementStatus status = shortageExcess.compareTo(BigDecimal.ZERO) == 0 ? SettlementStatus.SETTLED : SettlementStatus.DISCREPANCY;

        DriverCollection collection = DriverCollection.builder()
                .collectionCode("COLL-" + System.currentTimeMillis())
                .trip(trip)
                .driver(driver)
                .cashCollected(request.getCashCollected())
                .upiCollected(request.getUpiCollected())
                .chequeCollected(request.getChequeCollected())
                .expectedTotal(expectedTotal)
                .actualTotal(actualTotal)
                .shortageExcess(shortageExcess)
                .settlementStatus(status)
                .settledAt(ZonedDateTime.now())
                .build();

        return collectionRepository.save(collection);
    }
}
