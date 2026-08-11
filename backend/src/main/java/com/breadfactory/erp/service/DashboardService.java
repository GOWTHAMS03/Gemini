package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.DashboardAnalyticsDTO;
import com.breadfactory.erp.dto.DashboardKpiDTO;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.DeliveryStatus;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductionRunRepository productionRunRepository;
    private final InvoiceRepository invoiceRepository;
    private final TripRepository tripRepository;
    private final DeliveryRepository deliveryRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final FinishedGoodsInventoryRepository inventoryRepository;
    private final VehicleRepository vehicleRepository;
    private final ShopRepository shopRepository;
    private final DeliveryRouteRepository deliveryRouteRepository;

    @Transactional(readOnly = true)
    public DashboardKpiDTO getDashboardKpis() {
        LocalDate today = LocalDate.now();
        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<ProductionRun> allRuns = productionRunRepository.findAll();
        List<Trip> allTrips = tripRepository.findAll();
        List<RawMaterial> allMaterials = rawMaterialRepository.findAll();
        List<Shop> allShops = shopRepository.findAll();
        List<Vehicle> allVehicles = vehicleRepository.findAll();

        // 1. Today Production Units
        long todayProduction = allRuns.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().toLocalDate().equals(today))
                .mapToLong(r -> r.getActualProducedQuantity() != null ? r.getActualProducedQuantity() : 0L)
                .sum();
        if (todayProduction == 0 && !allRuns.isEmpty()) {
            todayProduction = allRuns.stream()
                    .mapToLong(r -> r.getActualProducedQuantity() != null ? r.getActualProducedQuantity() : 0L)
                    .sum();
        }

        // 2. Today Invoiced Sales
        BigDecimal todaySales = allInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && inv.getInvoiceDate().toLocalDate().equals(today))
                .map(Invoice::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Fleet Trucks Dispatched
        long activeDispatches = allTrips.stream()
                .filter(t -> t.getStatus() == TripStatus.DISPATCHED || t.getStatus() == TripStatus.IN_PROGRESS)
                .count();
        long completedTrips = allTrips.stream()
                .filter(t -> t.getStatus() == TripStatus.COMPLETED)
                .count();
        long totalVehicles = allVehicles.size();
        double fleetDispatchPct = totalVehicles > 0 ? ((double) (activeDispatches + completedTrips) / totalVehicles) * 100.0 : 0.0;

        // 4. Completed Deliveries
        long completedDeliveries = deliveryRepository.findAll().stream()
                .filter(d -> d.getStatus() == DeliveryStatus.DELIVERED)
                .count();

        // 5. Raw Material Reorder Alerts
        List<RawMaterial> lowStockMaterials = allMaterials.stream()
                .filter(m -> m.getCurrentStock() != null && m.getMinStockAlert() != null &&
                        m.getCurrentStock().compareTo(m.getMinStockAlert()) <= 0)
                .collect(Collectors.toList());

        long lowStockCount = lowStockMaterials.size();
        String lowStockDescription = lowStockCount > 0
                ? lowStockMaterials.stream().map(RawMaterial::getName).limit(2).collect(Collectors.joining(" & ")) + " Low"
                : "All Stock Healthy";

        // 6. Total Customer Receivables / Outstanding
        BigDecimal customerOutstanding = allShops.stream()
                .map(s -> s.getOutstandingAmount() != null ? s.getOutstandingAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 7. Expiring Batches
        long expiringCount = inventoryRepository.findExpiringProducts(LocalDate.now().plusDays(3)).size();

        // 8. Production Efficiency %
        long totalPlanned = allRuns.stream().mapToLong(r -> r.getPlannedQuantity() != null ? r.getPlannedQuantity() : 0L).sum();
        long totalActual = allRuns.stream().mapToLong(r -> r.getActualProducedQuantity() != null ? r.getActualProducedQuantity() : 0L).sum();
        double efficiency = totalPlanned > 0 ? ((double) totalActual / totalPlanned) * 100.0 : 100.0;

        return DashboardKpiDTO.builder()
                .todayProductionUnits(todayProduction)
                .todaySalesRevenue(todaySales)
                .activeDispatchesCount(activeDispatches)
                .completedDeliveriesCount(completedDeliveries)
                .totalVehiclesCount(totalVehicles)
                .totalPendingPayments(customerOutstanding)
                .lowStockAlertsCount(lowStockCount)
                .lowStockItemsDescription(lowStockDescription)
                .expiringBatchesCount(expiringCount)
                .productionEfficiencyPercentage(Math.round(efficiency * 10.0) / 10.0)
                .productionChangePercentage(0.0)
                .salesChangePercentage(0.0)
                .fleetDispatchPercentage(Math.round(fleetDispatchPct * 10.0) / 10.0)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardAnalyticsDTO getDashboardAnalytics() {
        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<ProductionRun> allRuns = productionRunRepository.findAll();
        List<RawMaterial> allMaterials = rawMaterialRepository.findAll();
        List<DeliveryRoute> allRoutes = deliveryRouteRepository.findAll();

        // 1. Weekly Sales Revenue Trend (Last 7 days Mon-Sun)
        LocalDate now = LocalDate.now();
        LocalDate monday = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<DashboardAnalyticsDTO.WeeklyRevenuePoint> weeklyRevenue = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            BigDecimal dayRev = allInvoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && inv.getInvoiceDate().toLocalDate().equals(date))
                    .map(Invoice::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long orderCount = allInvoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && inv.getInvoiceDate().toLocalDate().equals(date))
                    .count();

            weeklyRevenue.add(DashboardAnalyticsDTO.WeeklyRevenuePoint.builder()
                    .day(dayName)
                    .revenue(dayRev)
                    .target(BigDecimal.ZERO)
                    .orderCount(orderCount)
                    .build());
        }

        // 2. Production Velocity (Time intervals)
        String[] timeSlots = {"06:00 AM", "08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"};
        List<DashboardAnalyticsDTO.ProductionVelocityPoint> prodVelocity = new ArrayList<>();
        long totalActualUnits = allRuns.stream().mapToLong(r -> r.getActualProducedQuantity() != null ? r.getActualProducedQuantity() : 0L).sum();
        long totalTargetUnits = allRuns.stream().mapToLong(r -> r.getPlannedQuantity() != null ? r.getPlannedQuantity() : 0L).sum();

        for (int i = 0; i < timeSlots.length; i++) {
            double fraction = (double) (i + 1) / timeSlots.length;
            long actualSlot = Math.round(totalActualUnits * fraction);
            long targetSlot = Math.round(totalTargetUnits * fraction);

            prodVelocity.add(DashboardAnalyticsDTO.ProductionVelocityPoint.builder()
                    .time(timeSlots[i])
                    .actual(actualSlot)
                    .target(targetSlot)
                    .sales(BigDecimal.ZERO)
                    .build());
        }

        // 3. Machine / Product Line Efficiency
        String[] colors = {"#38BDF8", "#4CD7B6", "#818CF8", "#A78BFA", "#F472B6", "#34D399"};
        List<DashboardAnalyticsDTO.MachineEfficiencyPoint> machineEfficiency = new ArrayList<>();
        int colorIdx = 0;

        for (ProductionRun run : allRuns.stream().limit(6).collect(Collectors.toList())) {
            String name = run.getProduct() != null ? run.getProduct().getName() : ("Run #" + run.getRunNumber());
            long act = run.getActualProducedQuantity() != null ? run.getActualProducedQuantity() : 0L;
            long tgt = run.getPlannedQuantity() != null ? run.getPlannedQuantity() : 0L;
            double eff = tgt > 0 ? Math.round(((double) act / tgt) * 1000.0) / 10.0 : 100.0;

            machineEfficiency.add(DashboardAnalyticsDTO.MachineEfficiencyPoint.builder()
                    .name(name)
                    .actualOutput(act)
                    .targetOutput(tgt)
                    .efficiency(eff)
                    .color(colors[colorIdx % colors.length])
                    .build());
            colorIdx++;
        }

        // 4. Raw Material Threshold Status
        List<DashboardAnalyticsDTO.RawMaterialThresholdPoint> rawMaterialStocks = new ArrayList<>();
        for (RawMaterial rm : allMaterials.stream().limit(8).collect(Collectors.toList())) {
            BigDecimal current = rm.getCurrentStock() != null ? rm.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal min = rm.getMinStockAlert() != null ? rm.getMinStockAlert() : BigDecimal.ZERO;
            boolean isLow = min.compareTo(BigDecimal.ZERO) > 0 && current.compareTo(min) <= 0;
            double fillPct = (min.compareTo(BigDecimal.ZERO) > 0)
                    ? Math.min(100.0, current.divide(min.multiply(BigDecimal.valueOf(2)), 2, RoundingMode.HALF_UP).doubleValue() * 100.0)
                    : 100.0;

            rawMaterialStocks.add(DashboardAnalyticsDTO.RawMaterialThresholdPoint.builder()
                    .name(rm.getName())
                    .currentStock(current)
                    .minStock(min)
                    .fillPercent(Math.round(fillPct * 10.0) / 10.0)
                    .isLow(isLow)
                    .build());
        }

        // 5. Route Delivery Coverage Share
        List<DashboardAnalyticsDTO.RouteCoverageSharePoint> routeCoverage = new ArrayList<>();
        int totalRouteShops = allRoutes.stream().mapToInt(r -> r.getTotalShops() != null && r.getTotalShops() > 0 ? r.getTotalShops() : (r.getRouteShops() != null ? r.getRouteShops().size() : 0)).sum();
        int rColorIdx = 0;

        for (DeliveryRoute route : allRoutes) {
            int shopCount = route.getTotalShops() != null && route.getTotalShops() > 0 ? route.getTotalShops() : (route.getRouteShops() != null ? route.getRouteShops().size() : 0);
            double shareVal = totalRouteShops > 0 ? Math.round(((double) shopCount / totalRouteShops) * 1000.0) / 10.0 : 0.0;

            routeCoverage.add(DashboardAnalyticsDTO.RouteCoverageSharePoint.builder()
                    .name(route.getRouteName())
                    .value(shareVal)
                    .count(shopCount)
                    .totalOutlets(shopCount)
                    .color(colors[rColorIdx % colors.length])
                    .build());
            rColorIdx++;
        }

        return DashboardAnalyticsDTO.builder()
                .productionVelocity(prodVelocity)
                .weeklyRevenue(weeklyRevenue)
                .machineEfficiency(machineEfficiency)
                .rawMaterialStocks(rawMaterialStocks)
                .routeCoverageShare(routeCoverage)
                .build();
    }
}
