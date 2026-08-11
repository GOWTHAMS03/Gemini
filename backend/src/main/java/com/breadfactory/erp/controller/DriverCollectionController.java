package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.DriverSettlementRequest;
import com.breadfactory.erp.entity.DriverCollection;
import com.breadfactory.erp.repository.DriverCollectionRepository;
import com.breadfactory.erp.service.DriverCollectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverCollectionController {

    private final DriverCollectionService collectionService;
    private final DriverCollectionRepository driverCollectionRepository;

    @GetMapping
    public ResponseEntity<List<DriverCollection>> getAllCollections() {
        return ResponseEntity.ok(driverCollectionRepository.findAll());
    }

    @PostMapping("/settle")
    public ResponseEntity<DriverCollection> settleCollection(@Valid @RequestBody DriverSettlementRequest request) {
        return ResponseEntity.ok(collectionService.settleDriverCollection(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        if (driverCollectionRepository.existsById(id)) {
            driverCollectionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
