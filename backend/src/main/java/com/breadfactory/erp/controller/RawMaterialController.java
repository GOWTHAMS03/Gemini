package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.RawMaterial;
import com.breadfactory.erp.repository.RawMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping
    public ResponseEntity<RawMaterial> createRawMaterial(@RequestBody RawMaterial rawMaterial) {
        return ResponseEntity.ok(rawMaterialRepository.save(rawMaterial));
    }
}
