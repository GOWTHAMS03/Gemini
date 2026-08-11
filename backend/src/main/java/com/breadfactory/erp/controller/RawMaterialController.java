package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.RawMaterial;
import com.breadfactory.erp.repository.RawMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/raw-materials")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RawMaterialController {

    private final RawMaterialRepository rawMaterialRepository;

    @GetMapping
    public ResponseEntity<List<RawMaterial>> getAllRawMaterials() {
        return ResponseEntity.ok(rawMaterialRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RawMaterial> getRawMaterialById(@PathVariable Long id) {
        return rawMaterialRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RawMaterial> createRawMaterial(@RequestBody RawMaterial rawMaterial) {
        return ResponseEntity.ok(rawMaterialRepository.save(rawMaterial));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RawMaterial> updateRawMaterial(@PathVariable Long id, @RequestBody RawMaterial materialDetails) {
        return rawMaterialRepository.findById(id)
                .map(existing -> {
                    if (materialDetails.getMaterialCode() != null) existing.setMaterialCode(materialDetails.getMaterialCode());
                    if (materialDetails.getName() != null) existing.setName(materialDetails.getName());
                    if (materialDetails.getCategory() != null) existing.setCategory(materialDetails.getCategory());
                    if (materialDetails.getUnit() != null) existing.setUnit(materialDetails.getUnit());
                    if (materialDetails.getCurrentStock() != null) existing.setCurrentStock(materialDetails.getCurrentStock());
                    if (materialDetails.getMinStockAlert() != null) existing.setMinStockAlert(materialDetails.getMinStockAlert());
                    if (materialDetails.getUnitCost() != null) existing.setUnitCost(materialDetails.getUnitCost());
                    if (materialDetails.getWarehouseLocation() != null) existing.setWarehouseLocation(materialDetails.getWarehouseLocation());
                    return ResponseEntity.ok(rawMaterialRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/restock")
    public ResponseEntity<RawMaterial> restockRawMaterial(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal addQuantity = new BigDecimal(body.getOrDefault("quantity", 0).toString());
        return rawMaterialRepository.findById(id)
                .map(material -> {
                    material.setCurrentStock(material.getCurrentStock().add(addQuantity));
                    return ResponseEntity.ok(rawMaterialRepository.save(material));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRawMaterial(@PathVariable Long id) {
        if (rawMaterialRepository.existsById(id)) {
            rawMaterialRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
