package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.ProductionPlanRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.ProductionStatus;
import com.breadfactory.erp.enums.WarehouseType;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionService {

    private final ProductionRunRepository productionRunRepository;
    private final ProductRepository productRepository;
    private final RecipeRepository recipeRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final FinishedGoodsInventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProductionRun createProductionPlan(ProductionPlanRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String runNumber = "RUN-" + System.currentTimeMillis();
        String batchNumber = "BATCH-" + LocalDate.now().toString().replace("-", "") + "-" + (int)(Math.random() * 1000);

        User operator = null;
        if (request.getOperatorId() != null) {
            operator = userRepository.findById(request.getOperatorId()).orElse(null);
        }

        ProductionRun run = ProductionRun.builder()
                .runNumber(runNumber)
                .product(product)
                .plannedQuantity(request.getPlannedQuantity())
                .status(ProductionStatus.PLANNED)
                .machineUsed(request.getMachineUsed())
                .operator(operator)
                .batchNumber(batchNumber)
                .startTime(ZonedDateTime.now())
                .build();

        return productionRunRepository.save(run);
    }

    @Transactional
    public ProductionRun completeProductionRun(Long runId, Integer actualProduced, Integer rejected, Integer waste) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new RuntimeException("Production run not found"));

        Product product = run.getProduct();

        // 1. Fetch Active Recipe/BOM for Product
        Recipe recipe = recipeRepository.findByProductIdAndIsActiveTrue(product.getId())
                .orElseThrow(() -> new RuntimeException("No active BOM Recipe found for product: " + product.getName()));

        // Calculate scaling ratio (Actual produced / Recipe batch output)
        BigDecimal batchRatio = BigDecimal.valueOf(actualProduced)
                .divide(recipe.getBatchOutputQuantity(), 4, RoundingMode.HALF_UP);

        // 2. Deduct Raw Materials from Stock based on BOM Matrix
        for (RecipeItem item : recipe.getItems()) {
            RawMaterial rawMaterial = item.getRawMaterial();
            BigDecimal requiredAmount = item.getRequiredQuantity().multiply(batchRatio);

            if (rawMaterial.getCurrentStock().compareTo(requiredAmount) < 0) {
                throw new RuntimeException("Insufficient stock for Raw Material: " + rawMaterial.getName() +
                        ". Required: " + requiredAmount + " " + item.getUnit() +
                        ", Available: " + rawMaterial.getCurrentStock());
            }

            rawMaterial.setCurrentStock(rawMaterial.getCurrentStock().subtract(requiredAmount));
            rawMaterialRepository.save(rawMaterial);
        }

        // 3. Add Produced Finished Goods to Factory Warehouse Inventory
        Warehouse factoryWh = warehouseRepository.findByType(WarehouseType.FACTORY).stream().findFirst()
                .orElseGet(() -> warehouseRepository.save(Warehouse.builder()
                        .warehouseCode("WH-FACTORY")
                        .name("Main Factory Central Warehouse")
                        .type(WarehouseType.FACTORY)
                        .location("Factory Floor 1")
                        .build()));

        FinishedGoodsInventory inventory = inventoryRepository
                .findByWarehouseIdAndProductIdAndBatchNumber(factoryWh.getId(), product.getId(), run.getBatchNumber())
                .orElse(FinishedGoodsInventory.builder()
                        .warehouse(factoryWh)
                        .product(product)
                        .batchNumber(run.getBatchNumber())
                        .quantityAvailable(0)
                        .mfgDate(LocalDate.now())
                        .expiryDate(LocalDate.now().plusDays(product.getShelfLifeDays()))
                        .build());

        inventory.setQuantityAvailable(inventory.getQuantityAvailable() + actualProduced);
        inventoryRepository.save(inventory);

        // 4. Update Production Run Record
        run.setActualProducedQuantity(actualProduced);
        run.setRejectedQuantity(rejected != null ? rejected : 0);
        run.setWasteQuantity(waste != null ? waste : 0);
        run.setStatus(ProductionStatus.COMPLETED);
        run.setEndTime(ZonedDateTime.now());

        return productionRunRepository.save(run);
    }

    @Transactional(readOnly = true)
    public java.util.List<ProductionRun> getAllProductionRuns(ProductionStatus status) {
        if (status != null) {
            return productionRunRepository.findByStatus(status);
        }
        return productionRunRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ProductionRun getProductionRunById(Long id) {
        return productionRunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Production run not found with ID: " + id));
    }

    @Transactional
    public ProductionRun startProductionRun(Long id) {
        ProductionRun run = getProductionRunById(id);
        if (run.getStatus() != ProductionStatus.PLANNED) {
            throw new RuntimeException("Only PLANNED runs can be started. Current status: " + run.getStatus());
        }
        run.setStatus(ProductionStatus.IN_PROGRESS);
        run.setStartTime(ZonedDateTime.now());
        return productionRunRepository.save(run);
    }

    @Transactional
    public ProductionRun cancelProductionRun(Long id) {
        ProductionRun run = getProductionRunById(id);
        if (run.getStatus() == ProductionStatus.COMPLETED) {
            throw new RuntimeException("Completed production runs cannot be cancelled");
        }
        run.setStatus(ProductionStatus.CANCELLED);
        run.setEndTime(ZonedDateTime.now());
        return productionRunRepository.save(run);
    }
}
