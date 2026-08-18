package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.*;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionService {

    private final ProductionRunRepository productionRunRepository;
    private final ProductRepository productRepository;
    private final RecipeRepository recipeRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final FinishedGoodsInventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductStockLedgerRepository stockLedgerRepository;

    @Transactional
    public ProductionRunDTO createProductionPlan(ProductionPlanRequest request) {
        log.info("Creating production plan for Product ID: {}, Quantity: {}", request.getProductId(), request.getPlannedQuantity());

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + request.getProductId()));

        Recipe recipe = null;
        if (request.getRecipeId() != null) {
            recipe = recipeRepository.findById(request.getRecipeId()).orElse(null);
        }
        if (recipe == null) {
            recipe = recipeRepository.findByProductIdAndIsActiveTrue(product.getId()).orElse(null);
        }

        String runNumber = "RUN-" + System.currentTimeMillis();
        String batchNumber = "BATCH-" + LocalDate.now().toString().replace("-", "") + "-" + String.format("%03d", (int)(Math.random() * 1000));

        User operator = null;
        if (request.getOperatorId() != null) {
            operator = userRepository.findById(request.getOperatorId()).orElse(null);
        }

        // Calculate theoretical dough weight: ~1.125x finished bread weight (loss during baking)
        BigDecimal targetDoughWeight = request.getTargetDoughWeightKg();
        if (targetDoughWeight == null && product.getName() != null) {
            double approxGramPerUnit = product.getName().contains("800g") ? 900 : (product.getName().contains("100g") ? 115 : 450);
            targetDoughWeight = BigDecimal.valueOf((request.getPlannedQuantity() * approxGramPerUnit) / 1000.0).setScale(2, RoundingMode.HALF_UP);
        }

        // Calculate estimated unit cost from recipe BOM
        BigDecimal estimatedUnitCost = BigDecimal.valueOf(18.50); // Default estimate
        if (recipe != null && recipe.getBatchOutputQuantity() != null && recipe.getBatchOutputQuantity().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal totalBatchCost = BigDecimal.ZERO;
            for (RecipeItem item : recipe.getItems()) {
                if (item.getRawMaterial() != null && item.getRawMaterial().getUnitCost() != null) {
                    totalBatchCost = totalBatchCost.add(item.getRequiredQuantity().multiply(item.getRawMaterial().getUnitCost()));
                }
            }
            if (totalBatchCost.compareTo(BigDecimal.ZERO) > 0) {
                estimatedUnitCost = totalBatchCost.divide(recipe.getBatchOutputQuantity(), 2, RoundingMode.HALF_UP);
            }
        }

        BigDecimal totalEstimatedCost = estimatedUnitCost.multiply(BigDecimal.valueOf(request.getPlannedQuantity()));

        ProductionRun run = ProductionRun.builder()
                .runNumber(runNumber)
                .product(product)
                .recipe(recipe)
                .plannedQuantity(request.getPlannedQuantity())
                .actualProducedQuantity(0)
                .rejectedQuantity(0)
                .wasteQuantity(0)
                .status(ProductionStatus.PLANNED)
                .currentStage(ProductionStage.STAGE_DISPENSING)
                .shift(request.getShift() != null ? request.getShift() : ProductionShift.MORNING_SHIFT)
                .machineUsed(request.getMachineUsed() != null ? request.getMachineUsed() : "Tunnel-Oven-Line-01")
                .operator(operator)
                .targetDoughWeightKg(targetDoughWeight)
                .bakingTempCelsius(request.getBakingTempCelsius() != null ? request.getBakingTempCelsius() : 225)
                .bakingTimeMinutes(request.getBakingTimeMinutes() != null ? request.getBakingTimeMinutes() : 28)
                .yieldPercentage(BigDecimal.valueOf(100.0))
                .isQcPassed(false)
                .unitCost(estimatedUnitCost)
                .totalProductionCost(totalEstimatedCost)
                .notes(request.getNotes())
                .batchNumber(batchNumber)
                .startTime(ZonedDateTime.now())
                .build();

        ProductionRun saved = productionRunRepository.save(run);
        return mapToDTO(saved);
    }

    @Transactional
    public ProductionRunDTO advanceStage(Long runId, ProductionStageAdvanceRequest request) {
        log.info("Advancing production run ID {} to stage: {}", runId, request.getTargetStage());

        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + runId));

        run.setCurrentStage(request.getTargetStage());

        if (run.getStatus() == ProductionStatus.PLANNED && request.getTargetStage() != ProductionStage.STAGE_DISPENSING) {
            run.setStatus(ProductionStatus.IN_PROGRESS);
        }

        if (request.getActualDoughWeightKg() != null) {
            run.setActualDoughWeightKg(request.getActualDoughWeightKg());
        }
        if (request.getBakingTempCelsius() != null) {
            run.setBakingTempCelsius(request.getBakingTempCelsius());
        }
        if (request.getBakingTimeMinutes() != null) {
            run.setBakingTimeMinutes(request.getBakingTimeMinutes());
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            run.setNotes((run.getNotes() != null ? run.getNotes() + " | " : "") + request.getNotes());
        }

        if (request.getTargetStage() == ProductionStage.STAGE_COMPLETED) {
            run.setStatus(ProductionStatus.COMPLETED);
            run.setEndTime(ZonedDateTime.now());
        }

        ProductionRun updated = productionRunRepository.save(run);
        return mapToDTO(updated);
    }

    @Transactional
    public ProductionRunDTO completeProductionRun(Long runId, ProductionCompleteRequest request) {
        log.info("Completing production run ID: {} with actual produced: {}", runId, request.getActualProduced());

        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + runId));

        Product product = run.getProduct();
        Integer actualProduced = request.getActualProduced();
        Integer rejected = request.getRejectedQuantity() != null ? request.getRejectedQuantity() : 0;
        Integer waste = request.getWasteQuantity() != null ? request.getWasteQuantity() : 0;

        // 1. Fetch active Recipe / BOM
        Recipe recipe = run.getRecipe();
        if (recipe == null) {
            recipe = recipeRepository.findByProductIdAndIsActiveTrue(product.getId()).orElse(null);
        }

        if (recipe != null && recipe.getBatchOutputQuantity() != null && recipe.getBatchOutputQuantity().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal batchRatio = BigDecimal.valueOf(actualProduced + rejected)
                    .divide(recipe.getBatchOutputQuantity(), 4, RoundingMode.HALF_UP);

            // 2. Deduct Raw Materials from Stock & log inventory transaction
            for (RecipeItem item : recipe.getItems()) {
                RawMaterial rawMaterial = item.getRawMaterial();
                if (rawMaterial != null) {
                    BigDecimal requiredAmount = item.getRequiredQuantity().multiply(batchRatio);
                    BigDecimal currentStock = rawMaterial.getCurrentStock() != null ? rawMaterial.getCurrentStock() : BigDecimal.ZERO;

                    rawMaterial.setCurrentStock(currentStock.subtract(requiredAmount).max(BigDecimal.ZERO));
                    rawMaterialRepository.save(rawMaterial);

                    // Record material consumption transaction
                    try {
                        InventoryTransaction txn = InventoryTransaction.builder()
                                .transactionType(InventoryTransactionType.RAW_MATERIAL_TO_PRODUCTION)
                                .product(product)
                                .quantity(requiredAmount.intValue())
                                .source("RAW_MATERIAL_WAREHOUSE")
                                .destination("PRODUCTION_LINE_" + (run.getMachineUsed() != null ? run.getMachineUsed() : "01"))
                                .referenceNumber(run.getBatchNumber())
                                .notes("Consumed for " + product.getName() + " batch " + run.getBatchNumber())
                                .createdBy(run.getOperator() != null ? run.getOperator().getUsername() : "system")
                                .build();
                        inventoryTransactionRepository.save(txn);
                    } catch (Exception e) {
                        log.warn("Could not log inventory transaction: {}", e.getMessage());
                    }
                }
            }
        }

        // 3. Deposit Finished Goods into Factory Warehouse
        Warehouse factoryWh = warehouseRepository.findByType(WarehouseType.FACTORY).stream().findFirst()
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .warehouseCode("WH-FACTORY-01")
                        .name("Central Plant Finished Goods Warehouse")
                        .type(WarehouseType.FACTORY)
                        .location("Plant Line 1 Handover Hub")
                        .build()));

        int shelfLife = product.getShelfLifeDays() != null ? product.getShelfLifeDays() : 5;
        FinishedGoodsInventory inventory = inventoryRepository
                .findByWarehouseIdAndProductIdAndBatchNumber(factoryWh.getId(), product.getId(), run.getBatchNumber())
                .orElse(FinishedGoodsInventory.builder()
                        .warehouse(factoryWh)
                        .product(product)
                        .batchNumber(run.getBatchNumber())
                        .quantityAvailable(0)
                        .mfgDate(LocalDate.now())
                        .expiryDate(LocalDate.now().plusDays(shelfLife))
                        .build());

        inventory.setQuantityAvailable(inventory.getQuantityAvailable() + actualProduced);
        inventoryRepository.save(inventory);

        // 3b. Record in Product Stock Ledger (Movement: PRODUCTION)
        try {
            ProductStockLedger ledger = ProductStockLedger.builder()
                    .product(product)
                    .warehouse(factoryWh)
                    .movementType(StockMovementType.PRODUCTION)
                    .quantity(actualProduced)
                    .batchNumber(run.getBatchNumber())
                    .referenceNumber(run.getRunNumber())
                    .notes("Production completed: " + actualProduced + " loaves deposited to " + factoryWh.getName() + " (Run: " + run.getRunNumber() + ")")
                    .build();
            stockLedgerRepository.save(ledger);
        } catch (Exception e) {
            log.warn("Could not log stock ledger entry for production completion: {}", e.getMessage());
        }

        // 4. Update Production Run state & ensure all stage timestamps are cleanly finalized
        ZonedDateTime now = ZonedDateTime.now();
        if (!Boolean.TRUE.equals(run.getStage1Completed())) {
            run.setStage1Completed(true);
            if (run.getStage1StartTime() == null) run.setStage1StartTime(run.getStartTime() != null ? run.getStartTime() : now);
            if (run.getStage1EndTime() == null) run.setStage1EndTime(now);
        }
        if (!Boolean.TRUE.equals(run.getStage2Completed())) {
            run.setStage2Completed(true);
            if (run.getStage2StartTime() == null) run.setStage2StartTime(run.getStage1EndTime() != null ? run.getStage1EndTime() : now);
            if (run.getStage2EndTime() == null) run.setStage2EndTime(now);
        }
        if (!Boolean.TRUE.equals(run.getStage3Completed())) {
            run.setStage3Completed(true);
            if (run.getStage3StartTime() == null) run.setStage3StartTime(run.getStage2EndTime() != null ? run.getStage2EndTime() : now);
            if (run.getStage3EndTime() == null) run.setStage3EndTime(now);
        }

        run.setActualProducedQuantity(actualProduced);
        run.setRejectedQuantity(rejected);
        run.setWasteQuantity(waste);
        run.setDefectReason(request.getDefectReason());
        run.setDefectNotes(request.getDefectNotes());
        run.setQcInspectorName(request.getQcInspectorName() != null ? request.getQcInspectorName() : "S. Murugan (Senior QC)");
        run.setIsQcPassed(request.getIsQcPassed() != null ? request.getIsQcPassed() : true);
        run.setStatus(ProductionStatus.COMPLETED);
        run.setCurrentStage(ProductionStage.STAGE_COMPLETED);
        run.setEndTime(now);

        // Calculate Yield %: (actual produced / planned) * 100
        if (run.getPlannedQuantity() != null && run.getPlannedQuantity() > 0) {
            BigDecimal yield = BigDecimal.valueOf((actualProduced * 100.0) / run.getPlannedQuantity())
                    .setScale(2, RoundingMode.HALF_UP);
            run.setYieldPercentage(yield);
        }

        ProductionRun updated = productionRunRepository.save(run);
        log.info("Production run {} completed. Deposited {} loaves to finished goods inventory.",
                updated.getRunNumber(), actualProduced);
        return mapToDTO(updated);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PackagingRequest {
        private Integer boxCount;
        private Integer unitsPerBox;
        private Integer bundleCount;
        private Integer unitsPerBundle;
        private Integer coverCount;
        private Integer unitsPerCover;
        private Integer tinCount;
        private Integer looseUnits;
        private String packagingType;
        private String packagingNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageTransitionRequest {
        private Integer bakingTempCelsius;
        private Integer bakingTimeMinutes;
        private BigDecimal actualDoughWeightKg;
        private Integer slicedLoafCount;
        private Integer damagedDuringSlicing;
        private String packagingType;
        private Integer packagedUnits;
        private Integer boxedCount;
        private Integer bundledCount;
        private Integer coveredCount;
        private Integer tinCount;
        private Integer looseUnits;
        private String packagingNotes;
    }

    @Transactional
    public ProductionRunDTO startStage(Long runId, int stageNumber) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + runId));

        ZonedDateTime now = ZonedDateTime.now();
        if (run.getStartTime() == null) {
            run.setStartTime(now);
        }
        run.setStatus(ProductionStatus.IN_PROGRESS);

        if (stageNumber == 1) {
            run.setStage1StartTime(now);
            run.setCurrentStage(ProductionStage.STAGE_1_PREP_BAKE_COOL);
        } else if (stageNumber == 2) {
            // Ensure Stage 1 has stop timing
            if (!Boolean.TRUE.equals(run.getStage1Completed())) {
                run.setStage1Completed(true);
                if (run.getStage1EndTime() == null) run.setStage1EndTime(now);
                if (run.getStage1StartTime() == null) run.setStage1StartTime(run.getStartTime() != null ? run.getStartTime() : now);
            }
            run.setStage2StartTime(now);
            run.setCurrentStage(ProductionStage.STAGE_2_SLICE_PACK_STACK);
        } else if (stageNumber == 3) {
            // Ensure Stage 2 has stop timing
            if (!Boolean.TRUE.equals(run.getStage2Completed())) {
                run.setStage2Completed(true);
                if (run.getStage2EndTime() == null) run.setStage2EndTime(now);
                if (run.getStage2StartTime() == null) run.setStage2StartTime(run.getStage1EndTime() != null ? run.getStage1EndTime() : now);
            }
            run.setStage3StartTime(now);
            run.setCurrentStage(ProductionStage.STAGE_3_ROLL_PACKAGING);
        }

        ProductionRun updated = productionRunRepository.save(run);
        log.info("Started Stage {} for Production Run {}", stageNumber, run.getRunNumber());
        return mapToDTO(updated);
    }

    @Transactional
    public ProductionRunDTO completeStage(Long runId, int stageNumber, StageTransitionRequest request) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + runId));

        ZonedDateTime now = ZonedDateTime.now();

        if (stageNumber == 1) {
            run.setStage1EndTime(now);
            run.setStage1Completed(true);
            if (run.getStage1StartTime() == null) {
                run.setStage1StartTime(run.getStartTime() != null ? run.getStartTime() : now);
            }
            if (request != null) {
                if (request.getBakingTempCelsius() != null) run.setBakingTempCelsius(request.getBakingTempCelsius());
                if (request.getBakingTimeMinutes() != null) run.setBakingTimeMinutes(request.getBakingTimeMinutes());
                if (request.getActualDoughWeightKg() != null) run.setActualDoughWeightKg(request.getActualDoughWeightKg());
            }
            // Sequentially advance to Stage 2
            run.setCurrentStage(ProductionStage.STAGE_2_SLICE_PACK_STACK);
            if (run.getStage2StartTime() == null) run.setStage2StartTime(now);
        } else if (stageNumber == 2) {
            run.setStage2EndTime(now);
            run.setStage2Completed(true);
            if (run.getStage2StartTime() == null) {
                run.setStage2StartTime(run.getStage1EndTime() != null ? run.getStage1EndTime() : now);
            }
            // Sequentially advance to Stage 3
            run.setCurrentStage(ProductionStage.STAGE_3_ROLL_PACKAGING);
            if (run.getStage3StartTime() == null) run.setStage3StartTime(now);
        } else if (stageNumber == 3) {
            run.setStage3EndTime(now);
            run.setStage3Completed(true);
            if (run.getStage3StartTime() == null) {
                run.setStage3StartTime(run.getStage2EndTime() != null ? run.getStage2EndTime() : now);
            }
            // Sequentially advance to QC & Handover
            run.setCurrentStage(ProductionStage.STAGE_COMPLETED);
        }

        ProductionRun updated = productionRunRepository.save(run);
        log.info("Completed Stage {} for Production Run {}", stageNumber, run.getRunNumber());
        return mapToDTO(updated);
    }

    @Transactional
    public ProductionRunDTO savePackaging(Long runId, PackagingRequest request) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + runId));

        if (request.getBoxCount() != null) run.setBoxCount(request.getBoxCount());
        if (request.getUnitsPerBox() != null) run.setUnitsPerBox(request.getUnitsPerBox());
        if (request.getBundleCount() != null) run.setBundleCount(request.getBundleCount());
        if (request.getUnitsPerBundle() != null) run.setUnitsPerBundle(request.getUnitsPerBundle());
        if (request.getCoverCount() != null) run.setCoverCount(request.getCoverCount());
        if (request.getUnitsPerCover() != null) run.setUnitsPerCover(request.getUnitsPerCover());
        if (request.getTinCount() != null) run.setTinCount(request.getTinCount());
        if (request.getLooseUnits() != null) run.setLooseUnits(request.getLooseUnits());
        if (request.getPackagingType() != null) run.setPackagingType(request.getPackagingType());
        if (request.getPackagingNotes() != null) run.setPackagingNotes(request.getPackagingNotes());

        ProductionRun updated = productionRunRepository.save(run);
        log.info("Saved packaging configuration for run {}: {} boxes, {} bundles, {} covers, {} tins, {} loose units",
                run.getRunNumber(), run.getBoxCount(), run.getBundleCount(), run.getCoverCount(), run.getTinCount(), run.getLooseUnits());
        return mapToDTO(updated);
    }

    @Transactional(readOnly = true)
    public BOMPreviewResponse getBOMPreview(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + productId));

        Recipe recipe = recipeRepository.findByProductIdAndIsActiveTrue(productId)
                .orElse(null);

        int targetQty = (quantity != null && quantity > 0) ? quantity : 1000;
        BigDecimal batchSize = (recipe != null && recipe.getBatchOutputQuantity() != null)
                ? recipe.getBatchOutputQuantity() : BigDecimal.valueOf(1000);

        BigDecimal scalingRatio = BigDecimal.valueOf(targetQty).divide(batchSize, 4, RoundingMode.HALF_UP);

        List<ProductionRunDTO.BOMItemDTO> ingredients = new ArrayList<>();
        BigDecimal totalCost = BigDecimal.ZERO;
        boolean allSufficient = true;

        if (recipe != null && recipe.getItems() != null) {
            for (RecipeItem item : recipe.getItems()) {
                RawMaterial mat = item.getRawMaterial();
                if (mat != null) {
                    BigDecimal reqQty = item.getRequiredQuantity().multiply(scalingRatio).setScale(3, RoundingMode.HALF_UP);
                    BigDecimal availStock = mat.getCurrentStock() != null ? mat.getCurrentStock() : BigDecimal.ZERO;
                    boolean sufficient = availStock.compareTo(reqQty) >= 0;
                    if (!sufficient) allSufficient = false;

                    BigDecimal uCost = mat.getUnitCost() != null ? mat.getUnitCost() : BigDecimal.valueOf(35.0);
                    BigDecimal itemTotalCost = reqQty.multiply(uCost).setScale(2, RoundingMode.HALF_UP);
                    totalCost = totalCost.add(itemTotalCost);

                    ingredients.add(ProductionRunDTO.BOMItemDTO.builder()
                            .rawMaterialId(mat.getId())
                            .materialCode(mat.getMaterialCode())
                            .materialName(mat.getName())
                            .requiredQuantity(reqQty)
                            .unit(item.getUnit() != null ? item.getUnit() : mat.getUnit())
                            .availableStock(availStock)
                            .isSufficient(sufficient)
                            .unitCost(uCost)
                            .totalCost(itemTotalCost)
                            .build());
                }
            }
        }

        BigDecimal unitCost = targetQty > 0 ? totalCost.divide(BigDecimal.valueOf(targetQty), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return BOMPreviewResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .recipeId(recipe != null ? recipe.getId() : null)
                .recipeName(recipe != null ? recipe.getRecipeName() : "Standard BOM")
                .requestedQuantity(targetQty)
                .recipeBatchSize(batchSize)
                .scalingRatio(scalingRatio)
                .estimatedUnitCost(unitCost)
                .estimatedTotalCost(totalCost)
                .allIngredientsSufficient(allSufficient)
                .ingredients(ingredients)
                .build();
    }

    @Transactional(readOnly = true)
    public ProductionKpisResponse getProductionKpis() {
        List<ProductionRun> allRuns = productionRunRepository.findAll();

        int totalRuns = allRuns.size();
        int active = (int) allRuns.stream().filter(r -> r.getStatus() == ProductionStatus.IN_PROGRESS || r.getStatus() == ProductionStatus.PLANNED).count();
        int completed = (int) allRuns.stream().filter(r -> r.getStatus() == ProductionStatus.COMPLETED).count();

        int totalPlanned = allRuns.stream().mapToInt(r -> r.getPlannedQuantity() != null ? r.getPlannedQuantity() : 0).sum();
        int totalProduced = allRuns.stream().mapToInt(r -> r.getActualProducedQuantity() != null ? r.getActualProducedQuantity() : 0).sum();
        int totalRejected = allRuns.stream().mapToInt(r -> r.getRejectedQuantity() != null ? r.getRejectedQuantity() : 0).sum();
        int totalWaste = allRuns.stream().mapToInt(r -> r.getWasteQuantity() != null ? r.getWasteQuantity() : 0).sum();

        BigDecimal avgYield = (totalPlanned > 0 && totalProduced > 0)
                ? BigDecimal.valueOf((totalProduced * 100.0) / totalPlanned).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal oee = (totalProduced > 0 && (totalProduced + totalRejected) > 0)
                ? BigDecimal.valueOf((totalProduced * 100.0) / (totalProduced + totalRejected)).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal totalCost = allRuns.stream()
                .map(r -> r.getTotalProductionCost() != null ? r.getTotalProductionCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ProductionKpisResponse.builder()
                .totalRunsToday(totalRuns)
                .activeBatches(active)
                .completedBatches(completed)
                .plannedOutputTotal(totalPlanned)
                .actualOutputTotal(totalProduced)
                .averageYieldPercentage(avgYield)
                .totalRejectedLoaves(totalRejected)
                .totalWasteKg(totalWaste)
                .oeeEfficiencyPercentage(oee)
                .totalMaterialCost(totalCost)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductionRunDTO> getAllProductionRuns(ProductionStatus status, ProductionStage stage, String search) {
        List<ProductionRun> runs;
        if (status != null) {
            runs = productionRunRepository.findByStatus(status);
        } else {
            runs = productionRunRepository.findAll();
        }

        return runs.stream()
                .filter(r -> stage == null || r.getCurrentStage() == stage)
                .filter(r -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return (r.getRunNumber() != null && r.getRunNumber().toLowerCase().contains(q)) ||
                           (r.getBatchNumber() != null && r.getBatchNumber().toLowerCase().contains(q)) ||
                           (r.getProduct() != null && r.getProduct().getName().toLowerCase().contains(q)) ||
                           (r.getMachineUsed() != null && r.getMachineUsed().toLowerCase().contains(q));
                })
                .sorted(Comparator.comparing(ProductionRun::getId).reversed())
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductionRunDTO getProductionRunById(Long id) {
        ProductionRun run = productionRunRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + id));
        return mapToDTO(run);
    }

    @Transactional
    public ProductionRunDTO startProductionRun(Long id) {
        ProductionRun run = productionRunRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + id));

        ZonedDateTime now = ZonedDateTime.now();
        run.setStatus(ProductionStatus.IN_PROGRESS);
        run.setCurrentStage(ProductionStage.STAGE_1_PREP_BAKE_COOL);
        if (run.getStartTime() == null) {
            run.setStartTime(now);
        }
        if (run.getStage1StartTime() == null) {
            run.setStage1StartTime(now);
        }
        ProductionRun saved = productionRunRepository.save(run);
        return mapToDTO(saved);
    }

    @Transactional
    public ProductionRunDTO cancelProductionRun(Long id) {
        ProductionRun run = productionRunRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + id));

        if (run.getStatus() == ProductionStatus.COMPLETED) {
            throw new IllegalStateException("Completed production runs cannot be cancelled");
        }
        run.setStatus(ProductionStatus.CANCELLED);
        run.setEndTime(ZonedDateTime.now());
        ProductionRun saved = productionRunRepository.save(run);
        return mapToDTO(saved);
    }

    @Transactional
    public ProductionRunDTO pauseProductionRun(Long id) {
        ProductionRun run = productionRunRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Production run not found with ID: " + id));

        run.setStatus(ProductionStatus.PAUSED);
        ProductionRun saved = productionRunRepository.save(run);
        return mapToDTO(saved);
    }

    public ProductionRunDTO mapToDTO(ProductionRun run) {
        if (run == null) return null;
        Recipe recipe = run.getRecipe();
        List<ProductionRunDTO.BOMItemDTO> bomItems = new ArrayList<>();

        if (recipe != null && recipe.getItems() != null) {
            BigDecimal batchSize = recipe.getBatchOutputQuantity() != null ? recipe.getBatchOutputQuantity() : BigDecimal.valueOf(1000);
            int planned = run.getPlannedQuantity() != null ? run.getPlannedQuantity() : 1000;
            BigDecimal ratio = BigDecimal.valueOf(planned).divide(batchSize, 4, RoundingMode.HALF_UP);

            for (RecipeItem item : recipe.getItems()) {
                RawMaterial mat = item.getRawMaterial();
                if (mat != null) {
                    BigDecimal req = item.getRequiredQuantity().multiply(ratio).setScale(3, RoundingMode.HALF_UP);
                    BigDecimal stock = mat.getCurrentStock() != null ? mat.getCurrentStock() : BigDecimal.ZERO;
                    bomItems.add(ProductionRunDTO.BOMItemDTO.builder()
                            .rawMaterialId(mat.getId())
                            .materialCode(mat.getMaterialCode())
                            .materialName(mat.getName())
                            .requiredQuantity(req)
                            .unit(item.getUnit() != null ? item.getUnit() : mat.getUnit())
                            .availableStock(stock)
                            .isSufficient(stock.compareTo(req) >= 0)
                            .unitCost(mat.getUnitCost() != null ? mat.getUnitCost() : BigDecimal.ZERO)
                            .totalCost(req.multiply(mat.getUnitCost() != null ? mat.getUnitCost() : BigDecimal.ZERO))
                            .build());
                }
            }
        }

        return ProductionRunDTO.builder()
                .id(run.getId())
                .runNumber(run.getRunNumber())
                .batchNumber(run.getBatchNumber())
                .productId(run.getProduct() != null ? run.getProduct().getId() : null)
                .productCode(run.getProduct() != null ? run.getProduct().getProductCode() : null)
                .productName(run.getProduct() != null ? run.getProduct().getName() : "Product")
                .productCategory(run.getProduct() != null ? run.getProduct().getCategory() : "Bakery")
                .shelfLifeDays(run.getProduct() != null ? run.getProduct().getShelfLifeDays() : 5)
                .recipeId(recipe != null ? recipe.getId() : null)
                .recipeName(recipe != null ? recipe.getRecipeName() : "Standard BOM")
                .plannedQuantity(run.getPlannedQuantity())
                .actualProducedQuantity(run.getActualProducedQuantity())
                .rejectedQuantity(run.getRejectedQuantity())
                .wasteQuantity(run.getWasteQuantity())
                .yieldPercentage(run.getYieldPercentage() != null ? run.getYieldPercentage() : BigDecimal.valueOf(100.0))
                .status(run.getStatus())
                .currentStage(run.getCurrentStage() != null ? run.getCurrentStage() : ProductionStage.STAGE_1_PREP_BAKE_COOL)
                .shift(run.getShift() != null ? run.getShift() : ProductionShift.MORNING_SHIFT)
                .machineUsed(run.getMachineUsed())
                .operatorId(run.getOperator() != null ? run.getOperator().getId() : null)
                .operatorName(run.getOperator() != null ? run.getOperator().getFullName() : "Ramesh Kumar (Master Baker)")
                .targetDoughWeightKg(run.getTargetDoughWeightKg())
                .actualDoughWeightKg(run.getActualDoughWeightKg())
                .bakingTempCelsius(run.getBakingTempCelsius())
                .bakingTimeMinutes(run.getBakingTimeMinutes())
                .defectReason(run.getDefectReason())
                .defectNotes(run.getDefectNotes())
                .qcInspectorName(run.getQcInspectorName())
                .isQcPassed(run.getIsQcPassed())
                .unitCost(run.getUnitCost())
                .totalProductionCost(run.getTotalProductionCost())
                .notes(run.getNotes())
                .startTime(run.getStartTime())
                .endTime(run.getEndTime())
                .stage1StartTime(run.getStage1StartTime())
                .stage1EndTime(run.getStage1EndTime())
                .stage1Completed(run.getStage1Completed())
                .stage2StartTime(run.getStage2StartTime())
                .stage2EndTime(run.getStage2EndTime())
                .stage2Completed(run.getStage2Completed())
                .stage3StartTime(run.getStage3StartTime())
                .stage3EndTime(run.getStage3EndTime())
                .stage3Completed(run.getStage3Completed())
                .boxCount(run.getBoxCount())
                .unitsPerBox(run.getUnitsPerBox())
                .bundleCount(run.getBundleCount())
                .unitsPerBundle(run.getUnitsPerBundle())
                .coverCount(run.getCoverCount())
                .unitsPerCover(run.getUnitsPerCover())
                .tinCount(run.getTinCount())
                .looseUnits(run.getLooseUnits())
                .packagingType(run.getPackagingType())
                .packagingNotes(run.getPackagingNotes())
                .createdAt(run.getCreatedAt())
                .updatedAt(run.getUpdatedAt())
                .bomItems(bomItems)
                .build();
    }
}
