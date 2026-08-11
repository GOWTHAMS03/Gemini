package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.FactoryDTOs.*;
import com.breadfactory.erp.service.FactoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/factories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FactoryController {

    private final FactoryService factoryService;

    @GetMapping
    public ResponseEntity<List<FactoryResponse>> getAllFactories() {
        return ResponseEntity.ok(factoryService.getAllFactories());
    }

    @GetMapping("/overview")
    public ResponseEntity<FactoryOverviewSummaryResponse> getOverviewSummary() {
        return ResponseEntity.ok(factoryService.getFactoryOverviewSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FactoryDetailBreakdownResponse> getFactoryDetail(@PathVariable Long id) {
        return ResponseEntity.ok(factoryService.getFactoryDetailBreakdown(id));
    }

    @PostMapping
    public ResponseEntity<FactoryResponse> createFactory(@RequestBody FactoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(factoryService.createFactory(request, "admin"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FactoryResponse> updateFactory(@PathVariable Long id, @RequestBody FactoryCreateRequest request) {
        return ResponseEntity.ok(factoryService.updateFactory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFactory(@PathVariable Long id) {
        factoryService.deleteFactory(id);
        return ResponseEntity.ok().build();
    }
}
