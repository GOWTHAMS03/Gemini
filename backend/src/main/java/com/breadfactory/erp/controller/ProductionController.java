package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.*;
import com.breadfactory.erp.enums.ProductionStage;
import com.breadfactory.erp.enums.ProductionStatus;
import com.breadfactory.erp.service.ProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/production")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductionController {

    private final ProductionService productionService;

    /**
     * Get all production runs with optional status, stage, or search query filter
     */
    @GetMapping
    public ResponseEntity<List<ProductionRunDTO>> getAllRuns(
            @RequestParam(required = false) ProductionStatus status,
            @RequestParam(required = false) ProductionStage stage,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productionService.getAllProductionRuns(status, stage, search));
    }

    /**
     * Get real-time Factory Floor KPIs
     */
    @GetMapping("/kpis")
    public ResponseEntity<ProductionKpisResponse> getProductionKpis() {
        return ResponseEntity.ok(productionService.getProductionKpis());
    }

    /**
     * Preview Recipe / BOM requirements and live stock sufficiency before planning
     */
    @GetMapping("/bom-preview")
    public ResponseEntity<BOMPreviewResponse> getBOMPreview(
            @RequestParam Long productId,
            @RequestParam(required = false, defaultValue = "1000") Integer quantity) {
        return ResponseEntity.ok(productionService.getBOMPreview(productId, quantity));
    }

    /**
     * Get a specific production batch dossier by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductionRunDTO> getRunById(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.getProductionRunById(id));
    }

    /**
     * Create a new production batch plan
     */
    @PostMapping("/plan")
    public ResponseEntity<ProductionRunDTO> createPlan(@Valid @RequestBody ProductionPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productionService.createProductionPlan(request));
    }

    /**
     * Start production batch (moves to STAGE_MIXING & IN_PROGRESS)
     */
    @PostMapping("/start/{id}")
    public ResponseEntity<ProductionRunDTO> startRun(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.startProductionRun(id));
    }

    /**
     * Advance batch to next manufacturing stage
     */
    @PostMapping("/{id}/advance-stage")
    public ResponseEntity<ProductionRunDTO> advanceStage(
            @PathVariable Long id,
            @Valid @RequestBody ProductionStageAdvanceRequest request) {
        return ResponseEntity.ok(productionService.advanceStage(id, request));
    }

    /**
     * Pause a running production batch
     */
    @PostMapping("/pause/{id}")
    public ResponseEntity<ProductionRunDTO> pauseRun(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.pauseProductionRun(id));
    }

    /**
     * Complete production batch with actual good loaves, rejects, and waste
     */
    @PostMapping("/complete/{id}")
    public ResponseEntity<ProductionRunDTO> completeRun(
            @PathVariable Long id,
            @RequestParam(required = false) Integer actualProduced,
            @RequestParam(required = false, defaultValue = "0") Integer rejected,
            @RequestParam(required = false, defaultValue = "0") Integer waste,
            @RequestBody(required = false) ProductionCompleteRequest bodyRequest) {

        ProductionCompleteRequest req = bodyRequest;
        if (req == null) {
            req = ProductionCompleteRequest.builder()
                    .actualProduced(actualProduced != null ? actualProduced : 1000)
                    .rejectedQuantity(rejected)
                    .wasteQuantity(waste)
                    .build();
        } else if (actualProduced != null) {
            req.setActualProduced(actualProduced);
            if (rejected != null) req.setRejectedQuantity(rejected);
            if (waste != null) req.setWasteQuantity(waste);
        }

        return ResponseEntity.ok(productionService.completeProductionRun(id, req));
    }

    /**
     * Cancel a production batch
     */
    @PostMapping("/cancel/{id}")
    public ResponseEntity<ProductionRunDTO> cancelRun(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.cancelProductionRun(id));
    }
}
