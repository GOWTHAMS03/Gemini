package com.breadfactory.erp.service;

import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.StockMovementType;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.enums.WarehouseType;
import com.breadfactory.erp.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final FinishedGoodsInventoryRepository finishedGoodsRepository;
    private final ProductStockLedgerRepository stockLedgerRepository;
    private final ProductRepository productRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final WarehouseRepository warehouseRepository;
    private final TripRepository tripRepository;
    private final TripItemRepository tripItemRepository;
    private final ProductionRunRepository productionRunRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    // ─── DTOs ──────────────────────────────────────────────────────────────────

    @Data
    @Builder
    public static class InventoryDashboardDTO {
        private int totalFinishedGoodsUnits;
        private BigDecimal totalFinishedGoodsValue;
        private int totalTransitFleetUnits;
        private BigDecimal totalTransitFleetValue;
        private int totalRawMaterialCount;
        private BigDecimal totalRawMaterialValue;
        private int nearExpiryBatchCount;
        private int lowStockProductCount;
        private int todayProductionUnits;
        private int todaySalesUnits;
        private List<NearExpiryItemDTO> nearExpiryItems;
        private List<LowStockAlertDTO> lowStockAlerts;
    }

    @Data
    @Builder
    public static class NearExpiryItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private String category;
        private String batchNumber;
        private String warehouseName;
        private int quantityAvailable;
        private LocalDate mfgDate;
        private LocalDate expiryDate;
        private long daysUntilExpiry;
        private BigDecimal unitPrice;
        private BigDecimal totalValue;
    }

    @Data
    @Builder
    public static class LowStockAlertDTO {
        private Long productId;
        private String productName;
        private String productCode;
        private String category;
        private int currentStock;
        private int reorderThreshold;
        private String status; // CRITICAL, WARNING, NORMAL
    }

    @Data
    @Builder
    public static class FinishedGoodsItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private String category;
        private String imageUrl;
        private String batchNumber;
        private Long warehouseId;
        private String warehouseName;
        private int quantityAvailable;
        private LocalDate mfgDate;
        private LocalDate expiryDate;
        private long daysUntilExpiry;
        private boolean isExpiringSoon;
        private BigDecimal mrp;
        private BigDecimal wholesalePrice;
        private BigDecimal totalValuation;
    }

    @Data
    @Builder
    public static class TransitStockItemDTO {
        private Long tripId;
        private String tripNumber;
        private String vehicleNumber;
        private String driverName;
        private String routeName;
        private String tripStatus;
        private Long productId;
        private String productName;
        private String productCode;
        private int loadedQuantity;
        private int soldQuantity;
        private int returnedQuantity;
        private int damagedQuantity;
        private int availableOnVan;
        private BigDecimal unitPrice;
        private BigDecimal totalVanStockValue;
    }

    @Data
    @Builder
    public static class TruckInventoryDTO {
        private Long vehicleId;
        private String vehicleCode;
        private String vehicleNumber;
        private String model;
        private String type;
        private BigDecimal capacityKg;
        private String assignedDriver;
        private String driverPhone;
        private String assignedRoute;
        private Long tripId;
        private String tripNumber;
        private String tripStatus;
        private int totalLoadedUnits;
        private int totalSoldUnits;
        private int totalReturnedUnits;
        private int totalDamagedUnits;
        private int totalAvailableUnits;
        private BigDecimal totalWeightKg;
        private double payloadCapacityPercentage;
        private BigDecimal totalStockValue;
        private List<TruckInventoryItemDTO> items;
    }

    @Data
    @Builder
    public static class TruckInventoryItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private String category;
        private BigDecimal weightGrams;
        private int loadedQuantity;
        private int soldQuantity;
        private int returnedQuantity;
        private int damagedQuantity;
        private int availableQuantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotalValue;
        private int centralWarehouseStock;
    }

    @Data
    public static class TruckRefillRequest {
        private Long vehicleId;
        private String vehicleNumber;
        private String driverName;
        private String notes;
        private List<TruckRefillItem> items;
    }

    @Data
    public static class TruckRefillItem {
        private Long productId;
        private Integer quantityToRefill;
    }

    @Data
    public static class TruckAuditRequest {
        private Long vehicleId;
        private Long tripId;
        private String notes;
        private List<TruckAuditItem> items;
    }

    @Data
    public static class TruckAuditItem {
        private Long productId;
        private Integer actualPhysicalCount;
        private Integer damagedCount;
        private Integer expiredCount;
    }

    @Data
    @Builder
    public static class StockLedgerItemDTO {
        private Long id;
        private Long productId;
        private String productName;
        private String productCode;
        private String movementType;
        private int quantity;
        private String batchNumber;
        private String referenceNumber;
        private String warehouseName;
        private String tripNumber;
        private String shopName;
        private String notes;
        private ZonedDateTime createdAt;
    }

    @Data
    public static class StockAdjustmentRequest {
        private Long productId;
        private Long warehouseId;
        private String batchNumber;
        private Integer adjustedQuantity;
        private String reason;
        private String notes;
    }

    // ─── Dashboard Overview ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public InventoryDashboardDTO getDashboard() {
        List<FinishedGoodsInventory> fgList = finishedGoodsRepository.findAll();
        List<Product> products = productRepository.findAll();
        List<RawMaterial> rawMaterials = rawMaterialRepository.findAll();

        int totalFgUnits = 0;
        BigDecimal totalFgValue = BigDecimal.ZERO;
        List<NearExpiryItemDTO> nearExpiryList = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate alertLimit = today.plusDays(2);

        for (FinishedGoodsInventory fg : fgList) {
            int qty = fg.getQuantityAvailable() != null ? fg.getQuantityAvailable() : 0;
            if (qty <= 0) continue;

            totalFgUnits += qty;
            BigDecimal unitPrice = fg.getProduct() != null && fg.getProduct().getWholesalePrice() != null
                    ? fg.getProduct().getWholesalePrice()
                    : BigDecimal.valueOf(35.00);
            BigDecimal val = unitPrice.multiply(BigDecimal.valueOf(qty));
            totalFgValue = totalFgValue.add(val);

            if (fg.getExpiryDate() != null && !fg.getExpiryDate().isAfter(alertLimit)) {
                long days = ChronoUnit.DAYS.between(today, fg.getExpiryDate());
                nearExpiryList.add(NearExpiryItemDTO.builder()
                        .id(fg.getId())
                        .productId(fg.getProduct() != null ? fg.getProduct().getId() : null)
                        .productName(fg.getProduct() != null ? fg.getProduct().getName() : "Finished Product")
                        .productCode(fg.getProduct() != null ? fg.getProduct().getProductCode() : "")
                        .category(fg.getProduct() != null ? fg.getProduct().getCategory() : "Bakery")
                        .batchNumber(fg.getBatchNumber())
                        .warehouseName(fg.getWarehouse() != null ? fg.getWarehouse().getName() : "Central Warehouse")
                        .quantityAvailable(qty)
                        .mfgDate(fg.getMfgDate())
                        .expiryDate(fg.getExpiryDate())
                        .daysUntilExpiry(days)
                        .unitPrice(unitPrice)
                        .totalValue(val)
                        .build());
            }
        }

        // Transit stock calculation from active trips
        int totalTransitUnits = 0;
        BigDecimal totalTransitValue = BigDecimal.ZERO;
        List<TripItem> activeTripItems = tripItemRepository.findAll().stream()
                .filter(ti -> ti.getTrip() != null && (ti.getTrip().getStatus() == TripStatus.IN_PROGRESS || ti.getTrip().getStatus() == TripStatus.ASSIGNED || ti.getTrip().getStatus() == TripStatus.CONFIRMED || ti.getTrip().getStatus() == TripStatus.DISPATCHED))
                .collect(Collectors.toList());

        for (TripItem ti : activeTripItems) {
            int loaded = ti.getLoadedQuantity() != null ? ti.getLoadedQuantity() : 0;
            int sold = ti.getSoldQuantity() != null ? ti.getSoldQuantity() : 0;
            int returned = ti.getReturnedQuantity() != null ? ti.getReturnedQuantity() : 0;
            int damaged = ti.getDamagedQuantity() != null ? ti.getDamagedQuantity() : 0;
            int available = Math.max(0, loaded - sold - returned - damaged);

            if (available > 0) {
                totalTransitUnits += available;
                BigDecimal price = ti.getProduct() != null && ti.getProduct().getWholesalePrice() != null
                        ? ti.getProduct().getWholesalePrice()
                        : BigDecimal.valueOf(35.00);
                totalTransitValue = totalTransitValue.add(price.multiply(BigDecimal.valueOf(available)));
            }
        }

        // Raw Material valuation
        BigDecimal totalRmValue = BigDecimal.ZERO;
        for (RawMaterial rm : rawMaterials) {
            BigDecimal stock = rm.getCurrentStock() != null ? rm.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal cost = rm.getUnitCost() != null ? rm.getUnitCost() : BigDecimal.ZERO;
            totalRmValue = totalRmValue.add(stock.multiply(cost));
        }

        // Low stock alerts
        List<LowStockAlertDTO> lowStockAlerts = new ArrayList<>();
        for (Product p : products) {
            Integer currentStock = finishedGoodsRepository.findTotalStockByProduct(p.getId());
            int stockVal = currentStock != null ? currentStock : 0;
            int threshold = 50;

            if (stockVal <= threshold) {
                lowStockAlerts.add(LowStockAlertDTO.builder()
                        .productId(p.getId())
                        .productName(p.getName())
                        .productCode(p.getProductCode())
                        .category(p.getCategory())
                        .currentStock(stockVal)
                        .reorderThreshold(threshold)
                        .status(stockVal == 0 ? "OUT_OF_STOCK" : (stockVal < 20 ? "CRITICAL" : "LOW"))
                        .build());
            }
        }

        return InventoryDashboardDTO.builder()
                .totalFinishedGoodsUnits(totalFgUnits)
                .totalFinishedGoodsValue(totalFgValue.setScale(2, RoundingMode.HALF_UP))
                .totalTransitFleetUnits(totalTransitUnits)
                .totalTransitFleetValue(totalTransitValue.setScale(2, RoundingMode.HALF_UP))
                .totalRawMaterialCount(rawMaterials.size())
                .totalRawMaterialValue(totalRmValue.setScale(2, RoundingMode.HALF_UP))
                .nearExpiryBatchCount(nearExpiryList.size())
                .lowStockProductCount(lowStockAlerts.size())
                .nearExpiryItems(nearExpiryList)
                .lowStockAlerts(lowStockAlerts)
                .build();
    }

    // ─── Finished Goods Inventory Batches ─────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FinishedGoodsItemDTO> getFinishedGoods(Long productId, Long warehouseId) {
        List<FinishedGoodsInventory> list = finishedGoodsRepository.findAll();
        LocalDate today = LocalDate.now();

        return list.stream()
                .filter(fg -> (productId == null || (fg.getProduct() != null && fg.getProduct().getId().equals(productId))) &&
                              (warehouseId == null || (fg.getWarehouse() != null && fg.getWarehouse().getId().equals(warehouseId))))
                .map(fg -> {
                    Product p = fg.getProduct();
                    Warehouse w = fg.getWarehouse();
                    int qty = fg.getQuantityAvailable() != null ? fg.getQuantityAvailable() : 0;
                    long days = fg.getExpiryDate() != null ? ChronoUnit.DAYS.between(today, fg.getExpiryDate()) : 0;
                    BigDecimal price = (p != null && p.getWholesalePrice() != null) ? p.getWholesalePrice() : BigDecimal.valueOf(35.0);
                    BigDecimal totalVal = price.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);

                    return FinishedGoodsItemDTO.builder()
                            .id(fg.getId())
                            .productId(p != null ? p.getId() : null)
                            .productName(p != null ? p.getName() : "Unknown Product")
                            .productCode(p != null ? p.getProductCode() : "")
                            .category(p != null ? p.getCategory() : "Bakery")
                            .imageUrl(p != null ? p.getImageUrl() : null)
                            .batchNumber(fg.getBatchNumber())
                            .warehouseId(w != null ? w.getId() : null)
                            .warehouseName(w != null ? w.getName() : "Central Warehouse")
                            .quantityAvailable(qty)
                            .mfgDate(fg.getMfgDate())
                            .expiryDate(fg.getExpiryDate())
                            .daysUntilExpiry(days)
                            .isExpiringSoon(days <= 2 && qty > 0)
                            .mrp(p != null ? p.getMrp() : BigDecimal.ZERO)
                            .wholesalePrice(price)
                            .totalValuation(totalVal)
                            .build();
                })
                .sorted(Comparator.comparing(FinishedGoodsItemDTO::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    // ─── Transit & Fleet Van Stock ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TransitStockItemDTO> getTransitStock() {
        List<TripItem> tripItems = tripItemRepository.findAll();

        return tripItems.stream()
                .filter(ti -> ti.getTrip() != null && (ti.getTrip().getStatus() == TripStatus.IN_PROGRESS || ti.getTrip().getStatus() == TripStatus.ASSIGNED || ti.getTrip().getStatus() == TripStatus.CONFIRMED || ti.getTrip().getStatus() == TripStatus.DISPATCHED))
                .map(ti -> {
                    Trip trip = ti.getTrip();
                    Product p = ti.getProduct();
                    int loaded = ti.getLoadedQuantity() != null ? ti.getLoadedQuantity() : 0;
                    int sold = ti.getSoldQuantity() != null ? ti.getSoldQuantity() : 0;
                    int returned = ti.getReturnedQuantity() != null ? ti.getReturnedQuantity() : 0;
                    int damaged = ti.getDamagedQuantity() != null ? ti.getDamagedQuantity() : 0;
                    int available = Math.max(0, loaded - sold - returned - damaged);

                    BigDecimal price = (p != null && p.getWholesalePrice() != null) ? p.getWholesalePrice() : BigDecimal.valueOf(35.0);
                    BigDecimal totalVal = price.multiply(BigDecimal.valueOf(available)).setScale(2, RoundingMode.HALF_UP);

                    return TransitStockItemDTO.builder()
                            .tripId(trip.getId())
                            .tripNumber(trip.getTripNumber())
                            .vehicleNumber(trip.getVehicle() != null ? trip.getVehicle().getVehicleNumber() : "Fleet Truck")
                            .driverName(trip.getDriver() != null ? trip.getDriver().getFullName() : "Assigned Driver")
                            .routeName(trip.getRouteName() != null ? trip.getRouteName() : "Dynamic Route")
                            .tripStatus(trip.getStatus() != null ? trip.getStatus().name() : "IN_PROGRESS")
                            .productId(p != null ? p.getId() : null)
                            .productName(p != null ? p.getName() : "Product Item")
                            .productCode(p != null ? p.getProductCode() : "")
                            .loadedQuantity(loaded)
                            .soldQuantity(sold)
                            .returnedQuantity(returned)
                            .damagedQuantity(damaged)
                            .availableOnVan(available)
                            .unitPrice(price)
                            .totalVanStockValue(totalVal)
                            .build();
                })
                .sorted(Comparator.comparing(TransitStockItemDTO::getTripNumber).reversed())
                .collect(Collectors.toList());
    }

    // ─── Fleet Truck Inventory Management & Daily Refill ──────────────────────

    @Transactional(readOnly = true)
    public List<TruckInventoryDTO> getTruckInventories() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Product> allProducts = productRepository.findAll();
        List<TruckInventoryDTO> results = new ArrayList<>();

        for (Vehicle v : vehicles) {
            // Find active or assigned trip for this vehicle
            List<Trip> activeTrips = tripRepository.findByVehicleIdAndStatus(v.getId(), TripStatus.IN_PROGRESS);
            if (activeTrips.isEmpty()) {
                activeTrips = tripRepository.findByVehicleIdAndStatus(v.getId(), TripStatus.ASSIGNED);
            }

            Trip currentTrip = activeTrips.isEmpty() ? null : activeTrips.get(0);
            List<TripItem> tripItems = currentTrip != null && currentTrip.getItems() != null
                    ? currentTrip.getItems()
                    : Collections.emptyList();

            int totalLoaded = 0;
            int totalSold = 0;
            int totalReturned = 0;
            int totalDamaged = 0;
            int totalAvailable = 0;
            BigDecimal totalWeightKg = BigDecimal.ZERO;
            BigDecimal totalStockVal = BigDecimal.ZERO;
            List<TruckInventoryItemDTO> itemDtos = new ArrayList<>();

            for (TripItem ti : tripItems) {
                Product p = ti.getProduct();
                if (p == null) continue;

                int loaded = ti.getLoadedQuantity() != null ? ti.getLoadedQuantity() : 0;
                int sold = ti.getSoldQuantity() != null ? ti.getSoldQuantity() : 0;
                int returned = ti.getReturnedQuantity() != null ? ti.getReturnedQuantity() : 0;
                int damaged = ti.getDamagedQuantity() != null ? ti.getDamagedQuantity() : 0;
                int available = Math.max(0, loaded - sold - returned - damaged);

                totalLoaded += loaded;
                totalSold += sold;
                totalReturned += returned;
                totalDamaged += damaged;
                totalAvailable += available;

                BigDecimal weightGrams = p.getWeightGrams() != null ? p.getWeightGrams() : BigDecimal.valueOf(400);
                BigDecimal lineWeightKg = weightGrams.multiply(BigDecimal.valueOf(available))
                        .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
                totalWeightKg = totalWeightKg.add(lineWeightKg);

                BigDecimal price = p.getWholesalePrice() != null ? p.getWholesalePrice() : BigDecimal.valueOf(35.0);
                BigDecimal lineVal = price.multiply(BigDecimal.valueOf(available));
                totalStockVal = totalStockVal.add(lineVal);

                Integer whStock = finishedGoodsRepository.findTotalStockByProduct(p.getId());

                itemDtos.add(TruckInventoryItemDTO.builder()
                        .id(ti.getId())
                        .productId(p.getId())
                        .productName(p.getName())
                        .productCode(p.getProductCode())
                        .category(p.getCategory())
                        .weightGrams(weightGrams)
                        .loadedQuantity(loaded)
                        .soldQuantity(sold)
                        .returnedQuantity(returned)
                        .damagedQuantity(damaged)
                        .availableQuantity(available)
                        .unitPrice(price)
                        .lineTotalValue(lineVal)
                        .centralWarehouseStock(whStock != null ? whStock : 0)
                        .build());
            }

            BigDecimal capKg = v.getCapacityKg() != null && v.getCapacityKg().compareTo(BigDecimal.ZERO) > 0
                    ? v.getCapacityKg()
                    : BigDecimal.valueOf(1500);

            double capacityPct = capKg.compareTo(BigDecimal.ZERO) > 0
                    ? totalWeightKg.doubleValue() * 100.0 / capKg.doubleValue()
                    : 0.0;

            results.add(TruckInventoryDTO.builder()
                    .vehicleId(v.getId())
                    .vehicleCode(v.getVehicleCode() != null ? v.getVehicleCode() : "VH-" + v.getId())
                    .vehicleNumber(v.getVehicleNumber())
                    .model(v.getModel() != null ? v.getModel() : "Delivery Mini Truck")
                    .type(v.getType() != null ? v.getType() : "Mini Truck")
                    .capacityKg(capKg)
                    .assignedDriver(v.getAssignedDriver() != null ? v.getAssignedDriver() : "Assigned Driver")
                    .driverPhone(v.getDriverPhone())
                    .assignedRoute(v.getAssignedRoute() != null ? v.getAssignedRoute() : "Dynamic Route")
                    .tripId(currentTrip != null ? currentTrip.getId() : null)
                    .tripNumber(currentTrip != null ? currentTrip.getTripNumber() : "STANDBY")
                    .tripStatus(currentTrip != null ? currentTrip.getStatus().name() : "AVAILABLE")
                    .totalLoadedUnits(totalLoaded)
                    .totalSoldUnits(totalSold)
                    .totalReturnedUnits(totalReturned)
                    .totalDamagedUnits(totalDamaged)
                    .totalAvailableUnits(totalAvailable)
                    .totalWeightKg(totalWeightKg.setScale(1, RoundingMode.HALF_UP))
                    .payloadCapacityPercentage(Math.round(capacityPct * 10.0) / 10.0)
                    .totalStockValue(totalStockVal.setScale(2, RoundingMode.HALF_UP))
                    .items(itemDtos)
                    .build());
        }

        return results;
    }

    // ─── Daily Truck Refill / Replenishment from Central Warehouse ────────────

    @Transactional
    public TruckInventoryDTO refillTruck(TruckRefillRequest request) {
        if (request.getVehicleId() == null && (request.getVehicleNumber() == null || request.getVehicleNumber().isBlank())) {
            throw new IllegalArgumentException("Vehicle ID or Vehicle Number is required for refill");
        }

        Vehicle vehicle = request.getVehicleId() != null
                ? vehicleRepository.findById(request.getVehicleId()).orElseThrow(() -> new RuntimeException("Vehicle not found"))
                : vehicleRepository.findByVehicleNumber(request.getVehicleNumber()).orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("At least one product item with refill quantity is required");
        }

        // Find or create active Trip for today
        List<Trip> activeTrips = tripRepository.findByVehicleIdAndStatus(vehicle.getId(), TripStatus.IN_PROGRESS);
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findByVehicleIdAndStatus(vehicle.getId(), TripStatus.ASSIGNED);
        }

        Trip trip;
        if (!activeTrips.isEmpty()) {
            trip = activeTrips.get(0);
        } else {
            String tripNo = "TRIP-" + vehicle.getVehicleNumber().replace("-", "").toUpperCase() + "-" + System.currentTimeMillis() % 10000;
            trip = Trip.builder()
                    .tripNumber(tripNo)
                    .tripDate(LocalDate.now())
                    .vehicle(vehicle)
                    .status(TripStatus.IN_PROGRESS)
                    .totalSalesAmount(BigDecimal.ZERO)
                    .cashCollected(BigDecimal.ZERO)
                    .upiCollected(BigDecimal.ZERO)
                    .totalCollected(BigDecimal.ZERO)
                    .items(new ArrayList<>())
                    .build();
            trip = tripRepository.save(trip);
        }

        Warehouse factoryWh = warehouseRepository.findByType(WarehouseType.FACTORY).stream().findFirst().orElse(null);

        for (TruckRefillItem itemReq : request.getItems()) {
            if (itemReq.getQuantityToRefill() == null || itemReq.getQuantityToRefill() <= 0) continue;

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + itemReq.getProductId()));

            int qtyRefill = itemReq.getQuantityToRefill();

            // Deduct from Finished Goods Inventory (Factory Warehouse)
            List<FinishedGoodsInventory> fgBatches = finishedGoodsRepository.findAll().stream()
                    .filter(fg -> fg.getProduct() != null && fg.getProduct().getId().equals(product.getId()) &&
                                  fg.getQuantityAvailable() != null && fg.getQuantityAvailable() > 0)
                    .sorted(Comparator.comparing(FinishedGoodsInventory::getExpiryDate)) // FIFO by expiry
                    .collect(Collectors.toList());

            int remainingToDeduct = qtyRefill;
            for (FinishedGoodsInventory batch : fgBatches) {
                if (remainingToDeduct <= 0) break;
                int avail = batch.getQuantityAvailable();
                if (avail >= remainingToDeduct) {
                    batch.setQuantityAvailable(avail - remainingToDeduct);
                    finishedGoodsRepository.save(batch);
                    remainingToDeduct = 0;
                } else {
                    batch.setQuantityAvailable(0);
                    finishedGoodsRepository.save(batch);
                    remainingToDeduct -= avail;
                }
            }

            // Find or create TripItem on the truck
            TripItem tripItem = null;
            if (trip.getItems() != null) {
                tripItem = trip.getItems().stream()
                        .filter(ti -> ti.getProduct() != null && ti.getProduct().getId().equals(product.getId()))
                        .findFirst()
                        .orElse(null);
            }

            if (tripItem == null) {
                tripItem = TripItem.builder()
                        .trip(trip)
                        .product(product)
                        .loadedQuantity(qtyRefill)
                        .availableQuantity(qtyRefill)
                        .soldQuantity(0)
                        .returnedQuantity(0)
                        .damagedQuantity(0)
                        .build();
                if (trip.getItems() == null) trip.setItems(new ArrayList<>());
                trip.getItems().add(tripItem);
            } else {
                int curLoaded = tripItem.getLoadedQuantity() != null ? tripItem.getLoadedQuantity() : 0;
                int curAvail = tripItem.getAvailableQuantity() != null ? tripItem.getAvailableQuantity() : 0;
                tripItem.setLoadedQuantity(curLoaded + qtyRefill);
                tripItem.setAvailableQuantity(curAvail + qtyRefill);
            }
            tripItemRepository.save(tripItem);

            // Record in Product Stock Ledger (Movement: TRIP_LOAD)
            ProductStockLedger ledger = ProductStockLedger.builder()
                    .product(product)
                    .warehouse(factoryWh)
                    .trip(trip)
                    .movementType(StockMovementType.TRIP_LOAD)
                    .quantity(qtyRefill)
                    .referenceNumber(trip.getTripNumber())
                    .notes("Refilled " + qtyRefill + " loaves to truck " + vehicle.getVehicleNumber() +
                           (request.getNotes() != null ? " (" + request.getNotes() + ")" : ""))
                    .build();
            stockLedgerRepository.save(ledger);
        }

        log.info("Refilled truck {} (Trip {}) with items.", vehicle.getVehicleNumber(), trip.getTripNumber());

        // Return updated truck summary
        return getTruckInventories().stream()
                .filter(dto -> dto.getVehicleId().equals(vehicle.getId()))
                .findFirst()
                .orElse(null);
    }

    // ─── Daily Truck Stock Audit / Physical Count Check ───────────────────────

    @Transactional
    public TruckInventoryDTO auditTruckStock(TruckAuditRequest request) {
        if (request.getVehicleId() == null) {
            throw new IllegalArgumentException("Vehicle ID is required for stock check");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<Trip> activeTrips = tripRepository.findByVehicleIdAndStatus(vehicle.getId(), TripStatus.IN_PROGRESS);
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findByVehicleIdAndStatus(vehicle.getId(), TripStatus.ASSIGNED);
        }

        if (activeTrips.isEmpty()) {
            throw new RuntimeException("No active trip found on truck " + vehicle.getVehicleNumber() + " to audit.");
        }

        Trip trip = activeTrips.get(0);

        for (TruckAuditItem auditItem : request.getItems()) {
            Product product = productRepository.findById(auditItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            TripItem tripItem = trip.getItems().stream()
                    .filter(ti -> ti.getProduct() != null && ti.getProduct().getId().equals(product.getId()))
                    .findFirst()
                    .orElse(null);

            if (tripItem != null) {
                int oldAvail = tripItem.getAvailableQuantity() != null ? tripItem.getAvailableQuantity() : 0;
                int newPhysical = auditItem.getActualPhysicalCount() != null ? auditItem.getActualPhysicalCount() : oldAvail;
                int dmg = auditItem.getDamagedCount() != null ? auditItem.getDamagedCount() : 0;

                int variance = newPhysical - oldAvail;
                tripItem.setAvailableQuantity(newPhysical);
                if (dmg > 0) {
                    tripItem.setDamagedQuantity((tripItem.getDamagedQuantity() != null ? tripItem.getDamagedQuantity() : 0) + dmg);
                }
                tripItemRepository.save(tripItem);

                // Log variance in ProductStockLedger
                if (variance != 0 || dmg > 0) {
                    ProductStockLedger ledger = ProductStockLedger.builder()
                            .product(product)
                            .trip(trip)
                            .movementType(StockMovementType.ADJUSTMENT)
                            .quantity(variance)
                            .referenceNumber(trip.getTripNumber())
                            .notes("Truck Morning Audit on " + vehicle.getVehicleNumber() + 
                                   ": Variance=" + variance + ", Damaged=" + dmg + " | Notes: " + (request.getNotes() != null ? request.getNotes() : ""))
                            .build();
                    stockLedgerRepository.save(ledger);
                }
            }
        }

        return getTruckInventories().stream()
                .filter(dto -> dto.getVehicleId().equals(vehicle.getId()))
                .findFirst()
                .orElse(null);
    }

    // ─── Stock Movement Ledger ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StockLedgerItemDTO> getStockLedger(Long productId, String movementType) {
        List<ProductStockLedger> list = stockLedgerRepository.findAllByOrderByCreatedAtDesc();

        return list.stream()
                .filter(l -> (productId == null || (l.getProduct() != null && l.getProduct().getId().equals(productId))) &&
                             (movementType == null || movementType.isBlank() || (l.getMovementType() != null && l.getMovementType().name().equalsIgnoreCase(movementType))))
                .map(l -> StockLedgerItemDTO.builder()
                        .id(l.getId())
                        .productId(l.getProduct() != null ? l.getProduct().getId() : null)
                        .productName(l.getProduct() != null ? l.getProduct().getName() : "Product")
                        .productCode(l.getProduct() != null ? l.getProduct().getProductCode() : "")
                        .movementType(l.getMovementType() != null ? l.getMovementType().name() : "ADJUSTMENT")
                        .quantity(l.getQuantity() != null ? l.getQuantity() : 0)
                        .batchNumber(l.getBatchNumber())
                        .referenceNumber(l.getReferenceNumber())
                        .warehouseName(l.getWarehouse() != null ? l.getWarehouse().getName() : "Central Warehouse")
                        .tripNumber(l.getTrip() != null ? l.getTrip().getTripNumber() : null)
                        .shopName(l.getShop() != null ? l.getShop().getName() : null)
                        .notes(l.getNotes())
                        .createdAt(l.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Stock Adjustment & Reconciliation ───────────────────────────────────

    @Transactional
    public FinishedGoodsItemDTO adjustStock(StockAdjustmentRequest request) {
        if (request.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is required for stock adjustment");
        }
        if (request.getAdjustedQuantity() == null || request.getAdjustedQuantity() == 0) {
            throw new IllegalArgumentException("Adjustment quantity must be non-zero");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + request.getProductId()));

        Warehouse warehouse = request.getWarehouseId() != null 
                ? warehouseRepository.findById(request.getWarehouseId()).orElse(null)
                : warehouseRepository.findByType(WarehouseType.FACTORY).stream().findFirst().orElse(null);

        String batch = (request.getBatchNumber() != null && !request.getBatchNumber().isBlank())
                ? request.getBatchNumber().trim()
                : "BATCH-" + LocalDate.now().toString().replace("-", "");

        FinishedGoodsInventory fg = finishedGoodsRepository
                .findByWarehouseIdAndProductIdAndBatchNumber(
                        warehouse != null ? warehouse.getId() : 1L,
                        product.getId(),
                        batch
                )
                .orElseGet(() -> FinishedGoodsInventory.builder()
                        .product(product)
                        .warehouse(warehouse)
                        .batchNumber(batch)
                        .quantityAvailable(0)
                        .mfgDate(LocalDate.now())
                        .expiryDate(LocalDate.now().plusDays(product.getShelfLifeDays() != null ? product.getShelfLifeDays() : 5))
                        .build());

        int currentQty = fg.getQuantityAvailable() != null ? fg.getQuantityAvailable() : 0;
        int newQty = Math.max(0, currentQty + request.getAdjustedQuantity());
        fg.setQuantityAvailable(newQty);
        FinishedGoodsInventory saved = finishedGoodsRepository.save(fg);

        ProductStockLedger ledger = ProductStockLedger.builder()
                .product(product)
                .warehouse(warehouse)
                .movementType(StockMovementType.ADJUSTMENT)
                .quantity(request.getAdjustedQuantity())
                .batchNumber(batch)
                .referenceNumber("ADJ-" + System.currentTimeMillis())
                .notes("Reason: " + (request.getReason() != null ? request.getReason() : "Manual Audit") + 
                       (request.getNotes() != null ? " | Notes: " + request.getNotes() : ""))
                .build();
        stockLedgerRepository.save(ledger);

        long days = saved.getExpiryDate() != null ? ChronoUnit.DAYS.between(LocalDate.now(), saved.getExpiryDate()) : 0;
        BigDecimal price = product.getWholesalePrice() != null ? product.getWholesalePrice() : BigDecimal.valueOf(35.0);

        return FinishedGoodsItemDTO.builder()
                .id(saved.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productCode(product.getProductCode())
                .category(product.getCategory())
                .batchNumber(saved.getBatchNumber())
                .warehouseId(warehouse != null ? warehouse.getId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : "Central Warehouse")
                .quantityAvailable(newQty)
                .mfgDate(saved.getMfgDate())
                .expiryDate(saved.getExpiryDate())
                .daysUntilExpiry(days)
                .isExpiringSoon(days <= 2 && newQty > 0)
                .wholesalePrice(price)
                .totalValuation(price.multiply(BigDecimal.valueOf(newQty)))
                .build();
    }
}
