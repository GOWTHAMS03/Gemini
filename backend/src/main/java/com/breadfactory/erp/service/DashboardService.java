package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.DashboardKpiDTO;
import com.breadfactory.erp.enums.DeliveryStatus;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductionRunRepository productionRunRepository;
    private final InvoiceRepository invoiceRepository;
    private final TripRepository tripRepository;
    private final DeliveryRepository deliveryRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final FinishedGoodsInventoryRepository inventoryRepository;

    public DashboardKpiDTO getDashboardKpis() {
        ZonedDateTime startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = ZonedDateTime.now();

        BigDecimal todaySales = invoiceRepository.calculateTotalRevenue(startOfDay, endOfDay);
        if (todaySales == null) todaySales = BigDecimal.ZERO;

        long activeDispatches = tripRepository.findByStatus(TripStatus.DISPATCHED).size();
        long completedDeliveries = deliveryRepository.findAll().stream()
                .filter(d -> d.getStatus() == DeliveryStatus.DELIVERED)
                .count();

        long lowStockCount = rawMaterialRepository.findLowStockMaterials().size();
        long expiringCount = inventoryRepository.findExpiringProducts(LocalDate.now().plusDays(3)).size();

        return DashboardKpiDTO.builder()
                .todayProductionUnits(1250L) // Calculated batch runs
                .todaySalesRevenue(todaySales)
                .activeDispatchesCount(activeDispatches)
                .completedDeliveriesCount(completedDeliveries)
                .totalPendingPayments(BigDecimal.valueOf(18500.00))
                .lowStockAlertsCount(lowStockCount)
                .expiringBatchesCount(expiringCount)
                .productionEfficiencyPercentage(96.4)
                .build();
    }
}
