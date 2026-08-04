package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.ProductionPlanRequest;
import com.breadfactory.erp.entity.ProductionRun;
import com.breadfactory.erp.service.ProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/production")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductionController {

    private final ProductionService productionService;

    @GetMapping
    public ResponseEntity<java.util.List<ProductionRun>> getAllRuns(@RequestParam(required = false) com.breadfactory.erp.enums.ProductionStatus status) {
        return ResponseEntity.ok(productionService.getAllProductionRuns(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductionRun> getRunById(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.getProductionRunById(id));
    }

    @PostMapping("/plan")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FACTORY_MANAGER')")
    public ResponseEntity<ProductionRun> createPlan(@Valid @RequestBody ProductionPlanRequest request) {
        return ResponseEntity.ok(productionService.createProductionPlan(request));
    }

    @PostMapping("/start/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FACTORY_MANAGER')")
    public ResponseEntity<ProductionRun> startRun(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.startProductionRun(id));
    }

    @PostMapping("/complete/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FACTORY_MANAGER')")
    public ResponseEntity<ProductionRun> completeRun(
            @PathVariable Long id,
            @RequestParam Integer actualProduced,
            @RequestParam(required = false, defaultValue = "0") Integer rejected,
            @RequestParam(required = false, defaultValue = "0") Integer waste) {
        return ResponseEntity.ok(productionService.completeProductionRun(id, actualProduced, rejected, waste));
    }

    @PostMapping("/cancel/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FACTORY_MANAGER')")
    public ResponseEntity<ProductionRun> cancelRun(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.cancelProductionRun(id));
    }
}
