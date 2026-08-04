package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.DriverSettlementRequest;
import com.breadfactory.erp.entity.DriverCollection;
import com.breadfactory.erp.service.DriverCollectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverCollectionController {

    private final DriverCollectionService collectionService;

    @PostMapping("/settle")
    public ResponseEntity<DriverCollection> settleCollection(@Valid @RequestBody DriverSettlementRequest request) {
        return ResponseEntity.ok(collectionService.settleDriverCollection(request));
    }
}
